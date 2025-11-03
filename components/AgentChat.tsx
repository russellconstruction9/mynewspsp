import React from 'react';
import { UserProfile, View, SubscriptionTier } from '../types';
import { XMarkIcon, SparklesIcon } from './icons';

interface AgentChatProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: View) => void;
    userProfile: UserProfile | null;
    subscriptionTier: SubscriptionTier;
    hasSufficientTokens: () => boolean;
    handleTokensUsed: (count: number) => void;
    promptUpgrade: (featureName: string) => void;
}

const AgentChat: React.FC<AgentChatProps> = ({ isOpen, onClose }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="w-full max-w-2xl h-full max-h-[70vh] bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                 <header className="flex-shrink-0 flex justify-between items-center p-3 border-b border-white/10">
                     <div className="flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-white" />
                        <span className="text-white font-semibold">AI Agent</span>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-300 hover:text-white rounded-full hover:bg-white/10" aria-label="Close Agent">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-white">
                    <SparklesIcon className="w-16 h-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold">AI Voice Agent is Unavailable</h3>
                    <p className="mt-2 text-sm text-gray-300 max-w-sm">
                        This feature requires a direct connection to the AI service which is not supported in this secure deployment environment. All other AI features remain functional.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AgentChat;