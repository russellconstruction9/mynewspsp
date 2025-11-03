import React, { useState, useRef, useEffect } from 'react';
import { BookOpenIcon, UserCircleIcon, MenuIcon, SparklesIcon, LockClosedIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    onMenuClick: () => void;
    onProfileClick: () => void;
    onAgentClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onProfileClick, onAgentClick }) => {
    const { user, signOut } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        try {
            await signOut();
            setIsDropdownOpen(false);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="bg-blue-950 border-b border-blue-800 fixed top-0 left-0 right-0 z-20 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center">
                        <button 
                            onClick={onMenuClick} 
                            className="mr-2 p-2 rounded-full text-gray-300 hover:bg-blue-900 lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-white" 
                            aria-label="Open menu"
                        >
                            <MenuIcon className="h-6 w-6" />
                        </button>
                        <div className="flex items-center">
                           <BookOpenIcon className="h-7 w-7 text-white" />
                           <span className="ml-3 text-xl font-semibold text-white tracking-tight">
                                CustodyX<span className="text-blue-400 font-medium">.ai</span>
                           </span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={() => setIsDropdownOpen(prev => !prev)}
                                className="p-2 rounded-full text-gray-300 hover:bg-blue-900 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                aria-label="Open user menu"
                                aria-haspopup="true"
                                aria-expanded={isDropdownOpen}
                            >
                                <UserCircleIcon className="h-7 w-7" />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabIndex={-1}>
                                    <button
                                        onClick={() => {
                                            onProfileClick();
                                            setIsDropdownOpen(false);
                                        }}
                                        className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        role="menuitem"
                                        tabIndex={-1}
                                    >
                                        <UserCircleIcon className="w-5 h-5 text-gray-500"/>
                                        <span>My Profile</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onAgentClick();
                                            setIsDropdownOpen(false);
                                        }}
                                        className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        role="menuitem"
                                        tabIndex={-1}
                                    >
                                        <SparklesIcon className="w-5 h-5 text-gray-500"/>
                                        <span>AI Agent</span>
                                    </button>
                                    <hr className="my-1" />
                                    <div className="px-4 py-2 text-xs text-gray-500">
                                        {user?.email}
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        role="menuitem"
                                        tabIndex={-1}
                                    >
                                        <LockClosedIcon className="w-5 h-5 text-gray-500"/>
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;