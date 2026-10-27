-- ==================================================================================
-- SMART CAMPUS DATABASE SCHEMA (CLEAN REBUILD)
-- Senior Software Architect Design
-- Date: 2025-12-30 (Updated: 2026-01-05)
-- 
-- RULES:
-- ❌ NO settings tables (caidat, caidathethong, etc.)
-- ✅ PostgreSQL for: Accounts, Academic, Attendance, Events, Scheduling
-- ✅ Map data: GeoJSON in frontend (NOT in PostgreSQL)
-- ✅ All tables have PRIMARY KEY
-- ✅ All relationships have FOREIGN KEY with proper ON DELETE/UPDATE actions
-- ==================================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP ALL TABLES (clean slate)
DROP TABLE IF EXISTS KetQuaDiemDanh CASCADE;
DROP TABLE IF EXISTS PhienDiemDanh CASCADE;
DROP TABLE IF EXISTS SuKien CASCADE;
DROP TABLE IF EXISTS LopHoc_SinhVien CASCADE;
DROP TABLE IF EXISTS LopHoc CASCADE;
DROP TABLE IF EXISTS MonHoc CASCADE;
DROP TABLE IF EXISTS PhongHoc CASCADE;
DROP TABLE IF EXISTS ToaNha CASCADE;
DROP TABLE IF EXISTS NguoiDung CASCADE;
DROP TABLE IF EXISTS TietHoc CASCADE;
DROP TABLE IF EXISTS Nganh CASCADE;
DROP TABLE IF EXISTS Khoa CASCADE;
DROP TABLE IF EXISTS VaiTro CASCADE;

-- ==================================================================================
-- REFERENCE TABLES
-- ==================================================================================

-- 1. Roles (VaiTro)
CREATE TABLE VaiTro (
    MaVaiTro INTEGER PRIMARY KEY,
    TenVaiTro VARCHAR(50) NOT NULL UNIQUE,
    MoTa VARCHAR(255)
);

INSERT INTO VaiTro (MaVaiTro, TenVaiTro, MoTa) VALUES
(1, 'admin', 'Quản trị viên hệ thống'),
(2, 'lecturer', 'Giảng viên'),
(3, 'student', 'Sinh viên');

-- 2. Academic Periods (TietHoc)
CREATE TABLE TietHoc (
    MaTiet INTEGER PRIMARY KEY,
    TenTiet VARCHAR(50) NOT NULL,
    GioBatDau TIME NOT NULL,
    GioKetThuc TIME NOT NULL,
    CONSTRAINT tiethoc_time_check CHECK (GioKetThuc > GioBatDau)
);

INSERT INTO TietHoc (MaTiet, TenTiet, GioBatDau, GioKetThuc) VALUES
(1, 'Tiết 1', '07:00:00', '07:50:00'),
(2, 'Tiết 2', '07:55:00', '08:45:00'),
(3, 'Tiết 3', '08:50:00', '09:40:00'),
(4, 'Tiết 4', '09:50:00', '10:40:00'),
(5, 'Tiết 5', '10:45:00', '11:35:00'),
(6, 'Tiết 6', '12:30:00', '13:20:00'),
(7, 'Tiết 7', '13:25:00', '14:15:00'),
(8, 'Tiết 8', '14:20:00', '15:10:00'),
(9, 'Tiết 9', '15:20:00', '16:10:00'),
(10, 'Tiết 10', '16:15:00', '17:05:00'),
(11, 'Tiết 11', '17:10:00', '18:00:00'),
(12, 'Tiết 12', '18:05:00', '18:55:00'),
(13, 'Tiết 13', '19:00:00', '19:50:00');

-- 3. Faculties (Khoa)
CREATE TABLE Khoa (
    MaKhoa VARCHAR(20) PRIMARY KEY,
    TenKhoa VARCHAR(100) NOT NULL
);

INSERT INTO Khoa (MaKhoa, TenKhoa) VALUES
('CNTT', 'Công nghệ Thông tin'),
('KTQTKD', 'Kinh tế & Quản trị Kinh doanh'),
('NN', 'Ngoại ngữ'),
('DC', 'Đại cương'),
('KTB', 'Kỹ thuật Biển'),
('CNSH', 'Công nghệ Sinh học'),
('NTTS', 'Nuôi trồng Thủy sản');

-- 4. Majors (Nganh)
CREATE TABLE Nganh (
    MaNganh VARCHAR(20) PRIMARY KEY,
    TenNganh VARCHAR(100) NOT NULL,
    MaKhoa VARCHAR(20) NOT NULL,
    CONSTRAINT nganh_khoa_fk FOREIGN KEY (MaKhoa) 
        REFERENCES Khoa(MaKhoa) ON UPDATE CASCADE ON DELETE RESTRICT
);

INSERT INTO Nganh (MaNganh, TenNganh, MaKhoa) VALUES
('CNTT', 'Công nghệ Thông tin', 'CNTT'),
('KTPM', 'Kỹ thuật Phần mềm', 'CNTT'),
('HTTT', 'Hệ thống Thông tin', 'CNTT'),
('QTKD', 'Quản trị Kinh doanh', 'KTQTKD'),
('TCNH', 'Tài chính Ngân hàng', 'KTQTKD'),
('NNAH', 'Ngôn ngữ Anh', 'NN');

-- ==================================================================================
-- CORE TABLES
-- ==================================================================================

-- 5. Buildings (ToaNha) - Reference for room location
CREATE TABLE ToaNha (
    MaToaNha VARCHAR(20) PRIMARY KEY,
    TenToaNha VARCHAR(100) NOT NULL,
    MoTa TEXT,
    HinhAnh TEXT,
    MapKey VARCHAR(20)
);

-- 6. Classrooms (PhongHoc)
CREATE TABLE PhongHoc (
    MaPhong VARCHAR(20) PRIMARY KEY,
    TenPhong VARCHAR(100) NOT NULL,
    MaToaNha VARCHAR(20) NOT NULL,
    SoTang INTEGER,
    SucChua INTEGER DEFAULT 50,
    LoaiPhong VARCHAR(50) DEFAULT 'LY_THUYET'
        CHECK (LoaiPhong IN ('LY_THUYET', 'THUC_HANH', 'HOI_TRUONG', 'PHONG_MAY')),
    CONSTRAINT phonghoc_toanha_fk FOREIGN KEY (MaToaNha) 
        REFERENCES ToaNha(MaToaNha) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT phonghoc_succhua_check CHECK (SucChua IS NULL OR SucChua > 0),
    CONSTRAINT phonghoc_sotang_check CHECK (SoTang IS NULL OR SoTang >= 0)
);

CREATE INDEX idx_phonghoc_toanha ON PhongHoc(MaToaNha);

-- 7. Users (NguoiDung)
CREATE TABLE NguoiDung (
    MaSo VARCHAR(20) PRIMARY KEY,
    MatKhau VARCHAR(255) NOT NULL,
    HoTen VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE,
    SoDienThoai VARCHAR(20),
    Avatar TEXT,
    MaVaiTro INTEGER NOT NULL,
    
    -- Student-specific
    NienKhoa VARCHAR(20),
    MaNganh VARCHAR(20),
    LopQuanLy VARCHAR(50),
    
    -- Lecturer-specific
    ChucVu VARCHAR(50),
    MaKhoa VARCHAR(20),
    ChuyenMon TEXT,
    
    -- Status
    TrangThai VARCHAR(20) DEFAULT 'ACTIVE' 
        CHECK (TrangThai IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT nguoidung_vaitro_fk FOREIGN KEY (MaVaiTro) 
        REFERENCES VaiTro(MaVaiTro) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT nguoidung_nganh_fk FOREIGN KEY (MaNganh) 
        REFERENCES Nganh(MaNganh) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT nguoidung_khoa_fk FOREIGN KEY (MaKhoa) 
        REFERENCES Khoa(MaKhoa) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX idx_nguoidung_vaitro ON NguoiDung(MaVaiTro);
CREATE INDEX idx_nguoidung_khoa ON NguoiDung(MaKhoa);
CREATE INDEX idx_nguoidung_nganh ON NguoiDung(MaNganh);
CREATE INDEX idx_nguoidung_trangthai ON NguoiDung(TrangThai);
CREATE INDEX idx_nguoidung_vaitro_trangthai ON NguoiDung(MaVaiTro, TrangThai);

-- 8. Subjects (MonHoc)
CREATE TABLE MonHoc (
    MaMon VARCHAR(20) PRIMARY KEY,
    TenMon VARCHAR(150) NOT NULL,
    SoTinChi INTEGER DEFAULT 3 CHECK (SoTinChi >= 1 AND SoTinChi <= 10),
    MaNganh VARCHAR(20),
    NamHoc VARCHAR(20) NOT NULL,
    MoTa TEXT,
    TrangThai VARCHAR(20) DEFAULT 'ACTIVE' CHECK (TrangThai IN ('ACTIVE', 'INACTIVE')),
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT monhoc_nganh_fk FOREIGN KEY (MaNganh) 
        REFERENCES Nganh(MaNganh) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX idx_monhoc_nganh ON MonHoc(MaNganh);
CREATE INDEX idx_monhoc_namhoc ON MonHoc(NamHoc);
CREATE INDEX idx_monhoc_trangthai ON MonHoc(TrangThai);

-- 9. Class Sections (LopHoc)
CREATE TABLE LopHoc (
    MaLop VARCHAR(20) PRIMARY KEY,
    MaMon VARCHAR(20) NOT NULL,
    MaGiangVien VARCHAR(20),
    
    -- Schedule
    HocKy INTEGER NOT NULL CHECK (HocKy IN (1, 2, 3)),
    NamHoc VARCHAR(20) NOT NULL,
    Thu INTEGER CHECK (Thu IS NULL OR (Thu >= 2 AND Thu <= 8)),
    MaTietBatDau INTEGER,
    SoTiet INTEGER DEFAULT 3 CHECK (SoTiet IS NULL OR SoTiet > 0),
    MaPhong VARCHAR(20),
    
    -- Status: CHO_XAC_NHAN -> DA_XAC_NHAN -> MO_DANG_KY -> DANG_HOC -> DA_DONG
    TrangThai VARCHAR(20) DEFAULT 'CHO_XAC_NHAN' 
        CHECK (TrangThai IN ('CHO_XAC_NHAN', 'DA_XAC_NHAN', 'MO_DANG_KY', 'DANG_HOC', 'DA_DONG')),
    
    SiSoToiDa INTEGER DEFAULT 50 CHECK (SiSoToiDa IS NULL OR SiSoToiDa > 0),
    HanDangKy TIMESTAMP,
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT lophoc_mon_fk FOREIGN KEY (MaMon) 
        REFERENCES MonHoc(MaMon) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT lophoc_giangvien_fk FOREIGN KEY (MaGiangVien) 
        REFERENCES NguoiDung(MaSo) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT lophoc_tiet_fk FOREIGN KEY (MaTietBatDau) 
        REFERENCES TietHoc(MaTiet) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT lophoc_phong_fk FOREIGN KEY (MaPhong) 
        REFERENCES PhongHoc(MaPhong) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX idx_lophoc_mon ON LopHoc(MaMon);
CREATE INDEX idx_lophoc_gv ON LopHoc(MaGiangVien);
CREATE INDEX idx_lophoc_hocky ON LopHoc(HocKy, NamHoc);
CREATE INDEX idx_lophoc_trangthai ON LopHoc(TrangThai);
CREATE INDEX idx_lophoc_phong ON LopHoc(MaPhong);
CREATE INDEX idx_lophoc_gv_hocky ON LopHoc(MaGiangVien, HocKy, NamHoc);
-- 10. Class Enrollment (LopHoc_SinhVien) - Junction table (Many-to-Many)
CREATE TABLE LopHoc_SinhVien (
    MaLop VARCHAR(20) NOT NULL,
    MaSV VARCHAR(20) NOT NULL,
    NgayDangKy TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TrangThai VARCHAR(20) DEFAULT 'DANG_HOC' 
        CHECK (TrangThai IN ('DANG_HOC', 'DA_HOAN_THANH', 'DA_HUY')),
    PRIMARY KEY (MaLop, MaSV),
    
    CONSTRAINT lophoc_sv_lop_fk FOREIGN KEY (MaLop) 
        REFERENCES LopHoc(MaLop) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT lophoc_sv_sv_fk FOREIGN KEY (MaSV) 
        REFERENCES NguoiDung(MaSo) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_lophoc_sv_masv ON LopHoc_SinhVien(MaSV);
CREATE INDEX idx_lophoc_sv_trangthai ON LopHoc_SinhVien(TrangThai);

-- 11. Events (SuKien)
CREATE TABLE SuKien (
    MaSuKien SERIAL PRIMARY KEY,
    TenSuKien VARCHAR(200) NOT NULL,
    MoTa TEXT,
    
    -- Location
    MaToaNha VARCHAR(20),
    MaPhong VARCHAR(20),
    DiaDiem VARCHAR(255),
    
    -- Time
    ThoiGianBatDau TIMESTAMP NOT NULL,
    ThoiGianKetThuc TIMESTAMP NOT NULL,
    
    -- Target audience
    DoiTuong VARCHAR(50) DEFAULT 'ALL' 
        CHECK (DoiTuong IN ('ALL', 'LECTURER', 'STUDENT', 'ADMIN')),
    
    LoaiSuKien VARCHAR(50) DEFAULT 'THONG_BAO'
        CHECK (LoaiSuKien IN ('THONG_BAO', 'HOI_THAO', 'KIEM_TRA', 'BAO_TRI', 'SU_KIEN')),
    
    TrangThai VARCHAR(20) DEFAULT 'ACTIVE' 
        CHECK (TrangThai IN ('ACTIVE', 'HIDDEN', 'ENDED', 'CANCELLED')),
    
    NguoiTao VARCHAR(20),
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT sukien_toanha_fk FOREIGN KEY (MaToaNha) 
        REFERENCES ToaNha(MaToaNha) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT sukien_phong_fk FOREIGN KEY (MaPhong) 
        REFERENCES PhongHoc(MaPhong) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT sukien_nguoitao_fk FOREIGN KEY (NguoiTao) 
        REFERENCES NguoiDung(MaSo) ON UPDATE CASCADE ON DELETE SET NULL,
    
    -- Time validation
    CONSTRAINT sukien_time_check CHECK (ThoiGianKetThuc > ThoiGianBatDau)
);

CREATE INDEX idx_sukien_thoigian ON SuKien(ThoiGianBatDau, ThoiGianKetThuc);
CREATE INDEX idx_sukien_doituong ON SuKien(DoiTuong);
CREATE INDEX idx_sukien_loaisukien ON SuKien(LoaiSuKien);
CREATE INDEX idx_sukien_trangthai ON SuKien(TrangThai);

-- 12. Attendance Sessions (PhienDiemDanh)
CREATE TABLE PhienDiemDanh (
    MaPhien SERIAL PRIMARY KEY,
    MaLop VARCHAR(20) NOT NULL,
    MaGiangVien VARCHAR(20) NOT NULL,
    
    ThoiGianBatDau TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ThoiGianKetThuc TIMESTAMP,
    ThoiGianHetHan TIMESTAMP NOT NULL,
    
    LanDiemDanh INTEGER DEFAULT 1,
    GhiChu TEXT,
    
    TrangThai VARCHAR(20) DEFAULT 'OPEN' CHECK (TrangThai IN ('OPEN', 'CLOSED')),
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT phiendiemdanh_lop_fk FOREIGN KEY (MaLop) 
        REFERENCES LopHoc(MaLop) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT phiendiemdanh_gv_fk FOREIGN KEY (MaGiangVien) 
        REFERENCES NguoiDung(MaSo) ON UPDATE CASCADE ON DELETE RESTRICT,
    
    -- Time validation
    CONSTRAINT phiendiemdanh_time_check CHECK (ThoiGianHetHan > ThoiGianBatDau)
);

CREATE INDEX idx_phiendiemdanh_lop ON PhienDiemDanh(MaLop);
CREATE INDEX idx_phiendiemdanh_trangthai ON PhienDiemDanh(TrangThai);
CREATE INDEX idx_phiendiemdanh_lop_trangthai ON PhienDiemDanh(MaLop, TrangThai);

-- 13. Attendance Records (KetQuaDiemDanh)
CREATE TABLE KetQuaDiemDanh (
    MaKetQua SERIAL PRIMARY KEY,
    MaPhien INTEGER NOT NULL,
    MaSV VARCHAR(20) NOT NULL,
    
    ThoiGianCheckIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ViTriCheckIn GEOMETRY(Point, 4326),
    
    TrangThai VARCHAR(20) DEFAULT 'CO_MAT' 
        CHECK (TrangThai IN ('CO_MAT', 'VANG', 'MUON')),
    GhiChu TEXT,
    
    -- Foreign Keys
    CONSTRAINT ketquadiemdanh_phien_fk FOREIGN KEY (MaPhien) 
        REFERENCES PhienDiemDanh(MaPhien) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ketquadiemdanh_sv_fk FOREIGN KEY (MaSV) 
        REFERENCES NguoiDung(MaSo) ON UPDATE CASCADE ON DELETE CASCADE,
    
    -- Unique constraint: one record per student per session
    CONSTRAINT ketquadiemdanh_unique UNIQUE(MaPhien, MaSV)
);

CREATE INDEX idx_ketquadiemdanh_phien ON KetQuaDiemDanh(MaPhien);
CREATE INDEX idx_ketquadiemdanh_sv ON KetQuaDiemDanh(MaSV);
CREATE INDEX idx_ketquadiemdanh_trangthai ON KetQuaDiemDanh(TrangThai);

-- ==================================================================================
-- VIEWS
-- ==================================================================================

-- View: Student Schedule
CREATE OR REPLACE VIEW v_LichHocSinhVien AS
SELECT 
    sv.MaSV,
    u.HoTen AS TenSV,
    l.MaLop,
    m.TenMon,
    gv.HoTen AS TenGiangVien,
    l.Thu,
    l.MaTietBatDau,
    l.SoTiet,
    t.GioBatDau,
    t.GioKetThuc,
    p.TenPhong,
    tn.TenToaNha,
    l.HocKy,
    l.NamHoc
FROM LopHoc_SinhVien sv
JOIN LopHoc l ON sv.MaLop = l.MaLop
JOIN MonHoc m ON l.MaMon = m.MaMon
JOIN NguoiDung u ON sv.MaSV = u.MaSo
LEFT JOIN NguoiDung gv ON l.MaGiangVien = gv.MaSo
LEFT JOIN TietHoc t ON l.MaTietBatDau = t.MaTiet
LEFT JOIN PhongHoc p ON l.MaPhong = p.MaPhong
LEFT JOIN ToaNha tn ON p.MaToaNha = tn.MaToaNha
WHERE sv.TrangThai = 'DANG_HOC';

-- View: Lecturer Schedule  
CREATE OR REPLACE VIEW v_LichDayGiangVien AS
SELECT 
    l.MaGiangVien,
    gv.HoTen AS TenGiangVien,
    l.MaLop,
    m.TenMon,
    l.Thu,
    l.MaTietBatDau,
    l.SoTiet,
    t.GioBatDau,
    t.GioKetThuc,
    p.TenPhong,
    tn.TenToaNha,
    l.HocKy,
    l.NamHoc,
    l.TrangThai,
    (SELECT COUNT(*) FROM LopHoc_SinhVien WHERE MaLop = l.MaLop AND TrangThai = 'DANG_HOC') AS SoSinhVien
FROM LopHoc l
JOIN MonHoc m ON l.MaMon = m.MaMon
JOIN NguoiDung gv ON l.MaGiangVien = gv.MaSo
LEFT JOIN TietHoc t ON l.MaTietBatDau = t.MaTiet
LEFT JOIN PhongHoc p ON l.MaPhong = p.MaPhong
LEFT JOIN ToaNha tn ON p.MaToaNha = tn.MaToaNha;

-- View: Class Details
CREATE OR REPLACE VIEW v_LopHocChiTiet AS
SELECT 
    l.*,
    m.TenMon,
    m.SoTinChi,
    gv.HoTen AS TenGiangVien,
    gv.Email AS EmailGV,
    p.TenPhong,
    tn.TenToaNha,
    t.GioBatDau,
    t.GioKetThuc,
    (SELECT COUNT(*) FROM LopHoc_SinhVien WHERE MaLop = l.MaLop AND TrangThai = 'DANG_HOC') AS SoSinhVienDK
FROM LopHoc l
JOIN MonHoc m ON l.MaMon = m.MaMon
LEFT JOIN NguoiDung gv ON l.MaGiangVien = gv.MaSo
LEFT JOIN PhongHoc p ON l.MaPhong = p.MaPhong
LEFT JOIN ToaNha tn ON p.MaToaNha = tn.MaToaNha
LEFT JOIN TietHoc t ON l.MaTietBatDau = t.MaTiet;

-- ==================================================================================
-- STORED PROCEDURES
-- ==================================================================================

-- Lecturer confirms teaching
CREATE OR REPLACE PROCEDURE sp_XacNhanGiangDay(_MaGV VARCHAR, _MaLop VARCHAR)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE LopHoc
    SET TrangThai = 'DA_XAC_NHAN', NgayCapNhat = NOW()
    WHERE MaLop = _MaLop AND MaGiangVien = _MaGV AND TrangThai = 'CHO_XAC_NHAN';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lớp không tồn tại hoặc không ở trạng thái chờ xác nhận.';
    END IF;
END;
$$;

-- Admin opens class for registration
CREATE OR REPLACE PROCEDURE sp_MoLopHoc(_MaLop VARCHAR, _HanDangKy TIMESTAMP DEFAULT NULL)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE LopHoc
    SET TrangThai = 'MO_DANG_KY', 
        HanDangKy = COALESCE(_HanDangKy, NOW() + INTERVAL '7 days'),
        NgayCapNhat = NOW()
    WHERE MaLop = _MaLop AND TrangThai = 'DA_XAC_NHAN';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lớp chưa được giảng viên xác nhận.';
    END IF;
END;
$$;

-- Start class (change from MO_DANG_KY to DANG_HOC)
CREATE OR REPLACE PROCEDURE sp_BatDauLopHoc(_MaLop VARCHAR)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE LopHoc
    SET TrangThai = 'DANG_HOC', NgayCapNhat = NOW()
    WHERE MaLop = _MaLop AND TrangThai = 'MO_DANG_KY';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lớp không ở trạng thái mở đăng ký.';
    END IF;
END;
$$;

-- Open attendance session
CREATE OR REPLACE PROCEDURE sp_MoDiemDanh(
    _MaGV VARCHAR,
    _MaLop VARCHAR,
    _ThoiGianPhut INTEGER DEFAULT 15,
    INOUT _MaPhien INTEGER DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM LopHoc WHERE MaLop = _MaLop AND MaGiangVien = _MaGV AND TrangThai = 'DANG_HOC') THEN
        RAISE EXCEPTION 'Giảng viên không phụ trách lớp này hoặc lớp chưa bắt đầu học.';
    END IF;

    UPDATE PhienDiemDanh SET TrangThai = 'CLOSED', ThoiGianKetThuc = NOW() 
    WHERE MaLop = _MaLop AND TrangThai = 'OPEN';

    INSERT INTO PhienDiemDanh (MaLop, MaGiangVien, ThoiGianHetHan)
    VALUES (_MaLop, _MaGV, NOW() + (_ThoiGianPhut || ' minutes')::INTERVAL)
    RETURNING MaPhien INTO _MaPhien;
END;
$$;

-- Student check-in
CREATE OR REPLACE PROCEDURE sp_DiemDanh(_MaSV VARCHAR, _MaPhien INTEGER, _ViTri GEOMETRY DEFAULT NULL)
LANGUAGE plpgsql AS $$
DECLARE
    _MaLop VARCHAR;
    _ThoiGianHetHan TIMESTAMP;
    _ThoiGianBatDau TIMESTAMP;
    _SessionStatus VARCHAR;
BEGIN
    SELECT MaLop, ThoiGianHetHan, ThoiGianBatDau, TrangThai
    INTO _MaLop, _ThoiGianHetHan, _ThoiGianBatDau, _SessionStatus
    FROM PhienDiemDanh WHERE MaPhien = _MaPhien;

    IF _SessionStatus IS NULL THEN RAISE EXCEPTION 'Phiên điểm danh không tồn tại.'; END IF;
    IF _SessionStatus != 'OPEN' THEN RAISE EXCEPTION 'Phiên điểm danh đã đóng.'; END IF;
    IF NOW() > _ThoiGianHetHan THEN RAISE EXCEPTION 'Đã hết thời gian điểm danh.'; END IF;
    IF NOT EXISTS (SELECT 1 FROM LopHoc_SinhVien WHERE MaLop = _MaLop AND MaSV = _MaSV AND TrangThai = 'DANG_HOC') THEN
        RAISE EXCEPTION 'Sinh viên không thuộc lớp này.';
    END IF;

    IF NOW() > _ThoiGianBatDau + INTERVAL '5 minutes' THEN
        INSERT INTO KetQuaDiemDanh (MaPhien, MaSV, ViTriCheckIn, TrangThai) VALUES (_MaPhien, _MaSV, _ViTri, 'MUON')
        ON CONFLICT (MaPhien, MaSV) DO UPDATE SET ThoiGianCheckIn = NOW(), TrangThai = 'MUON';
    ELSE
        INSERT INTO KetQuaDiemDanh (MaPhien, MaSV, ViTriCheckIn, TrangThai) VALUES (_MaPhien, _MaSV, _ViTri, 'CO_MAT')
        ON CONFLICT (MaPhien, MaSV) DO UPDATE SET ThoiGianCheckIn = NOW(), TrangThai = 'CO_MAT';
    END IF;
END;
$$;

-- Close attendance session
CREATE OR REPLACE PROCEDURE sp_DongDiemDanh(_MaPhien INTEGER)
LANGUAGE plpgsql AS $$
DECLARE _MaLop VARCHAR;
BEGIN
    SELECT MaLop INTO _MaLop FROM PhienDiemDanh WHERE MaPhien = _MaPhien;
    
    INSERT INTO KetQuaDiemDanh (MaPhien, MaSV, TrangThai)
    SELECT _MaPhien, sv.MaSV, 'VANG'
    FROM LopHoc_SinhVien sv
    WHERE sv.MaLop = _MaLop AND sv.TrangThai = 'DANG_HOC'
      AND NOT EXISTS (SELECT 1 FROM KetQuaDiemDanh kq WHERE kq.MaPhien = _MaPhien AND kq.MaSV = sv.MaSV)
    ON CONFLICT (MaPhien, MaSV) DO NOTHING;

    UPDATE PhienDiemDanh SET TrangThai = 'CLOSED', ThoiGianKetThuc = NOW() WHERE MaPhien = _MaPhien;
END;
$$;

-- ==================================================================================
-- FUNCTIONS
-- ==================================================================================

-- Get active attendance sessions for student
CREATE OR REPLACE FUNCTION fn_PhienDiemDanhChoSV(_MaSV VARCHAR)
RETURNS TABLE (
    MaPhien INTEGER, MaLop VARCHAR, TenMon VARCHAR, TenGiangVien VARCHAR,
    TenPhong VARCHAR, ThoiGianBatDau TIMESTAMP, ThoiGianHetHan TIMESTAMP, ThoiGianConLai INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT pd.MaPhien, pd.MaLop, m.TenMon, gv.HoTen, p.TenPhong,
           pd.ThoiGianBatDau, pd.ThoiGianHetHan,
           EXTRACT(EPOCH FROM (pd.ThoiGianHetHan - NOW()))::INTEGER / 60
    FROM PhienDiemDanh pd
    JOIN LopHoc l ON pd.MaLop = l.MaLop
    JOIN MonHoc m ON l.MaMon = m.MaMon
    JOIN NguoiDung gv ON pd.MaGiangVien = gv.MaSo
    LEFT JOIN PhongHoc p ON l.MaPhong = p.MaPhong
    JOIN LopHoc_SinhVien sv ON l.MaLop = sv.MaLop
    WHERE pd.TrangThai = 'OPEN' AND sv.MaSV = _MaSV AND sv.TrangThai = 'DANG_HOC' AND NOW() <= pd.ThoiGianHetHan;
END;
$$ LANGUAGE plpgsql;

-- Get attendance statistics for class
CREATE OR REPLACE FUNCTION fn_ThongKeDiemDanhLop(_MaLop VARCHAR)
RETURNS TABLE (
    MaSV VARCHAR, HoTen VARCHAR, TongSoBuoi BIGINT, SoBuoiCoMat BIGINT,
    SoBuoiMuon BIGINT, SoBuoiVang BIGINT, TyLeDiemDanh NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT sv.MaSV, u.HoTen,
           COUNT(DISTINCT pd.MaPhien) FILTER (WHERE pd.TrangThai = 'CLOSED'),
           COUNT(DISTINCT kq.MaPhien) FILTER (WHERE kq.TrangThai = 'CO_MAT'),
           COUNT(DISTINCT kq.MaPhien) FILTER (WHERE kq.TrangThai = 'MUON'),
           COUNT(DISTINCT kq.MaPhien) FILTER (WHERE kq.TrangThai = 'VANG'),
           CASE WHEN COUNT(DISTINCT pd.MaPhien) FILTER (WHERE pd.TrangThai = 'CLOSED') > 0 
                THEN ROUND((COUNT(DISTINCT kq.MaPhien) FILTER (WHERE kq.TrangThai IN ('CO_MAT', 'MUON'))::NUMERIC / 
                           COUNT(DISTINCT pd.MaPhien) FILTER (WHERE pd.TrangThai = 'CLOSED')) * 100, 2)
                ELSE 0 END
    FROM LopHoc_SinhVien sv
    JOIN NguoiDung u ON sv.MaSV = u.MaSo
    LEFT JOIN PhienDiemDanh pd ON sv.MaLop = pd.MaLop
    LEFT JOIN KetQuaDiemDanh kq ON pd.MaPhien = kq.MaPhien AND sv.MaSV = kq.MaSV
    WHERE sv.MaLop = _MaLop AND sv.TrangThai = 'DANG_HOC'
    GROUP BY sv.MaSV, u.HoTen;
END;
$$ LANGUAGE plpgsql;

-- ==================================================================================
-- END OF SCHEMA
-- ==================================================================================

