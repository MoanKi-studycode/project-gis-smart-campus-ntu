/**
 * Attendance Model (PhienDiemDanh, KetQuaDiemDanh)
 * Handles all attendance-related database operations
 */
import { getPool } from '../db.js';

// Status constants
export const SESSION_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED'
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'CO_MAT',
  ABSENT: 'VANG',
  LATE: 'MUON'
};

/**
 * Create new attendance session
 */
export async function createSession(maLop, maGiangVien, durationMinutes = 15) {
  const pool = getPool();
  
  // First, close any existing open sessions for this class
  await pool.query(
    `UPDATE PhienDiemDanh SET TrangThai = 'CLOSED', ThoiGianKetThuc = NOW()
     WHERE MaLop = $1 AND TrangThai = 'OPEN'`,
    [maLop]
  );
  
  // Create new session
  const result = await pool.query(
    `INSERT INTO PhienDiemDanh (MaLop, MaGiangVien, ThoiGianHetHan)
     VALUES ($1, $2, NOW() + ($3 || ' minutes')::INTERVAL)
     RETURNING *`,
    [maLop, maGiangVien, durationMinutes]
  );
  
  return result.rows[0];
}

/**
 * Close attendance session
 */
export async function closeSession(maPhien) {
  const pool = getPool();
  
  // Get class info
  const sessionResult = await pool.query(
    `SELECT MaLop FROM PhienDiemDanh WHERE MaPhien = $1`,
    [maPhien]
  );
  
  if (!sessionResult.rows[0]) return null;
  
  const maLop = sessionResult.rows[0].malop;
  
  // Mark absent students
  await pool.query(
    `INSERT INTO KetQuaDiemDanh (MaPhien, MaSV, TrangThai)
     SELECT $1, sv.MaSV, 'VANG'
     FROM LopHoc_SinhVien sv
     WHERE sv.MaLop = $2 AND sv.TrangThai = 'DANG_HOC'
       AND NOT EXISTS (SELECT 1 FROM KetQuaDiemDanh kq WHERE kq.MaPhien = $1 AND kq.MaSV = sv.MaSV)
     ON CONFLICT (MaPhien, MaSV) DO NOTHING`,
    [maPhien, maLop]
  );
  
  // Close session
  const result = await pool.query(
    `UPDATE PhienDiemDanh SET TrangThai = 'CLOSED', ThoiGianKetThuc = NOW()
     WHERE MaPhien = $1 RETURNING *`,
    [maPhien]
  );
  
  return result.rows[0];
}

/**
 * Get session by ID with details
 */
export async function getSession(maPhien) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT p.*, l.MaLop, m.TenMon, gv.HoTen as TenGiangVien
     FROM PhienDiemDanh p
     JOIN LopHoc l ON p.MaLop = l.MaLop
     JOIN MonHoc m ON l.MaMon = m.MaMon
     LEFT JOIN NguoiDung gv ON p.MaGiangVien = gv.MaSo
     WHERE p.MaPhien = $1`,
    [maPhien]
  );
  return result.rows[0] || null;
}

/**
 * Get open session for a class
 */
export async function getOpenSession(maLop) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT p.*, m.TenMon
     FROM PhienDiemDanh p
     JOIN LopHoc l ON p.MaLop = l.MaLop
     JOIN MonHoc m ON l.MaMon = m.MaMon
     WHERE p.MaLop = $1 AND p.TrangThai = 'OPEN' AND NOW() < p.ThoiGianHetHan
     LIMIT 1`,
    [maLop]
  );
  return result.rows[0] || null;
}

/**
 * Student check-in
 */
export async function studentCheckIn(maPhien, maSV, viTri = null) {
  const pool = getPool();
  
  // Get session info
  const session = await getSession(maPhien);
  if (!session) throw new Error('Phiên điểm danh không tồn tại');
  if (session.trangthai !== 'OPEN') throw new Error('Phiên điểm danh đã đóng');
  if (new Date() > new Date(session.thoigianhethan)) throw new Error('Đã hết thời gian điểm danh');
  
  // Check if student is enrolled
  const enrollmentCheck = await pool.query(
    `SELECT 1 FROM LopHoc_SinhVien WHERE MaLop = $1 AND MaSV = $2 AND TrangThai = 'DANG_HOC'`,
    [session.malop, maSV]
  );
  if (!enrollmentCheck.rows[0]) throw new Error('Sinh viên không thuộc lớp học này');
  
  // Get late threshold - default 5 minutes if settings table doesn't exist
  let lateThreshold = 5;
  try {
    const settingResult = await pool.query(
      `SELECT GiaTri FROM CaiDatHeThong WHERE MaCaiDat = 'LATE_THRESHOLD'`
    );
    if (settingResult.rows[0]?.giatri) {
      lateThreshold = parseInt(settingResult.rows[0].giatri);
    }
  } catch (err) {
    // Table doesn't exist, use default value
    console.log('[Attendance] Using default late threshold: 5 minutes');
  }
  
  // Calculate if late
  const sessionStart = new Date(session.thoigianbatdau);
  const now = new Date();
  const minutesSinceStart = (now - sessionStart) / (1000 * 60);
  const status = minutesSinceStart > lateThreshold ? 'MUON' : 'CO_MAT';
  
  // Record attendance
  const result = await pool.query(
    `INSERT INTO KetQuaDiemDanh (MaPhien, MaSV, TrangThai)
     VALUES ($1, $2, $3)
     ON CONFLICT (MaPhien, MaSV) DO UPDATE SET ThoiGianCheckIn = NOW(), TrangThai = $3
     RETURNING *`,
    [maPhien, maSV, status]
  );
  
  return result.rows[0];
}

/**
 * Get attendance records for a session
 */
export async function getSessionAttendance(maPhien) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT kq.*, n.HoTen, n.MaSo, n.NienKhoa
     FROM KetQuaDiemDanh kq
     JOIN NguoiDung n ON kq.MaSV = n.MaSo
     WHERE kq.MaPhien = $1
     ORDER BY kq.ThoiGianCheckIn ASC`,
    [maPhien]
  );
  return result.rows;
}

/**
 * Get sessions for a class (for lecturer)
 */
export async function getClassSessions(maLop, limit = 20) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT p.*,
            (SELECT COUNT(*) FROM KetQuaDiemDanh kq WHERE kq.MaPhien = p.MaPhien AND kq.TrangThai = 'CO_MAT') as SoCoMat,
            (SELECT COUNT(*) FROM KetQuaDiemDanh kq WHERE kq.MaPhien = p.MaPhien AND kq.TrangThai = 'MUON') as SoMuon,
            (SELECT COUNT(*) FROM KetQuaDiemDanh kq WHERE kq.MaPhien = p.MaPhien AND kq.TrangThai = 'VANG') as SoVang
     FROM PhienDiemDanh p
     WHERE p.MaLop = $1
     ORDER BY p.ThoiGianBatDau DESC
     LIMIT $2`,
    [maLop, limit]
  );
  return result.rows;
}

/**
 * Get attendance statistics for a course section
 */
export async function getClassStatistics(maLop) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM fn_ThongKeDiemDanhLop($1)`,
    [maLop]
  );
  return result.rows;
}

/**
 * Get student's attendance for a course
 */
export async function getStudentAttendance(maSV, maLop) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT p.MaPhien, p.ThoiGianBatDau, p.LanDiemDanh, 
            kq.TrangThai, kq.ThoiGianCheckIn
     FROM PhienDiemDanh p
     LEFT JOIN KetQuaDiemDanh kq ON p.MaPhien = kq.MaPhien AND kq.MaSV = $1
     WHERE p.MaLop = $2 AND p.TrangThai = 'CLOSED'
     ORDER BY p.ThoiGianBatDau DESC`,
    [maSV, maLop]
  );
  return result.rows;
}

/**
 * Get open attendance sessions for student
 */
export async function getActiveSessionsForStudent(maSV) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT p.*, l.MaLop, l.MaPhong as phong, m.TenMon, gv.HoTen as TenGV,
            CASE WHEN kq.MaKetQua IS NOT NULL THEN true ELSE false END as DaDiemDanh
     FROM PhienDiemDanh p
     JOIN LopHoc l ON p.MaLop = l.MaLop
     JOIN LopHoc_SinhVien sv ON l.MaLop = sv.MaLop
     JOIN MonHoc m ON l.MaMon = m.MaMon
     LEFT JOIN NguoiDung gv ON l.MaGiangVien = gv.MaSo
     LEFT JOIN KetQuaDiemDanh kq ON p.MaPhien = kq.MaPhien AND kq.MaSV = $1
     WHERE sv.MaSV = $1 
       AND sv.TrangThai = 'DANG_HOC'
       AND p.TrangThai = 'OPEN'
       AND NOW() < p.ThoiGianHetHan
     ORDER BY p.ThoiGianBatDau DESC`,
    [maSV]
  );
  return result.rows;
}

/**
 * Get lecturer's current open sessions
 */
export async function getLecturerOpenSessions(maGiangVien) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT p.*, l.MaLop, m.TenMon,
            (SELECT COUNT(*) FROM LopHoc_SinhVien sv WHERE sv.MaLop = l.MaLop AND sv.TrangThai = 'DANG_HOC') as TongSinhVien,
            (SELECT COUNT(*) FROM KetQuaDiemDanh kq WHERE kq.MaPhien = p.MaPhien) as DaDiemDanh
     FROM PhienDiemDanh p
     JOIN LopHoc l ON p.MaLop = l.MaLop
     JOIN MonHoc m ON l.MaMon = m.MaMon
     WHERE l.MaGiangVien = $1 AND p.TrangThai = 'OPEN'
     ORDER BY p.ThoiGianBatDau DESC`,
    [maGiangVien]
  );
  return result.rows;
}

// ==================================================================================
// LECTURER STATISTICS FUNCTIONS
// ==================================================================================

/**
 * Get comprehensive statistics for all lecturer's classes
 */
export async function getLecturerClassStatistics(maGiangVien, hocKy = null, namHoc = null) {
  const pool = getPool();
  
  let query = `
    SELECT 
      l.MaLop,
      l.MaMon,
      m.TenMon,
      l.HocKy,
      l.NamHoc,
      l.TrangThai,
      l.Thu,
      l.MaTietBatDau,
      l.SoTiet,
      p.TenPhong,
      tn.TenToaNha,
      t.GioBatDau,
      t.GioKetThuc,
      (SELECT COUNT(*) FROM LopHoc_SinhVien sv WHERE sv.MaLop = l.MaLop) as TongSinhVien,
      (SELECT COUNT(*) FROM PhienDiemDanh pd WHERE pd.MaLop = l.MaLop AND pd.TrangThai = 'CLOSED') as TongBuoiHoc,
      COALESCE((
        SELECT ROUND(AVG(
          CASE WHEN sub.TongBuoi > 0 THEN (sub.SoCoMat::FLOAT / sub.TongBuoi * 100) ELSE 0 END
        )::numeric, 1)
        FROM (
          SELECT 
            kq.MaSV,
            COUNT(CASE WHEN kq.TrangThai IN ('CO_MAT', 'MUON') THEN 1 END) as SoCoMat,
            COUNT(*) as TongBuoi
          FROM KetQuaDiemDanh kq
          JOIN PhienDiemDanh pd ON kq.MaPhien = pd.MaPhien
          WHERE pd.MaLop = l.MaLop AND pd.TrangThai = 'CLOSED'
          GROUP BY kq.MaSV
        ) sub
      ), 0) as TyLeChuyenCanTB
    FROM LopHoc l
    JOIN MonHoc m ON l.MaMon = m.MaMon
    LEFT JOIN PhongHoc p ON l.MaPhong = p.MaPhong
    LEFT JOIN ToaNha tn ON p.MaToaNha = tn.MaToaNha
    LEFT JOIN TietHoc t ON l.MaTietBatDau = t.MaTiet
    WHERE l.MaGiangVien = $1
  `;
  
  const params = [maGiangVien];
  let paramIndex = 2;
  
  if (hocKy) {
    query += ` AND l.HocKy = $${paramIndex++}`;
    params.push(hocKy);
  }
  
  if (namHoc) {
    query += ` AND l.NamHoc = $${paramIndex++}`;
    params.push(namHoc);
  }
  
  query += ` ORDER BY l.NamHoc DESC, l.HocKy DESC, l.MaLop`;
  
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get detailed attendance statistics for a class with per-student breakdown
 */
export async function getDetailedClassStatistics(maLop) {
  const pool = getPool();
  
  // Get class info
  const classInfo = await pool.query(`
    SELECT 
      l.*,
      m.TenMon,
      m.SoTinChi,
      gv.HoTen as TenGiangVien,
      p.TenPhong,
      tn.TenToaNha,
      t.GioBatDau,
      t.GioKetThuc
    FROM LopHoc l
    JOIN MonHoc m ON l.MaMon = m.MaMon
    LEFT JOIN NguoiDung gv ON l.MaGiangVien = gv.MaSo
    LEFT JOIN PhongHoc p ON l.MaPhong = p.MaPhong
    LEFT JOIN ToaNha tn ON p.MaToaNha = tn.MaToaNha
    LEFT JOIN TietHoc t ON l.MaTietBatDau = t.MaTiet
    WHERE l.MaLop = $1
  `, [maLop]);
  
  if (!classInfo.rows[0]) return null;
  
  // Get all sessions
  const sessions = await pool.query(`
    SELECT 
      MaPhien,
      ThoiGianBatDau,
      ThoiGianKetThuc,
      LanDiemDanh,
      TrangThai,
      (SELECT COUNT(*) FROM KetQuaDiemDanh kq WHERE kq.MaPhien = p.MaPhien AND kq.TrangThai = 'CO_MAT') as SoCoMat,
      (SELECT COUNT(*) FROM KetQuaDiemDanh kq WHERE kq.MaPhien = p.MaPhien AND kq.TrangThai = 'MUON') as SoMuon,
      (SELECT COUNT(*) FROM KetQuaDiemDanh kq WHERE kq.MaPhien = p.MaPhien AND kq.TrangThai = 'VANG') as SoVang
    FROM PhienDiemDanh p
    WHERE p.MaLop = $1 AND p.TrangThai = 'CLOSED'
    ORDER BY p.ThoiGianBatDau ASC
  `, [maLop]);
  
  // Get student statistics
  const studentStats = await pool.query(`
    SELECT 
      sv.MaSV,
      n.HoTen,
      n.Email,
      n.LopQuanLy,
      sv.TrangThai as TrangThaiDangKy,
      COUNT(CASE WHEN kq.TrangThai = 'CO_MAT' THEN 1 END) as SoCoMat,
      COUNT(CASE WHEN kq.TrangThai = 'MUON' THEN 1 END) as SoMuon,
      COUNT(CASE WHEN kq.TrangThai = 'VANG' THEN 1 END) as SoVang,
      COUNT(kq.MaKetQua) as TongBuoi,
      CASE 
        WHEN COUNT(kq.MaKetQua) > 0 
        THEN ROUND((COUNT(CASE WHEN kq.TrangThai IN ('CO_MAT', 'MUON') THEN 1 END)::FLOAT / COUNT(kq.MaKetQua) * 100)::numeric, 1)
        ELSE 0 
      END as TyLeChuyenCan
    FROM LopHoc_SinhVien sv
    JOIN NguoiDung n ON sv.MaSV = n.MaSo
    LEFT JOIN PhienDiemDanh p ON sv.MaLop = p.MaLop AND p.TrangThai = 'CLOSED'
    LEFT JOIN KetQuaDiemDanh kq ON p.MaPhien = kq.MaPhien AND sv.MaSV = kq.MaSV
    WHERE sv.MaLop = $1
    GROUP BY sv.MaSV, n.HoTen, n.Email, n.LopQuanLy, sv.TrangThai
    ORDER BY TyLeChuyenCan DESC, n.HoTen ASC
  `, [maLop]);
  
  // Calculate summary
  const totalStudents = studentStats.rows.length;
  const totalSessions = sessions.rows.length;
  const avgAttendance = totalStudents > 0 
    ? studentStats.rows.reduce((sum, s) => sum + parseFloat(s.tylechuyencan || 0), 0) / totalStudents 
    : 0;
  
  const safe = studentStats.rows.filter(s => parseFloat(s.tylechuyencan) >= 80).length;
  const warning = studentStats.rows.filter(s => parseFloat(s.tylechuyencan) >= 50 && parseFloat(s.tylechuyencan) < 80).length;
  const banned = studentStats.rows.filter(s => parseFloat(s.tylechuyencan) < 50).length;
  
  return {
    classInfo: classInfo.rows[0],
    sessions: sessions.rows,
    students: studentStats.rows,
    summary: {
      totalStudents,
      totalSessions,
      avgAttendance: Math.round(avgAttendance * 10) / 10,
      safe,
      warning,
      banned
    }
  };
}

/**
 * Get student attendance matrix (for session-by-session view)
 */
export async function getStudentAttendanceMatrix(maLop) {
  const pool = getPool();
  
  // Get all sessions
  const sessions = await pool.query(`
    SELECT MaPhien, ThoiGianBatDau, LanDiemDanh
    FROM PhienDiemDanh 
    WHERE MaLop = $1 AND TrangThai = 'CLOSED'
    ORDER BY ThoiGianBatDau ASC
  `, [maLop]);
  
  // Get all students with their attendance for each session
  const students = await pool.query(`
    SELECT 
      sv.MaSV,
      n.HoTen,
      p.MaPhien,
      p.ThoiGianBatDau,
      kq.TrangThai,
      kq.ThoiGianCheckIn
    FROM LopHoc_SinhVien sv
    JOIN NguoiDung n ON sv.MaSV = n.MaSo
    CROSS JOIN PhienDiemDanh p
    LEFT JOIN KetQuaDiemDanh kq ON p.MaPhien = kq.MaPhien AND sv.MaSV = kq.MaSV
    WHERE sv.MaLop = $1 AND p.MaLop = $1 AND p.TrangThai = 'CLOSED'
    ORDER BY n.HoTen, p.ThoiGianBatDau
  `, [maLop]);
  
  // Group by student
  const studentMap = new Map();
  for (const row of students.rows) {
    if (!studentMap.has(row.masv)) {
      studentMap.set(row.masv, {
        maSV: row.masv,
        hoTen: row.hoten,
        sessions: []
      });
    }
    studentMap.get(row.masv).sessions.push({
      maPhien: row.maphien,
      ngay: row.thoigianbatdau,
      trangThai: row.trangthai,
      thoiGianCheckIn: row.thoigiancheckin
    });
  }
  
  return {
    sessions: sessions.rows,
    students: Array.from(studentMap.values())
  };
}

// ==================================================================================
// MULTI-ROUND ATTENDANCE FUNCTIONS
// ==================================================================================

/**
 * Create new attendance round within a day (same class, increments LanDiemDanh)
 * Instead of closing previous session, create a new round
 */
export async function createAttendanceRound(maLop, maGiangVien, durationMinutes = 15) {
  const pool = getPool();
  
  // Count rounds today for this class - use SQL CURRENT_DATE to avoid timezone issues
  const countResult = await pool.query(
    `SELECT COALESCE(MAX(LanDiemDanh), 0) as maxlan 
     FROM PhienDiemDanh 
     WHERE MaLop = $1 AND ThoiGianBatDau::date = CURRENT_DATE`,
    [maLop]
  );
  
  const nextRound = (countResult.rows[0]?.maxlan || 0) + 1;
  
  // Close any open sessions for this class
  await pool.query(
    `UPDATE PhienDiemDanh SET TrangThai = 'CLOSED', ThoiGianKetThuc = NOW()
     WHERE MaLop = $1 AND TrangThai = 'OPEN'`,
    [maLop]
  );
  
  // Create new session with incremented round
  const result = await pool.query(
    `INSERT INTO PhienDiemDanh (MaLop, MaGiangVien, ThoiGianHetHan, LanDiemDanh)
     VALUES ($1, $2, NOW() + ($3 || ' minutes')::INTERVAL, $4)
     RETURNING *`,
    [maLop, maGiangVien, durationMinutes, nextRound]
  );
  
  return result.rows[0];
}

/**
 * Get all attendance rounds for a class today
 */
export async function getTodayRounds(maLop) {
  const pool = getPool();
  
  // Use SQL CURRENT_DATE to avoid timezone issues
  const result = await pool.query(
    `SELECT p.maphien, p.malop, p.magiangvien, p.thoigianbatdau, p.thoigianketthuc,
            p.thoigianhethan, p.landiemdanh, p.ghichu, p.trangthai, p.ngaytao,
            (SELECT COUNT(*) FROM KetQuaDiemDanh kq WHERE kq.MaPhien = p.MaPhien AND kq.TrangThai = 'CO_MAT') as socomat,
            (SELECT COUNT(*) FROM KetQuaDiemDanh kq WHERE kq.MaPhien = p.MaPhien AND kq.TrangThai = 'MUON') as somuon,
            (SELECT COUNT(*) FROM KetQuaDiemDanh kq WHERE kq.MaPhien = p.MaPhien AND kq.TrangThai = 'VANG') as sovang,
            (SELECT COUNT(*) FROM LopHoc_SinhVien sv WHERE sv.MaLop = p.MaLop AND sv.TrangThai = 'DANG_HOC') as tongsinhvien
     FROM PhienDiemDanh p
     WHERE p.MaLop = $1 AND p.ThoiGianBatDau::date = CURRENT_DATE
     ORDER BY p.LanDiemDanh ASC`,
    [maLop]
  );
  return result.rows;
}

/**
 * Get student attendance for all rounds today
 */
export async function getStudentRoundAttendance(maLop, maSV = null) {
  const pool = getPool();
  
  // Use SQL CURRENT_DATE to avoid timezone issues
  let query = `
    SELECT sv.MaSV, n.HoTen, n.Email,
           p.MaPhien, p.LanDiemDanh, p.TrangThai as TrangThaiPhien,
           COALESCE(kq.TrangThai, 'CHUA_DIEM_DANH') as TrangThaiDiemDanh,
           kq.ThoiGianCheckIn
    FROM LopHoc_SinhVien sv
    JOIN NguoiDung n ON sv.MaSV = n.MaSo
    CROSS JOIN (
      SELECT * FROM PhienDiemDanh 
      WHERE MaLop = $1 AND ThoiGianBatDau::date = CURRENT_DATE
    ) p
    LEFT JOIN KetQuaDiemDanh kq ON p.MaPhien = kq.MaPhien AND sv.MaSV = kq.MaSV
    WHERE sv.MaLop = $1 AND sv.TrangThai = 'DANG_HOC'
  `;
  
  const params = [maLop];
  
  if (maSV) {
    query += ` AND sv.MaSV = $2`;
    params.push(maSV);
  }
  
  query += ` ORDER BY sv.MaSV, p.LanDiemDanh`;
  
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * End today's attendance session for a class
 * Calculate final attendance: if student checked in at least once = CO_MAT, else = VANG
 */
export async function endTodayAttendance(maLop) {
  const pool = getPool();
  
  // Use SQL CURRENT_DATE to avoid timezone issues
  // Close all open sessions for this class today
  await pool.query(
    `UPDATE PhienDiemDanh SET TrangThai = 'CLOSED', ThoiGianKetThuc = NOW()
     WHERE MaLop = $1 AND TrangThai = 'OPEN' AND ThoiGianBatDau::date = CURRENT_DATE`,
    [maLop]
  );
  
  // Get all today's sessions
  const sessions = await pool.query(
    `SELECT MaPhien FROM PhienDiemDanh 
     WHERE MaLop = $1 AND ThoiGianBatDau::date = CURRENT_DATE`,
    [maLop]
  );
  
  // Mark absent students for each session that was closed
  for (const session of sessions.rows) {
    await pool.query(
      `INSERT INTO KetQuaDiemDanh (MaPhien, MaSV, TrangThai)
       SELECT $1, sv.MaSV, 'VANG'
       FROM LopHoc_SinhVien sv
       WHERE sv.MaLop = $2 AND sv.TrangThai = 'DANG_HOC'
         AND NOT EXISTS (SELECT 1 FROM KetQuaDiemDanh kq WHERE kq.MaPhien = $1 AND kq.MaSV = sv.MaSV)
       ON CONFLICT (MaPhien, MaSV) DO NOTHING`,
      [session.maphien, maLop]
    );
  }
  
  // Return summary
  const summary = await getTodaySummary(maLop);
  return summary;
}

/**
 * Get today's attendance summary for a class
 * Final status: CO_MAT if checked in at least once, VANG if not
 */
export async function getTodaySummary(maLop) {
  const pool = getPool();
  
  // Use SQL CURRENT_DATE to avoid timezone issues
  const result = await pool.query(
    `WITH TodaySessions AS (
      SELECT MaPhien FROM PhienDiemDanh 
      WHERE MaLop = $1 AND ThoiGianBatDau::date = CURRENT_DATE
    ),
    StudentCheckIns AS (
      SELECT kq.MaSV, COUNT(CASE WHEN kq.TrangThai IN ('CO_MAT', 'MUON') THEN 1 END) as SoLanCoMat
      FROM KetQuaDiemDanh kq
      WHERE kq.MaPhien IN (SELECT MaPhien FROM TodaySessions)
      GROUP BY kq.MaSV
    )
    SELECT 
      sv.MaSV,
      n.HoTen,
      n.Email,
      COALESCE(sci.SoLanCoMat, 0) as SoLanCoMat,
      (SELECT COUNT(*) FROM TodaySessions) as TongSoLan,
      CASE WHEN COALESCE(sci.SoLanCoMat, 0) > 0 THEN 'CO_MAT' ELSE 'VANG' END as KetQuaCuoi
    FROM LopHoc_SinhVien sv
    JOIN NguoiDung n ON sv.MaSV = n.MaSo
    LEFT JOIN StudentCheckIns sci ON sv.MaSV = sci.MaSV
    WHERE sv.MaLop = $1 AND sv.TrangThai = 'DANG_HOC'
    ORDER BY sv.MaSV`,
    [maLop]
  );
  
  return {
    date: new Date().toLocaleDateString('vi-VN'),
    totalRounds: result.rows[0]?.tongsolan || 0,
    students: result.rows
  };
}

export default {
  SESSION_STATUS,
  ATTENDANCE_STATUS,
  createSession,
  closeSession,
  getSession,
  getOpenSession,
  studentCheckIn,
  getSessionAttendance,
  getClassSessions,
  getClassStatistics,
  getStudentAttendance,
  getActiveSessionsForStudent,
  getLecturerOpenSessions,
  getLecturerClassStatistics,
  getDetailedClassStatistics,
  getStudentAttendanceMatrix,
  // Multi-round functions
  createAttendanceRound,
  getTodayRounds,
  getStudentRoundAttendance,
  endTodayAttendance,
  getTodaySummary
};