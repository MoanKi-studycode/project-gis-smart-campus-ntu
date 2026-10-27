/**
 * User Model (NguoiDung)
 * Handles all user-related database operations
 */
import { getPool } from '../db.js';

// Role constants
export const ROLES = {
  ADMIN: 1,
  LECTURER: 2,
  STUDENT: 3
};

export const ROLE_NAMES = {
  1: 'admin',
  2: 'lecturer', 
  3: 'student'
};

/**
 * Find user by ID (MaSo)
 */
export async function findById(maSo) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT n.*, v.TenVaiTro, k.TenKhoa, ng.TenNganh
     FROM NguoiDung n
     LEFT JOIN VaiTro v ON n.MaVaiTro = v.MaVaiTro
     LEFT JOIN Khoa k ON n.MaKhoa = k.MaKhoa
     LEFT JOIN Nganh ng ON n.MaNganh = ng.MaNganh
     WHERE n.MaSo = $1`,
    [maSo]
  );
  return result.rows[0] || null;
}

/**
 * Find user by email
 */
export async function findByEmail(email) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM NguoiDung WHERE Email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

/**
 * Authenticate user
 */
export async function authenticate(maSo, matKhau) {
  const pool = getPool();
  // In production, use bcrypt to compare hashed passwords
  const result = await pool.query(
    `SELECT n.*, v.TenVaiTro
     FROM NguoiDung n
     JOIN VaiTro v ON n.MaVaiTro = v.MaVaiTro
     WHERE n.MaSo = $1 AND n.TrangThai = 'ACTIVE'`,
    [maSo]
  );
  
  const user = result.rows[0];
  if (!user) return null;
  
  // Password check - for development, allow plain text comparison
  // In production, use bcrypt.compare for hashed passwords
  const storedPassword = user.matkhau;
  const passwordMatch = storedPassword === matKhau;
  
  if (!passwordMatch) return null;
  
  // Remove password from response
  const { matkhau: _, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    role: user.tenvaitro
  };
}

/**
 * Get all users with pagination and filtering
 */
export async function findAll({ role, search, page = 1, limit = 20, status = 'ACTIVE', nienKhoa, maNganh, maKhoa }) {
  const pool = getPool();
  const offset = (page - 1) * limit;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  if (role) {
    whereClause += ` AND n.MaVaiTro = $${paramIndex++}`;
    params.push(role);
  }
  
  if (status) {
    whereClause += ` AND n.TrangThai = $${paramIndex++}`;
    params.push(status);
  }
  
  if (search) {
    whereClause += ` AND (n.HoTen ILIKE $${paramIndex} OR n.MaSo ILIKE $${paramIndex} OR n.Email ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }
  
  // Filter by academic year (niên khóa)
  if (nienKhoa) {
    whereClause += ` AND n.NienKhoa = $${paramIndex++}`;
    params.push(nienKhoa);
  }
  
  // Filter by major (ngành)
  if (maNganh) {
    whereClause += ` AND n.MaNganh = $${paramIndex++}`;
    params.push(maNganh);
  }
  
  // Filter by faculty (khoa)
  if (maKhoa) {
    whereClause += ` AND n.MaKhoa = $${paramIndex++}`;
    params.push(maKhoa);
  }
  
  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM NguoiDung n ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);
  
  // Get paginated data
  params.push(limit, offset);
  const result = await pool.query(
    `SELECT n.MaSo, n.HoTen, n.Email, n.SoDienThoai, n.Avatar, n.MaVaiTro,
            n.NienKhoa, n.MaNganh, n.LopQuanLy, n.ChucVu, n.MaKhoa, n.ChuyenMon,
            n.TrangThai, n.NgayTao, v.TenVaiTro, k.TenKhoa, ng.TenNganh
     FROM NguoiDung n
     LEFT JOIN VaiTro v ON n.MaVaiTro = v.MaVaiTro
     LEFT JOIN Khoa k ON n.MaKhoa = k.MaKhoa
     LEFT JOIN Nganh ng ON n.MaNganh = ng.MaNganh
     ${whereClause}
     ORDER BY n.NgayTao DESC
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
 * Create new user
 */
export async function create(userData) {
  const pool = getPool();
  const {
    maSo, matKhau, hoTen, email, soDienThoai, avatar, maVaiTro,
    nienKhoa, maNganh, lopQuanLy, chucVu, maKhoa, chuyenMon
  } = userData;
  
  const result = await pool.query(
    `INSERT INTO NguoiDung (MaSo, MatKhau, HoTen, Email, SoDienThoai, Avatar, MaVaiTro,
                            NienKhoa, MaNganh, LopQuanLy, ChucVu, MaKhoa, ChuyenMon)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [maSo, matKhau, hoTen, email, soDienThoai, avatar, maVaiTro,
     nienKhoa, maNganh, lopQuanLy, chucVu, maKhoa, chuyenMon]
  );
  
  return result.rows[0];
}

/**
 * Update user
 */
export async function update(maSo, userData) {
  const pool = getPool();
  const {
    hoTen, email, soDienThoai, avatar,
    nienKhoa, maNganh, lopQuanLy, chucVu, maKhoa, chuyenMon, trangThai
  } = userData;
  
  const result = await pool.query(
    `UPDATE NguoiDung SET
       HoTen = COALESCE($2, HoTen),
       Email = COALESCE($3, Email),
       SoDienThoai = COALESCE($4, SoDienThoai),
       Avatar = COALESCE($5, Avatar),
       NienKhoa = COALESCE($6, NienKhoa),
       MaNganh = COALESCE($7, MaNganh),
       LopQuanLy = COALESCE($8, LopQuanLy),
       ChucVu = COALESCE($9, ChucVu),
       MaKhoa = COALESCE($10, MaKhoa),
       ChuyenMon = COALESCE($11, ChuyenMon),
       TrangThai = COALESCE($12, TrangThai),
       NgayCapNhat = NOW()
     WHERE MaSo = $1
     RETURNING *`,
    [maSo, hoTen, email, soDienThoai, avatar, nienKhoa, maNganh, lopQuanLy, chucVu, maKhoa, chuyenMon, trangThai]
  );
  
  return result.rows[0];
}

/**
 * Update password
 */
export async function updatePassword(maSo, newPassword) {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE NguoiDung SET MatKhau = $2, NgayCapNhat = NOW() WHERE MaSo = $1 RETURNING MaSo`,
    [maSo, newPassword]
  );
  return result.rows[0];
}

/**
 * Change password (with current password verification)
 */
export async function changePassword(maSo, currentPassword, newPassword) {
  const pool = getPool();
  
  // First verify current password
  const userResult = await pool.query(
    `SELECT MatKhau FROM NguoiDung WHERE MaSo = $1`,
    [maSo]
  );
  
  const user = userResult.rows[0];
  if (!user) {
    return { success: false, error: 'Người dùng không tồn tại' };
  }
  
  // Check current password (in production, use bcrypt.compare)
  if (user.matkhau !== currentPassword) {
    return { success: false, error: 'Mật khẩu hiện tại không đúng' };
  }
  
  // Update to new password
  const result = await pool.query(
    `UPDATE NguoiDung SET MatKhau = $2, NgayCapNhat = NOW() WHERE MaSo = $1 RETURNING MaSo`,
    [maSo, newPassword]
  );
  
  return { success: true, user: result.rows[0] };
}

/**
 * Delete user (soft delete by changing status)
 */
export async function remove(maSo) {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE NguoiDung SET TrangThai = 'INACTIVE', NgayCapNhat = NOW() WHERE MaSo = $1 RETURNING MaSo`,
    [maSo]
  );
  return result.rows[0];
}

/**
 * Hard delete user
 */
export async function hardDelete(maSo) {
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM NguoiDung WHERE MaSo = $1 RETURNING MaSo`,
    [maSo]
  );
  return result.rows[0];
}

/**
 * Get users by role
 */
export async function findByRole(role) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT MaSo, HoTen, Email, ChucVu, MaKhoa FROM NguoiDung 
     WHERE MaVaiTro = $1 AND TrangThai = 'ACTIVE'
     ORDER BY HoTen`,
    [role]
  );
  return result.rows;
}

export default {
  ROLES,
  ROLE_NAMES,
  findById,
  findByEmail,
  authenticate,
  findAll,
  create,
  update,
  updatePassword,
  changePassword,
  remove,
  hardDelete,
  findByRole
};
