/**
 * Reference Data Model
 * Handles lookup tables: VaiTro, TietHoc, Khoa, Nganh, ToaNha, PhongHoc
 */
import { getPool } from '../db.js';

// ============ ROLES (VaiTro) ============
export async function getRoles() {
  const pool = getPool();
  const result = await pool.query(`SELECT * FROM VaiTro ORDER BY MaVaiTro`);
  return result.rows;
}

// ============ PERIODS (TietHoc) ============
export async function getPeriods() {
  const pool = getPool();
  const result = await pool.query(`SELECT * FROM TietHoc ORDER BY MaTiet`);
  return result.rows;
}

// ============ FACULTIES (Khoa) ============
export async function getFaculties() {
  const pool = getPool();
  const result = await pool.query(`SELECT * FROM Khoa ORDER BY TenKhoa`);
  return result.rows;
}

export async function getFacultyById(maKhoa) {
  const pool = getPool();
  const result = await pool.query(`SELECT * FROM Khoa WHERE MaKhoa = $1`, [maKhoa]);
  return result.rows[0] || null;
}

// ============ MAJORS (Nganh) ============
export async function getMajors(maKhoa = null) {
  const pool = getPool();
  let query = `SELECT n.*, k.TenKhoa FROM Nganh n LEFT JOIN Khoa k ON n.MaKhoa = k.MaKhoa`;
  const params = [];
  
  if (maKhoa) {
    query += ` WHERE n.MaKhoa = $1`;
    params.push(maKhoa);
  }
  
  query += ` ORDER BY n.TenNganh`;
  const result = await pool.query(query, params);
  return result.rows;
}

export async function getMajorById(maNganh) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT n.*, k.TenKhoa FROM Nganh n LEFT JOIN Khoa k ON n.MaKhoa = k.MaKhoa WHERE n.MaNganh = $1`,
    [maNganh]
  );
  return result.rows[0] || null;
}

// ============ BUILDINGS (ToaNha) ============
export async function getBuildings() {
  const pool = getPool();
  const result = await pool.query(`SELECT MaToaNha, TenToaNha, MapKey, MoTa, HinhAnh FROM ToaNha ORDER BY TenToaNha`);
  return result.rows;
}

export async function getBuildingById(maToaNha) {
  const pool = getPool();
  const result = await pool.query(`SELECT * FROM ToaNha WHERE MaToaNha = $1`, [maToaNha]);
  return result.rows[0] || null;
}

export async function getBuildingByMapKey(mapKey) {
  const pool = getPool();
  const result = await pool.query(`SELECT * FROM ToaNha WHERE MapKey = $1 OR MaToaNha = $1`, [mapKey]);
  return result.rows[0] || null;
}

// ============ CLASSROOMS (PhongHoc) ============
export async function getClassrooms(maToaNha = null, soTang = null) {
  const pool = getPool();
  let query = `SELECT p.*, t.TenToaNha FROM PhongHoc p LEFT JOIN ToaNha t ON p.MaToaNha = t.MaToaNha WHERE 1=1`;
  const params = [];
  let paramIndex = 1;
  
  if (maToaNha) {
    query += ` AND p.MaToaNha = $${paramIndex++}`;
    params.push(maToaNha);
  }
  
  if (soTang) {
    query += ` AND p.SoTang = $${paramIndex++}`;
    params.push(soTang);
  }
  
  query += ` ORDER BY p.MaToaNha, p.SoTang, p.TenPhong`;
  const result = await pool.query(query, params);
  return result.rows;
}

export async function getClassroomById(maPhong) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT p.*, t.TenToaNha FROM PhongHoc p LEFT JOIN ToaNha t ON p.MaToaNha = t.MaToaNha WHERE p.MaPhong = $1`,
    [maPhong]
  );
  return result.rows[0] || null;
}

// ============ ACADEMIC YEARS ============
export async function getAcademicYears() {
  const pool = getPool();
  const result = await pool.query(
    `SELECT DISTINCT NamHoc FROM LopHoc WHERE NamHoc IS NOT NULL ORDER BY NamHoc DESC`
  );
  return result.rows.map(r => r.namhoc);
}

// ============ STUDENT YEARS (Niên khóa) ============
export async function getStudentYears() {
  const pool = getPool();
  const result = await pool.query(
    `SELECT DISTINCT NienKhoa FROM NguoiDung WHERE NienKhoa IS NOT NULL ORDER BY NienKhoa DESC`
  );
  return result.rows.map(r => r.nienkhoa);
}

// ============ SEMESTERS ============
export function getSemesters() {
  return [
    { value: 1, label: 'Học kỳ 1' },
    { value: 2, label: 'Học kỳ 2' },
    { value: 3, label: 'Học kỳ hè' }
  ];
}

// ============ DAYS OF WEEK ============
export function getDaysOfWeek() {
  return [
    { value: 2, label: 'Thứ 2' },
    { value: 3, label: 'Thứ 3' },
    { value: 4, label: 'Thứ 4' },
    { value: 5, label: 'Thứ 5' },
    { value: 6, label: 'Thứ 6' },
    { value: 7, label: 'Thứ 7' },
    { value: 8, label: 'Chủ nhật' }
  ];
}

// ============ DROPDOWN HELPERS ============
export async function getLecturersForDropdown() {
  const pool = getPool();
  const result = await pool.query(`
    SELECT MaSo, HoTen, Email, ChucVu, MaKhoa 
    FROM NguoiDung 
    WHERE MaVaiTro = 2 AND TrangThai = 'ACTIVE'
    ORDER BY HoTen
  `);
  return result.rows;
}

export async function getSubjectsForDropdown() {
  const pool = getPool();
  const result = await pool.query(`
    SELECT MaMon, TenMon 
    FROM MonHoc 
    WHERE TrangThai = 'ACTIVE'
    ORDER BY TenMon
  `);
  return result.rows;
}

export default {
  getRoles,
  getPeriods,
  getFaculties,
  getFacultyById,
  getMajors,
  getMajorById,
  getBuildings,
  getBuildingById,
  getBuildingByMapKey,
  getClassrooms,
  getClassroomById,
  getAcademicYears,
  getStudentYears,
  getSemesters,
  getDaysOfWeek,
  getLecturersForDropdown,
  getSubjectsForDropdown
};
