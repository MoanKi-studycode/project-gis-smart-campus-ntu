/**
 * mockApi.js
 * Frontend Mock Data & Service
 * MIRRORS BACKEND SEED DATA LOGIC (2025-12-28)
 */

import { buildingService } from './buildingService';

// --- 1. DATA GENERATORS ---

const generateUsers = () => {
  const users = [
    { MaSo: 'admin', MatKhau: '123', HoTen: 'Quản Trị Viên', Email: 'admin@ntu.edu.vn', MaVaiTro: 1, role: 'admin' },
    { MaSo: 'gv001', MatKhau: '123', HoTen: 'Nguyễn Văn A', Email: 'gv001@ntu.edu.vn', MaVaiTro: 2, ChucVu: 'Thạc sĩ', role: 'lecturer' },
    { MaSo: 'gv002', MatKhau: '123', HoTen: 'Trần Thị B', Email: 'gv002@ntu.edu.vn', MaVaiTro: 2, ChucVu: 'Tiến sĩ', role: 'lecturer' },
    { MaSo: 'gv003', MatKhau: '123', HoTen: 'Lê Văn C', Email: 'gv003@ntu.edu.vn', MaVaiTro: 2, ChucVu: 'Thạc sĩ', role: 'lecturer' },
    { MaSo: 'gv004', MatKhau: '123', HoTen: 'Phạm Thị D', Email: 'gv004@ntu.edu.vn', MaVaiTro: 2, ChucVu: 'Giảng viên chính', role: 'lecturer' },
    { MaSo: 'gv005', MatKhau: '123', HoTen: 'Hoàng Văn E', Email: 'gv005@ntu.edu.vn', MaVaiTro: 2, ChucVu: 'Tiến sĩ', role: 'lecturer' },
  ];

  const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng'];
  const middleNames = ['Văn', 'Thị', 'Minh', 'Đức', 'Ngọc', 'Thanh'];
  const firstNames = ['An', 'Bình', 'Cường', 'Dũng', 'Giang', 'Hương', 'Khánh', 'Lan', 'Minh', 'Nam'];

  for (let cohort = 61; cohort <= 65; cohort++) {
    for (let i = 0; i < 3; i++) {
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const id = `${cohort}${randomSuffix}`;
      const name = `${lastNames[Math.floor(Math.random() * lastNames.length)]} ${middleNames[Math.floor(Math.random() * middleNames.length)]} ${firstNames[Math.floor(Math.random() * firstNames.length)]}`;
      
      users.push({
        MaSo: id,
        MatKhau: '123',
        HoTen: name,
        Email: `sv${id}@ntu.edu.vn`,
        MaVaiTro: 3,
        NienKhoa: `${cohort}.CNTT`,
        role: 'student'
      });
    }
  }
  return users;
};

const UTILITIES = [
    {
      MaToaNha: 'ATM',
      TenToaNha: 'ATM Vietcombank',
      description: 'Cây ATM rút tiền tự động',
      type: 'UTILITY',
      location: { lat: 12.268000, lng: 109.202500, alt: 0 },
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/ATM_machine.jpg/640px-ATM_machine.jpg'
    },
    {
      MaToaNha: 'CANTEEN',
      TenToaNha: 'Căn tin Sinh viên',
      description: 'Khu vực ăn uống và giải khát',
      type: 'UTILITY',
      location: { lat: 12.268800, lng: 109.202800, alt: 0 },
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Canteen_interior.jpg/640px-Canteen_interior.jpg'
    }
];

const generateRooms = () => {
  // Only generate rooms for known academic buildings to avoid clutter
  const ACADEMIC_BUILDINGS = ['G2', 'G3', 'G6', 'G7'];
  const rooms = [];
  
  ACADEMIC_BUILDINGS.forEach(bId => {
    for (let f = 1; f <= 5; f++) {
      for (let r = 1; r <= 3; r++) {
        rooms.push({
          MaPhong: `${bId}-${f}0${r}`,
          TenPhong: `${f}0${r}`,
          MaToaNha: bId,
          SoTang: f
        });
      }
    }
  });

  return rooms;
};

const subjects = [
  // IT (G6)
  { MaMon: 'IT001', TenMon: 'Lập trình Web', SoTinChi: 3, Building: 'G6' },
  { MaMon: 'IT002', TenMon: 'Trí tuệ nhân tạo', SoTinChi: 3, Building: 'G6' },
  { MaMon: 'IT003', TenMon: 'Mạng máy tính', SoTinChi: 3, Building: 'G6' },
  { MaMon: 'IT004', TenMon: 'Cấu trúc dữ liệu', SoTinChi: 3, Building: 'G6' },
  // Social (G7)
  { MaMon: 'KT001', TenMon: 'Marketing căn bản', SoTinChi: 3, Building: 'G7' },
  { MaMon: 'XH001', TenMon: 'Triết học Mác-Lênin', SoTinChi: 3, Building: 'G7' },
  { MaMon: 'KT002', TenMon: 'Kinh tế vĩ mô', SoTinChi: 3, Building: 'G7' },
  { MaMon: 'QT001', TenMon: 'Quản trị nhân lực', SoTinChi: 3, Building: 'G7' },
  // English (G3)
  { MaMon: 'NN001', TenMon: 'Tiếng Anh chuyên ngành', SoTinChi: 3, Building: 'G3' },
  { MaMon: 'PL001', TenMon: 'Pháp luật đại cương', SoTinChi: 2, Building: 'G3' },
  { MaMon: 'NN002', TenMon: 'TOEIC 1', SoTinChi: 4, Building: 'G3' },
  { MaMon: 'PL002', TenMon: 'Luật kinh tế', SoTinChi: 3, Building: 'G3' },
  // General (G2)
  { MaMon: 'DC001', TenMon: 'Toán cao cấp', SoTinChi: 3, Building: 'G2' },
  { MaMon: 'DC002', TenMon: 'Giáo dục thể chất', SoTinChi: 1, Building: 'G2' },
  { MaMon: 'DC003', TenMon: 'Xác suất thống kê', SoTinChi: 3, Building: 'G2' },
  { MaMon: 'DC004', TenMon: 'Tư tưởng Hồ Chí Minh', SoTinChi: 2, Building: 'G2' }
];

const generateClasses = (rooms, lecturers) => {
  const classes = [];
  let counter = 1;

  subjects.forEach(subj => {
    // 2 classes per subject
    for (let i = 0; i < 2; i++) {
      // Filter rooms by building
      const validRooms = rooms.filter(r => r.MaToaNha === subj.Building);
      const room = validRooms[Math.floor(Math.random() * validRooms.length)];
      const lecturer = lecturers[Math.floor(Math.random() * lecturers.length)];
      
      const day = 2 + Math.floor(Math.random() * 6); // 2-7
      const startPeriod = 1 + Math.floor(Math.random() * 10);
      const duration = 2 + Math.floor(Math.random() * 2); // 2-3

      classes.push({
        MaLop: `L${String(counter).padStart(3, '0')}`,
        MaMon: subj.MaMon,
        MaPhong: room.MaPhong,
        MaGiangVien: lecturer.MaSo,
        Thu: day,
        MaTietBatDau: startPeriod,
        SoTiet: duration,
        TrangThai: 'DANG_HOC',
        HocKy: 1,
        NamHoc: '2025-2026'
      });
      counter++;
    }
  });
  return classes;
};

const generateEnrollments = (students, classes) => {
  const enrollments = []; // { MaLop, MaSV }

  students.forEach(student => {
    let count = 0;
    let attempts = 0;
    const studentClasses = [];

    while (count < 6 && attempts < 100) {
      attempts++;
      const cls = classes[Math.floor(Math.random() * classes.length)];
      
      // Check if already enrolled
      if (studentClasses.find(c => c.MaLop === cls.MaLop)) continue;

      // Check conflict
      const conflict = studentClasses.some(existing => 
        existing.Thu === cls.Thu &&
        (
          (existing.MaTietBatDau <= (cls.MaTietBatDau + cls.SoTiet - 1)) &&
          ((existing.MaTietBatDau + existing.SoTiet - 1) >= cls.MaTietBatDau)
        )
      );

      if (!conflict) {
        studentClasses.push(cls);
        enrollments.push({ MaLop: cls.MaLop, MaSV: student.MaSo });
        count++;
      }
    }
  });
  return enrollments;
};

const generateEvents = () => {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  
  return [
    // Ended
    { MaSuKien: 1, TieuDe: 'Hội thảo Blockchain', NoiDung: 'Ứng dụng Blockchain trong tài chính', ThoiGianBatDau: new Date(now.getTime() - 3 * day).toISOString(), ThoiGianKetThuc: new Date(now.getTime() - 2 * day).toISOString(), DoiTuong: 'ALL', targetRole: 'ALL', TrangThai: 'ENDED' },
    { MaSuKien: 2, TieuDe: 'Ngày hội việc làm', NoiDung: 'Gặp gỡ doanh nghiệp IT', ThoiGianBatDau: new Date(now.getTime() - 5 * day).toISOString(), ThoiGianKetThuc: new Date(now.getTime() - 4 * day).toISOString(), DoiTuong: 'SV_61.CNTT', targetRole: 'SINH_VIEN', TrangThai: 'ENDED' },
    // Ongoing
    { MaSuKien: 3, TieuDe: 'Triển lãm Công nghệ', NoiDung: 'Demo các sản phẩm IoT', ThoiGianBatDau: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), ThoiGianKetThuc: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), DoiTuong: 'ALL', targetRole: 'ALL', TrangThai: 'ACTIVE' },
    // Upcoming
    { MaSuKien: 4, TieuDe: 'Workshop AI & Big Data', NoiDung: 'Chuyên đề sâu về Deep Learning', ThoiGianBatDau: new Date(now.getTime() + 2 * day).toISOString(), ThoiGianKetThuc: new Date(now.getTime() + 2 * day + 4 * 60 * 60 * 1000).toISOString(), DoiTuong: 'SV_62.CNTT', targetRole: 'SINH_VIEN', TrangThai: 'ACTIVE' },
    { MaSuKien: 5, TieuDe: 'Cuộc thi Hùng biện Tiếng Anh', NoiDung: 'Vòng chung kết cấp trường', ThoiGianBatDau: new Date(now.getTime() + 4 * day).toISOString(), ThoiGianKetThuc: new Date(now.getTime() + 4 * day + 3 * 60 * 60 * 1000).toISOString(), DoiTuong: 'ALL', targetRole: 'ALL', TrangThai: 'ACTIVE' },
    { MaSuKien: 6, TieuDe: 'Tập huấn Cán bộ lớp', NoiDung: 'Kỹ năng lãnh đạo', ThoiGianBatDau: new Date(now.getTime() + 5 * day).toISOString(), ThoiGianKetThuc: new Date(now.getTime() + 5 * day + 2 * 60 * 60 * 1000).toISOString(), DoiTuong: 'ALL', targetRole: 'ALL', TrangThai: 'ACTIVE' },
    { MaSuKien: 7, TieuDe: 'Họp giao ban Giảng viên', NoiDung: 'Triển khai kế hoạch học kỳ mới', ThoiGianBatDau: new Date(now.getTime() + 1 * day).toISOString(), ThoiGianKetThuc: new Date(now.getTime() + 1 * day + 2 * 60 * 60 * 1000).toISOString(), DoiTuong: 'GV', targetRole: 'GIANG_VIEN', TrangThai: 'ACTIVE' }
  ];
};

// --- 2. INITIALIZE DB ---

const Users = generateUsers();
let ToaNha = []; // Initialize empty, populated on first fetch
const PhongHoc = generateRooms();
const MonHoc = subjects;
const LopHoc = generateClasses(PhongHoc, Users.filter(u => u.role === 'lecturer'));
const LopHoc_SinhVien = generateEnrollments(Users.filter(u => u.role === 'student'), LopHoc);
const SuKien = generateEvents();
const PhienDiemDanh = [];
const KetQuaDiemDanh = [];

const DB = { Users, ToaNha, PhongHoc, MonHoc, LopHoc, LopHoc_SinhVien, SuKien, PhienDiemDanh, KetQuaDiemDanh };

// --- 3. HELPER FUNCTIONS ---

const getPeriodTime = (period) => {
  const times = {
    1: { start: '07:00', end: '07:50' },
    2: { start: '07:55', end: '08:45' },
    3: { start: '08:50', end: '09:40' },
    4: { start: '09:50', end: '10:40' },
    5: { start: '10:45', end: '11:35' },
    6: { start: '12:30', end: '13:20' },
    7: { start: '13:25', end: '14:15' },
    8: { start: '14:20', end: '15:10' },
    9: { start: '15:20', end: '16:10' },
    10: { start: '16:15', end: '17:05' },
    11: { start: '17:10', end: '18:00' },
    12: { start: '18:05', end: '18:55' },
    13: { start: '19:00', end: '19:50' }
  };
  return times[period] || { start: '00:00', end: '00:00' };
};

// --- 4. SERVICE API ---

export const mockApi = {
  // Auth
  login: async (username, password) => {
    const user = DB.Users.find(u => u.MaSo === username && u.MatKhau === password);
    if (!user) return null;
    return user;
  },

  // Metadata
  getBuildings: async () => {
    if (ToaNha.length === 0) {
      const dynamicBuildings = await buildingService.getAllBuildings();
      ToaNha = [...dynamicBuildings, ...UTILITIES];
      DB.ToaNha = ToaNha;
    }
    return ToaNha;
  },
  getRooms: async () => DB.PhongHoc,

  // --- ADMIN: USER MANAGEMENT ---
  getUsers: async () => {
    return DB.Users;
  },

  addUser: async (user) => {
    const roleMapReverse = { 'admin': 1, 'lecturer': 2, 'student': 3 };
    const newUser = {
        ...user,
        MaVaiTro: roleMapReverse[user.role] || 3,
        MatKhau: '123' // Default password
    };
    DB.Users.push(newUser);
    return { success: true, user: newUser };
  },

  deleteUser: async (userId) => {
    const index = DB.Users.findIndex(u => u.MaSo === userId);
    if (index !== -1) {
        DB.Users.splice(index, 1);
        return { success: true };
    }
    return { success: false, message: 'User not found' };
  },

  // --- ADMIN: EVENT MANAGEMENT ---
  getEvents: async () => {
    return DB.SuKien;
  },

  addEvent: async (event) => {
    const newEvent = {
        ...event,
        MaSuKien: Date.now(),
        TrangThai: 'ACTIVE'
    };
    DB.SuKien.push(newEvent);
    return { success: true, event: newEvent };
  },

  deleteEvent: async (eventId) => {
    const index = DB.SuKien.findIndex(e => e.MaSuKien === eventId);
    if (index !== -1) {
        DB.SuKien.splice(index, 1);
        return { success: true };
    }
    return { success: false, message: 'Event not found' };
  },

  // --- ADMIN: ACADEMIC MANAGEMENT ---
  getSubjects: async () => {
    return DB.MonHoc;
  },

  addSubject: async (subject) => {
    DB.MonHoc.push(subject);
    return { success: true };
  },

  deleteSubject: async (subjectId) => {
    const index = DB.MonHoc.findIndex(m => m.MaMon === subjectId);
    if (index !== -1) {
        DB.MonHoc.splice(index, 1);
        return { success: true };
    }
    return { success: false };
  },

  getAllClasses: async () => {
    return DB.LopHoc.map(c => {
        const subject = DB.MonHoc.find(m => m.MaMon === c.MaMon);
        const teacher = DB.Users.find(u => u.MaSo === c.MaGiangVien);
        return { ...c, TenMon: subject?.TenMon, TenGV: teacher?.HoTen };
    });
  },

  addClass: async (cls) => {
    DB.LopHoc.push(cls);
    return { success: true };
  },

  deleteClass: async (classId) => {
    const index = DB.LopHoc.findIndex(c => c.MaLop === classId);
    if (index !== -1) {
        DB.LopHoc.splice(index, 1);
        return { success: true };
    }
    return { success: false };
  },

  // Schedule Logic (Strict Isolation)
  getSchedule: async (userId, role) => {
    let classes = [];
    
    if (role === 'student') {
      // Join LopHoc_SinhVien -> LopHoc -> MonHoc, PhongHoc, GiangVien
      const enrolledClassIds = DB.LopHoc_SinhVien
        .filter(e => e.MaSV === userId)
        .map(e => e.MaLop);
        
      classes = DB.LopHoc.filter(c => enrolledClassIds.includes(c.MaLop));
    } else if (role === 'lecturer') {
      // Filter LopHoc by MaGiangVien
      classes = DB.LopHoc.filter(c => c.MaGiangVien === userId);
    }

    // Hydrate with details
    return classes.map(c => {
      const subject = DB.MonHoc.find(m => m.MaMon === c.MaMon);
      const room = DB.PhongHoc.find(p => p.MaPhong === c.MaPhong);
      const teacher = DB.Users.find(u => u.MaSo === c.MaGiangVien);
      const time = getPeriodTime(c.MaTietBatDau);
      
      return {
        ...c,
        TenMon: subject?.TenMon,
        TenPhong: room?.TenPhong,
        TenToaNha: room?.MaToaNha,
        TenGV: teacher?.HoTen,
        GioBatDau: time.start,
        GioKetThuc: time.end
      };
    });
  },

  // Activities & Notifications
  getActivities: async (userId, role) => {
    const user = DB.Users.find(u => u.MaSo === userId);
    if (!user) return [];

    let activities = [];

    // 1. General Events
    const events = DB.SuKien.filter(e => {
      if (e.TrangThai !== 'ACTIVE') return false;
      if (e.targetRole === 'ALL') return true;
      
      const userRole = role === 'student' ? 'SINH_VIEN' : (role === 'lecturer' ? 'GIANG_VIEN' : 'ADMIN');
      if (e.targetRole === userRole) return true;
      
      // Legacy checks fallback
      if (e.DoiTuong === 'ALL') return true;
      if (role === 'student' && e.DoiTuong === `SV_${user.NienKhoa}`) return true;
      if (role === 'lecturer' && e.DoiTuong === 'GV') return true;
      
      return false;
    }).map(e => ({ ...e, type: 'EVENT' }));
    
    activities = [...activities, ...events];

    // 2. Attendance Requests (Student Only)
    if (role === 'student') {
      const enrolledClassIds = DB.LopHoc_SinhVien
        .filter(e => e.MaSV === userId)
        .map(e => e.MaLop);
      
      const activeSessions = DB.PhienDiemDanh.filter(s => 
        s.TrangThai === 'OPEN' && enrolledClassIds.includes(s.MaLop)
      );

      const attendanceReqs = activeSessions.map(s => {
        const cls = DB.LopHoc.find(c => c.MaLop === s.MaLop);
        const subject = DB.MonHoc.find(m => m.MaMon === cls.MaMon);
        return {
          id: `ATT-${s.MaPhien}`,
          type: 'ATTENDANCE',
          title: 'Điểm danh đang mở',
          content: `Lớp ${subject.TenMon} (${cls.MaLop}) đang yêu cầu điểm danh.`,
          MaPhien: s.MaPhien,
          MaLop: s.MaLop
        };
      });
      
      activities = [...attendanceReqs, ...activities];
    }

    return activities;
  },

  // Lecturer: Register Class
  getAvailableClasses: async () => {
    return DB.LopHoc.filter(c => c.TrangThai === 'CHO_GV_DANG_KY').map(c => {
      const subject = DB.MonHoc.find(m => m.MaMon === c.MaMon);
      return { ...c, TenMon: subject?.TenMon };
    });
  },

  registerClass: async (userId, classId) => {
    const clsIndex = DB.LopHoc.findIndex(c => c.MaLop === classId);
    if (clsIndex === -1) return { success: false, message: 'Class not found' };
    
    DB.LopHoc[clsIndex].MaGiangVien = userId;
    DB.LopHoc[clsIndex].TrangThai = 'CHO_ADMIN_DUYET';
    return { success: true, message: 'Registered successfully' };
  },

  // Attendance Control
  toggleAttendance: async (userId, classId, action) => {
    // Verify ownership
    const cls = DB.LopHoc.find(c => c.MaLop === classId && c.MaGiangVien === userId);
    if (!cls) return { success: false, message: 'Unauthorized' };

    if (action === 'START') {
      // Close existing
      DB.PhienDiemDanh.forEach(s => {
        if (s.MaLop === classId && s.TrangThai === 'OPEN') s.TrangThai = 'CLOSED';
      });
      // Open new
      const newSession = {
        MaPhien: Date.now(),
        MaLop: classId,
        ThoiGianBatDau: new Date().toISOString(),
        TrangThai: 'OPEN'
      };
      DB.PhienDiemDanh.push(newSession);
      return { success: true, status: 'OPEN', sessionId: newSession.MaPhien };
    } else {
      // Stop
      DB.PhienDiemDanh.forEach(s => {
        if (s.MaLop === classId && s.TrangThai === 'OPEN') s.TrangThai = 'CLOSED';
      });
      return { success: true, status: 'CLOSED' };
    }
  },

  submitAttendance: async (userId, sessionId, location) => {
    const session = DB.PhienDiemDanh.find(s => s.MaPhien === sessionId && s.TrangThai === 'OPEN');
    if (!session) return { success: false, message: 'Session closed or invalid' };

    DB.KetQuaDiemDanh.push({
      MaKetQua: Date.now(),
      MaPhien: sessionId,
      MaSV: userId,
      ThoiGianCheckIn: new Date().toISOString(),
      ViTriCheckIn: location,
      TrangThai: 'CO_MAT'
    });
    return { success: true, message: 'Checked in successfully' };
  },

  // Map Room Info Logic
  getRoomInfo: async (roomId) => {
    const now = new Date();
    // Simplified: Just find ANY active class in this room for now
    const activeClass = DB.LopHoc.find(c => 
      c.MaPhong === roomId && 
      c.TrangThai === 'DANG_HOC'
    );

    if (!activeClass) return { status: 'FREE', message: 'Phòng trống' };

    const subject = DB.MonHoc.find(m => m.MaMon === activeClass.MaMon);
    const teacher = DB.Users.find(u => u.MaSo === activeClass.MaGiangVien);

    return {
      status: 'OCCUPIED',
      classInfo: {
        MaLop: activeClass.MaLop,
        TenMon: subject?.TenMon,
        TenGV: teacher?.HoTen,
        MaGiangVien: activeClass.MaGiangVien
      }
    };
  }
};
