import React from 'react';
import { BarChart3, Users, BookOpen, CheckSquare, TrendingUp } from 'lucide-react';

/**
 * Lecturer - Statistics Page
 */

const STATS = [
  { label: 'Lớp đang dạy', value: '3', icon: BookOpen, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
  { label: 'Tổng sinh viên', value: '123', icon: Users, color: 'bg-green-500', bgColor: 'bg-green-50' },
  { label: 'Tỉ lệ điểm danh TB', value: '92%', icon: CheckSquare, color: 'bg-purple-500', bgColor: 'bg-purple-50' },
  { label: 'Buổi dạy tháng này', value: '12', icon: TrendingUp, color: 'bg-orange-500', bgColor: 'bg-orange-50' },
];

const ATTENDANCE_BY_CLASS = [
  { class: 'IT001.01 - Lập trình Web', rate: 95, total: 45 },
  { class: 'IT002.01 - Cơ sở dữ liệu', rate: 88, total: 38 },
  { class: 'IT003.01 - Mạng máy tính', rate: 92, total: 40 },
];

export default function LecturerStatistics() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-indigo-50">
          <BarChart3 className="text-indigo-600" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Thống kê</h1>
          <p className="text-sm text-gray-500">Học kỳ 1, 2024-2025</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {STATS.map((stat, idx) => (
          <div key={idx} className={`${stat.bgColor} rounded-xl p-5 border border-gray-100`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance by Class */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Tỉ lệ điểm danh theo lớp</h2>
        <div className="space-y-4">
          {ATTENDANCE_BY_CLASS.map((item, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">{item.class}</span>
                <span className="text-sm font-medium text-gray-800">{item.rate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    item.rate >= 90 ? 'bg-green-500' : item.rate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${item.rate}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{item.total} sinh viên</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
