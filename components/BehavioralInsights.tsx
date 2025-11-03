import React, { useState, useEffect } from 'react';
import { Report, UserProfile, StoredDocument, DocumentFolder, SubscriptionTier } from '../types';
import { getSingleIncidentAnalysis } from '../services/geminiService';
import { LightBulbIcon, ArrowLeftIcon, ScaleIcon } from './icons';
import ReactMarkdown from 'react-markdown';

interface DeepAnalysisProps {
    reports: Report[];
    userProfile: UserProfile | null;
    activeInsightContext: Report | null;
    onBackToTimeline: () => void;
    onGenerateDraft: (analysisText: string, motionType: string) => void;
    onAddDocument: (document: StoredDocument) => void;
    // Token & Subscription Props
    subscriptionTier: SubscriptionTier;
    hasSufficientTokens: () => boolean;
    handleTokensUsed: (count: number) => void;
    promptUpgrade: (featureName: string) => void;
}

const DeepAnalysis: React.FC<DeepAnalysisProps> = ({ 
    reports, userProfile, activeInsightContext, onBackToTimeline, onGenerateDraft, onAddDocument,
    hasSufficientTokens, handleTokensUsed, promptUpgrade
}) => {
    const [analysisResult, setAnalysisResult] = useState<{ analysis: string; sources: any[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recommendedMotion, setRecommendedMotion] = useState<string | null>(null);
    
    useEffect(() => {
        if (!activeInsightContext) {
            setAnalysisResult(null);
            setRecommendedMotion(null);
            return;
        }

        const fetchInsights = async () => {
            if (!hasSufficientTokens()) {
                promptUpgrade("Deep Analysis");
                onBackToTimeline(); // Go back if they can't use the feature
                return;
            }

            setIsLoading(true);
            setError(null);
            setRecommendedMotion(null);
            setAnalysisResult(null);
            try {
                const result = await getSingleIncidentAnalysis(activeInsightContext, reports, userProfile);
                handleTokensUsed(result.tokensUsed);
                setAnalysisResult(result);

                const analysisText = result.analysis;
                const docName = `Forensic Analysis - ${new Date(activeInsightContext.createdAt).toLocaleDateString()}.md`;
                const newDoc: StoredDocument = {
                    id: `doc_analysis_${Date.now()}`,
                    name: docName,
                    mimeType: 'text/markdown',
                    data: btoa(unescape(encodeURIComponent(analysisText))),
                    createdAt: new Date().toISOString(),
                    folder: DocumentFolder.FORENSIC_ANALYSES,
                };
                onAddDocument(newDoc);

                const motionMatch = analysisText.match(/(Motion (to|for) [a-zA-Z\s]+)/);
                if (motionMatch && motionMatch[0]) {
                    setRecommendedMotion(motionMatch[0].trim());
                }

            } catch (err) {
                setError('An error occurred while generating insights.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInsights();
    }, [activeInsightContext, reports, userProfile, onAddDocument, hasSufficientTokens, promptUpgrade, handleTokensUsed, onBackToTimeline]);
    
    if (!activeInsightContext) {
        return (
            <div className="text-center py-24 bg-white border-2 border-dashed border-gray-300 rounded-lg h-full flex flex-col justify-center">
                <LightBulbIcon className="mx-auto h-16 w-16 text-gray-300" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Deep Analysis</h3>
                <p className="mt-2 text-base text-gray-500 max-w-md mx-auto">
                    Select an incident from the "Incident Timeline" and click "Incident Analysis" to generate a deep analysis.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                 <button
                    onClick={onBackToTimeline}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Timeline
                </button>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                    Forensic Analysis for {new Date(activeInsightContext.createdAt).toLocaleDateString()}
                </h1>
            </div>

            <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
                {isLoading ? (
                    <div className="text-center py-16">
                        <p className="text-gray-600">Generating deep analysis, this may take a moment...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-16 text-red-600 bg-red-50 p-4 rounded-md">
                        <p>{error}</p>
                    </div>
                ) : analysisResult ? (
                    <>
                        <div className="prose prose-slate max-w-none prose-h3:font-semibold prose-h3:text-gray-800 prose-h3:mt-6 prose-h3:mb-2 prose-strong:font-semibold">
                            <ReactMarkdown>{analysisResult.analysis}</ReactMarkdown>
                        </div>
                        
                        {analysisResult.sources && analysisResult.sources.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h4 className="text-base font-semibold text-gray-800 mb-3">Research Sources</h4>
                                <ul className="list-disc list-inside space-y-1.5">
                                    {analysisResult.sources.map((source, index) => (
                                        <li key={index} className="text-sm">
                                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800 hover:underline">
                                                {source.web.title || source.web.uri}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {recommendedMotion && (
                             <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                                 <button
                                     onClick={() => onGenerateDraft(analysisResult.analysis, recommendedMotion)}
                                     className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-900 rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:-translate-y-0.5"
                                 >
                                     <ScaleIcon className="w-5 h-5" />
                                     Generate Draft: {recommendedMotion}
                                 </button>
                             </div>
                        )}
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default DeepAnalysis;
