-- ==================================================================================
-- SMART CAMPUS SEED DATA (CLEAN)
-- Date: 2025-12-30
-- ==================================================================================

-- ==================================================================================
-- 1. BUILDINGS (ToaNha)
-- ==================================================================================
INSERT INTO ToaNha (MaToaNha, TenToaNha, MoTa, HinhAnh, MapKey) VALUES
('G2', 'Tòa nhà G2', 'Tòa nhà giảng dạy các môn đại cương và cơ sở ngành. Gồm 5 tầng với các phòng học lý thuyết từ 50-60 chỗ ngồi, được trang bị máy chiếu và điều hòa.', '/images/buildings/g2.jpg', 'G2'),
('G3', 'Tòa nhà G3', 'Tòa nhà khoa Ngoại ngữ, chuyên giảng dạy các môn tiếng Anh và ngoại ngữ khác. Có phòng Lab nghe nói hiện đại và thư viện sách ngoại văn.', '/images/buildings/g3.jpg', 'G3'),
('G6', 'Tòa nhà G6', 'Tòa nhà khoa Công nghệ Thông tin - trung tâm đào tạo CNTT của trường. Trang bị 8 phòng máy hiện đại với hơn 300 máy tính, phòng thực hành IoT và AI.', '/images/buildings/g6.jpg', 'G6'),
('G7', 'Tòa nhà G7', 'Tòa nhà khoa Kinh tế và Quản trị Kinh doanh. Các phòng học được thiết kế theo kiểu hội trường nhỏ, phù hợp cho seminar và thuyết trình.', '/images/buildings/g7.jpg', 'G7'),
('G1', 'Tòa nhà G1', 'Tòa nhà Khoa Nuôi trồng Thủy sản. Có các phòng thí nghiệm sinh học biển và khu vực bể nuôi nghiên cứu.', '/images/buildings/g1.jpg', 'G1'),
('G4', 'Tòa nhà G4', 'Tòa nhà giảng dạy đa năng, phục vụ nhiều khoa khác nhau.', '/images/buildings/g4.jpg', 'G4'),
('G5', 'Tòa nhà G5', 'Tòa nhà thực hành kỹ thuật, có các xưởng cơ khí và phòng thực hành điện.', '/images/buildings/g5.jpg', 'G5'),
('NDN', 'Nhà Đa Năng', 'Nhà thi đấu đa năng phục vụ các hoạt động thể thao và sự kiện lớn của trường.', '/images/buildings/ndn.jpg', 'NDN'),
('KHC', 'Khu Hành Chính', 'Khu vực văn phòng hành chính, phòng ban quản lý và phòng họp.', '/images/buildings/khc.jpg', 'KHC'),
('TV1', 'Thư Viện 1', 'Thư viện chính của trường với hơn 50.000 đầu sách và phòng đọc yên tĩnh.', '/images/buildings/tv1.jpg', 'TV1'),
('TV2', 'Thư Viện 2', 'Thư viện điện tử với máy tính tra cứu và phòng học nhóm.', '/images/buildings/tv2.jpg', 'TV2'),
('TV3', 'Thư Viện 3', 'Khu vực đọc sách và nghiên cứu mở rộng.', '/images/buildings/tv3.jpg', 'TV3'),
('NTT', 'Nhà Truyền Thống', 'Nhà trưng bày lịch sử và thành tựu của trường Đại học Nha Trang.', '/images/buildings/ntt.jpg', 'NTT'),
('CT', 'Căn Tin', 'Khu vực ăn uống dành cho sinh viên và cán bộ với đa dạng món ăn.', '/images/buildings/ct.jpg', 'CT'),
('NTD', 'Nhà Thi Đấu Đa Năng', 'Nhà thi đấu trong nhà phục vụ các môn cầu lông, bóng chuyền, bóng rổ.', '/images/buildings/ntd.jpg', 'NTD'),
('HT1', 'Hội Trường 1', 'Hội trường lớn tổ chức các sự kiện quan trọng, sức chứa 500 người.', '/images/buildings/ht1.jpg', 'HT1'),
('HT2', 'Hội Trường 2', 'Hội trường phụ phục vụ các buổi seminar và hội thảo.', '/images/buildings/ht2.jpg', 'HT2'),
('HT3', 'Viện KHCN Thủy Sản', 'Viện nghiên cứu Khoa học Công nghệ Thủy sản - trung tâm nghiên cứu biển.', '/images/buildings/ht3.jpg', 'HT3'),
('KTN', 'Khu Thí Nghiệm', 'Khu vực phòng thí nghiệm các ngành kỹ thuật và công nghệ sinh học.', '/images/buildings/ktn.jpg', 'KTN'),
('KTN-TH', 'Khu Thí Nghiệm - Thực Hành', 'Khu thực hành chuyên sâu cho sinh viên các ngành kỹ thuật.', '/images/buildings/ktn-th.jpg', 'KTN-TH'),
('B1', 'Tòa B1', 'Tòa nhà phục vụ giảng dạy và các hoạt động hỗ trợ.', '/images/buildings/b1.jpg', 'B1'),
('B3', 'Tòa B3', 'Tòa nhà giảng dạy khoa học cơ bản.', '/images/buildings/b3.jpg', 'B3'),
('K1', 'Ký túc xá K1', 'Ký túc xá sinh viên khu vực 1.', '/images/buildings/k1.jpg', 'K1'),
('K2', 'Ký túc xá K2', 'Ký túc xá sinh viên khu vực 2.', '/images/buildings/k2.jpg', 'K2'),
('K3', 'Ký túc xá K3', 'Ký túc xá sinh viên khu vực 3.', '/images/buildings/k3.jpg', 'K3'),
('K4', 'Ký túc xá K4', 'Ký túc xá sinh viên khu vực 4.', '/images/buildings/k4.jpg', 'K4'),
('K5', 'Ký túc xá K5', 'Ký túc xá sinh viên khu vực 5.', '/images/buildings/k5.jpg', 'K5'),
('K6', 'Ký túc xá K6', 'Ký túc xá sinh viên khu vực 6.', '/images/buildings/k6.jpg', 'K6'),
('K7', 'Khu vực K7', 'Khu vực hỗ trợ và dịch vụ sinh viên.', '/images/buildings/k7.jpg', 'K7'),
('K8', 'Ký túc xá K8', 'Ký túc xá sinh viên khu vực 8.', '/images/buildings/k8.jpg', 'K8'),
('A3', 'Tòa A3', 'Tòa nhà hành chính phụ.', '/images/buildings/a3.jpg', 'A3'),
('A4', 'Trung Tâm Y Tế', 'Trung tâm y tế phục vụ khám chữa bệnh cho cán bộ và sinh viên.', '/images/buildings/a4.jpg', 'A4'),
('A7', 'Tòa A7', 'Tòa nhà phục vụ công tác hành chính và dịch vụ.', '/images/buildings/a7.jpg', 'A7'),
('A8', 'Tòa A8', 'Tòa nhà giảng dạy bổ sung.', '/images/buildings/a8.jpg', 'A8'),
('A10', 'Tòa A10', 'Tòa nhà nghiên cứu và phòng làm việc giảng viên.', '/images/buildings/a10.jpg', 'A10'),
('BT', 'Bảo Tàng Thủy Sinh Vật', 'Bảo tàng trưng bày các mẫu sinh vật biển quý hiếm.', '/images/buildings/bt.jpg', 'BT'),
('CLB', 'CLB Sinh Viên', 'Khu vực sinh hoạt câu lạc bộ và hoạt động ngoại khóa.', '/images/buildings/clb.jpg', 'CLB'),
('G8', 'Tòa nhà G8', 'Tòa nhà giảng dạy mới nhất của trường.', '/images/buildings/g8.jpg', 'G8'),
('SB', 'Sân Bóng', 'Sân bóng đá mini phục vụ hoạt động thể thao.', '/images/buildings/sb.jpg', 'SB'),
('BN', 'Bể Chứa Nước', 'Hệ thống bể chứa nước phục vụ khuôn viên trường.', '/images/buildings/bn.jpg', 'BN'),
('KKTGT', 'Khoa Kỹ Thuật Giao Thông', 'Khoa Kỹ thuật Giao thông và Xưởng Cơ khí thực hành.', '/images/buildings/kktgt.jpg', 'KKTGT'),
('P1', 'Bãi Đỗ Xe HT3', 'Bãi đỗ xe dành cho khu vực HT3.', '/images/buildings/p1.jpg', 'P1'),
('P2', 'Bãi Đỗ Xe Ngoài Cổng', 'Bãi đỗ xe ngoài cổng trường.', '/images/buildings/p2.jpg', 'P2'),
('P3', 'Bãi Đỗ Xe Tầng Hầm', 'Bãi đỗ xe tầng hầm sân bóng.', '/images/buildings/p3.jpg', 'P3');

-- ==================================================================================
-- 2. CLASSROOMS (PhongHoc)
-- ==================================================================================
INSERT INTO PhongHoc (MaPhong, TenPhong, MaToaNha, SoTang, SucChua, LoaiPhong) VALUES
-- G2
('G2-101', '101', 'G2', 1, 50, 'LY_THUYET'),
('G2-102', '102', 'G2', 1, 50, 'LY_THUYET'),
('G2-201', '201', 'G2', 2, 50, 'LY_THUYET'),
('G2-202', '202', 'G2', 2, 50, 'LY_THUYET'),
-- G6
('G6-101', '101', 'G6', 1, 40, 'PHONG_MAY'),
('G6-102', '102', 'G6', 1, 40, 'PHONG_MAY'),
('G6-201', '201', 'G6', 2, 50, 'LY_THUYET'),
('G6-202', '202', 'G6', 2, 50, 'LY_THUYET'),
('G6-301', '301', 'G6', 3, 30, 'THUC_HANH'),
-- G7
('G7-101', '101', 'G7', 1, 60, 'LY_THUYET'),
('G7-201', '201', 'G7', 2, 60, 'LY_THUYET'),
-- G3
('G3-101', '101', 'G3', 1, 50, 'LY_THUYET'),
('G3-201', '201', 'G3', 2, 50, 'LY_THUYET'),
-- HT1 (Hội trường)
('HT1-A', 'Hội trường A', 'HT1', 1, 500, 'HOI_TRUONG');

-- ==================================================================================
-- 3. USERS (NguoiDung)
-- ==================================================================================

-- Admin accounts
INSERT INTO NguoiDung (MaSo, MatKhau, HoTen, Email, SoDienThoai, MaVaiTro, TrangThai) VALUES
('admin', '123456', 'Quản Trị Viên', 'admin@ntu.edu.vn', '0901234567', 1, 'ACTIVE');

-- Lecturer accounts
INSERT INTO NguoiDung (MaSo, MatKhau, HoTen, Email, SoDienThoai, MaVaiTro, ChucVu, MaKhoa, ChuyenMon, TrangThai) VALUES
('gv001', '123456', 'Nguyễn Văn An', 'gv001@ntu.edu.vn', '0912345001', 2, 'Tiến sĩ', 'CNTT', 'Trí tuệ nhân tạo', 'ACTIVE'),
('gv002', '123456', 'Trần Thị Bình', 'gv002@ntu.edu.vn', '0912345002', 2, 'Thạc sĩ', 'CNTT', 'Lập trình Web', 'ACTIVE'),
('gv003', '123456', 'Lê Văn Cường', 'gv003@ntu.edu.vn', '0912345003', 2, 'Tiến sĩ', 'KTQTKD', 'Marketing', 'ACTIVE'),
('gv004', '123456', 'Phạm Thị Dung', 'gv004@ntu.edu.vn', '0912345004', 2, 'Thạc sĩ', 'DC', 'Toán cao cấp', 'ACTIVE');

-- Student accounts
INSERT INTO NguoiDung (MaSo, MatKhau, HoTen, Email, MaVaiTro, NienKhoa, MaNganh, LopQuanLy, TrangThai) VALUES
('sv001', '123456', 'Nguyễn Văn Sinh', 'sv001@ntu.edu.vn', 3, '64', 'CNTT', '64CNTT-1', 'ACTIVE'),
('sv002', '123456', 'Trần Thị Hoa', 'sv002@ntu.edu.vn', 3, '64', 'CNTT', '64CNTT-1', 'ACTIVE'),
('sv003', '123456', 'Lê Văn Nam', 'sv003@ntu.edu.vn', 3, '64', 'KTPM', '64KTPM-1', 'ACTIVE'),
('sv004', '123456', 'Phạm Thị Mai', 'sv004@ntu.edu.vn', 3, '65', 'CNTT', '65CNTT-1', 'ACTIVE'),
('sv005', '123456', 'Hoàng Văn Đức', 'sv005@ntu.edu.vn', 3, '65', 'QTKD', '65QTKD-1', 'ACTIVE');

-- ==================================================================================
-- 4. SUBJECTS (MonHoc)
-- ==================================================================================
INSERT INTO MonHoc (MaMon, TenMon, SoTinChi, MaNganh, NamHoc, MoTa, TrangThai) VALUES
('IT001', 'Lập trình Web', 3, 'CNTT', '2024-2025', 'HTML, CSS, JavaScript, React', 'ACTIVE'),
('IT002', 'Cơ sở dữ liệu', 3, 'CNTT', '2024-2025', 'SQL, PostgreSQL, MongoDB', 'ACTIVE'),
('IT003', 'Trí tuệ nhân tạo', 3, 'CNTT', '2024-2025', 'Machine Learning cơ bản', 'ACTIVE'),
('IT004', 'Hệ thống thông tin địa lý', 3, 'HTTT', '2024-2025', 'GIS, WebGIS, CesiumJS', 'ACTIVE'),
('DC001', 'Toán cao cấp 1', 3, 'CNTT', '2024-2025', 'Giải tích, Đại số', 'ACTIVE'),
('DC002', 'Vật lý đại cương', 2, 'CNTT', '2024-2025', 'Cơ học, Điện từ', 'ACTIVE'),
('KT001', 'Kinh tế vĩ mô', 3, 'QTKD', '2024-2025', 'Nguyên lý kinh tế vĩ mô', 'ACTIVE');

-- ==================================================================================
-- 5. CLASS SECTIONS (LopHoc)
-- ==================================================================================
INSERT INTO LopHoc (MaLop, MaMon, MaGiangVien, HocKy, NamHoc, Thu, MaTietBatDau, SoTiet, MaPhong, TrangThai, SiSoToiDa) VALUES
-- Active classes (DANG_HOC - lớp đang học)
('IT001-01', 'IT001', 'gv002', 1, '2024-2025', 2, 1, 3, 'G6-201', 'DANG_HOC', 40),
('IT002-01', 'IT002', 'gv002', 1, '2024-2025', 3, 4, 3, 'G6-101', 'DANG_HOC', 40),
('IT003-01', 'IT003', 'gv001', 1, '2024-2025', 4, 1, 3, 'G6-202', 'DANG_HOC', 35),
('DC001-01', 'DC001', 'gv004', 1, '2024-2025', 5, 1, 3, 'G2-101', 'DANG_HOC', 50),
-- Waiting for confirmation (CHO_XAC_NHAN)
('IT004-01', 'IT004', 'gv001', 1, '2024-2025', 6, 6, 3, 'G6-301', 'CHO_XAC_NHAN', 30),
('KT001-01', 'KT001', 'gv003', 1, '2024-2025', 2, 6, 3, 'G7-101', 'CHO_XAC_NHAN', 50);

-- ==================================================================================
-- 6. CLASS ENROLLMENT (LopHoc_SinhVien)
-- ==================================================================================
INSERT INTO LopHoc_SinhVien (MaLop, MaSV, TrangThai) VALUES
-- IT001-01: sv001, sv002, sv003
('IT001-01', 'sv001', 'DANG_HOC'),
('IT001-01', 'sv002', 'DANG_HOC'),
('IT001-01', 'sv003', 'DANG_HOC'),
-- IT002-01: sv001, sv002
('IT002-01', 'sv001', 'DANG_HOC'),
('IT002-01', 'sv002', 'DANG_HOC'),
-- IT003-01: sv001, sv003
('IT003-01', 'sv001', 'DANG_HOC'),
('IT003-01', 'sv003', 'DANG_HOC'),
-- DC001-01: sv001, sv002, sv003, sv004
('DC001-01', 'sv001', 'DANG_HOC'),
('DC001-01', 'sv002', 'DANG_HOC'),
('DC001-01', 'sv003', 'DANG_HOC'),
('DC001-01', 'sv004', 'DANG_HOC');

-- ==================================================================================
-- 7. EVENTS (SuKien)
-- ==================================================================================
INSERT INTO SuKien (TenSuKien, MoTa, MaToaNha, MaPhong, ThoiGianBatDau, ThoiGianKetThuc, DoiTuong, LoaiSuKien, TrangThai, NguoiTao) VALUES
('Hội thảo AI trong Giáo dục', 'Ứng dụng trí tuệ nhân tạo trong giảng dạy và học tập', 'HT1', 'HT1-A', 
 NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '3 hours', 'ALL', 'HOI_THAO', 'ACTIVE', 'admin'),
('Bảo trì hệ thống phòng máy', 'Bảo trì định kỳ phòng máy G6', 'G6', 'G6-101',
 NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '4 hours', 'LECTURER', 'BAO_TRI', 'ACTIVE', 'admin'),
('Kiểm tra giữa kỳ Lập trình Web', 'Thi giữa kỳ môn IT001', 'G6', 'G6-201',
 NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '2 hours', 'STUDENT', 'KIEM_TRA', 'ACTIVE', 'gv002'),
('Tuần lễ định hướng sinh viên mới', 'Chương trình định hướng cho sinh viên K66', 'HT1', 'HT1-A',
 NOW() + INTERVAL '30 days', NOW() + INTERVAL '32 days', 'STUDENT', 'SU_KIEN', 'ACTIVE', 'admin');

-- ==================================================================================
-- 8. SAMPLE ATTENDANCE DATA (for statistics)
-- ==================================================================================

-- Create some closed attendance sessions for IT001-01
INSERT INTO PhienDiemDanh (MaLop, MaGiangVien, ThoiGianBatDau, ThoiGianKetThuc, ThoiGianHetHan, LanDiemDanh, TrangThai) VALUES
('IT001-01', 'gv002', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '20 minutes', NOW() - INTERVAL '7 days' + INTERVAL '15 minutes', 1, 'CLOSED'),
('IT001-01', 'gv002', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days' + INTERVAL '20 minutes', NOW() - INTERVAL '14 days' + INTERVAL '15 minutes', 1, 'CLOSED');

-- Attendance records
INSERT INTO KetQuaDiemDanh (MaPhien, MaSV, ThoiGianCheckIn, TrangThai) VALUES
-- Session 1
(1, 'sv001', NOW() - INTERVAL '7 days' + INTERVAL '2 minutes', 'CO_MAT'),
(1, 'sv002', NOW() - INTERVAL '7 days' + INTERVAL '8 minutes', 'MUON'),
(1, 'sv003', NOW() - INTERVAL '7 days' + INTERVAL '1 minutes', 'CO_MAT'),
-- Session 2
(2, 'sv001', NOW() - INTERVAL '14 days' + INTERVAL '3 minutes', 'CO_MAT'),
(2, 'sv002', NOW() - INTERVAL '14 days' + INTERVAL '2 minutes', 'CO_MAT'),
(2, 'sv003', NULL, 'VANG');

-- ==================================================================================
-- END OF SEED DATA
-- ==================================================================================
