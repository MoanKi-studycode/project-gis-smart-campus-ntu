import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Globe, Bell, Monitor } from 'lucide-react';

/**
 * Settings Page - UI Preferences Only (localStorage)
 * NO database calls - follows architecture rules
 */

const DEFAULT_SETTINGS = {
  theme: 'light',
  language: 'vi',
  notifications: {
    email: true,
    push: true,
    scheduleReminder: true,
    attendanceAlert: true
  },
  display: {
    compactMode: false,
    showWelcome: true
  }
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    
    // Apply theme immediately
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const updateSetting = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let obj = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('userSettings');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="text-gray-600" size={28} />
        <h1 className="text-2xl font-bold text-gray-800">Cài đặt</h1>
      </div>

      {saved && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
          ✓ Đã lưu cài đặt thành công
        </div>
      )}

      <div className="space-y-6">
        {/* Theme Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={20} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Giao diện</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chủ đề</label>
              <div className="flex gap-3">
                <button
                  onClick={() => updateSetting('theme', 'light')}
                  className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                    settings.theme === 'light' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Sun size={18} />
                  Sáng
                </button>
                <button
                  onClick={() => updateSetting('theme', 'dark')}
                  className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                    settings.theme === 'dark' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Moon size={18} />
                  Tối
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Chế độ thu gọn</p>
                <p className="text-sm text-gray-500">Giảm khoảng cách giữa các phần tử</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.display.compactMode}
                  onChange={(e) => updateSetting('display.compactMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Language Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={20} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Ngôn ngữ</h2>
          </div>
          
          <select
            value={settings.language}
            onChange={(e) => updateSetting('language', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={20} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Thông báo</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { key: 'notifications.email', label: 'Thông báo qua Email', desc: 'Nhận email về các sự kiện quan trọng' },
              { key: 'notifications.push', label: 'Thông báo đẩy', desc: 'Nhận thông báo trực tiếp trên trình duyệt' },
              { key: 'notifications.scheduleReminder', label: 'Nhắc nhở lịch học', desc: 'Nhắc nhở trước khi lớp học bắt đầu' },
              { key: 'notifications.attendanceAlert', label: 'Cảnh báo điểm danh', desc: 'Thông báo khi có phiên điểm danh mở' }
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.key.split('.').reduce((o, k) => o?.[k], settings)}
                    onChange={(e) => updateSetting(item.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={saveSettings}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Lưu cài đặt
          </button>
          <button
            onClick={resetSettings}
            className="py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Đặt lại
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          * Cài đặt được lưu trên thiết bị này (localStorage)
        </p>
      </div>
    </div>
  );
}
