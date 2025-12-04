
import React from 'react';
import type { ToastMessage } from '../types';
import { InfoIcon, CheckCircleIcon, ExclamationIcon } from './icons';

interface ToastProps {
    toast: ToastMessage | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
    if (!toast) return null;

    const toastStyles = {
        info: 'bg-blue-500',
        success: 'bg-green-500',
        error: 'bg-red-500',
    };

    const icons = {
        info: <InfoIcon className="w-6 h-6" />,
        success: <CheckCircleIcon className="w-6 h-6" />,
        error: <ExclamationIcon className="w-6 h-6" />,
    };

    return (
        <div
            className={`fixed top-5 right-5 flex items-center p-4 rounded-lg text-white shadow-lg z-50 transition-transform transform-gpu animate-fade-in-right ${
                toastStyles[toast.type]
            }`}
        >
            <div className="mr-3">{icons[toast.type]}</div>
            <div>{toast.message}</div>
            <style>{`
                @keyframes fade-in-right {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-fade-in-right {
                    animation: fade-in-right 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
