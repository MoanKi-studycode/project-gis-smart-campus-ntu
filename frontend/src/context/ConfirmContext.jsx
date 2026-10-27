import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, Trash2, Info, HelpCircle, X } from 'lucide-react';

const ConfirmContext = createContext(null);

const CONFIRM_TYPES = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmBg: 'bg-red-600 hover:bg-red-700',
    confirmText: 'text-white'
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
    confirmText: 'text-white'
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmBg: 'bg-blue-600 hover:bg-blue-700',
    confirmText: 'text-white'
  },
  question: {
    icon: HelpCircle,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    confirmBg: 'bg-purple-600 hover:bg-purple-700',
    confirmText: 'text-white'
  }
};

function ConfirmDialog({ config, onConfirm, onCancel }) {
  const type = CONFIRM_TYPES[config.type] || CONFIRM_TYPES.question;
  const Icon = type.icon;

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="p-6 pt-8">
          {/* Icon */}
          <div className={`w-14 h-14 ${type.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Icon className={type.iconColor} size={28} />
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
            {config.title || 'Xác nhận'}
          </h3>
          
          {/* Message */}
          <p className="text-gray-600 text-center whitespace-pre-line">
            {config.message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            {config.cancelText || 'Hủy'}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 ${type.confirmBg} ${type.confirmText} rounded-xl font-medium transition-colors`}
          >
            {config.confirmText || 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [resolveRef, setResolveRef] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setResolveRef(() => resolve);
      setDialog(typeof options === 'string' ? { message: options } : options);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef?.(true);
    setDialog(null);
    setResolveRef(null);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    resolveRef?.(false);
    setDialog(null);
    setResolveRef(null);
  }, [resolveRef]);

  // Convenience methods
  const confirmDelete = useCallback((itemName) => {
    return confirm({
      type: 'danger',
      title: 'Xác nhận xóa',
      message: `Bạn có chắc chắn muốn xóa ${itemName}?\n\nHành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy'
    });
  }, [confirm]);

  const confirmAction = useCallback((message, title = 'Xác nhận') => {
    return confirm({
      type: 'question',
      title,
      message,
      confirmText: 'Xác nhận',
      cancelText: 'Hủy'
    });
  }, [confirm]);

  const confirmDanger = useCallback((message, title = 'Cảnh báo') => {
    return confirm({
      type: 'danger',
      title,
      message,
      confirmText: 'Tiếp tục',
      cancelText: 'Hủy'
    });
  }, [confirm]);

  const confirmWarning = useCallback((message, title = 'Cảnh báo') => {
    return confirm({
      type: 'warning',
      title,
      message,
      confirmText: 'Đồng ý',
      cancelText: 'Hủy'
    });
  }, [confirm]);

  const value = {
    confirm,
    confirmDelete,
    confirmAction,
    confirmDanger,
    confirmWarning
  };

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {dialog && (
        <ConfirmDialog 
          config={dialog} 
          onConfirm={handleConfirm} 
          onCancel={handleCancel} 
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

export default ConfirmContext;
