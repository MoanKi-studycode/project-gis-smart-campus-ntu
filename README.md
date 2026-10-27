# 📚 Hướng Dẫn Dự Án NTU Smart Campus

## 🎯 Mô Tả Dự Án

**NTU Smart Campus** là hệ thống quản lý giáo dục thông minh cho Trường Đại học Nha Trang, được xây dựng bằng **Node.js + Express + PostgreSQL + PostGIS** trên backend và **Vite + React** trên frontend.

### ✨ Tính Năng Chính

- 📍 **Quản lý lớp học và lịch học** với công nghệ PostGIS
- 👥 **Quản lý sinh viên, giảng viên, người dùng**
- 📅 **Hệ thống điểm danh tự động** với phân công phòng học
- 🏢 **Quản lý phòng học, tòa nhà, khu vực**
- 📊 **Dashboard thống kê** cho các vai trò khác nhau
- 🗺️ **Bản đồ tương tác** hiển thị vị trí các tòa nhà trên campus

---

## 📁 Cấu Trúc Dự Án

```
smart-campus/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── app.js             # Cấu hình ứng dụng
│   │   ├── server.js          # Khởi động server
│   │   ├── db.js              # Kết nối database
│   │   ├── controllers/       # Logic xử lý yêu cầu
│   │   ├── models/            # Mô hình dữ liệu
│   │   ├── routes/            # Các API endpoint
│   │   ├── services/          # Các service hỗ trợ
│   │   └── config/            # Cấu hình (database, env)
│   ├── database/
│   │   ├── schema.sql         # Cơ sở dữ liệu (bảng, constraints)
│   │   └── seed.sql           # Dữ liệu mẫu
│   ├── scripts/
│   │   ├── update-course-data.js      # Cập nhật dữ liệu lớp học
│   │   └── apply-migration.js         # Áp dụng cập nhật database
│   ├── package.json           # Dependencies
│   ├── .env                   # Biến môi trường
│   └── README.md              # Hướng dẫn backend
│
└── frontend/                  # Vite + React
    ├── src/
    │   ├── App.jsx            # Component chính
    │   ├── main.jsx           # Điểm vào
    │   ├── pages/             # Các trang
    │   ├── components/        # Các component
    │   ├── hooks/             # Custom hooks
    │   ├── services/          # API services
    │   ├── context/           # Context API
    │   └── styles/            # CSS
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── README.md              # Hướng dẫn frontend
```

---

## 🚀 Cách Chạy Dự Án

### 1️⃣ Chuẩn Bị Môi Trường

**Yêu cầu:**
- Node.js 16+ (`node -v`)
- PostgreSQL 15+ với PostGIS (`psql --version`)
- npm hoặc yarn

**Cài đặt:**
```bash
# Clone hoặc giải nén dự án
cd smart-campus/backend

# Cài đặt dependencies
npm install
```

### 2️⃣ Cấu Hình Database

**Tạo database PostgreSQL:**
```bash
# Mở Terminal PostgreSQL hoặc pgAdmin
psql -U postgres

# Trong PostgreSQL console:
CREATE DATABASE DB_SmartCampus;
CREATE EXTENSION postgis;
```

**Khởi tạo schema và dữ liệu:**
```bash
# Từ thư mục backend
node scripts/apply-migration.js
```

Hoặc chạy thủ công:
```bash
psql -U postgres -d DB_SmartCampus -f database/schema.sql
psql -U postgres -d DB_SmartCampus -f database/seed.sql
```

### 3️⃣ Cấu Hình .env

Tạo file `.env` trong thư mục `backend`:

```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=DB_SmartCampus
DB_USER=postgres
DB_PASSWORD=123456

# Server
PORT=4000
NODE_ENV=development
```

### 4️⃣ Chạy Backend

```bash
cd backend

# Khởi động server
npm start

# Server sẽ chạy trên: http://localhost:4000
```

### 5️⃣ Chạy Frontend

**Mở terminal mới:**

```bash
cd frontend

# Cài đặt dependencies
npm install

# Khởi động development server
npm run dev

# Frontend sẽ chạy trên: http://localhost:5173
```

### 6️⃣ Truy Cập Ứng Dụng

Mở trình duyệt và truy cập:
```
http://localhost:5173
```

---

## 👤 Tài Khoản Mặc Định

| Vai Trò | Tên Đăng Nhập | Mật Khẩu | Email |
|---------|---------------|---------|-------|
| Admin | admin | 123456 | admin@ntu.edu.vn |
| Giảng viên | gv001 | 123456 | gv001@ntu.edu.vn |
| Giảng viên | gv002 | 123456 | gv002@ntu.edu.vn |
| Sinh viên | sv001 | 123456 | sv001@ntu.edu.vn |
| Sinh viên | sv002 | 123456 | sv002@ntu.edu.vn |

---

## 📊 API Endpoints Chính

### Lớp Học (Courses)
```
GET    /api/courses                    # Lấy danh sách lớp
GET    /api/courses/:id                # Chi tiết lớp
POST   /api/courses                    # Tạo lớp mới
PUT    /api/courses/:id                # Cập nhật lớp
GET    /api/courses/lecturer/:id       # Lấy lớp của giảng viên
GET    /api/courses/student/:id        # Lấy lớp của sinh viên
```

### Phòng Học (Rooms)
```
GET    /api/room-status/:maPhong       # Trạng thái phòng
GET    /api/rooms                      # Danh sách phòng
```

### Điểm Danh (Attendance)
```
GET    /api/attendance/session/:id     # Chi tiết phiên điểm danh
POST   /api/attendance/session         # Tạo phiên mới
POST   /api/attendance/record          # Ghi nhận điểm danh
```

### Người Dùng (Users)
```
GET    /api/users                      # Danh sách người dùng
GET    /api/users/:id                  # Chi tiết người dùng
POST   /api/auth/login                 # Đăng nhập
POST   /api/auth/logout                # Đăng xuất
```

---

## 🔧 Các Lệnh Hữu Ích

### Backend

```bash
cd backend

# Chạy server phát triển
npm start

# Cập nhật dữ liệu lớp học
node scripts/update-course-data.js

# Áp dụng migration database
node scripts/apply-migration.js
```

### Frontend

```bash
cd frontend

# Chạy phát triển
npm run dev

# Build sản phẩm
npm run build

# Preview build
npm run preview
```

---

## 🗄️ Cơ Sở Dữ Liệu

### Bảng Chính

| Bảng | Mô Tả |
|------|-------|
| `VaiTro` | Vai trò (admin, lecturer, student) |
| `NguoiDung` | Người dùng (admin, giảng viên, sinh viên) |
| `ToaNha` | Các tòa nhà trên campus |
| `PhongHoc` | Phòng học |
| `Khoa` | Khoa học |
| `Nganh` | Ngành học |
| `MonHoc` | Môn học |
| `LopHoc` | Lớp học (class sections) |
| `LopHoc_SinhVien` | Danh sách sinh viên trong lớp |
| `TietHoc` | Các tiết học trong ngày |
| `PhienDiemDanh` | Phiên điểm danh |
| `KetQuaDiemDanh` | Kết quả điểm danh |
| `SuKien` | Các sự kiện |

### Ràng Buộc Dữ Liệu

- ✅ Foreign Key (FK) tất cả các bảng liên kết
- ✅ Check constraints cho phạm vi hợp lệ (tiết 1-13, thứ 2-8)
- ✅ NOT NULL cho các trường bắt buộc
- ✅ Unique constraint cho mã định danh

---

## ⚙️ Quy Trình Lớp Học

### Trạng Thái Lớp Học

1. **CHO_XAC_NHAN** - Chờ xác nhận từ giảng viên
2. **DA_XAC_NHAN** - Đã xác nhận
3. **MO_DANG_KY** - Mở đăng ký sinh viên
4. **DANG_HOC** - Đang học (active)
5. **DA_DONG** - Đã đóng

### Quy Trình Điểm Danh

1. Giảng viên mở phiên điểm danh (`PhienDiemDanh`)
2. Hệ thống load danh sách sinh viên từ `LopHoc_SinhVien`
3. Ghi nhận có/vắng trong `KetQuaDiemDanh`
4. Tổng kết lại thống kê

---

## 🐛 Xử Lý Lỗi

### Lỗi Kết Nối Database

**Triệu chứng:**
```
Error: ECONNREFUSED 127.0.0.1:5432
```

**Giải pháp:**
- Kiểm tra PostgreSQL đang chạy: `pg_isready`
- Kiểm tra `.env` DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
- Tạo lại database nếu cần

### Lỗi Port Đang Sử Dụng

**Triệu chứng:**
```
Error: listen EADDRINUSE 0.0.0.0:4000
```

**Giải pháp:**
```bash
# Windows: Tìm process trên port 4000
netstat -ano | findstr :4000

# Kill process (thay PID bằng số)
taskkill /PID <PID> /F

# Hoặc chỉnh đổi port trong .env
```

### Lỗi Permission Denied

**Triệu chứng:**
```
Error: permission denied for schema public
```

**Giải pháp:**
```bash
# Cấp quyền cho user postgres
psql -U postgres -d DB_SmartCampus << EOF
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
EOF
```

---

## 📝 Ghi Chú Quan Trọng

1. **Dữ Liệu Mẫu**: Dữ liệu trong `seed.sql` được thiết kế để demo, sử dụng trong môi trường thực tế cần xóa sạch.

2. **Mật Khẩu**: Mật khẩu mặc định `123456` chỉ dùng cho phát triển, cần thay đổi trước khi deploy.

3. **PostGIS**: Dự án sử dụng PostGIS để quản lý dữ liệu địa lý, nếu không cần có thể xóa bỏ.

4. **Validation**: Tất cả lớp học có đầy đủ validation ở cấp API và database.

5. **Lịch Học**: 
   - Thu (ngày): 2=Thứ 2, 3=Thứ 3, ..., 8=Chủ nhật
   - MaTietBatDau: 1-13 (13 tiết/ngày)
   - SoTiet: Số tiết học (tối đa không vượt quá 13)

---

## 🤝 Hỗ Trợ

**Gặp vấn đề?**

1. Kiểm tra file `.env` cấu hình chính xác
2. Xóa `node_modules` và cài lại: `rm -r node_modules && npm install`
3. Kiểm tra logs trong terminal
4. Đảm bảo PostgreSQL và Node.js cài đặt chính xác

---

## 📜 Phiên Bản

- **Backend**: Node.js 16+, Express 4.x
- **Frontend**: React 18+, Vite 3+
- **Database**: PostgreSQL 15+, PostGIS 3+
- **Cập nhật**: 2026-01-19

---

## ✅ Checklist Triển Khai

- [ ] Node.js 16+ cài đặt
- [ ] PostgreSQL cài đặt và chạy
- [ ] Database `DB_SmartCampus` tạo
- [ ] File `.env` cấu hình chính xác
- [ ] `npm install` chạy thành công
- [ ] `node scripts/apply-migration.js` thành công
- [ ] Backend `npm start` chạy port 4000
- [ ] Frontend `npm run dev` chạy port 5173
- [ ] Truy cập http://localhost:5173 thành công

---

**Chúc bạn sử dụng dự án hiệu quả! 🚀**
