/**
 * Subject Model (MonHoc)
 * Handles all subject-related database operations
 */
import { getPool } from '../db.js';

/**
 * Get all subjects with pagination and filtering
 */
export async function findAll({ search, maNganh, soTinChi, namHoc, trangThai = 'ACTIVE', page = 1, limit = 20 }) {
  const pool = getPool();
  const offset = (page - 1) * limit;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  if (trangThai) {
    whereClause += ` AND m.TrangThai = $${paramIndex++}`;
    params.push(trangThai);
  }
  
  if (maNganh) {
    whereClause += ` AND m.MaNganh = $${paramIndex++}`;
    params.push(maNganh);
  }
  
  if (soTinChi) {
    whereClause += ` AND m.SoTinChi = $${paramIndex++}`;
    params.push(soTinChi);
  }
  
  if (namHoc) {
    whereClause += ` AND m.NamHoc = $${paramIndex++}`;
    params.push(namHoc);
  }
  
  if (search) {
    whereClause += ` AND (m.TenMon ILIKE $${paramIndex} OR m.MaMon ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }
  
  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM MonHoc m ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);
  
  // Get paginated data
  params.push(limit, offset);
  const result = await pool.query(
    `SELECT m.*, n.TenNganh, k.TenKhoa
     FROM MonHoc m
     LEFT JOIN Nganh n ON m.MaNganh = n.MaNganh
     LEFT JOIN Khoa k ON n.MaKhoa = k.MaKhoa
     ${whereClause}
     ORDER BY m.NgayTao DESC
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
 * Find subject by ID
 */
export async function findById(maMon) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT m.*, n.TenNganh, k.TenKhoa
     FROM MonHoc m
     LEFT JOIN Nganh n ON m.MaNganh = n.MaNganh
     LEFT JOIN Khoa k ON n.MaKhoa = k.MaKhoa
     WHERE m.MaMon = $1`,
    [maMon]
  );
  return result.rows[0] || null;
}

/**
 * Create new subject
 */
export async function create(subjectData) {
  const pool = getPool();
  const { maMon, tenMon, soTinChi, maNganh, namHoc, moTa } = subjectData;
  
  const result = await pool.query(
    `INSERT INTO MonHoc (MaMon, TenMon, SoTinChi, MaNganh, NamHoc, MoTa)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [maMon, tenMon, soTinChi, maNganh, namHoc, moTa]
  );
  
  return result.rows[0];
}

/**
 * Update subject
 */
export async function update(maMon, subjectData) {
  const pool = getPool();
  const { tenMon, soTinChi, maNganh, namHoc, moTa, trangThai } = subjectData;
  
  const result = await pool.query(
    `UPDATE MonHoc SET
       TenMon = COALESCE($2, TenMon),
       SoTinChi = COALESCE($3, SoTinChi),
       MaNganh = COALESCE($4, MaNganh),
       NamHoc = COALESCE($5, NamHoc),
       MoTa = COALESCE($6, MoTa),
       TrangThai = COALESCE($7, TrangThai)
     WHERE MaMon = $1
     RETURNING *`,
    [maMon, tenMon, soTinChi, maNganh, namHoc, moTa, trangThai]
  );
  
  return result.rows[0];
}

/**
 * Delete subject
 */
export async function remove(maMon) {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE MonHoc SET TrangThai = 'INACTIVE' WHERE MaMon = $1 RETURNING MaMon`,
    [maMon]
  );
  return result.rows[0];
}

/**
 * Get all active subjects for dropdown
 */
export async function findAllActive() {
  const pool = getPool();
  const result = await pool.query(
    `SELECT MaMon, TenMon, SoTinChi FROM MonHoc WHERE TrangThai = 'ACTIVE' ORDER BY TenMon`
  );
  return result.rows;
}

export default {
  findAll,
  findById,
  create,
  update,
  remove,
  findAllActive
};
