
import React from 'react';
import { ClearIcon } from './icons';

interface TermsAndConditionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full h-3/4 overflow-hidden transform transition-all animate-slide-up">
                <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50">
                    <h2 className="text-xl font-bold text-cyan-400">Terms and Conditions</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <ClearIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-5 text-gray-300 overflow-y-auto h-full pb-20">
                    <p className="text-sm text-gray-500">Last updated: October 26, 2023</p>
                    <p>Please read these terms and conditions carefully before using Our Service.</p>
                    <h3 className="text-lg font-semibold text-cyan-400 mt-4">Interpretation and Definitions</h3>
                    <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
                    <h3 className="text-lg font-semibold text-cyan-400 mt-4">Acknowledgment</h3>
                    <p>These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.</p>
                    <p>Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.</p>
                    <p>By accessing or using the Service You agree to be bound by these Terms and Conditions. If You disagree with any part of these Terms and Conditions then You may not access the Service.</p>
                    <p>You represent that you are over the age of 18. The Company does not permit those under 18 to use the Service.</p>
                    <p>Your access to and use of the Service is also conditioned on Your acceptance of and compliance with the Privacy Policy of the Company. Our Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your personal information when You use the Application or the Website and tells You about Your privacy rights and how the law protects You. Please read Our Privacy Policy carefully before using Our Service.</p>
                    <h3 className="text-lg font-semibold text-cyan-400 mt-4">Links to Other Websites</h3>
                    <p>Our Service may contain links to third-party web sites or services that are not owned or controlled by the Company.</p>
                    <p>The Company has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. You further acknowledge and agree that the Company shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods or services available on or through any such web sites or services.</p>
                    <p>We strongly advise You to read the terms and conditions and privacy policies of any third-party web sites or services that You visit.</p>
                    <h3 className="text-lg font-semibold text-cyan-400 mt-4">Termination</h3>
                    <p>We may terminate or suspend Your access immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms and Conditions.</p>
                    <p>Upon termination, Your right to use the Service will cease immediately.</p>
                </div>
                <div className="p-4 bg-gray-900/50 text-right absolute bottom-0 w-full">
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
