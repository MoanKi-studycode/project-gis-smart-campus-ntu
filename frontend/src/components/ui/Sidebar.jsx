import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import { getMenuByRole } from '../../config/menuConfig';

/**
 * Sidebar Component - Role-Based Navigation with Push Layout
 * 
 * Props:
 * - isExpanded: boolean - Sidebar expansion state
 * - onToggle: function - Toggle sidebar expansion
 * - user: object - Current user with role
 * - onLogout: function - Logout handler
 */

export default function Sidebar({ isExpanded, onToggle, user, onLogout }) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  // Get menu items based on user role
  const menuItems = useMemo(() => {
    return getMenuByRole(user?.role);
  }, [user?.role]);

  // Auto-expand parent menu when child is active
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => location.pathname === child.path);
        if (hasActiveChild) {
          setExpandedMenus(prev => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [location.pathname, menuItems]);

  // Toggle submenu expansion
  const toggleSubmenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // Check if a menu item or its children are active
  const isMenuActive = (item) => {
    if (item.path && location.pathname === item.path) return true;
    if (item.children) {
      return item.children.some(child => location.pathname === child.path);
    }
    return false;
  };

  // Render a single menu item
  const renderMenuItem = (item) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = isMenuActive(item);
    const isSubmenuExpanded = expandedMenus[item.id];

    if (hasChildren) {
      return (
        <div key={item.id} className="mb-1">
          {/* Parent Menu Button */}
          <button
            onClick={() => toggleSubmenu(item.id)}
            className={`
              w-full flex items-center rounded-xl transition-all duration-200
              ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}
              ${isExpanded ? 'px-4 py-3 justify-between' : 'px-0 py-3 justify-center'}
            `}
            title={!isExpanded ? item.label : ''}
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${isExpanded ? 'w-6' : 'w-full flex justify-center'}`}>
                <item.icon size={20} />
              </div>
              {isExpanded && (
                <span className="ml-3 font-medium whitespace-nowrap">{item.label}</span>
              )}
            </div>
            {isExpanded && (
              <div className="flex-shrink-0">
                {isSubmenuExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            )}
          </button>

          {/* Submenu Items */}
          {isExpanded && isSubmenuExpanded && (
            <div className="mt-1 ml-4 pl-4 border-l-2 border-gray-100">
              {item.children.map(child => (
                <NavLink
                  key={child.id}
                  to={child.path}
                  className={({ isActive }) => `
                    flex items-center py-2.5 px-3 rounded-lg mb-1 transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}
                  `}
                >
                  {child.icon && <child.icon size={16} className="mr-2 flex-shrink-0" />}
                  <span className="text-sm">{child.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Regular menu item (no children)
    return (
      <NavLink
        key={item.id}
        to={item.path}
        title={!isExpanded ? item.label : ''}
        className={({ isActive }) => `
          flex items-center rounded-xl mb-1 transition-all duration-200
          ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}
          ${isExpanded ? 'px-4 py-3' : 'px-0 py-3 justify-center'}
        `}
      >
        <div className={`flex-shrink-0 ${isExpanded ? 'w-6' : 'w-full flex justify-center'}`}>
          <item.icon size={20} />
        </div>
        {isExpanded && (
          <span className="ml-3 font-medium whitespace-nowrap">{item.label}</span>
        )}
      </NavLink>
    );
  };

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full z-20
        bg-white shadow-xl border-r border-gray-100
        flex flex-col
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'w-[280px]' : 'w-[80px]'}
      `}
    >
      {/* Header - Logo & Toggle */}
      <div className="h-16 flex items-center border-b border-gray-100 px-4">
        <button
          onClick={onToggle}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
          title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
        >
          <Menu size={22} />
        </button>
        {isExpanded && (
          <span className="ml-3 font-bold text-lg text-gray-800 whitespace-nowrap">
            Smart Campus
          </span>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-thin">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* Footer - User Info & Logout */}
      <div className="border-t border-gray-100 p-3">
        {/* User Info */}
        {user && (
          <div className={`
            flex items-center mb-3 p-2 rounded-xl bg-gray-50
            ${isExpanded ? 'gap-3' : 'justify-center'}
          `}>
            {user.Avatar ? (
              <img
                src={user.Avatar}
                alt="Avatar"
                className="w-9 h-9 rounded-full flex-shrink-0 object-cover"
              />
            ) : (
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.HoTen || user.name || 'U')}&background=6366f1&color=fff`}
                alt="Avatar"
                className="w-9 h-9 rounded-full flex-shrink-0"
              />
            )}
            {isExpanded && (
              <div className="overflow-hidden">
                <p className="font-semibold text-gray-800 text-sm truncate">
                  {user.HoTen || user.name}
                </p>
                <p className="text-xs text-gray-500 capitalize truncate">
                  {user.role === 'admin' ? 'Quản trị viên' : 
                   user.role === 'lecturer' ? 'Giảng viên' : 'Sinh viên'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={onLogout}
          title={!isExpanded ? 'Đăng xuất' : ''}
          className={`
            w-full flex items-center rounded-xl py-3 
            text-red-500 hover:bg-red-50 transition-colors
            ${isExpanded ? 'px-4' : 'justify-center'}
          `}
        >
          <LogOut size={20} />
          {isExpanded && (
            <span className="ml-3 font-medium">Đăng xuất</span>
          )}
        </button>
      </div>
    </aside>
  );
}
