/**
 * Settings Model (CaiDat, CaiDatHeThong)
 * Handles user and system settings
 */
import { getPool } from '../db.js';

/**
 * Get user settings
 */
export async function getUserSettings(maNguoiDung) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM CaiDat WHERE MaNguoiDung = $1`,
    [maNguoiDung]
  );
  
  // Return default settings if not found
  if (!result.rows[0]) {
    return {
      manguoidung: maNguoiDung,
      caidatchung: {},
      caidatthongbao: { email: true, push: true },
      caidatgiaodien: { theme: 'light', sidebarCollapsed: false }
    };
  }
  
  return result.rows[0];
}

/**
 * Update user settings
 */
export async function updateUserSettings(maNguoiDung, settings) {
  const pool = getPool();
  const { caiDatChung, caiDatThongBao, caiDatGiaoDien } = settings;
  
  const result = await pool.query(
    `INSERT INTO CaiDat (MaNguoiDung, CaiDatChung, CaiDatThongBao, CaiDatGiaoDien)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (MaNguoiDung) DO UPDATE SET
       CaiDatChung = COALESCE($2, CaiDat.CaiDatChung),
       CaiDatThongBao = COALESCE($3, CaiDat.CaiDatThongBao),
       CaiDatGiaoDien = COALESCE($4, CaiDat.CaiDatGiaoDien),
       NgayCapNhat = NOW()
     RETURNING *`,
    [maNguoiDung, 
     caiDatChung ? JSON.stringify(caiDatChung) : null,
     caiDatThongBao ? JSON.stringify(caiDatThongBao) : null,
     caiDatGiaoDien ? JSON.stringify(caiDatGiaoDien) : null]
  );
  
  return result.rows[0];
}

/**
 * Get all system settings
 */
export async function getSystemSettings() {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM CaiDatHeThong ORDER BY MaCaiDat`
  );
  
  // Convert to object
  const settings = {};
  result.rows.forEach(row => {
    let value = row.giatri;
    if (row.loaigiatri === 'NUMBER') value = parseFloat(value);
    if (row.loaigiatri === 'BOOLEAN') value = value === 'true';
    if (row.loaigiatri === 'JSON') value = JSON.parse(value);
    settings[row.macaidat] = {
      value,
      description: row.mota,
      type: row.loaigiatri
    };
  });
  
  return settings;
}

/**
 * Get specific system setting
 */
export async function getSystemSetting(maCaiDat) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM CaiDatHeThong WHERE MaCaiDat = $1`,
    [maCaiDat]
  );
  
  if (!result.rows[0]) return null;
  
  const row = result.rows[0];
  let value = row.giatri;
  if (row.loaigiatri === 'NUMBER') value = parseFloat(value);
  if (row.loaigiatri === 'BOOLEAN') value = value === 'true';
  if (row.loaigiatri === 'JSON') value = JSON.parse(value);
  
  return value;
}

/**
 * Update system setting
 */
export async function updateSystemSetting(maCaiDat, giaTri, moTa = null) {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE CaiDatHeThong SET 
       GiaTri = $2, 
       MoTa = COALESCE($3, MoTa),
       NgayCapNhat = NOW()
     WHERE MaCaiDat = $1
     RETURNING *`,
    [maCaiDat, String(giaTri), moTa]
  );
  return result.rows[0];
}

/**
 * Create system setting
 */
export async function createSystemSetting(maCaiDat, giaTri, moTa, loaiGiaTri = 'STRING') {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO CaiDatHeThong (MaCaiDat, GiaTri, MoTa, LoaiGiaTri)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [maCaiDat, String(giaTri), moTa, loaiGiaTri]
  );
  return result.rows[0];
}

export default {
  getUserSettings,
  updateUserSettings,
  getSystemSettings,
  getSystemSetting,
  updateSystemSetting,
  createSystemSetting
};
