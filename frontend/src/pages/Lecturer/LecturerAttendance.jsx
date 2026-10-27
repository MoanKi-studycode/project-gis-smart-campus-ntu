import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { coursesApi, attendanceApi } from '../../services/api';
import { 
  Play, Square, Users, CheckCircle, XCircle, Clock, 
  Calendar, ChevronDown, ChevronUp, AlertCircle, Plus,
  Eye, X, ClipboardList
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

export default function LecturerAttendance() {
  const { user } = useAuth();
  const toast = useToast();
  const { confirmAction } = useConfirm();
  const [courses, setCourses] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [todayRounds, setTodayRounds] = useState({});
  const [todayStudents, setTodayStudents] = useState({});
  const [showStudentDetail, setShowStudentDetail] = useState(null);
  const [roundRecords, setRoundRecords] = useState({});

  useEffect(() => {
    loadData();
    const interval = setInterval(loadActiveSessions, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Helper: Check if a course is currently in session (within class time)
  const isInClassTime = (course) => {
    const now = new Date();
    const currentDay = now.getDay() === 0 ? 8 : now.getDay() + 1; // VN weekday format (2=Mon, 8=Sun)
    const courseThu = course.Thu || course.thu;
    
    // Check weekday match (or null = all days)
    if (courseThu !== null && courseThu !== currentDay) {
      return false;
    }
    
    // Period times (HH:MM:SS)
    const periodTimes = {
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
    };
    
    const startPeriod = course.MaTietBatDau || course.matietbatdau;
    const numPeriods = course.SoTiet || course.sotiet;
    const endPeriod = startPeriod + numPeriods - 1;
    
    // Get start and end time from periods
    const startTime = course.GioBatDau || course.giobatdau || periodTimes[startPeriod]?.start;
    const endTime = course.GioKetThuc || course.gioketthuc || periodTimes[endPeriod]?.end;
    
    if (!startTime || !endTime) return false;
    
    // Compare current time with class time (with 5 minute buffer)
    const currentTimeStr = now.toTimeString().slice(0, 8);
    const startWithBuffer = startTime.slice(0, 5); // Remove seconds
    const endWithBuffer = endTime.slice(0, 5);
    
    // Parse times for comparison
    const [startH, startM] = startWithBuffer.split(':').map(Number);
    const [endH, endM] = endWithBuffer.split(':').map(Number);
    const [curH, curM] = currentTimeStr.slice(0, 5).split(':').map(Number);
    
    const startMinutes = startH * 60 + startM - 5; // 5 min before
    const endMinutes = endH * 60 + endM + 5; // 5 min after
    const currentMinutes = curH * 60 + curM;
    
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };

  const loadData = async () => {
    const lecturerId = user?.MaNguoiDung || user?.id || user?.MaSo;
    if (!lecturerId) return;
    setLoading(true);
    try {
      const [coursesResponse, activeResponse] = await Promise.all([
        coursesApi.getByLecturer(lecturerId),
        attendanceApi.getLecturerOpenSessions()
      ]);
      const coursesData = coursesResponse.success ? (coursesResponse.data || []) : (Array.isArray(coursesResponse) ? coursesResponse : []);
      const activeData = activeResponse.success ? (activeResponse.data || []) : (Array.isArray(activeResponse) ? activeResponse : []);
      
      // Filter: chỉ lớp DANG_HOC VÀ đang trong giờ dạy thực tế
      const activeCourses = coursesData.filter(c => {
        const status = c.TrangThai || c.trangthai;
        return status === 'DANG_HOC' && isInClassTime(c);
      });
      console.log('All courses:', coursesData.length, 'In-session courses:', activeCourses.length, activeCourses);
      setCourses(activeCourses);
      setActiveSessions(activeData);
      
      // Auto-expand first course and load its data
      if (activeCourses.length > 0) {
        const firstCourseId = activeCourses[0].MaLop || activeCourses[0].MaLopHoc;
        setExpandedCourse(firstCourseId);
        
        // Load today rounds for first course
        try {
          const roundsRes = await attendanceApi.getTodayRounds(firstCourseId);
          const rounds = roundsRes.success ? roundsRes.data : (Array.isArray(roundsRes) ? roundsRes : []);
          setTodayRounds(prev => ({ ...prev, [firstCourseId]: rounds }));
          
          const studentsRes = await attendanceApi.getTodayStudents(firstCourseId);
          const students = studentsRes.success ? studentsRes.data : (Array.isArray(studentsRes) ? studentsRes : []);
          setTodayStudents(prev => ({ ...prev, [firstCourseId]: students }));
        } catch (e) {
          console.error('Failed to load rounds/students', e);
        }
      }
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const activeResponse = await attendanceApi.getLecturerOpenSessions();
      const activeData = activeResponse.success ? (activeResponse.data || []) : (Array.isArray(activeResponse) ? activeResponse : []);
      setActiveSessions(activeData);
    } catch (error) {
      console.error('Failed to load active sessions', error);
    }
  };

  const loadTodayRounds = useCallback(async (courseId) => {
    try {
      const response = await attendanceApi.getTodayRounds(courseId);
      const rounds = response.success ? response.data : (Array.isArray(response) ? response : []);
      setTodayRounds(prev => ({ ...prev, [courseId]: rounds }));
    } catch (error) {
      console.error('Failed to load today rounds', error);
    }
  }, []);

  const loadTodayStudents = useCallback(async (courseId) => {
    try {
      const response = await attendanceApi.getTodayStudents(courseId);
      const students = response.success ? response.data : (Array.isArray(response) ? response : []);
      setTodayStudents(prev => ({ ...prev, [courseId]: students }));
    } catch (error) {
      console.error('Failed to load today students', error);
    }
  }, []);

  const loadRoundRecords = useCallback(async (roundId) => {
    try {
      const records = await attendanceApi.getSessionRecords(roundId);
      setRoundRecords(prev => ({ ...prev, [roundId]: Array.isArray(records) ? records : [] }));
    } catch (error) {
      console.error('Failed to load round records', error);
    }
  }, []);

  const handleOpenRound = async (courseId) => {
    try {
      const result = await attendanceApi.createRound(courseId, 15);
      if (result.success) {
        toast.success('Thành công', result.message || 'Đã mở lần điểm danh mới');
        loadTodayRounds(courseId);
        loadActiveSessions();
      }
    } catch (error) {
      toast.error('Mở điểm danh thất bại', error.message);
    }
  };

  const handleCloseRound = async (sessionId, courseId) => {
    const confirmed = await confirmAction('Đóng lần điểm danh này?');
    if (!confirmed) return;
    try {
      await attendanceApi.closeSession(sessionId);
      toast.success('Thành công', 'Đã đóng lần điểm danh');
      loadTodayRounds(courseId);
      loadActiveSessions();
    } catch (error) {
      toast.error('Đóng điểm danh thất bại', error.message);
    }
  };

  const handleEndDay = async (courseId) => {
    const confirmed = await confirmAction(
      'Kết thúc buổi điểm danh hôm nay?\nSinh viên không điểm danh lần nào sẽ bị đánh vắng.',
      'Kết thúc buổi học'
    );
    if (!confirmed) return;
    try {
      const result = await attendanceApi.endTodayAttendance(courseId);
      if (result.success) {
        toast.success('Thành công', 'Đã kết thúc buổi điểm danh hôm nay');
        loadTodayRounds(courseId);
        loadTodayStudents(courseId);
        loadActiveSessions();
      }
    } catch (error) {
      toast.error('Lỗi', error.message);
    }
  };

  const toggleExpand = (courseId) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(courseId);
      loadTodayRounds(courseId);
      loadTodayStudents(courseId);
    }
  };

  const getActiveSession = (courseId) => {
    return activeSessions.find(s => s.malop === courseId || s.MaLop === courseId);
  };

  const hasOpenRoundToday = (courseId) => {
    const rounds = todayRounds[courseId] || [];
    return rounds.some(r => r.trangthai === 'OPEN');
  };

  const getStudentSummary = (courseId) => {
    const students = todayStudents[courseId] || [];
    const rounds = todayRounds[courseId] || [];
    
    const studentMap = new Map();
    students.forEach(row => {
      if (!studentMap.has(row.masv)) {
        studentMap.set(row.masv, {
          masv: row.masv,
          hoten: row.hoten,
          email: row.email,
          rounds: {}
        });
      }
      studentMap.get(row.masv).rounds[row.landiemdanh] = row.trangthaidiemdanh;
    });
    
    return {
      students: Array.from(studentMap.values()),
      rounds: rounds
    };
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">Điểm danh</h1>
        <p className="text-gray-500 text-sm mt-1">
          Quản lý điểm danh cho các lớp học phần (hỗ trợ nhiều lần/buổi)
        </p>
      </div>

      {activeSessions.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 shrink-0">
          <div className="flex items-center gap-2 text-green-700 font-medium">
            <AlertCircle size={20} />
            Đang có {activeSessions.length} phiên điểm danh đang mở
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-white rounded-xl p-8">
          <Users size={48} className="mb-4 text-gray-300" />
          <p className="text-lg font-medium">Không có lớp học phần nào đang hoạt động</p>
          <p className="text-sm mt-2">Các lớp có trạng thái "ĐANG HỌC" sẽ hiển thị ở đây để điểm danh</p>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto flex-1">
          {courses.map(course => {
            const courseId = course.MaLop || course.MaLopHoc;
            const isExpanded = expandedCourse === courseId;
            const rounds = todayRounds[courseId] || [];
            const hasOpenRound = hasOpenRoundToday(courseId);
            const { students: summaryStudents, rounds: summaryRounds } = getStudentSummary(courseId);

            return (
              <div key={courseId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-900">{course.TenMon}</h3>
                      {hasOpenRound && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Đang điểm danh (Lần {rounds.filter(r => r.trangthai === 'OPEN')[0]?.landiemdanh || 1})
                        </span>
                      )}
                      {rounds.length > 0 && !hasOpenRound && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          Hôm nay: {rounds.length} lần
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{courseId}</span>
                      <span className="flex items-center gap-1">
                        <Users size={14} /> {course.SoSinhVien || 0} sinh viên
                      </span>
                      {course.Thu ? (
                        <span className="flex items-center gap-1">
                          <Calendar size={14} /> Thứ {course.Thu}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-600">
                          <Calendar size={14} /> Học mọi ngày
                        </span>
                      )}
                      {course.TenPhong && (
                        <span>Phòng: {course.TenPhong}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenRound(courseId)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 hover:bg-green-600"
                    >
                      <Plus size={16} /> Mở điểm danh
                    </button>
                    <button
                      onClick={() => toggleExpand(courseId)}
                      className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          <ClipboardList size={18} />
                          Các lần điểm danh hôm nay
                        </h4>
                        {rounds.length > 0 && (
                          <button
                            onClick={() => handleEndDay(courseId)}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 flex items-center gap-1"
                          >
                            <Square size={14} /> Kết thúc buổi
                          </button>
                        )}
                      </div>

                      {rounds.length === 0 ? (
                        <div className="text-gray-500 text-sm bg-white rounded-lg p-4">
                          Chưa có lần điểm danh nào hôm nay. Nhấn "Mở điểm danh" để bắt đầu.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {rounds.map(round => (
                            <RoundCard 
                              key={round.maphien}
                              round={round}
                              onClose={() => handleCloseRound(round.maphien, courseId)}
                              onViewDetail={() => {
                                setShowStudentDetail({ courseId, roundId: round.maphien });
                                loadRoundRecords(round.maphien);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {rounds.length > 0 && summaryStudents.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <Users size={18} />
                          Tổng hợp điểm danh sinh viên
                        </h4>
                        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-3 py-2 text-left font-medium text-gray-700">MSSV</th>
                                  <th className="px-3 py-2 text-left font-medium text-gray-700">Họ tên</th>
                                  {summaryRounds.map(r => (
                                    <th key={r.maphien} className="px-3 py-2 text-center font-medium text-gray-700">
                                      Lần {r.landiemdanh}
                                    </th>
                                  ))}
                                  <th className="px-3 py-2 text-center font-medium text-gray-700">Kết quả</th>
                                </tr>
                              </thead>
                              <tbody>
                                {summaryStudents.map(student => {
                                  const hasAnyCheckIn = summaryRounds.some(r => 
                                    student.rounds[r.landiemdanh] === 'CO_MAT' || 
                                    student.rounds[r.landiemdanh] === 'MUON'
                                  );
                                  return (
                                    <tr key={student.masv} className="border-t border-gray-100 hover:bg-gray-50">
                                      <td className="px-3 py-2 text-gray-900">{student.masv}</td>
                                      <td className="px-3 py-2 text-gray-900">{student.hoten}</td>
                                      {summaryRounds.map(r => (
                                        <td key={r.maphien} className="px-3 py-2 text-center">
                                          <StatusBadge status={student.rounds[r.landiemdanh]} />
                                        </td>
                                      ))}
                                      <td className="px-3 py-2 text-center">
                                        {hasAnyCheckIn ? (
                                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                            Có mặt
                                          </span>
                                        ) : (
                                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                                            Vắng
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          * Sinh viên được tính có mặt nếu điểm danh ít nhất 1 lần trong buổi học
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showStudentDetail && (
        <RoundDetailModal
          roundId={showStudentDetail.roundId}
          records={roundRecords[showStudentDetail.roundId] || []}
          onClose={() => setShowStudentDetail(null)}
        />
      )}
    </div>
  );
}

function RoundCard({ round, onClose, onViewDetail }) {
  // Handle both uppercase and lowercase from PostgreSQL
  const status = (round.trangthai || '').toUpperCase();
  const isOpen = status === 'OPEN';
  const isClosed = status === 'CLOSED';
  
  const startTime = round.thoigianbatdau 
    ? new Date(round.thoigianbatdau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  const endTime = round.thoigianketthuc 
    ? new Date(round.thoigianketthuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : null;
  
  return (
    <div className={`p-4 rounded-lg border-2 ${isOpen ? 'bg-green-50 border-green-400 shadow-md' : 'bg-gray-50 border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-lg font-bold ${isOpen ? 'text-green-700' : 'text-gray-700'}`}>
          Lần {round.landiemdanh || 1}
        </span>
        {isOpen ? (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            ĐANG MỞ
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2 py-1 bg-gray-400 text-white rounded-full text-xs font-medium">
            ĐÃ ĐÓNG
          </span>
        )}
      </div>
      
      {/* Time info */}
      <div className="text-sm text-gray-600 space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-gray-400" />
          <span>Bắt đầu: <strong>{startTime}</strong></span>
          {endTime && <span className="text-gray-400">| Kết thúc: {endTime}</span>}
        </div>
        
        {/* Statistics */}
        <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <CheckCircle size={14} /> {round.socomat || 0}
          </span>
          <span className="flex items-center gap-1 text-yellow-600 font-medium">
            <Clock size={14} /> {round.somuon || 0}
          </span>
          <span className="flex items-center gap-1 text-red-600 font-medium">
            <XCircle size={14} /> {round.sovang || 0}
          </span>
          <span className="text-gray-400 ml-auto">
            Tổng: {round.tongsinhvien || 0} SV
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onViewDetail}
          className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-1 font-medium"
        >
          <Eye size={14} /> Chi tiết
        </button>
        {isOpen && (
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-1 font-medium"
          >
            <Square size={14} /> Đóng lần này
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  if (!status || status === 'CHUA_DIEM_DANH') {
    return <span className="text-gray-400">-</span>;
  }
  if (status === 'CO_MAT') {
    return <CheckCircle size={16} className="text-green-500 mx-auto" />;
  }
  if (status === 'MUON') {
    return <Clock size={16} className="text-yellow-500 mx-auto" />;
  }
  if (status === 'VANG') {
    return <XCircle size={16} className="text-red-500 mx-auto" />;
  }
  return <span className="text-gray-400">-</span>;
}

function RoundDetailModal({ roundId, records, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-lg">Chi tiết lần điểm danh #{roundId}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {records.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Chưa có dữ liệu điểm danh
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">MSSV</th>
                  <th className="px-3 py-2 text-left">Họ tên</th>
                  <th className="px-3 py-2 text-center">Trạng thái</th>
                  <th className="px-3 py-2 text-center">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, idx) => (
                  <tr key={idx} className="border-t border-gray-100">
                    <td className="px-3 py-2">{record.masv || record.maso}</td>
                    <td className="px-3 py-2">{record.hoten}</td>
                    <td className="px-3 py-2 text-center">
                      {record.trangthai === 'CO_MAT' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Có mặt</span>
                      )}
                      {record.trangthai === 'MUON' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Muộn</span>
                      )}
                      {record.trangthai === 'VANG' && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Vắng</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-500">
                      {record.thoigiancheckin 
                        ? new Date(record.thoigiancheckin).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}