import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, Users, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { DataTable, Button } from '../../components/Common';
import { useMap } from '../../contexts/MapContext';
import { useAuth } from '../../context/AuthContext';
import { coursesApi } from '../../services/api';
import { getBuildingCoords } from '../../constants/buildingCoords';

/**
 * WeeklySchedule - Lecturer's Class Schedule with Map Integration
 * Database-driven with real course data
 * 
 * Features:
 * - Weekly view of scheduled classes
 * - Click map icon to preview & fly to building location
 * - Week navigation
 */

const WEEKDAY_MAP = {
  2: 'Thứ 2',
  3: 'Thứ 3',
  4: 'Thứ 4',
  5: 'Thứ 5',
  6: 'Thứ 6',
  7: 'Thứ 7',
  8: 'Chủ nhật'
};

// Get current week dates
const getWeekDates = (offset = 0) => {
  const now = new Date();
  const currentDay = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - currentDay + 1 + (offset * 7));
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const formatDate = (date) => {
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

export default function WeeklySchedule() {
  const navigate = useNavigate();
  const { flyToDirectly } = useMap();
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const weekDates = getWeekDates(weekOffset);
  const weekStart = formatDate(weekDates[0]);
  const weekEnd = formatDate(weekDates[6]);

  useEffect(() => {
    loadSchedule();
  }, [user]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const maSo = user?.MaSo || user?.maso;
      const response = await coursesApi.getByLecturer(maSo);
      const coursesData = response.data || response || [];
      
      // Transform course data to schedule format
      const scheduleData = Array.isArray(coursesData) ? coursesData.map(course => {
        const buildingName = course.tentoanha || course.TenToaNha || 'G6';
        const coords = getBuildingCoords(buildingName);
        const thu = course.thu || course.Thu || 2;
        const tietBD = course.matietbatdau || course.MaTietBatDau || 1;
        const soTiet = course.sotiet || course.SoTiet || 2;
        const gioBD = course.giobatdau || course.GioBatDau || '07:30';
        const gioKT = course.gioketthuc || course.GioKetThuc || '09:30';
        
        return {
          id: course.malop || course.MaLop,
          subject: course.tenmon || course.TenMon,
          subjectCode: course.mamon || course.MaMon,
          classCode: course.malop || course.MaLop,
          dayOfWeek: WEEKDAY_MAP[thu] || `Thứ ${thu}`,
          time: `${gioBD} - ${gioKT}`,
          room: `${buildingName}-${course.tenphong || course.TenPhong || ''}`,
          buildingId: buildingName,
          buildingName: buildingName,
          studentCount: course.soluongsv || course.SoLuongSV || course.sisotoida || course.SiSoToiDa || 0,
          lat: coords.lat,
          lng: coords.lng,
        };
      }) : [];
      
      // Sort by day and time
      scheduleData.sort((a, b) => {
        const dayA = Object.keys(WEEKDAY_MAP).find(k => WEEKDAY_MAP[k] === a.dayOfWeek) || 2;
        const dayB = Object.keys(WEEKDAY_MAP).find(k => WEEKDAY_MAP[k] === b.dayOfWeek) || 2;
        if (dayA !== dayB) return parseInt(dayA) - parseInt(dayB);
        return a.time.localeCompare(b.time);
      });
      
      setSchedule(scheduleData);
    } catch (error) {
      console.error('Failed to load schedule:', error);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle view location click - directly fly to location
  const handleViewLocation = (row) => {
    flyToDirectly({
      lat: row.lat,
      lng: row.lng,
      name: row.buildingName,
      buildingId: row.buildingId,
    }, navigate);
  };

  // Table columns
  const columns = [
    {
      key: 'dayOfWeek',
      label: 'Thứ',
      width: '80px',
      render: (value) => (
        <span className="font-semibold text-gray-700">{value}</span>
      ),
    },
    {
      key: 'time',
      label: 'Thời gian',
      width: '120px',
      render: (value) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Clock size={14} className="text-gray-400" />
          {value}
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Môn học',
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-800">{value}</p>
          <p className="text-xs text-gray-500">{row.classCode}</p>
        </div>
      ),
    },
    {
      key: 'room',
      label: 'Phòng học',
      width: '140px',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <MapPin size={14} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-700">{value}</p>
            <p className="text-xs text-gray-500">{row.buildingName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'studentCount',
      label: 'Sĩ số',
      width: '80px',
      render: (value) => (
        <div className="flex items-center gap-1.5 text-gray-600">
          <Users size={14} className="text-gray-400" />
          {value}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Xem vị trí',
      width: '100px',
      render: (_, row) => (
        <button
          onClick={() => handleViewLocation(row)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
          title="Xem trên bản đồ"
        >
          <MapPin size={18} className="group-hover:scale-110 transition-transform" />
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lịch giảng dạy</h1>
          <p className="text-gray-500 mt-1">Xem lịch dạy và điều hướng đến phòng học</p>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={<ChevronLeft size={16} />}
            onClick={() => setWeekOffset(prev => prev - 1)}
          />
          
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl">
            <Calendar size={18} className="text-blue-600" />
            <span className="font-medium text-blue-700">
              {weekStart} - {weekEnd}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<ChevronRight size={16} />}
            onClick={() => setWeekOffset(prev => prev + 1)}
          />

          {weekOffset !== 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset(0)}
            >
              Tuần này
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Tổng buổi dạy"
          value={schedule.length}
          icon={<Calendar size={20} />}
          color="blue"
        />
        <StatCard
          label="Môn học"
          value={new Set(schedule.map(s => s.subjectCode)).size}
          icon={<Calendar size={20} />}
          color="indigo"
        />
        <StatCard
          label="Tổng sinh viên"
          value={schedule.reduce((sum, s) => sum + s.studentCount, 0)}
          icon={<Users size={20} />}
          color="green"
        />
        <StatCard
          label="Phòng học"
          value={new Set(schedule.map(s => s.room)).size}
          icon={<MapPin size={20} />}
          color="purple"
        />
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Chi tiết lịch dạy</h2>
        </div>
        {schedule.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Không có lịch dạy trong tuần này</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={schedule}
            striped
            hoverable
          />
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
