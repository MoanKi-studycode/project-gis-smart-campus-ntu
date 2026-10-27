import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, Clock, BookOpen, Loader2 } from 'lucide-react';
import { coursesApi, referenceApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useMap } from '../../contexts/MapContext';
import { getBuildingCoords } from '../../constants/buildingCoords';

/**
 * Lecturer - Weekly Schedule Page
 * Displays teaching schedule in a weekly matrix format
 * Database-driven
 */

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const DAY_INDEX_MAP = { 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 8: 6 };

export default function LecturerScheduleWeekly() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { flyToDirectly } = useMap();
  const [currentWeek] = useState(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${monday.toLocaleDateString('vi-VN')} - ${sunday.toLocaleDateString('vi-VN')}`;
  });
  const [schedule, setSchedule] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesRes, periodsRes] = await Promise.all([
        coursesApi.getByLecturer(user?.MaSo || user?.maso),
        referenceApi.getPeriods()
      ]);
      
      const coursesData = coursesRes.data || coursesRes || [];
      
      // Transform courses to schedule format
      const scheduleData = Array.isArray(coursesData) ? coursesData.map(course => {
        const thu = course.thu || course.Thu || 2;
        const tietBD = course.matietbatdau || course.MaTietBatDau || 1;
        const soTiet = course.sotiet || course.SoTiet || 2;
        const tenToaNha = course.tentoanha || course.TenToaNha || 'G6';
        const tenPhong = course.tenphong || course.TenPhong || '';
        
        return {
          day: DAY_INDEX_MAP[thu] ?? 0,
          startPeriod: tietBD,
          endPeriod: tietBD + soTiet - 1,
          subject: course.tenmon || course.TenMon,
          room: `${tenToaNha}-${tenPhong}`,
          building: tenToaNha,
          class: course.malop || course.MaLop,
        };
      }) : [];
      
      setSchedule(scheduleData);
      
      // Format periods
      const periodsData = periodsRes || [];
      const formattedPeriods = periodsData.map(p => ({
        id: p.matiet || p.MaTiet,
        time: `${p.giobatdau || p.GioBatDau} - ${p.gioketthuc || p.GioKetThuc}`
      }));
      
      // If no periods from API, use default
      if (formattedPeriods.length === 0) {
        setPeriods([
          { id: 1, time: '07:00 - 07:50' },
          { id: 2, time: '07:55 - 08:45' },
          { id: 3, time: '08:50 - 09:40' },
          { id: 4, time: '09:45 - 10:35' },
          { id: 5, time: '10:40 - 11:30' },
          { id: 6, time: '13:00 - 13:50' },
          { id: 7, time: '13:55 - 14:45' },
          { id: 8, time: '14:50 - 15:40' },
          { id: 9, time: '15:45 - 16:35' },
          { id: 10, time: '16:40 - 17:30' },
        ]);
      } else {
        setPeriods(formattedPeriods);
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  // Get schedule item for a specific day and period
  const getScheduleItem = (dayIndex, periodId) => {
    return schedule.find(
      s => s.day === dayIndex && periodId >= s.startPeriod && periodId <= s.endPeriod
    );
  };

  // Check if this is the start period of a schedule item
  const isStartPeriod = (dayIndex, periodId) => {
    const item = schedule.find(s => s.day === dayIndex && s.startPeriod === periodId);
    return item;
  };

  // Handle View on Map
  const handleViewOnMap = (item) => {
    const coords = getBuildingCoords(item.building);
    
    flyToDirectly({
      lat: coords.lat,
      lng: coords.lng,
      name: item.room,
      buildingId: item.building,
    }, navigate);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50">
            <CalendarDays className="text-blue-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Lịch giảng dạy</h1>
            <p className="text-sm text-gray-500">{currentWeek}</p>
          </div>
        </div>
      </div>

      {/* Schedule Matrix */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b w-24">Tiết</th>
                {DAYS.map((day, idx) => (
                  <th key={idx} className="px-4 py-3 text-center text-sm font-semibold text-gray-600 border-b">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period.id} className="border-b border-gray-100">
                  <td className="px-4 py-2 text-xs text-gray-500 bg-gray-50">
                    <div className="font-medium">Tiết {period.id}</div>
                    <div>{period.time}</div>
                  </td>
                  {DAYS.map((_, dayIndex) => {
                    const startItem = isStartPeriod(dayIndex, period.id);
                    const currentItem = getScheduleItem(dayIndex, period.id);

                    if (startItem) {
                      const rowSpan = startItem.endPeriod - startItem.startPeriod + 1;
                      return (
                        <td
                          key={dayIndex}
                          rowSpan={rowSpan}
                          className="px-2 py-2 align-top"
                        >
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 h-full">
                            <p className="font-medium text-blue-800 text-sm">{startItem.subject}</p>
                            <p className="text-xs text-blue-600 mt-1">{startItem.class}</p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <Clock size={12} />
                              <span>Tiết {startItem.startPeriod}-{startItem.endPeriod}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <BookOpen size={12} />
                              <span>{startItem.room}</span>
                            </div>
                            <button
                              onClick={() => handleViewOnMap(startItem)}
                              className="mt-2 flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                            >
                              <MapPin size={12} />
                              Xem bản đồ
                            </button>
                          </div>
                        </td>
                      );
                    }

                    // Skip cells that are part of a rowspan
                    if (currentItem && period.id !== currentItem.startPeriod) {
                      return null;
                    }

                    return <td key={dayIndex} className="px-2 py-2"></td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
