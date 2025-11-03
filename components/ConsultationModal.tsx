import React, { useState } from 'react';
import { XMarkIcon, ScaleIcon, CheckCircleIcon } from './icons';

interface ConsultationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ConsultationModal: React.FC<ConsultationModalProps> = ({ isOpen, onClose }) => {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleRequest = () => {
        // In a real application, this would trigger an API call.
        setIsSubmitted(true);
    };

    const handleClose = () => {
        setIsSubmitted(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={handleClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Premium Document Generation</h2>
                    <button onClick={handleClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100" aria-label="Close modal">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="p-6 sm:p-8 text-center">
                    {isSubmitted ? (
                        <>
                            <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto" />
                            <h3 className="mt-4 text-2xl font-bold text-gray-900">Request Received!</h3>
                            <p className="mt-2 text-gray-600">
                                Thank you for your interest. A representative will contact you within 24 hours to schedule your consultation and provide a precise quote.
                            </p>
                            <button
                                onClick={handleClose}
                                className="mt-8 w-full px-6 py-3 text-sm font-semibold text-white bg-blue-950 rounded-md shadow-sm hover:bg-blue-800"
                            >
                                Close
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                <ScaleIcon className="w-8 h-8 text-blue-800" />
                            </div>
                            <h3 className="mt-4 text-2xl font-bold text-gray-900">Unlock a Bespoke Legal Document</h3>
                            <p className="mt-2 text-gray-600">
                                Our AI-powered document generation is a premium service designed for high-stakes situations. To ensure the final document is perfectly tailored to your case, a consultation is required.
                            </p>
                            <div className="my-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="font-semibold text-gray-800">Service Fee:</p>
                                <p className="text-3xl font-bold text-blue-900">$150 - $500</p>
                                <p className="text-xs text-gray-500">Final price determined during your consultation.</p>
                            </div>
                            <button
                                onClick={handleRequest}
                                className="w-full px-6 py-3 text-sm font-semibold text-white bg-blue-950 rounded-md shadow-sm hover:bg-blue-800"
                            >
                                Request Consultation
                            </button>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ConsultationModal;
