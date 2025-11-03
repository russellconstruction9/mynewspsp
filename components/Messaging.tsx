import React, { useState, useRef, useEffect } from 'react';
import { CoParentMessage, UserProfile } from '../types';
import { PaperAirplaneIcon, UserCircleIcon, ChatBubbleLeftRightIcon } from './icons';

interface MessagingProps {
    messages: CoParentMessage[];
    onSendMessage: (text: string) => void;
    userProfile: UserProfile | null;
}

const Messaging: React.FC<MessagingProps> = ({ messages, onSendMessage, userProfile }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (input.trim()) {
            onSendMessage(input.trim());
            setInput('');
        }
    };
    
    const otherParentRole = userProfile?.role === 'Mother' ? 'Father' : (userProfile?.role === 'Father' ? 'Mother' : 'Other Parent');
    
    // In a real Firebase app, you would fetch the other parent's profile to get their name.
    // For now, we'll just use their role.

    return (
        <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <header className="p-4 sm:p-6 border-b border-gray-200 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <UserCircleIcon className="w-6 h-6 text-gray-500"/>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Messaging with {otherParentRole}</h1>
                    <p className="text-sm text-gray-600">This conversation is saved locally on your device.</p>
                </div>
            </header>
            
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="text-center py-24">
                        <ChatBubbleLeftRightIcon className="mx-auto h-16 w-16 text-gray-300" />
                        <h3 className="mt-4 text-xl font-semibold text-gray-900">Start the Conversation</h3>
                        <p className="mt-2 text-base text-gray-500 max-w-md mx-auto">
                            Send a message to begin your conversation. All messages are timestamped and saved.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map(msg => {
                            const isUser = msg.senderId === 'user';
                            return (
                                <div key={msg.id} className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xl px-4 py-3 rounded-2xl ${isUser ? 'bg-blue-950 text-white rounded-br-lg' : 'bg-gray-100 text-gray-900 rounded-bl-lg'}`}>
                                        <p className="text-sm leading-6 whitespace-pre-wrap">{msg.text}</p>
                                        <p className={`text-xs mt-2 text-right ${isUser ? 'text-blue-300' : 'text-gray-500'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                 <div ref={messagesEndRef} />
            </main>
            
            <footer className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Type your message..."
                        rows={1}
                        className="w-full pl-4 pr-12 py-3 text-sm resize-none border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-150"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <button onClick={handleSend} disabled={!input.trim()} className="p-2 text-white bg-blue-950 rounded-full hover:bg-blue-800 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors" aria-label="Send message">
                             <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Messaging;