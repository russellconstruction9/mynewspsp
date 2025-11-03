import React from 'react';
import { ShieldCheckIcon } from './icons';

interface OnboardingInfoProps {
    onContinue: () => void;
}

const OnboardingInfo: React.FC<OnboardingInfoProps> = ({ onContinue }) => {
    return (
        <div className="bg-white p-6 sm:p-8 border border-gray-200 rounded-lg shadow-sm max-w-lg mx-auto">
            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <ShieldCheckIcon className="w-9 h-9 text-blue-800" />
                </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight text-center">Where does this information go?</h1>
            <p className="mt-4 text-base text-gray-700">
                Your privacy and trust are our top priorities. Here’s a clear breakdown of how we handle the information you just provided:
            </p>
            
            <div className="mt-6 space-y-4 text-left">
                <div>
                    <h2 className="font-semibold text-gray-800">Your Name & Email</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        This is used by the CustodyX.AI team to communicate with you about product updates or support issues. <strong>It is never shared with the other parent or used within the AI's analysis of your incidents.</strong>
                    </p>
                </div>
                <div>
                    <h2 className="font-semibold text-gray-800">Your Primary Goal</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        This anonymous feedback is vital for us. It helps our development team understand what's most important to parents like you, so we can prioritize building the features that matter most.
                    </p>
                </div>
                <div>
                    <h2 className="font-semibold text-gray-800">Your Incident Data</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        The profile you're about to create and all the incident reports you log are stored <strong>only on your local device</strong>. We do not see, store, or have access to this sensitive information.
                    </p>
                </div>
            </div>

            <div className="mt-8 pt-5 border-t border-gray-200">
                <button
                    onClick={onContinue}
                    className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-blue-950 rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Got it, Continue to Profile Setup
                </button>
            </div>
        </div>
    );
};

export default OnboardingInfo;