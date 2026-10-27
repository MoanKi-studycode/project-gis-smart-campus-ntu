/**
 * Event Model (SuKien)
 * Handles all event-related database operations
 */
import { getPool } from '../db.js';

// Target audience constants
export const TARGET = {
  ALL: 'ALL',
  LECTURER: 'LECTURER',
  STUDENT: 'STUDENT'
};

// Status constants (computed dynamically based on time)
export const STATUS = {
  UPCOMING: 'UPCOMING',     // Before start time
  ACTIVE: 'ACTIVE',         // Between start and end time (ongoing)
  COMPLETED: 'COMPLETED',   // After end time
  CANCELLED: 'CANCELLED'    // Manually cancelled by admin
};

/**
 * Compute real-time status based on event times
 * Only CANCELLED status is stored in DB, others are computed
 */
function computeEventStatus(event) {
  // If cancelled, keep that status
  if (event.trangthai === 'CANCELLED' || event.TrangThai === 'CANCELLED') {
    return 'CANCELLED';
  }
  
  const now = new Date();
  const startTime = new Date(event.thoigianbatdau || event.ThoiGianBatDau);
  const endTime = new Date(event.thoigianketthuc || event.ThoiGianKetThuc);
  
  if (now < startTime) {
    return 'UPCOMING';
  } else if (now >= startTime && now <= endTime) {
    return 'ACTIVE';
  } else {
    return 'COMPLETED';
  }
}

/**
 * Add computed status to event object and normalize field names
 */
function addComputedStatus(event) {
  if (!event) return null;
  
  const status = computeEventStatus(event);
  
  return {
    ...event,
    // Computed status
    TrangThai: status,
    TrangThaiGoc: event.trangthai || event.TrangThai,
    // Normalize field names for frontend compatibility
    MaSuKien: event.masukien || event.MaSuKien,
    TieuDe: event.tensukien || event.TenSuKien,
    TenSuKien: event.tensukien || event.TenSuKien,
    MoTa: event.mota || event.MoTa,
    ThoiGianBatDau: event.thoigianbatdau || event.ThoiGianBatDau,
    ThoiGianKetThuc: event.thoigianketthuc || event.ThoiGianKetThuc,
    DoiTuong: event.doituong || event.DoiTuong,
    DoiTuongMucTieu: event.doituong || event.DoiTuong,
    MaToaNha: event.matoanha || event.MaToaNha,
    MaPhong: event.maphong || event.MaPhong,
    MaDiaDiem: event.matoanha || event.maphong || event.MaToaNha || event.MaPhong,
    LoaiDiaDiem: event.maphong ? 'ROOM' : (event.matoanha ? 'BUILDING' : null),
    TenDiaDiem: event.diadiem || event.DiaDiem,
    DiaDiem: event.diadiem || event.DiaDiem,
    LoaiSuKien: event.loaisukien || event.LoaiSuKien,
    NguoiTao: event.nguoitao || event.NguoiTao,
    TenNguoiTao: event.tennguoitao || event.TenNguoiTao,
    NgayTao: event.ngaytao || event.NgayTao,
    NgayCapNhat: event.ngaycapnhat || event.NgayCapNhat
  };
}

/**
 * Get all events with pagination and filtering
 */
export async function findAll({ 
  search, doiTuong, trangThai, fromDate, toDate,
  page = 1, limit = 20 
}) {
  const pool = getPool();
  const offset = (page - 1) * limit;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  // Only filter CANCELLED from DB, other statuses are computed
  if (trangThai === 'CANCELLED') {
    whereClause += ` AND TrangThai = 'CANCELLED'`;
  } else if (trangThai && trangThai !== 'ALL') {
    // For computed statuses, we need to filter by time
    if (trangThai === 'UPCOMING') {
      whereClause += ` AND TrangThai != 'CANCELLED' AND ThoiGianBatDau > NOW()`;
    } else if (trangThai === 'ACTIVE') {
      whereClause += ` AND TrangThai != 'CANCELLED' AND ThoiGianBatDau <= NOW() AND ThoiGianKetThuc >= NOW()`;
    } else if (trangThai === 'COMPLETED') {
      whereClause += ` AND TrangThai != 'CANCELLED' AND ThoiGianKetThuc < NOW()`;
    }
  }
  
  if (doiTuong) {
    whereClause += ` AND DoiTuong = $${paramIndex++}`;
    params.push(doiTuong);
  }
  
  if (fromDate) {
    whereClause += ` AND ThoiGianBatDau >= $${paramIndex++}`;
    params.push(fromDate);
  }
  
  if (toDate) {
    whereClause += ` AND ThoiGianKetThuc <= $${paramIndex++}`;
    params.push(toDate);
  }
  
  if (search) {
    whereClause += ` AND (TieuDe ILIKE $${paramIndex} OR NoiDung ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }
  
  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM SuKien ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);
  
  // Get paginated data
  params.push(limit, offset);
  const result = await pool.query(
    `SELECT s.*, n.HoTen as TenNguoiTao
     FROM SuKien s
     LEFT JOIN NguoiDung n ON s.NguoiTao = n.MaSo
     ${whereClause}
     ORDER BY s.ThoiGianBatDau DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );
  
  // Add computed status to each event
  const eventsWithStatus = result.rows.map(addComputedStatus);
  
  return {
    data: eventsWithStatus,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Find event by ID
 */
export async function findById(maSuKien) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT s.*, n.HoTen as TenNguoiTao
     FROM SuKien s
     LEFT JOIN NguoiDung n ON s.NguoiTao = n.MaSo
     WHERE s.MaSuKien = $1`,
    [maSuKien]
  );
  return addComputedStatus(result.rows[0]);
}

/**
 * Create new event (status is computed, not stored)
 */
export async function create(eventData) {
  const pool = getPool();
  const {
    tieuDe, tenSuKien, moTa, thoiGianBatDau, thoiGianKetThuc,
    doiTuong, doiTuongMucTieu, maToaNha, maDiaDiem, maPhong, diaDiem, tenDiaDiem, loaiDiaDiem, loaiSuKien, nguoiTao
  } = eventData;
  
  // Map frontend fields to database columns
  const eventName = tieuDe || tenSuKien;
  const locationBuilding = maToaNha || (loaiDiaDiem === 'BUILDING' ? maDiaDiem : null);
  const locationRoom = maPhong || (loaiDiaDiem === 'ROOM' ? maDiaDiem : null);
  const locationText = diaDiem || tenDiaDiem;
  const target = doiTuong || doiTuongMucTieu || 'ALL';
  
  // Status defaults to ACTIVE (will be computed dynamically when reading)
  const result = await pool.query(
    `INSERT INTO SuKien (TenSuKien, MoTa, ThoiGianBatDau, ThoiGianKetThuc, 
                         DoiTuong, MaToaNha, MaPhong, DiaDiem, LoaiSuKien, NguoiTao, TrangThai)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE')
     RETURNING *`,
    [eventName, moTa, thoiGianBatDau, thoiGianKetThuc, 
     target, locationBuilding, locationRoom, locationText, loaiSuKien || 'SU_KIEN', nguoiTao]
  );
  
  return addComputedStatus(result.rows[0]);
}

/**
 * Update event (cannot change status via update, use cancel instead)
 */
export async function update(maSuKien, eventData) {
  const pool = getPool();
  const {
    tieuDe, tenSuKien, moTa, thoiGianBatDau, thoiGianKetThuc,
    doiTuong, doiTuongMucTieu, maToaNha, maDiaDiem, maPhong, diaDiem, tenDiaDiem, loaiDiaDiem, loaiSuKien
  } = eventData;
  
  // Map frontend fields to database columns
  const eventName = tieuDe || tenSuKien;
  const locationBuilding = maToaNha || (loaiDiaDiem === 'BUILDING' ? maDiaDiem : null);
  const locationRoom = maPhong || (loaiDiaDiem === 'ROOM' ? maDiaDiem : null);
  const locationText = diaDiem || tenDiaDiem;
  const target = doiTuong || doiTuongMucTieu;
  
  // Note: Status is NOT updated here - it's computed dynamically
  const result = await pool.query(
    `UPDATE SuKien SET
       TenSuKien = COALESCE($2, TenSuKien),
       MoTa = COALESCE($3, MoTa),
       ThoiGianBatDau = COALESCE($4, ThoiGianBatDau),
       ThoiGianKetThuc = COALESCE($5, ThoiGianKetThuc),
       DoiTuong = COALESCE($6, DoiTuong),
       MaToaNha = COALESCE($7, MaToaNha),
       MaPhong = COALESCE($8, MaPhong),
       DiaDiem = COALESCE($9, DiaDiem),
       LoaiSuKien = COALESCE($10, LoaiSuKien),
       NgayCapNhat = NOW()
     WHERE MaSuKien = $1
     RETURNING *`,
    [maSuKien, eventName, moTa, thoiGianBatDau, thoiGianKetThuc,
     target, locationBuilding, locationRoom, locationText, loaiSuKien]
  );
  
  return addComputedStatus(result.rows[0]);
}

/**
 * Cancel event (sets status to CANCELLED)
 */
export async function cancel(maSuKien) {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE SuKien SET TrangThai = 'CANCELLED', NgayCapNhat = NOW() WHERE MaSuKien = $1 RETURNING *`,
    [maSuKien]
  );
  return addComputedStatus(result.rows[0]);
}

/**
 * Delete event permanently
 */
export async function remove(maSuKien) {
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM SuKien WHERE MaSuKien = $1 RETURNING MaSuKien`,
    [maSuKien]
  );
  return result.rows[0];
}

/**
 * Get events for a specific user based on their role
 */
export async function findForUser(user) {
  const pool = getPool();
  
  let doiTuongConditions = [`DoiTuong = 'ALL'`];
  
  if (user.mavaitro === 2) {
    // Lecturer
    doiTuongConditions.push(`DoiTuong = 'LECTURER'`);
  } else if (user.mavaitro === 3) {
    // Student
    doiTuongConditions.push(`DoiTuong = 'STUDENT'`);
    // Also get cohort-specific events
    if (user.nienkhoa) {
      const cohort = user.nienkhoa.substring(0, 2);
      doiTuongConditions.push(`DoiTuong = 'SV_K${cohort}'`);
    }
  }
  
  const result = await pool.query(
    `SELECT * FROM SuKien 
     WHERE TrangThai != 'CANCELLED' 
       AND NOW() <= ThoiGianKetThuc
       AND (${doiTuongConditions.join(' OR ')})
     ORDER BY ThoiGianBatDau ASC`
  );
  
  return result.rows.map(addComputedStatus);
}

/**
 * Get upcoming events (not started yet, not cancelled)
 */
export async function findUpcoming(limit = 10) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM SuKien 
     WHERE TrangThai != 'CANCELLED' AND ThoiGianBatDau > NOW()
     ORDER BY ThoiGianBatDau ASC
     LIMIT $1`,
    [limit]
  );
  return result.rows.map(addComputedStatus);
}

/**
 * Restore cancelled event (sets status back to ACTIVE for recomputing)
 */
export async function restore(maSuKien) {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE SuKien SET TrangThai = 'ACTIVE', NgayCapNhat = NOW() 
     WHERE MaSuKien = $1 AND TrangThai = 'CANCELLED' 
     RETURNING *`,
    [maSuKien]
  );
  return addComputedStatus(result.rows[0]);
}

export default {
  TARGET,
  STATUS,
  findAll,
  findById,
  create,
  update,
  cancel,
  remove,
  restore,
  findForUser,
  findUpcoming,
  computeEventStatus,
  addComputedStatus
};
