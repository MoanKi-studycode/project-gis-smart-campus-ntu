/**
 * Room Status Routes
 * Real-time room status based on class schedules and events
 */
import { Router } from 'express';
import { getPool } from '../db.js';

const router = Router();

/**
 * Helper: Get period times
 */
const getPeriodTimes = () => ({
  1: { start: '07:00:00', end: '07:50:00' },
  2: { start: '07:55:00', end: '08:45:00' },
  3: { start: '08:50:00', end: '09:40:00' },
  4: { start: '09:50:00', end: '10:40:00' },
  5: { start: '10:45:00', end: '11:35:00' },
  6: { start: '12:30:00', end: '13:20:00' },
  7: { start: '13:25:00', end: '14:15:00' },
  8: { start: '14:20:00', end: '15:10:00' },
  9: { start: '15:20:00', end: '16:10:00' },
  10: { start: '16:15:00', end: '17:05:00' },
  11: { start: '17:10:00', end: '18:00:00' },
  12: { start: '18:05:00', end: '18:55:00' },
  13: { start: '19:00:00', end: '19:50:00' }
});

/**
 * Calculate room status based on current time and schedule
 * @param {Date} now - Current time
 * @param {string} startTime - Start time HH:MM:SS
 * @param {string} endTime - End time HH:MM:SS
 * @returns {{ status: string, statusLabel: string, color: string }}
 */
function calculateStatus(now, startTime, endTime) {
  const todayStr = now.toISOString().split('T')[0];
  const startDateTime = new Date(`${todayStr}T${startTime}`);
  const endDateTime = new Date(`${todayStr}T${endTime}`);
  
  const diffToStart = (startDateTime - now) / 60000; // minutes
  const diffToEnd = (endDateTime - now) / 60000; // minutes
  
  if (diffToStart > 5) {
    return { status: 'EMPTY', statusLabel: 'Phòng trống', color: 'gray' };
  } else if (diffToStart > 0 && diffToStart <= 5) {
    return { status: 'UPCOMING', statusLabel: 'Sắp bắt đầu', color: 'yellow' };
  } else if (diffToEnd > 5) {
    return { status: 'IN_PROGRESS', statusLabel: 'Đang học', color: 'green' };
  } else if (diffToEnd > 0 && diffToEnd <= 5) {
    return { status: 'ENDING_SOON', statusLabel: 'Sắp kết thúc', color: 'red' };
  } else {
    return { status: 'EMPTY', statusLabel: 'Phòng trống', color: 'gray' };
  }
}

/**
 * GET /api/room-status/:maPhong
 * Get real-time room status for a specific classroom
 */
router.get('/:maPhong', async (req, res) => {
  try {
    const pool = getPool();
    const { maPhong } = req.params;
    const now = new Date();
    const currentDay = now.getDay() === 0 ? 8 : now.getDay() + 1; // Convert to VN weekday (2-8)
    const currentTimeStr = now.toTimeString().slice(0, 8); // HH:MM:SS

    // 1. Check for class in this room at current time
    // Supports both fixed weekday classes (Thu = 2-8) and all-week classes (Thu = null)
    const classQuery = `
      SELECT 
        l.MaLop, l.MaMon, l.MaGiangVien, l.Thu, l.MaTietBatDau, l.SoTiet,
        m.TenMon, m.SoTinChi,
        gv.HoTen AS TenGiangVien, gv.Avatar AS AvatarGiangVien,
        t_start.GioBatDau, t_end.GioKetThuc,
        p.TenPhong, p.SucChua
      FROM LopHoc l
      JOIN MonHoc m ON l.MaMon = m.MaMon
      JOIN NguoiDung gv ON l.MaGiangVien = gv.MaSo
      JOIN TietHoc t_start ON l.MaTietBatDau = t_start.MaTiet
      JOIN TietHoc t_end ON (l.MaTietBatDau + l.SoTiet - 1) = t_end.MaTiet
      JOIN PhongHoc p ON l.MaPhong = p.MaPhong
      WHERE l.MaPhong = $1 
        AND (l.Thu = $2 OR l.Thu IS NULL)
        AND l.TrangThai = 'DANG_HOC'
        AND t_start.GioBatDau <= $3::time + interval '5 minutes'
        AND t_end.GioKetThuc >= $3::time - interval '5 minutes'
      ORDER BY t_start.GioBatDau ASC
      LIMIT 1
    `;
    
    const classResult = await pool.query(classQuery, [maPhong, currentDay, currentTimeStr]);

    // 2. Check for events in this room
    const eventQuery = `
      SELECT 
        s.MaSuKien, s.TenSuKien, s.MoTa, s.ThoiGianBatDau, s.ThoiGianKetThuc,
        s.LoaiSuKien, s.DoiTuong,
        n.HoTen AS TenNguoiTao, n.Avatar AS AvatarNguoiTao
      FROM SuKien s
      LEFT JOIN NguoiDung n ON s.NguoiTao = n.MaSo
      WHERE s.MaPhong = $1 
        AND s.TrangThai = 'ACTIVE'
        AND s.ThoiGianBatDau <= NOW() + interval '5 minutes'
        AND s.ThoiGianKetThuc >= NOW() - interval '5 minutes'
      ORDER BY s.ThoiGianBatDau ASC
      LIMIT 1
    `;
    
    const eventResult = await pool.query(eventQuery, [maPhong]);

    // 3. Determine which activity to show (class or event)
    if (classResult.rows.length > 0) {
      const cls = classResult.rows[0];
      const periodTimes = getPeriodTimes();
      const startTime = cls.giobatdau || periodTimes[cls.matietbatdau]?.start;
      const endTime = cls.gioketthuc || periodTimes[cls.matietbatdau + cls.sotiet - 1]?.end;
      
      const statusInfo = calculateStatus(now, startTime, endTime);

      return res.json({
        type: 'CLASS',
        ...statusInfo,
        data: {
          maLop: cls.malop,
          tenMon: cls.tenmon,
          soTinChi: cls.sotinchi,
          giangVien: {
            hoTen: cls.tengiangvien,
            avatar: cls.avatargiangvien
          },
          thoiGian: {
            batDau: startTime?.slice(0, 5),
            ketThuc: endTime?.slice(0, 5)
          },
          phong: {
            tenPhong: cls.tenphong,
            sucChua: cls.succhua
          }
        }
      });
    }

    if (eventResult.rows.length > 0) {
      const event = eventResult.rows[0];
      const startTime = new Date(event.thoigianbatdau);
      const endTime = new Date(event.thoigianketthuc);
      
      let statusInfo;
      const diffToStart = (startTime - now) / 60000;
      const diffToEnd = (endTime - now) / 60000;
      
      if (diffToStart > 5) {
        statusInfo = { status: 'EMPTY', statusLabel: 'Phòng trống', color: 'gray' };
      } else if (diffToStart > 0 && diffToStart <= 5) {
        statusInfo = { status: 'UPCOMING', statusLabel: 'Sắp diễn ra', color: 'yellow' };
      } else if (diffToEnd > 5) {
        statusInfo = { status: 'IN_PROGRESS', statusLabel: 'Đang diễn ra', color: 'green' };
      } else if (diffToEnd > 0 && diffToEnd <= 5) {
        statusInfo = { status: 'ENDING_SOON', statusLabel: 'Sắp kết thúc', color: 'red' };
      } else {
        statusInfo = { status: 'EMPTY', statusLabel: 'Phòng trống', color: 'gray' };
      }

      return res.json({
        type: 'EVENT',
        ...statusInfo,
        data: {
          maSuKien: event.masukien,
          tenSuKien: event.tensukien,
          moTa: event.mota,
          loaiSuKien: event.loaisukien,
          doiTuong: event.doituong,
          chuSuKien: {
            hoTen: event.tennguoitao,
            avatar: event.avatarnguoitao
          },
          thoiGian: {
            batDau: startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            ketThuc: endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          }
        }
      });
    }

    // 4. Room is empty
    return res.json({
      type: 'EMPTY',
      status: 'EMPTY',
      statusLabel: 'Phòng trống',
      color: 'gray',
      data: null
    });

  } catch (error) {
    console.error('Get room status error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/room-status/building/:maToaNha
 * Get status of all rooms in a building (summary view)
 */
router.get('/building/:maToaNha', async (req, res) => {
  try {
    const pool = getPool();
    const { maToaNha } = req.params;
    const { floor } = req.query;
    const now = new Date();
    const currentDay = now.getDay() === 0 ? 8 : now.getDay() + 1;
    const currentTimeStr = now.toTimeString().slice(0, 8);

    let roomQuery = `
      SELECT MaPhong, TenPhong, SoTang, SucChua, LoaiPhong 
      FROM PhongHoc 
      WHERE MaToaNha = $1
    `;
    const params = [maToaNha];

    if (floor) {
      roomQuery += ` AND SoTang = $2`;
      params.push(parseInt(floor));
    }

    roomQuery += ` ORDER BY SoTang, TenPhong`;

    const roomsResult = await pool.query(roomQuery, params);
    
    // For each room, check current status
    const roomStatuses = await Promise.all(roomsResult.rows.map(async (room) => {
      // Check class - supports both fixed weekday (Thu = 2-8) and all-week classes (Thu = null)
      const classQuery = `
        SELECT 
          l.MaLop, m.TenMon, gv.HoTen AS TenGV,
          t_start.GioBatDau, t_end.GioKetThuc
        FROM LopHoc l
        JOIN MonHoc m ON l.MaMon = m.MaMon
        JOIN NguoiDung gv ON l.MaGiangVien = gv.MaSo
        JOIN TietHoc t_start ON l.MaTietBatDau = t_start.MaTiet
        JOIN TietHoc t_end ON (l.MaTietBatDau + l.SoTiet - 1) = t_end.MaTiet
        WHERE l.MaPhong = $1 
          AND (l.Thu = $2 OR l.Thu IS NULL)
          AND l.TrangThai = 'DANG_HOC'
          AND t_start.GioBatDau <= $3::time + interval '5 minutes'
          AND t_end.GioKetThuc >= $3::time - interval '5 minutes'
        LIMIT 1
      `;
      
      const classResult = await pool.query(classQuery, [room.maphong, currentDay, currentTimeStr]);
      
      if (classResult.rows.length > 0) {
        const cls = classResult.rows[0];
        const statusInfo = calculateStatus(now, cls.giobatdau, cls.gioketthuc);
        return {
          ...room,
          ...statusInfo,
          type: 'CLASS',
          activity: {
            tenMon: cls.tenmon,
            tenGV: cls.tengv,
            thoiGian: {
              batDau: cls.giobatdau?.slice(0, 5),
              ketThuc: cls.gioketthuc?.slice(0, 5)
            }
          }
        };
      }

      // Check event
      const eventQuery = `
        SELECT TenSuKien, ThoiGianBatDau, ThoiGianKetThuc
        FROM SuKien 
        WHERE MaPhong = $1 
          AND TrangThai = 'ACTIVE'
          AND ThoiGianBatDau <= NOW() + interval '5 minutes'
          AND ThoiGianKetThuc >= NOW() - interval '5 minutes'
        LIMIT 1
      `;
      
      const eventResult = await pool.query(eventQuery, [room.maphong]);
      
      if (eventResult.rows.length > 0) {
        const event = eventResult.rows[0];
        return {
          ...room,
          status: 'EVENT',
          statusLabel: 'Có sự kiện',
          color: 'blue',
          type: 'EVENT',
          activity: {
            tenSuKien: event.tensukien
          }
        };
      }

      return {
        ...room,
        status: 'EMPTY',
        statusLabel: 'Phòng trống',
        color: 'gray',
        type: 'EMPTY',
        activity: null
      };
    }));

    res.json(roomStatuses);

  } catch (error) {
    console.error('Get building room statuses error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

export default router;
