import React from 'react';
import { Check } from 'lucide-react';

interface ToastNotificationProps {
    message: string;
    type: 'success' | 'error';
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ message, type }) => {
    return (
        <div className={`fixed top-5 right-5 z-[9999] bg-white border border-gray-150 shadow-2xl rounded-2xl p-4 flex items-center gap-3 max-w-sm border-l-4 ${type === 'success' ? 'border-l-emerald-500' : 'border-l-red-500'} transform translate-y-0 transition-all duration-300`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-655'}`}>
                {type === 'success' ? <Check size={18} /> : <span>⚠️</span>}
            </div>
            <div>
                <p className="text-xs font-extrabold text-gray-900">{message}</p>
            </div>
        </div>
    );
};

export default ToastNotification;
