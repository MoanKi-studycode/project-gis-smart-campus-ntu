import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'DB_SmartCampus',
  user: 'postgres',
  password: '123456'
});

async function runUpdateScript() {
  const scriptPath = path.resolve('database/update-course-2026-01-18.sql');
  
  try {
    console.log('📝 Reading SQL script...');
    const sql = fs.readFileSync(scriptPath, 'utf8');
    
    console.log('🚀 Executing update script...');
    await pool.query(sql);
    
    console.log('✅ Update completed successfully!');
    
    // Verify the update
    console.log('\n📊 VERIFICATION RESULTS:\n');
    
    // Check the updated class
    const classResult = await pool.query(
      `SELECT l.*, m.TenMon, p.TenPhong, tn.TenToaNha, gv.HoTen as TenGiangVien, th.GioBatDau, th.GioKetThuc
       FROM LopHoc l
       JOIN MonHoc m ON l.MaMon = m.MaMon
       LEFT JOIN PhongHoc p ON l.MaPhong = p.MaPhong
       LEFT JOIN ToaNha tn ON p.MaToaNha = tn.MaToaNha
       LEFT JOIN NguoiDung gv ON l.MaGiangVien = gv.MaSo
       LEFT JOIN TietHoc th ON l.MaTietBatDau = th.MaTiet
       WHERE l.MaLop = 'IT004-01'`
    );
    
    if (classResult.rows.length > 0) {
      const cls = classResult.rows[0];
      console.log('=== CLASS INFORMATION ===');
      console.log(`Class ID: ${cls.malop}`);
      console.log(`Subject: ${cls.tenmon}`);
      console.log(`Lecturer: ${cls.tengiangvien}`);
      console.log(`Room: ${cls.tenphong} (${cls.tentoanha}, Floor 4)`);
      console.log(`Schedule: Sunday (Thu=${cls.thu}), Periods 1-5 (${cls.giobtdau} - ${cls.gioketthuc})`);
      console.log(`Status: ${cls.trangthai}`);
      console.log(`Max capacity: ${cls.sisotoida}`);
      console.log();
    }
    
    // Check enrolled students
    const studentsResult = await pool.query(
      `SELECT sv.MaSV, u.HoTen as TenSV, sv.TrangThai, sv.NgayDangKy
       FROM LopHoc_SinhVien sv
       JOIN NguoiDung u ON sv.MaSV = u.MaSo
       WHERE sv.MaLop = 'IT004-01'
       ORDER BY sv.NgayDangKy`
    );
    
    console.log('=== ENROLLED STUDENTS ===');
    console.log(`Total: ${studentsResult.rows.length} students\n`);
    studentsResult.rows.forEach((student, index) => {
      console.log(`${index + 1}. ${student.masv} - ${student.tensv} (${student.trangthai})`);
    });
    console.log();
    
    // Check room info
    const roomResult = await pool.query(
      `SELECT p.*, tn.TenToaNha 
       FROM PhongHoc p
       JOIN ToaNha tn ON p.MaToaNha = tn.MaToaNha
       WHERE p.MaPhong = 'G2-401'`
    );
    
    if (roomResult.rows.length > 0) {
      const room = roomResult.rows[0];
      console.log('=== ROOM INFORMATION ===');
      console.log(`Room Code: ${room.maphong}`);
      console.log(`Room Name: ${room.tenphong}`);
      console.log(`Building: ${room.tentoanha}`);
      console.log(`Floor: ${room.sotang}`);
      console.log(`Capacity: ${room.succhua} seats`);
      console.log(`Type: ${room.loaiphong}`);
      console.log();
    }
    
    console.log('✨ All operations completed successfully!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runUpdateScript();
