import React from 'react';
import { ClearIcon } from './icons';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-slide-up">
                <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50">
                    <h2 className="text-xl font-bold text-cyan-400">Contact Us</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <ClearIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-5 text-gray-300">
                    <p className="leading-relaxed">
                        We value your feedback! If you have questions, feature requests, or need support, please don't hesitate to reach out.
                    </p>
                    
                    <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/50">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Support</h3>
                        <a href="mailto:support@targetanalyzer.com" className="text-cyan-400 hover:text-cyan-300 font-mono text-lg transition-colors break-all">
                            support@targetanalyzer.com
                        </a>
                    </div>
                    
                    <div className="text-sm text-gray-500 pt-2 border-t border-gray-700/50">
                        <p>We typically respond within 24-48 hours.</p>
                    </div>
                </div>
                <div className="p-4 bg-gray-900/50 text-right">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2 bg-gray-700 hover:bg-gray-600 hover:text-white text-gray-200 rounded-lg transition-all font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
