import React, { useState, useRef, useEffect } from 'react';
import { Report, UserProfile, StoredDocument, StructuredLegalDocument, DocumentFolder, SubscriptionTier } from '../types';
import { getLegalAssistantResponse, getInitialLegalAnalysis, analyzeDocument, redraftDocument } from '../services/geminiService';
import { PaperAirplaneIcon, SparklesIcon, UserCircleIcon, DocumentTextIcon, LightBulbIcon, XMarkIcon, ScaleIcon } from './icons';
import MotionPreviewModal from './MotionPreviewModal';
import ReactMarkdown from 'react-markdown';

interface LegalMessage {
    role: 'user' | 'model';
    content: string;
    document?: {
        title: string;
        data: StructuredLegalDocument;
    };
    sources?: any[];
}

interface AnalyzedDocInfo {
    fileData: string;
    mimeType: string;
    analysisMessageId: number;
}

interface LegalAssistantProps {
    reports: Report[];
    documents: StoredDocument[];
    userProfile: UserProfile | null;
    activeReportContext: Report | null;
    clearActiveReportContext: () => void;
    initialQuery: string | null;
    clearInitialQuery: () => void;
    activeAnalysisContext: string | null;
    clearActiveAnalysisContext: () => void;
    onAddDocument: (document: StoredDocument) => void;
    onPromptConsultation: () => void;
    // Token & Subscription Props
    subscriptionTier: SubscriptionTier;
    hasSufficientTokens: () => boolean;
    handleTokensUsed: (count: number) => void;
    promptUpgrade: (featureName: string) => void;
}

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });

const documentToPlainText = (doc: StructuredLegalDocument | null): string => {
    if (!doc) return "";
    let text = `${doc.title}\n\n`;
    if (doc.subtitle) text += `${doc.subtitle}\n\n`;
    text += `Date: ${doc.metadata.date}\n`;
    if(doc.metadata.clientName) text += `Client: ${doc.metadata.clientName}\n`;
    if(doc.metadata.caseNumber) text += `Case No.: ${doc.metadata.caseNumber}\n\n`;
    if(doc.preamble) text += `${doc.preamble}\n\n`;
    doc.sections.forEach(s => {
        text += `${s.heading}\n\n${s.body}\n\n`;
    });
    if(doc.closing) text += `${doc.closing}\n\n`;
    if(doc.notes) text += `Notes: ${doc.notes}\n`;
    return text;
};

const LegalAssistant: React.FC<LegalAssistantProps> = ({ 
    reports, documents, userProfile, activeReportContext, clearActiveReportContext, 
    initialQuery, clearInitialQuery, activeAnalysisContext, clearActiveAnalysisContext, onAddDocument,
    onPromptConsultation,
    hasSufficientTokens, handleTokensUsed, promptUpgrade
}) => {
    const [messages, setMessages] = useState<LegalMessage[]>(() => {
        const initialContent = reports.length > 0
            ? "Hello, you can ask me questions about your logged incidents or uploaded documents. For example: 'When did communication issues occur?' or 'Draft a motion about the missed visitation.'"
            : "Hello, you can ask me general questions about Indiana family law or ask me to draft a legal document. I can also analyze a legal document if you upload one.";
        return [{ role: 'model', content: initialContent }];
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [modalContent, setModalContent] = useState<{ title: string; document: StructuredLegalDocument } | null>(null);
    const [analyzedDocInfo, setAnalyzedDocInfo] = useState<AnalyzedDocInfo | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isLoading) return;

        const sendInitialQuery = async (query: string) => {
            if (!hasSufficientTokens()) {
                promptUpgrade("Legal Assistant");
                clearInitialQuery();
                clearActiveAnalysisContext();
                return;
            }
            const userMessage: LegalMessage = { role: 'user', content: query };
            setMessages(prev => [...prev, userMessage]);
            setIsLoading(true);

            try {
                const { response, tokensUsed } = await getLegalAssistantResponse(reports, documents, query, userProfile, activeAnalysisContext);
                handleTokensUsed(tokensUsed);
                
                if (response.type === 'document' && response.title && response.documentText) {
                    onPromptConsultation();
                    const modelMessage: LegalMessage = {
                        role: 'model',
                        content: "I have prepared a draft for you. Document generation is a Pro Premium service that includes a consultation to tailor the document to your needs. Please request a consultation to proceed.",
                    };
                    setMessages(prev => [...prev, modelMessage]);

                } else {
                    const modelMessage: LegalMessage = { role: 'model', content: response.content, sources: response.sources };
                    setMessages(prev => [...prev, modelMessage]);
                }
            } catch (error) {
                console.error("Failed to run initial query", error);
                setMessages(prev => [...prev, { role: 'model', content: "Sorry, an error occurred." }]);
            } finally {
                setIsLoading(false);
                clearInitialQuery();
                clearActiveAnalysisContext();
            }
        };

        if (activeReportContext) {
            const runAnalysis = async () => {
                if (!hasSufficientTokens()) {
                    promptUpgrade("Legal Assistant");
                    clearActiveReportContext();
                    return;
                }
                setIsLoading(true);
                try {
                    const { response, tokensUsed } = await getInitialLegalAnalysis(activeReportContext, reports, userProfile);
                    handleTokensUsed(tokensUsed);
                    const analysisMessage: LegalMessage = {
                        role: 'model',
                        content: response.content,
                        sources: response.sources,
                    };
                    setMessages(prev => [...prev, analysisMessage]);
                } catch (error) {
                    console.error("Failed to run initial analysis", error);
                    setMessages(prev => [...prev, {
                        role: 'model',
                        content: "Sorry, an error occurred during analysis. How can I help with this incident?"
                    }]);
                } finally {
                    setIsLoading(false);
                    clearActiveReportContext();
                }
            };
    
            runAnalysis();
        } else if (initialQuery) {
            sendInitialQuery(initialQuery);
        }

    }, [activeReportContext, reports, documents, userProfile, clearActiveReportContext, initialQuery, clearInitialQuery, activeAnalysisContext, onAddDocument, clearActiveAnalysisContext, isLoading, hasSufficientTokens, promptUpgrade, handleTokensUsed, onPromptConsultation]);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;
        if (!hasSufficientTokens()) {
            promptUpgrade("Legal Assistant");
            return;
        }

        setAnalyzedDocInfo(null);
        const userMessage: LegalMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const { response, tokensUsed } = await getLegalAssistantResponse(reports, documents, currentInput, userProfile, activeAnalysisContext);
            handleTokensUsed(tokensUsed);
            
            if (response.type === 'document' && response.title && response.documentText) {
                onPromptConsultation();
                const modelMessage: LegalMessage = {
                    role: 'model',
                    content: `I have drafted the **${response.title}** for you. Accessing and saving documents requires our Pro Premium service, which includes a consultation to ensure it meets your specific legal needs.`,
                    sources: response.sources
                };
                 setMessages(prev => [...prev, modelMessage]);
            } else {
                 const modelMessage: LegalMessage = {
                    role: 'model',
                    content: response.content,
                    sources: response.sources
                };
                setMessages(prev => [...prev, modelMessage]);
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', content: "Sorry, an error occurred." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!hasSufficientTokens()) {
            promptUpgrade("Document Analysis");
            return;
        }

        setIsLoading(true);
        setAnalyzedDocInfo(null);
        
        try {
            const fileData = await fileToBase64(file);
            const { analysis, tokensUsed } = await analyzeDocument(fileData, file.type, userProfile);
            handleTokensUsed(tokensUsed);

            const analysisMessage: LegalMessage = {
                role: 'model',
                content: `Here is my analysis of **${file.name}**:\n\n${analysis}`
            };
            setMessages(prev => [...prev, analysisMessage]);
            setAnalyzedDocInfo({ fileData, mimeType: file.type, analysisMessageId: messages.length + 1 });
        } catch (error) {
            console.error("Error analyzing document:", error);
            setMessages(prev => [...prev, { role: 'model', content: "Sorry, an error occurred during document analysis." }]);
        } finally {
            setIsLoading(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRedraft = async (analysisText: string) => {
        if (!analyzedDocInfo) return;
        
        onPromptConsultation();
        const modelMessage: LegalMessage = {
            role: 'model',
            content: "I am ready to redraft the document with the suggestions. Document redrafting is part of our Pro Premium service. Please request a consultation to proceed."
        };
        setMessages(prev => [...prev, modelMessage]);
        setAnalyzedDocInfo(null); // Clear the analysis info so the button disappears
    };

    return (
        <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
            {modalContent && (
                <MotionPreviewModal 
                    isOpen={!!modalContent}
                    onClose={() => setModalContent(null)}
                    document={modalContent.document}
                    title={modalContent.title}
                />
            )}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                <div className="space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                             {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><ScaleIcon className="w-5 h-5 text-gray-500"/></div>}
                            <div className={`max-w-3xl px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-950 text-white rounded-br-lg' : 'bg-gray-100 text-gray-900 rounded-bl-lg'}`}>
                                <div className="prose prose-sm max-w-none prose-p:my-1"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                                {msg.document && (
                                     <button onClick={() => setModalContent({ title: msg.document!.title, document: msg.document!.data })} className="mt-3 flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-blue-900 bg-blue-100 rounded-md hover:bg-blue-200">
                                        <DocumentTextIcon className="w-4 h-4" />
                                        Preview: {msg.document.title}
                                    </button>
                                )}
                                {analyzedDocInfo && analyzedDocInfo.analysisMessageId === index && (
                                    <button onClick={() => handleRedraft(msg.content)} className="mt-3 flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                                        <SparklesIcon className="w-4 h-4" />
                                        Redraft with these suggestions
                                    </button>
                                )}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-300">
                                        <h4 className="text-xs font-semibold text-gray-600 mb-1.5">Sources:</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {msg.sources.map((source, idx) => (
                                                <li key={idx} className="text-xs">
                                                    <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">{source.web.title || source.web.uri}</a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><UserCircleIcon className="w-6 h-6 text-gray-500"/></div>}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><ScaleIcon className="w-5 h-5 text-gray-500"/></div>
                            <div className="max-w-lg px-4 py-3 rounded-2xl bg-gray-100 text-gray-800 rounded-bl-lg">
                                <div className="flex items-center space-x-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-0"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
                <div className="relative">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    />
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Ask a question or request a document..."
                        rows={1}
                        className="w-full pl-4 pr-24 py-3 text-sm resize-none border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                            title="Analyze a document"
                        >
                            <LightBulbIcon className="w-5 h-5" />
                        </button>
                        <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="p-2 text-white bg-blue-950 rounded-full hover:bg-blue-800 disabled:bg-blue-300">
                             <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegalAssistant;