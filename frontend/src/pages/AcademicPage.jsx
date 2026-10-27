import React from 'react';

export default function AcademicPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Học vụ</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Lịch học hôm nay</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center text-blue-700 font-bold">
                07:00
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Lập trình Web GIS</h3>
                <p className="text-sm text-gray-600">Phòng G2-301 • GV: Nguyễn Văn A</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 font-bold">
                09:30
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Cơ sở dữ liệu</h3>
                <p className="text-sm text-gray-600">Phòng G2-205 • GV: Trần Thị B</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Kết quả học tập</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
              <span className="text-gray-700">Toán cao cấp A1</span>
              <span className="font-bold text-green-600">8.5</span>
            </div>
            <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
              <span className="text-gray-700">Nhập môn lập trình</span>
              <span className="font-bold text-green-600">9.0</span>
            </div>
            <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
              <span className="text-gray-700">Pháp luật đại cương</span>
              <span className="font-bold text-yellow-600">7.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
