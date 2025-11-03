import React, { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { verifySupabaseSetup } from './verify-supabase';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import IncidentTimeline from './components/IncidentTimeline';
import ChatInterface from './components/ChatInterface';
import PatternAnalysis from './components/PatternAnalysis';
import DeepAnalysis from './components/BehavioralInsights';
import LegalAssistant from './components/LegalAssistant';
import UserProfile from './components/UserProfile';
import DocumentLibrary from './components/DocumentLibrary';
import CalendarView from './components/CalendarView';
import EvidencePackageBuilder from './components/EvidencePackageBuilder';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import AgentChat from './components/AgentChat';
import Messaging from './components/Messaging';
import UpgradeModal from './components/UpgradeModal';
import ConsultationModal from './components/ConsultationModal';
import NetlifyForm from './components/NetlifyForm';
import OnboardingInfo from './components/OnboardingInfo';
import AuthForm from './components/AuthForm';
import { Report, UserProfile as UserProfileType, StoredDocument, View, IncidentTemplate, CoParentMessage, SubscriptionTier, TokenUsage } from './types';
import { TOKEN_LIMITS } from './constants';
import { SparklesIcon } from './components/icons';

// Create the main authenticated app component
const AuthenticatedApp: React.FC = () => {
    const { user, signOut } = useAuth();
    const [view, setView] = useState<View>('dashboard');
    
    const [reports, setReports] = useState<Report[]>(() => {
        try {
            const savedReports = localStorage.getItem('reports');
            return savedReports ? JSON.parse(savedReports) : [];
        } catch (error) {
            console.error("Failed to load reports from localStorage", error);
            return [];
        }
    });
    
    const [documents, setDocuments] = useState<StoredDocument[]>(() => {
        try {
            const savedDocuments = localStorage.getItem('documents');
            return savedDocuments ? JSON.parse(savedDocuments) : [];
        } catch (error) {
            console.error("Failed to load documents from localStorage", error);
            return [];
        }
    });

    const [userProfile, setUserProfile] = useState<UserProfileType | null>(() => {
        try {
            const savedProfile = localStorage.getItem('userProfile');
            return savedProfile ? JSON.parse(savedProfile) : null;
        } catch (error) {
            console.error("Failed to load user profile from localStorage", error);
            return null;
        }
    });

    const [incidentTemplates, setIncidentTemplates] = useState<IncidentTemplate[]>(() => {
        try {
            const saved = localStorage.getItem('incidentTemplates');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Failed to load incident templates from localStorage", error);
            return [];
        }
    });

    const [messages, setMessages] = useState<CoParentMessage[]>(() => {
        try {
            const savedMessages = localStorage.getItem('coParentingMessages');
            return savedMessages ? JSON.parse(savedMessages) : [];
        } catch (error) {
            console.error("Failed to load messages from localStorage", error);
            return [];
        }
    });

    const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(() => {
        const savedTier = localStorage.getItem('subscriptionTier') as SubscriptionTier | null;
        return savedTier || 'Free';
    });

    const [tokenUsage, setTokenUsage] = useState<TokenUsage>(() => {
        const savedUsage = localStorage.getItem('tokenUsage');
        if (savedUsage) {
            return JSON.parse(savedUsage);
        }
        const nextReset = new Date();
        nextReset.setMonth(nextReset.getMonth() + 1);
        return { used: 0, resetDate: nextReset.toISOString() };
    });
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAgentOpen, setIsAgentOpen] = useState(false);
    const [activeReportContext, setActiveReportContext] = useState<Report | null>(null);
    const [activeInsightContext, setActiveInsightContext] = useState<Report | null>(null);
    const [initialLegalQuery, setInitialLegalQuery] = useState<string | null>(null);
    const [activeAnalysisContext, setActiveAnalysisContext] = useState<string | null>(null);
    const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());
    const [isEvidenceBuilderOpen, setIsEvidenceBuilderOpen] = useState(false);
    const [newReportDate, setNewReportDate] = useState<Date | null>(null);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeFeatureContext, setUpgradeFeatureContext] = useState<string | undefined>(undefined);
    const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);

    // Save data to localStorage whenever it changes
    useEffect(() => { localStorage.setItem('reports', JSON.stringify(reports)); }, [reports]);
    useEffect(() => { localStorage.setItem('incidentTemplates', JSON.stringify(incidentTemplates)); }, [incidentTemplates]);
    useEffect(() => { localStorage.setItem('coParentingMessages', JSON.stringify(messages)); }, [messages]);
    useEffect(() => { localStorage.setItem('subscriptionTier', subscriptionTier); }, [subscriptionTier]);
    useEffect(() => { localStorage.setItem('tokenUsage', JSON.stringify(tokenUsage)); }, [tokenUsage]);
    
    useEffect(() => {
        const now = new Date();
        const resetDate = new Date(tokenUsage.resetDate);

        if (now >= resetDate) {
            console.log("Resetting monthly token usage.");
            const nextReset = new Date();
            nextReset.setMonth(nextReset.getMonth() + 1);
            setTokenUsage({
                used: 0,
                resetDate: nextReset.toISOString(),
            });
        }
    }, []);

    const handleProfileSave = (profile: UserProfileType) => {
        try {
            localStorage.setItem('userProfile', JSON.stringify(profile));
            setUserProfile(profile);
            setView('dashboard');
        } catch (error) {
            console.error("Failed to save user profile to localStorage", error);
        }
    };
    
    const promptUpgrade = useCallback((featureName: string) => {
        setUpgradeFeatureContext(featureName);
        setIsUpgradeModalOpen(true);
    }, []);

    const handleUpgradeClick = () => {
        setUpgradeFeatureContext('your subscription');
        setIsUpgradeModalOpen(true);
    };
    
    const handlePromptConsultation = useCallback(() => {
        setIsConsultationModalOpen(true);
    }, []);

    const handleSwitchPlan = (tier: SubscriptionTier) => {
        setSubscriptionTier(tier);
        setIsUpgradeModalOpen(false);
    };

    const handleTokensUsed = useCallback((count: number) => {
        setTokenUsage(prev => ({ ...prev, used: prev.used + count }));
    }, []);

    const hasSufficientTokens = useCallback(() => {
        return tokenUsage.used < TOKEN_LIMITS[subscriptionTier];
    }, [tokenUsage, subscriptionTier]);

    const handleReportGenerated = (newReport: Report) => {
        setReports(prev => [...prev, newReport]);
        setNewReportDate(null);
    };
    
    const handleAddDocument = useCallback((newDocument: StoredDocument) => {
        setDocuments(prevDocuments => {
            const updatedDocuments = [...prevDocuments, newDocument];
            try {
                localStorage.setItem('documents', JSON.stringify(updatedDocuments));
            } catch (error) {
                console.error("Failed to save documents to localStorage", error);
            }
            return updatedDocuments;
        });
    }, []);

    const handleDeleteDocument = useCallback((documentId: string) => {
        setDocuments(prevDocuments => {
            const updatedDocuments = prevDocuments.filter(doc => doc.id !== documentId);
            try {
                localStorage.setItem('documents', JSON.stringify(updatedDocuments));
            } catch (error) {
                console.error("Failed to save documents to localStorage", error);
            }
            return updatedDocuments;
        });
    }, []);
    
    const handleAddTemplate = useCallback((newTemplate: IncidentTemplate) => {
        setIncidentTemplates(prev => [...prev, newTemplate]);
    }, []);

    const handleDeleteTemplate = useCallback((templateId: string) => {
        setIncidentTemplates(prev => prev.filter(t => t.id !== templateId));
    }, []);

    const handleSendMessage = (text: string) => {
        const userMessage: CoParentMessage = {
            id: `msg_${Date.now()}`,
            text,
            senderId: 'user',
            timestamp: new Date().toISOString(),
        };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setTimeout(() => {
            const otherParentResponse: CoParentMessage = {
                id: `msg_${Date.now() + 1}`,
                text: `Received: "${text}". I will review this shortly.`,
                senderId: 'other_parent',
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, otherParentResponse]);
        }, 1500 + Math.random() * 1000);
    };

    const handleViewChange = useCallback((newView: View) => {
        const tierRequired: Partial<Record<View, SubscriptionTier>> = {
            'patterns': 'Plus',
            'documents': 'Plus',
            'assistant': 'Plus',
            'insights': 'Pro',
        };

        const requiredTier = tierRequired[newView];
        if (requiredTier) {
            const tierLevels: Record<SubscriptionTier, number> = { 'Free': 0, 'Plus': 1, 'Pro': 2 };
            if (tierLevels[subscriptionTier] < tierLevels[requiredTier]) {
                const featureNameMap: Partial<Record<View, string>> = {
                    'patterns': 'Pattern Analysis',
                    'documents': 'Document Library',
                    'assistant': 'Legal Assistant',
                    'insights': 'Deep Analysis',
                };
                promptUpgrade(featureNameMap[newView] || 'this feature');
                return;
            }
        }

        if (newView !== 'new_report') setNewReportDate(null);
        setView(newView);
        setIsSidebarOpen(false);
    }, [subscriptionTier, promptUpgrade]);

    const handleDiscussIncident = (reportId: string) => {
        if (subscriptionTier === 'Free') {
            promptUpgrade('Legal Assistant');
            return;
        }
        const reportToDiscuss = reports.find(r => r.id === reportId);
        if (reportToDiscuss) {
            setActiveReportContext(reportToDiscuss);
            setActiveAnalysisContext(null);
            handleViewChange('assistant');
        }
    };

    const handleAnalyzeIncident = (reportId: string) => {
        if (subscriptionTier !== 'Pro') {
            promptUpgrade('Deep Analysis');
            return;
        }
        const reportToAnalyze = reports.find(r => r.id === reportId);
        if (reportToAnalyze) {
            setActiveInsightContext(reportToAnalyze);
            handleViewChange('insights');
        }
    };
    
    const handleGenerateDraftFromInsight = (analysisText: string, motionType: string) => {
        const query = `Based on the provided deep analysis, please draft a "${motionType}".`;
        setActiveAnalysisContext(analysisText);
        setActiveReportContext(null);
        setInitialLegalQuery(query);
        setView('assistant');
        setActiveInsightContext(null);
    };

    const handleBackToTimeline = () => {
        setView('timeline');
        setActiveInsightContext(null);
    };

    const handleToggleReportSelection = (reportId: string) => {
        setSelectedReportIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(reportId)) {
                newSet.delete(reportId);
            } else {
                newSet.add(reportId);
            }
            return newSet;
        });
    };

    const handleCalendarDayClick = (date: Date) => {
        setNewReportDate(date);
        setView('new_report');
    };

    const handleClearSelection = () => {
        setSelectedReportIds(new Set());
    };

    const handleAgentClick = () => {
        if (subscriptionTier !== 'Pro') {
            promptUpgrade('AI Voice Agent');
            return;
        }
        setIsAgentOpen(true);
    };

    const handleBuildPackageClick = () => {
        setIsEvidenceBuilderOpen(true);
    };
    
    const renderView = () => {
        const selectionProps = {
            selectedReportIds,
            onToggleReportSelection: handleToggleReportSelection,
        };
        const commonAiProps = {
            subscriptionTier,
            hasSufficientTokens,
            handleTokensUsed,
            promptUpgrade,
        };
        switch (view) {
            case 'dashboard':
                return <Dashboard 
                            userProfile={userProfile}
                            reports={reports}
                            onViewChange={handleViewChange}
                            onAnalyzeIncident={handleAnalyzeIncident}
                        />;
            case 'new_report':
                return <ChatInterface 
                            onReportGenerated={handleReportGenerated} 
                            userProfile={userProfile}
                            initialDate={newReportDate} 
                            templates={incidentTemplates}
                            onAddTemplate={handleAddTemplate}
                            onDeleteTemplate={handleDeleteTemplate}
                            onNavToTimeline={() => handleViewChange('timeline')}
                            {...commonAiProps}
                        />;
            case 'messaging':
                return <Messaging 
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            userProfile={userProfile}
                        />;
            case 'patterns':
                return <PatternAnalysis reports={reports} {...commonAiProps} />;
            case 'insights':
                return <DeepAnalysis 
                            reports={reports} 
                            userProfile={userProfile}
                            activeInsightContext={activeInsightContext}
                            onBackToTimeline={handleBackToTimeline}
                            onGenerateDraft={handleGenerateDraftFromInsight}
                            onAddDocument={handleAddDocument}
                            {...commonAiProps}
                        />;
            case 'documents':
                return <DocumentLibrary 
                            documents={documents}
                            onAddDocument={handleAddDocument}
                            onDeleteDocument={handleDeleteDocument}
                        />;
            case 'assistant':
                return <LegalAssistant 
                            reports={reports} 
                            documents={documents}
                            userProfile={userProfile}
                            activeReportContext={activeReportContext}
                            clearActiveReportContext={() => setActiveReportContext(null)}
                            initialQuery={initialLegalQuery}
                            clearInitialQuery={() => setInitialLegalQuery(null)}
                            activeAnalysisContext={activeAnalysisContext}
                            clearActiveAnalysisContext={() => setActiveAnalysisContext(null)}
                            onAddDocument={handleAddDocument}
                            onPromptConsultation={handlePromptConsultation}
                            {...commonAiProps}
                        />;
            case 'profile':
                return <UserProfile 
                            onSave={handleProfileSave} 
                            onCancel={() => handleViewChange('dashboard')}
                            currentProfile={userProfile}
                        />;
            case 'calendar':
                return <CalendarView 
                            reports={reports}
                            onDiscussIncident={handleDiscussIncident}
                            onAnalyzeIncident={handleAnalyzeIncident}
                            onDayClick={handleCalendarDayClick}
                            {...selectionProps}
                        />;
            case 'timeline':
            default:
                return <IncidentTimeline 
                            reports={reports} 
                            onDiscussIncident={handleDiscussIncident}
                            onAnalyzeIncident={handleAnalyzeIncident}
                            {...selectionProps}
                        />;
        }
    };

    const isUserOnboarded = !!userProfile;

    if (!isUserOnboarded) {
        if (view === 'netlify_form') {
            return (
                <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
                    <NetlifyForm onFormSubmit={() => setView('onboarding_info')} />
                </div>
            );
        }

        if (view === 'onboarding_info') {
            return (
                 <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
                    <OnboardingInfo onContinue={() => setView('profile')} />
                </div>
            );
        }
        
        if (view === 'profile') {
            return (
                <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
                     <UserProfile 
                        onSave={handleProfileSave} 
                        onCancel={() => setView('dashboard')}
                        currentProfile={null}
                        isInitialSetup={true}
                    />
                </div>
            );
        }

        return <LandingPage onGetStarted={() => setView('netlify_form')} />;
    }

    const isChatView = view === 'new_report' || view === 'assistant' || view === 'messaging';

    return (
        <div className="h-screen bg-gray-100 flex flex-col">
            <Header 
                onMenuClick={() => setIsSidebarOpen(prev => !prev)} 
                onProfileClick={() => handleViewChange('profile')}
                onAgentClick={handleAgentClick}
            />
            <div className="flex flex-1 pt-16 overflow-hidden">
                 {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
                        onClick={() => setIsSidebarOpen(false)}
                        aria-hidden="true"
                    ></div>
                )}
                <Sidebar 
                    activeView={view} 
                    onViewChange={handleViewChange} 
                    reportCount={reports.length}
                    isOpen={isSidebarOpen}
                    subscriptionTier={subscriptionTier}
                    tokenUsage={tokenUsage}
                    onUpgradeClick={handleUpgradeClick}
                />
                <main className={`flex-1 p-4 sm:p-6 lg:p-8 ${isChatView ? 'flex flex-col' : 'overflow-y-auto'}`}>
                    <div className={`mx-auto max-w-7xl w-full ${isChatView ? 'flex-1 min-h-0' : ''}`}>
                        {renderView()}
                    </div>
                </main>
            </div>
             {selectedReportIds.size > 0 && (view === 'timeline' || view === 'calendar') && (
                <div className="fixed bottom-6 right-6 z-30 flex items-center gap-3 no-print">
                    <button
                        onClick={handleClearSelection}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Clear Selection ({selectedReportIds.size})
                    </button>
                    <button
                        onClick={handleBuildPackageClick}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-950 rounded-full shadow-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105 transition-transform"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        Build Evidence Package
                    </button>
                </div>
            )}
            <AgentChat
                isOpen={isAgentOpen}
                onClose={() => setIsAgentOpen(false)}
                onNavigate={(newView) => {
                    handleViewChange(newView);
                    setIsAgentOpen(false);
                }}
                userProfile={userProfile}
                {...{subscriptionTier, hasSufficientTokens, handleTokensUsed, promptUpgrade}}
            />
            <EvidencePackageBuilder
                isOpen={isEvidenceBuilderOpen}
                onClose={() => setIsEvidenceBuilderOpen(false)}
                selectedReports={reports.filter(r => selectedReportIds.has(r.id))}
                allDocuments={documents}
                userProfile={userProfile}
                onPackageCreated={() => {
                    setIsEvidenceBuilderOpen(false);
                    setSelectedReportIds(new Set());
                }}
                onAddDocument={handleAddDocument}
                {...{subscriptionTier, hasSufficientTokens, handleTokensUsed, promptUpgrade}}
            />
            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                onSwitchPlan={handleSwitchPlan}
                currentTier={subscriptionTier}
                featureName={upgradeFeatureContext}
            />
            <ConsultationModal 
                isOpen={isConsultationModalOpen}
                onClose={() => setIsConsultationModalOpen(false)}
            />
        </div>
    );
};

// Main App component with authentication routing
const App: React.FC = () => {
    // Run Supabase verification on app start
    React.useEffect(() => {
        verifySupabaseSetup();
    }, []);

    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

// App content component that handles authenticated vs unauthenticated states
const AppContent: React.FC = () => {
    const { user, loading } = useAuth();

    // Show loading spinner while checking authentication state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Show authentication form if user is not logged in
    if (!user) {
        return <AuthForm onSuccess={() => window.location.reload()} />;
    }

    // Show the authenticated app
    return <AuthenticatedApp />;
};

export default App;