import React from 'react';

export default function AccountPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Quản lý tài khoản</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 font-semibold text-gray-600">Họ tên</th>
              <th className="pb-3 font-semibold text-gray-600">Email</th>
              <th className="pb-3 font-semibold text-gray-600">Vai trò</th>
              <th className="pb-3 font-semibold text-gray-600">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr className="border-b border-gray-50">
              <td className="py-3">Nguyễn Văn A</td>
              <td className="py-3">nguyenvana@ntu.edu.vn</td>
              <td className="py-3"><span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium">Sinh viên</span></td>
              <td className="py-3"><span className="px-2 py-1 bg-green-50 text-green-600 rounded-md text-xs font-medium">Hoạt động</span></td>
            </tr>
            <tr>
              <td className="py-3">Trần Thị B</td>
              <td className="py-3">tranthib@ntu.edu.vn</td>
              <td className="py-3"><span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-md text-xs font-medium">Giảng viên</span></td>
              <td className="py-3"><span className="px-2 py-1 bg-green-50 text-green-600 rounded-md text-xs font-medium">Hoạt động</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
