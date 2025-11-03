import { ChatMessage, GeneratedReportData, Report, Theme, UserProfile, LegalAssistantResponse, StoredDocument, StructuredLegalDocument } from '../types';

async function callApi(action: string, payload: any) {
    try {
        const response = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, payload }),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'API call failed with status ' + response.status }));
            throw new Error(errorBody.message || 'An unknown API error occurred');
        }

        return response.json();
    } catch (e) {
        console.error(`API call for action "${action}" failed:`, e);
        throw e;
    }
}

export const getChatResponse = async (messages: ChatMessage[], userProfile: UserProfile | null): Promise<{ text: string; tokensUsed: number }> => {
    return callApi('getChatResponse', { messages, userProfile });
};

export const generateJsonReport = async (messages: ChatMessage[], userProfile: UserProfile | null): Promise<{ reportData: GeneratedReportData | null; tokensUsed: number }> => {
    return callApi('generateJsonReport', { messages, userProfile });
};

export const getThemeAnalysis = async (reports: Report[], category: string): Promise<{ themes: Theme[]; tokensUsed: number }> => {
    return callApi('getThemeAnalysis', { reports, category });
};

export const getSingleIncidentAnalysis = async (mainReport: Report, allReports: Report[], userProfile: UserProfile | null): Promise<{ analysis: string; sources: any[]; tokensUsed: number }> => {
    return callApi('getSingleIncidentAnalysis', { mainReport, allReports, userProfile });
};

export const getLegalAssistantResponse = async (
    reports: Report[], 
    documents: StoredDocument[], 
    query: string, 
    userProfile: UserProfile | null,
    analysisContext: string | null
): Promise<{ response: LegalAssistantResponse & { sources?: any[] }; tokensUsed: number }> => {
    return callApi('getLegalAssistantResponse', { reports, documents, query, userProfile, analysisContext });
};

export const getInitialLegalAnalysis = async (mainReport: Report, allReports: Report[], userProfile: UserProfile | null): Promise<{ response: LegalAssistantResponse & { sources?: any[] }; tokensUsed: number }> => {
    return callApi('getInitialLegalAnalysis', { mainReport, allReports, userProfile });
};

export const analyzeDocument = async (
    fileData: string, 
    mimeType: string, 
    userProfile: UserProfile | null
): Promise<{ analysis: string; tokensUsed: number }> => {
    return callApi('analyzeDocument', { fileData, mimeType, userProfile });
};

export const redraftDocument = async (
    fileData: string,
    mimeType: string,
    analysisText: string,
    userProfile: UserProfile | null
): Promise<{ redraftedDoc: StructuredLegalDocument | null; tokensUsed: number }> => {
    return callApi('redraftDocument', { fileData, mimeType, analysisText, userProfile });
};

export const generateEvidencePackage = async (
    selectedReports: Report[],
    selectedDocuments: StoredDocument[],
    userProfile: UserProfile | null,
    packageObjective: string,
): Promise<{ evidencePackage: StructuredLegalDocument | null; tokensUsed: number }> => {
    return callApi('generateEvidencePackage', { selectedReports, selectedDocuments, userProfile, packageObjective });
};

export const countAgentTokens = async (text: string): Promise<number> => {
    console.warn("Agent feature is disabled in this deployment.");
    return 0;
};
