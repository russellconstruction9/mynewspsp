import React from 'react';
import { BookOpenIcon, ChartBarIcon, LightBulbIcon, PlusIcon, DocumentTextIcon, ScaleIcon, CalendarDaysIcon, HomeIcon, LockClosedIcon, ChatBubbleLeftRightIcon } from './icons';
import { View, SubscriptionTier, TokenUsage } from '../types';
import { TOKEN_LIMITS } from '../constants';

interface SidebarProps {
    activeView: View;
    onViewChange: (view: View) => void;
    reportCount: number;
    isOpen: boolean;
    subscriptionTier: SubscriptionTier;
    tokenUsage: TokenUsage;
    onUpgradeClick: () => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
    isPro?: boolean;
    isPlus?: boolean;
    currentTier: SubscriptionTier;
}> = ({ icon, label, isActive, onClick, disabled, isPro, isPlus, currentTier }) => {
    const baseClasses = "flex items-center justify-between w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950 relative";
    const activeClasses = "bg-blue-800 text-white font-semibold";
    const inactiveClasses = "text-gray-300 hover:bg-blue-900 hover:text-white";
    const disabledClasses = "text-blue-600/50 cursor-not-allowed";

    const isLocked = (isPro && currentTier !== 'Pro') || (isPlus && currentTier === 'Free');

    return (
        <button
            onClick={onClick}
            disabled={disabled || isLocked}
            className={`${baseClasses} ${(disabled || isLocked) ? disabledClasses : (isActive ? activeClasses : inactiveClasses)}`}
        >
            <div className="flex items-center">
                <div className="w-5 h-5 mr-3">{icon}</div>
                <span>{label}</span>
            </div>
            {isLocked && <LockClosedIcon className="w-4 h-4 text-amber-300" />}
        </button>
    );
};

const TokenUsageDisplay: React.FC<{ tier: SubscriptionTier; usage: TokenUsage; onClick: () => void }> = ({ tier, usage, onClick }) => {
    const limit = TOKEN_LIMITS[tier];
    const percentage = Math.min((usage.used / limit) * 100, 100);
    const usedFormatted = usage.used.toLocaleString();
    const limitFormatted = limit.toLocaleString();

    return (
        <button
            onClick={onClick}
            className="w-full text-left px-3 pt-3 pb-4 border-t border-blue-800/50 transition-colors duration-150 hover:bg-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={`You are on the ${tier} plan. Click to view and change your subscription.`}
        >
            <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">{tier} Plan</h4>
                 <p className="text-xs text-blue-300">{usedFormatted} / {limitFormatted}</p>
            </div>
            <div className="w-full bg-blue-900 rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Tokens used this month. Resets on {new Date(usage.resetDate).toLocaleDateString()}.</p>
        </button>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, reportCount, isOpen, subscriptionTier, tokenUsage, onUpgradeClick }) => {
    return (
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-950 border-r border-blue-800 p-4 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex lg:flex-col`}>
            <div className="flex flex-col h-full pt-16 lg:pt-0">
                <nav className="flex-grow space-y-1.5">
                    <NavItem
                        icon={<HomeIcon />}
                        label="Dashboard"
                        isActive={activeView === 'dashboard'}
                        onClick={() => onViewChange('dashboard')}
                        currentTier={subscriptionTier}
                    />
                    <NavItem
                        icon={<PlusIcon />}
                        label="New Report"
                        isActive={activeView === 'new_report'}
                        onClick={() => onViewChange('new_report')}
                        currentTier={subscriptionTier}
                    />
                     <NavItem
                        icon={<ChatBubbleLeftRightIcon />}
                        label="Messaging"
                        isActive={activeView === 'messaging'}
                        onClick={() => onViewChange('messaging')}
                        currentTier={subscriptionTier}
                    />
                    <NavItem
                        icon={<BookOpenIcon />}
                        label="Incident Timeline"
                        isActive={activeView === 'timeline'}
                        onClick={() => onViewChange('timeline')}
                        currentTier={subscriptionTier}
                    />
                     <NavItem
                        icon={<CalendarDaysIcon />}
                        label="Calendar View"
                        isActive={activeView === 'calendar'}
                        onClick={() => onViewChange('calendar')}
                        currentTier={subscriptionTier}
                    />
                    <NavItem
                        icon={<ChartBarIcon />}
                        label="Pattern Analysis"
                        isActive={activeView === 'patterns'}
                        onClick={() => onViewChange('patterns')}
                        disabled={reportCount < 2}
                        isPlus
                        currentTier={subscriptionTier}
                    />
                     <NavItem
                        icon={<DocumentTextIcon />}
                        label="Document Library"
                        isActive={activeView === 'documents'}
                        onClick={() => onViewChange('documents')}
                        isPlus
                        currentTier={subscriptionTier}
                    />
                     <NavItem
                        icon={<ScaleIcon />}
                        label="Legal Assistant"
                        isActive={activeView === 'assistant'}
                        onClick={() => onViewChange('assistant')}
                        isPlus
                        currentTier={subscriptionTier}
                    />
                     <NavItem
                        icon={<LightBulbIcon />}
                        label="Deep Analysis"
                        isActive={activeView === 'insights'}
                        onClick={() => onViewChange('insights')}
                        disabled={reportCount < 1}
                        isPro
                        currentTier={subscriptionTier}
                    />
                </nav>
                <div className="flex-shrink-0">
                     <TokenUsageDisplay tier={subscriptionTier} usage={tokenUsage} onClick={onUpgradeClick} />
                     <div className="text-left p-3">
                        <h3 className="text-lg font-bold text-white">CustodyX<span className="text-blue-400 font-medium">.ai</span></h3>
                        <p className="text-xs text-gray-400">An R² Technologies Project.</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;