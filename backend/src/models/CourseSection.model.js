/**
 * Course Section Model (LopHoc)
 * Handles all course section-related database operations
 */
import { getPool } from '../db.js';

// Status constants
export const STATUS = {
  WAITING_CONFIRMATION: 'CHO_XAC_NHAN',     // Chờ xác nhận (giảng viên)
  CONFIRMED: 'DA_XAC_NHAN',                  // Đã xác nhận
  OPEN_REGISTRATION: 'MO_DANG_KY',           // Mở đăng ký
  IN_PROGRESS: 'DANG_HOC',                   // Đang học  
  CLOSED: 'DA_DONG'                          // Đã đóng
};

/**
 * Validate course data before creation
 */
export async function validateCourseData(courseData) {
  const pool = getPool();
  const errors = [];
  
  // Check required fields
  if (!courseData.maLop) errors.push('Mã lớp học phần là bắt buộc');
  if (!courseData.maMon) errors.push('Mã môn học là bắt buộc');
  if (!courseData.hocKy) errors.push('Học kỳ là bắt buộc');
  if (!courseData.namHoc) errors.push('Năm học là bắt buộc');
  
  // Check MaMon exists
  if (courseData.maMon) {
    const monResult = await pool.query(
      `SELECT MaMon FROM MonHoc WHERE MaMon = $1`,
      [courseData.maMon]
    );
    if (monResult.rows.length === 0) {
      errors.push(`Môn học "${courseData.maMon}" không tồn tại`);
    }
  }
  
  // Check MaPhong exists (if provided)
  if (courseData.maPhong) {
    const phongResult = await pool.query(
      `SELECT MaPhong FROM PhongHoc WHERE MaPhong = $1`,
      [courseData.maPhong]
    );
    if (phongResult.rows.length === 0) {
      errors.push(`Phòng học "${courseData.maPhong}" không tồn tại`);
    }
  }
  
  // Check MaGiangVien exists and is a lecturer (if provided)
  if (courseData.maGiangVien) {
    const gvResult = await pool.query(
      `SELECT MaSo, MaVaiTro FROM NguoiDung WHERE MaSo = $1 AND MaVaiTro = 2`,
      [courseData.maGiangVien]
    );
    if (gvResult.rows.length === 0) {
      errors.push(`Giảng viên "${courseData.maGiangVien}" không tồn tại hoặc không phải giảng viên`);
    }
  }
  
  // Check Thu (weekday) is valid (2-8 or NULL)
  if (courseData.thu !== null && courseData.thu !== undefined) {
    if (courseData.thu < 2 || courseData.thu > 8) {
      errors.push(`Ngày trong tuần phải từ 2-8 (Thứ 2-Chủ nhật), nhận được: ${courseData.thu}`);
    }
  }
  
  // Check MaTietBatDau is valid (1-13)
  if (courseData.maTietBatDau) {
    if (courseData.maTietBatDau < 1 || courseData.maTietBatDau > 13) {
      errors.push(`Tiết bắt đầu phải từ 1-13, nhận được: ${courseData.maTietBatDau}`);
    }
  }
  
  // Check SoTiet is valid (> 0)
  if (courseData.soTiet) {
    if (courseData.soTiet <= 0) {
      errors.push(`Số tiết phải lớn hơn 0, nhận được: ${courseData.soTiet}`);
    }
  }
  
  // Check period range (MaTietBatDau + SoTiet - 1 <= 13)
  if (courseData.maTietBatDau && courseData.soTiet) {
    const maxPeriod = courseData.maTietBatDau + courseData.soTiet - 1;
    if (maxPeriod > 13) {
      errors.push(`Phạm vi tiết không hợp lệ: tiết ${courseData.maTietBatDau} đến ${maxPeriod} (max 13). Số tiết quá nhiều.`);
    }
  }
  
  // Check SiSoToiDa is positive (if provided)
  if (courseData.siSoToiDa && courseData.siSoToiDa <= 0) {
    errors.push(`Sĩ số tối đa phải lớn hơn 0, nhận được: ${courseData.siSoToiDa}`);
  }
  
  return errors;
}

/**
 * Get all course sections with pagination and filtering
 */
export async function findAll({ 
  search, maGiangVien, hocKy, namHoc, trangThai, maMon, maNganh,
  page = 1, limit = 20 
}) {
  const pool = getPool();
  const offset = (page - 1) * limit;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  if (maGiangVien) {
    whereClause += ` AND l.MaGiangVien = $${paramIndex++}`;
    params.push(maGiangVien);
  }
  
  if (hocKy) {
    whereClause += ` AND l.HocKy = $${paramIndex++}`;
    params.push(hocKy);
  }
  
  if (namHoc) {
    whereClause += ` AND l.NamHoc = $${paramIndex++}`;
    params.push(namHoc);
  }
  
  if (trangThai) {
    whereClause += ` AND l.TrangThai = $${paramIndex++}`;
    params.push(trangThai);
  }
  
  if (maMon) {
    whereClause += ` AND l.MaMon = $${paramIndex++}`;
    params.push(maMon);
  }
  
  // Filter by major (ngành) via MonHoc
  if (maNganh) {
    whereClause += ` AND m.MaNganh = $${paramIndex++}`;
    params.push(maNganh);
  }
  
  if (search) {
    whereClause += ` AND (l.MaLop ILIKE $${paramIndex} OR m.TenMon ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }
  
  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM LopHoc l JOIN MonHoc m ON l.MaMon = m.MaMon ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);
  
  // Get paginated data with full details
  params.push(limit, offset);
  const result = await pool.query(
    `SELECT l.*, m.TenMon, m.SoTinChi, m.MaNganh, p.TenPhong, t.TenToaNha, t.MaToaNha,
            gv.HoTen as TenGiangVien, th.GioBatDau, th.GioKetThuc,
            (SELECT COUNT(*) FROM LopHoc_SinhVien sv WHERE sv.MaLop = l.MaLop AND sv.TrangThai = 'DANG_HOC') as SoSinhVien
     FROM LopHoc l
     JOIN MonHoc m ON l.MaMon = m.MaMon
     LEFT JOIN PhongHoc p ON l.MaPhong = p.MaPhong
     LEFT JOIN ToaNha t ON p.MaToaNha = t.MaToaNha
     LEFT JOIN NguoiDung gv ON l.MaGiangVien = gv.MaSo
     LEFT JOIN TietHoc th ON l.MaTietBatDau = th.MaTiet
     ${whereClause}
     ORDER BY l.NgayTao DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );
  
  return {
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Find course section by ID
 */
export async function findById(maLop) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT l.*, m.TenMon, m.SoTinChi, p.TenPhong, t.TenToaNha, t.MaToaNha,
            gv.HoTen as TenGiangVien, gv.Email as EmailGiangVien, th.GioBatDau, th.GioKetThuc,
            (SELECT COUNT(*) FROM LopHoc_SinhVien sv WHERE sv.MaLop = l.MaLop AND sv.TrangThai = 'DANG_HOC') as SoSinhVien
     FROM LopHoc l
     JOIN MonHoc m ON l.MaMon = m.MaMon
     LEFT JOIN PhongHoc p ON l.MaPhong = p.MaPhong
     LEFT JOIN ToaNha t ON p.MaToaNha = t.MaToaNha
     LEFT JOIN NguoiDung gv ON l.MaGiangVien = gv.MaSo
     LEFT JOIN TietHoc th ON l.MaTietBatDau = th.MaTiet
     WHERE l.MaLop = $1`,
    [maLop]
  );
  return result.rows[0] || null;
}

/**
 * Create new course section
 */
export async function create(courseData) {
  const pool = getPool();
  const {
    maLop, maMon, maPhong, hocKy, namHoc,
    thu, maTietBatDau, soTiet, maGiangVien, siSoToiDa, hanDangKy
  } = courseData;
  
  const result = await pool.query(
    `INSERT INTO LopHoc (MaLop, MaMon, MaPhong, HocKy, NamHoc, Thu, MaTietBatDau, SoTiet, MaGiangVien, SiSoToiDa, HanDangKy)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [maLop, maMon, maPhong, hocKy, namHoc, thu, maTietBatDau, soTiet, maGiangVien, siSoToiDa, hanDangKy]
  );
  
  return result.rows[0];
}

/**
 * Update course section
 */
export async function update(maLop, courseData) {
  const pool = getPool();
  const {
    maPhong, thu, maTietBatDau, soTiet, maGiangVien, siSoToiDa, trangThai, hanDangKy
  } = courseData;
  
  const result = await pool.query(
    `UPDATE LopHoc SET
       MaPhong = COALESCE($2, MaPhong),
       Thu = COALESCE($3, Thu),
       MaTietBatDau = COALESCE($4, MaTietBatDau),
       SoTiet = COALESCE($5, SoTiet),
       MaGiangVien = COALESCE($6, MaGiangVien),
       SiSoToiDa = COALESCE($7, SiSoToiDa),
       TrangThai = COALESCE($8, TrangThai),
       HanDangKy = COALESCE($9, HanDangKy),
       NgayCapNhat = NOW()
     WHERE MaLop = $1
     RETURNING *`,
    [maLop, maPhong, thu, maTietBatDau, soTiet, maGiangVien, siSoToiDa, trangThai, hanDangKy]
  );
  
  return result.rows[0];
}

/**
 * Update course status
 */
export async function updateStatus(maLop, trangThai) {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE LopHoc SET TrangThai = $2, NgayCapNhat = NOW() WHERE MaLop = $1 RETURNING *`,
    [maLop, trangThai]
  );
  return result.rows[0];
}

/**
 * Lecturer confirms teaching registration
 */
export async function lecturerConfirm(maLop, maGiangVien) {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE LopHoc SET TrangThai = 'DA_XAC_NHAN', NgayCapNhat = NOW() 
     WHERE MaLop = $1 AND MaGiangVien = $2 AND TrangThai = 'CHO_XAC_NHAN'
     RETURNING *`,
    [maLop, maGiangVien]
  );
  return result.rows[0];
}

/**
 * Admin opens course section for student registration
 */
export async function openCourse(maLop, hanDangKy = null) {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE LopHoc SET TrangThai = 'MO_DANG_KY', HanDangKy = $2, NgayCapNhat = NOW() 
     WHERE MaLop = $1 AND TrangThai = 'DA_XAC_NHAN'
     RETURNING *`,
    [maLop, hanDangKy]
  );
  return result.rows[0];
}

/**
 * Start course (change from MO_DANG_KY to DANG_HOC)
 */
export async function startCourse(maLop) {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE LopHoc SET TrangThai = 'DANG_HOC', NgayCapNhat = NOW() 
     WHERE MaLop = $1 AND TrangThai = 'MO_DANG_KY'
     RETURNING *`,
    [maLop]
  );
  return result.rows[0];
}

/**
 * Delete course section
 */
export async function remove(maLop) {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE LopHoc SET TrangThai = 'DA_DONG' WHERE MaLop = $1 RETURNING MaLop`,
    [maLop]
  );
  return result.rows[0];
}

/**
 * Get students enrolled in a course
 */
export async function getEnrolledStudents(maLop) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT sv.MaSV, sv.NgayDangKy, sv.TrangThai,
            n.HoTen, n.Email, n.NienKhoa, n.LopQuanLy
     FROM LopHoc_SinhVien sv
     JOIN NguoiDung n ON sv.MaSV = n.MaSo
     WHERE sv.MaLop = $1
     ORDER BY n.HoTen`,
    [maLop]
  );
  return result.rows;
}

/**
 * Add student to course
 */
export async function addStudent(maLop, maSV) {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO LopHoc_SinhVien (MaLop, MaSV) VALUES ($1, $2)
     ON CONFLICT (MaLop, MaSV) DO UPDATE SET TrangThai = 'DANG_HOC'
     RETURNING *`,
    [maLop, maSV]
  );
  return result.rows[0];
}

/**
 * Remove student from course
 */
export async function removeStudent(maLop, maSV) {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE LopHoc_SinhVien SET TrangThai = 'DA_HUY' WHERE MaLop = $1 AND MaSV = $2 RETURNING *`,
    [maLop, maSV]
  );
  return result.rows[0];
}

/**
 * Get courses by lecturer (for teaching schedule)
 */
export async function findByLecturer(maGiangVien, hocKy, namHoc) {
  const pool = getPool();
  let query = `
    SELECT l.malop as "MaLop", l.mamon as "MaMon", l.magiangvien as "MaGiangVien", 
           l.hocky as "HocKy", l.namhoc as "NamHoc", 
           l.thu as "Thu", l.matietbatdau as "MaTietBatDau", l.sotiet as "SoTiet", 
           l.maphong as "MaPhong", l.trangthai as "TrangThai", l.sisotoida as "SiSoToiDa",
           m.tenmon as "TenMon", m.sotinchi as "SoTinChi", 
           p.tenphong as "TenPhong", t.tentoanha as "TenToaNha",
           th.giobatdau as "GioBatDau", th.gioketthuc as "GioKetThuc",
           (SELECT COUNT(*) FROM lophoc_sinhvien sv WHERE sv.malop = l.malop AND sv.trangthai = 'DANG_HOC') as "SoSinhVien"
    FROM lophoc l
    JOIN monhoc m ON l.mamon = m.mamon
    LEFT JOIN phonghoc p ON l.maphong = p.maphong
    LEFT JOIN toanha t ON p.matoanha = t.matoanha
    LEFT JOIN tiethoc th ON l.matietbatdau = th.matiet
    WHERE l.magiangvien = $1`;
  
  const params = [maGiangVien];
  
  if (hocKy) {
    query += ` AND l.hocky = $${params.length + 1}`;
    params.push(hocKy);
  }
  
  if (namHoc) {
    query += ` AND l.namhoc = $${params.length + 1}`;
    params.push(namHoc);
  }
  
  query += ` ORDER BY l.thu, l.matietbatdau`;
  
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get courses by student (for study schedule)
 */
export async function findByStudent(maSV, hocKy, namHoc) {
  const pool = getPool();
  let query = `
    SELECT l.malop as "MaLop", l.mamon as "MaMon", l.magiangvien as "MaGiangVien", 
           l.hocky as "HocKy", l.namhoc as "NamHoc", 
           l.thu as "Thu", l.matietbatdau as "MaTietBatDau", l.sotiet as "SoTiet", 
           l.maphong as "MaPhong", l.trangthai as "TrangThai", l.sisotoida as "SiSoToiDa",
           m.tenmon as "TenMon", m.sotinchi as "SoTinChi", 
           p.tenphong as "TenPhong", t.tentoanha as "TenToaNha",
           gv.hoten as "TenGiangVien", 
           th.giobatdau as "GioBatDau", th.gioketthuc as "GioKetThuc"
    FROM lophoc_sinhvien sv
    JOIN lophoc l ON sv.malop = l.malop
    JOIN monhoc m ON l.mamon = m.mamon
    LEFT JOIN phonghoc p ON l.maphong = p.maphong
    LEFT JOIN toanha t ON p.matoanha = t.matoanha
    LEFT JOIN nguoidung gv ON l.magiangvien = gv.maso
    LEFT JOIN tiethoc th ON l.matietbatdau = th.matiet
    WHERE sv.masv = $1 AND sv.trangthai = 'DANG_HOC' AND l.trangthai IN ('DANG_HOC', 'MO_DANG_KY')`;
  
  const params = [maSV];
  
  if (hocKy) {
    query += ` AND l.hocky = $${params.length + 1}`;
    params.push(hocKy);
  }
  
  if (namHoc) {
    query += ` AND l.namhoc = $${params.length + 1}`;
    params.push(namHoc);
  }
  
  query += ` ORDER BY l.thu, l.matietbatdau`;
  
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get courses available for registration (MO_DANG_KY status, deadline not passed)
 */
export async function findAvailableForRegistration(maSV, hocKy, namHoc) {
  const pool = getPool();
  let query = `
    SELECT l.*, m.TenMon, m.SoTinChi, p.TenPhong, t.TenToaNha,
           gv.HoTen as TenGiangVien, th.GioBatDau, th.GioKetThuc,
           (SELECT COUNT(*) FROM LopHoc_SinhVien sv WHERE sv.MaLop = l.MaLop AND sv.TrangThai = 'DANG_HOC') as SoSinhVien,
           (l.SiSoToiDa - COALESCE((SELECT COUNT(*) FROM LopHoc_SinhVien sv WHERE sv.MaLop = l.MaLop AND sv.TrangThai = 'DANG_HOC'), 0)) as ConLai,
           EXISTS(SELECT 1 FROM LopHoc_SinhVien sv WHERE sv.MaLop = l.MaLop AND sv.MaSV = $1 AND sv.TrangThai = 'DANG_HOC') as DaDangKy
    FROM LopHoc l
    JOIN MonHoc m ON l.MaMon = m.MaMon
    LEFT JOIN PhongHoc p ON l.MaPhong = p.MaPhong
    LEFT JOIN ToaNha t ON p.MaToaNha = t.MaToaNha
    LEFT JOIN NguoiDung gv ON l.MaGiangVien = gv.MaSo
    LEFT JOIN TietHoc th ON l.MaTietBatDau = th.MaTiet
    WHERE l.TrangThai = 'MO_DANG_KY' 
      AND (l.HanDangKy IS NULL OR l.HanDangKy >= CURRENT_DATE)`;
  
  const params = [maSV];
  
  if (hocKy) {
    query += ` AND l.HocKy = $${params.length + 1}`;
    params.push(hocKy);
  }
  
  if (namHoc) {
    query += ` AND l.NamHoc = $${params.length + 1}`;
    params.push(namHoc);
  }
  
  query += ` ORDER BY m.TenMon, l.MaLop`;
  
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get student's registered courses for a semester
 */
export async function findRegisteredByStudent(maSV, hocKy, namHoc) {
  const pool = getPool();
  let query = `
    SELECT l.*, m.TenMon, m.SoTinChi, p.TenPhong, t.TenToaNha,
           gv.HoTen as TenGiangVien, th.GioBatDau, th.GioKetThuc, sv.NgayDangKy
    FROM LopHoc_SinhVien sv
    JOIN LopHoc l ON sv.MaLop = l.MaLop
    JOIN MonHoc m ON l.MaMon = m.MaMon
    LEFT JOIN PhongHoc p ON l.MaPhong = p.MaPhong
    LEFT JOIN ToaNha t ON p.MaToaNha = t.MaToaNha
    LEFT JOIN NguoiDung gv ON l.MaGiangVien = gv.MaSo
    LEFT JOIN TietHoc th ON l.MaTietBatDau = th.MaTiet
    WHERE sv.MaSV = $1 AND sv.TrangThai = 'DANG_HOC'`;
  
  const params = [maSV];
  
  if (hocKy) {
    query += ` AND l.HocKy = $${params.length + 1}`;
    params.push(hocKy);
  }
  
  if (namHoc) {
    query += ` AND l.NamHoc = $${params.length + 1}`;
    params.push(namHoc);
  }
  
  query += ` ORDER BY l.Thu, l.MaTietBatDau`;
  
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Student self-enrollment (from MO_DANG_KY courses)
 */
export async function studentEnroll(maLop, maSV) {
  const pool = getPool();
  
  // Check course is open for registration
  const course = await pool.query(
    `SELECT * FROM LopHoc WHERE MaLop = $1 AND TrangThai = 'MO_DANG_KY' AND (HanDangKy IS NULL OR HanDangKy >= CURRENT_DATE)`,
    [maLop]
  );
  
  if (course.rows.length === 0) {
    throw new Error('Lớp học phần không mở đăng ký hoặc đã hết hạn đăng ký');
  }
  
  // Check available seats
  const countResult = await pool.query(
    `SELECT COUNT(*) as enrolled FROM LopHoc_SinhVien WHERE MaLop = $1 AND TrangThai = 'DANG_HOC'`,
    [maLop]
  );
  
  const enrolled = parseInt(countResult.rows[0].enrolled);
  if (enrolled >= course.rows[0].sisotoida) {
    throw new Error('Lớp học phần đã đủ sĩ số');
  }
  
  // Check if already enrolled
  const existing = await pool.query(
    `SELECT * FROM LopHoc_SinhVien WHERE MaLop = $1 AND MaSV = $2`,
    [maLop, maSV]
  );
  
  if (existing.rows.length > 0 && existing.rows[0].trangthai === 'DANG_HOC') {
    throw new Error('Sinh viên đã đăng ký lớp học phần này');
  }
  
  // Enroll student
  const result = await pool.query(
    `INSERT INTO LopHoc_SinhVien (MaLop, MaSV) VALUES ($1, $2)
     ON CONFLICT (MaLop, MaSV) DO UPDATE SET TrangThai = 'DANG_HOC', NgayDangKy = NOW()
     RETURNING *`,
    [maLop, maSV]
  );
  
  return result.rows[0];
}

/**
 * Student cancel registration
 */
export async function studentCancelEnrollment(maLop, maSV) {
  const pool = getPool();
  
  // Check course status allows cancellation (only MO_DANG_KY)
  const course = await pool.query(
    `SELECT * FROM LopHoc WHERE MaLop = $1 AND TrangThai = 'MO_DANG_KY'`,
    [maLop]
  );
  
  if (course.rows.length === 0) {
    throw new Error('Không thể hủy đăng ký: Lớp học phần đã đóng đăng ký hoặc đã bắt đầu');
  }
  
  const result = await pool.query(
    `UPDATE LopHoc_SinhVien SET TrangThai = 'DA_HUY' WHERE MaLop = $1 AND MaSV = $2 RETURNING *`,
    [maLop, maSV]
  );
  
  return result.rows[0];
}

/**
 * Get courses waiting for lecturer confirmation
 */
export async function findWaitingConfirmation(maGiangVien) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT l.*, m.TenMon, m.SoTinChi, p.TenPhong, t.TenToaNha, th.GioBatDau, th.GioKetThuc
     FROM LopHoc l
     JOIN MonHoc m ON l.MaMon = m.MaMon
     LEFT JOIN PhongHoc p ON l.MaPhong = p.MaPhong
     LEFT JOIN ToaNha t ON p.MaToaNha = t.MaToaNha
     LEFT JOIN TietHoc th ON l.MaTietBatDau = th.MaTiet
     WHERE l.MaGiangVien = $1 AND l.TrangThai = 'CHO_XAC_NHAN'
     ORDER BY l.NgayTao DESC`,
    [maGiangVien]
  );
  return result.rows;
}

export default {
  STATUS,
  findAll,
  findById,
  create,
  update,
  updateStatus,
  lecturerConfirm,
  openCourse,
  startCourse,
  remove,
  getEnrolledStudents,
  addStudent,
  removeStudent,
  findByLecturer,
  findByStudent,
  findWaitingConfirmation,
  findAvailableForRegistration,
  findRegisteredByStudent,
  studentEnroll,
  studentCancelEnrollment
};
