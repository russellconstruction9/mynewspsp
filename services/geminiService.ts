import { ChatMessage, GeneratedReportData, Report, Theme, UserProfile, LegalAssistantResponse, StoredDocument, StructuredLegalDocument } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const getGeminiAPI = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_complete_gemini_api_key_here') {
        throw new Error('Gemini API key is not configured. Please add your actual VITE_GEMINI_API_KEY to your .env.local file');
    }
    return new GoogleGenerativeAI(apiKey);
};

// Helper function to format user profile context
const formatUserProfileContext = (profile: UserProfile | null): string => {
    if (!profile || !profile.name) return '';
    let context = `The user's name is ${profile.name}`;
    if (profile.role) {
        context += `, and they identify as the ${profile.role}. The other parent should be referred to as the ${profile.role === 'Mother' ? 'Father' : 'Mother'}.`;
    }
    if (profile.children && profile.children.length > 0) {
        context += ` The child/children involved are: ${profile.children.join(', ')}.`;
    }
    return `\n### User Context\n${context}\n`;
};

// Basic system prompts
const SYSTEM_PROMPT_CHAT = `You are CustodyX.AI, an advanced AI assistant designed to help co-parents document incidents, analyze patterns, and provide strategic guidance for custody matters. Your role is to be supportive, objective, and focused on the best interests of the children involved.

{USER_PROFILE_CONTEXT}

Key Guidelines:
- Maintain a professional, empathetic tone
- Focus on factual documentation and objective analysis
- Provide constructive suggestions for co-parenting improvement
- Prioritize child welfare in all recommendations
- Avoid taking sides or making legal judgments
- Encourage healthy communication when possible`;

export const getChatResponse = async (messages: ChatMessage[], userProfile: UserProfile | null): Promise<{ text: string; tokensUsed: number }> => {
    try {
        console.log('🤖 Starting Gemini API call...');
        const genAI = getGeminiAPI();
        console.log('✅ Gemini API client initialized');
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        console.log('✅ Model loaded: gemini-2.0-flash-exp');
        
        const systemInstruction = SYSTEM_PROMPT_CHAT.replace('{USER_PROFILE_CONTEXT}', formatUserProfileContext(userProfile));
        const lastMessage = messages[messages.length - 1];
        
        console.log('📝 Sending message to Gemini:', lastMessage.content.substring(0, 100) + '...');
        
        const result = await model.generateContent(`${systemInstruction}\n\nUser: ${lastMessage.content}`);
        const response = result.response;
        
        console.log('✅ Gemini response received');
        
        return { 
            text: response.text(), 
            tokensUsed: result.response.usageMetadata?.totalTokenCount ?? 0 
        };
    } catch (error: any) {
        console.error('❌ Gemini API error details:', {
            message: error.message,
            status: error.status,
            code: error.code,
            details: error.details
        });
        
        // Provide more specific error messages
        if (error.message?.includes('API_KEY_INVALID')) {
            throw new Error('❌ Invalid Gemini API key. Please check your VITE_GEMINI_API_KEY environment variable.');
        } else if (error.message?.includes('QUOTA_EXCEEDED')) {
            throw new Error('❌ Gemini API quota exceeded. Please check your Google Cloud billing.');
        } else if (error.message?.includes('PERMISSION_DENIED')) {
            throw new Error('❌ Gemini API access denied. Please ensure the API is enabled in Google Cloud.');
        } else {
            throw new Error(`❌ AI service error: ${error.message || 'Unknown error occurred'}`);
        }
    }
};

export const generateJsonReport = async (messages: ChatMessage[], userProfile: UserProfile | null): Promise<{ reportData: GeneratedReportData | null; tokensUsed: number }> => {
    try {
        const genAI = getGeminiAPI();
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        
        const conversationText = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
        const prompt = `Based on the conversation transcript provided below, generate a JSON incident report with these fields:
        - content: Detailed, objective description of the incident
        - category: Most appropriate category for this incident  
        - tags: Array of relevant tags for organization
        - legalContext: Brief note on potential legal relevance (optional)

        Conversation:
        ${conversationText}
        
        Return only valid JSON.`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        
        try {
            const reportData = JSON.parse(response.text()) as GeneratedReportData;
            return { 
                reportData, 
                tokensUsed: result.response.usageMetadata?.totalTokenCount ?? 0 
            };
        } catch {
            return { 
                reportData: null, 
                tokensUsed: result.response.usageMetadata?.totalTokenCount ?? 0 
            };
        }
    } catch (error: any) {
        console.error('Gemini JSON report error:', error);
        throw new Error(`AI service error: ${error.message}`);
    }
};

export const getThemeAnalysis = async (reports: Report[], category: string): Promise<{ themes: Theme[]; tokensUsed: number }> => {
    try {
        const genAI = getGeminiAPI();
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        
        const reportsContent = reports.map(r => `--- REPORT ---\n${r.content}\n--- END REPORT ---`).join('\n\n');
        const prompt = `Analyze these incident reports for category '${category}' and identify recurring themes. Return a JSON array of themes with name and value (0-100 relevance score).

        Reports:
        ${reportsContent}
        
        Return format: [{"name": "theme name", "value": 85}, ...]`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        
        try {
            const themes = JSON.parse(response.text()) as Theme[];
            return { 
                themes, 
                tokensUsed: result.response.usageMetadata?.totalTokenCount ?? 0 
            };
        } catch {
            return { 
                themes: [], 
                tokensUsed: result.response.usageMetadata?.totalTokenCount ?? 0 
            };
        }
    } catch (error: any) {
        console.error('Gemini theme analysis error:', error);
        throw new Error(`AI service error: ${error.message}`);
    }
};

export const getSingleIncidentAnalysis = async (mainReport: Report, allReports: Report[], userProfile: UserProfile | null): Promise<{ analysis: string; sources: any[]; tokensUsed: number }> => {
    try {
        const genAI = getGeminiAPI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        
        const mainReportContent = `--- PRIMARY INCIDENT ---\n${mainReport.content}\n--- END PRIMARY INCIDENT ---`;
        const otherReportsContent = allReports
            .filter(r => r.id !== mainReport.id)
            .map(r => `--- SUPPORTING REPORT ---\n${r.content}\n--- END SUPPORTING REPORT ---`)
            .join('\n\n');
            
        const prompt = `As a forensic behavioral analyst, analyze this incident in context of supporting reports. Identify patterns, escalation factors, and provide objective insights.

        ${formatUserProfileContext(userProfile)}
        
        ${mainReportContent}
        
        ${otherReportsContent}`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        
        return { 
            analysis: response.text(), 
            sources: [], // No sources for direct API calls
            tokensUsed: result.response.usageMetadata?.totalTokenCount ?? 0 
        };
    } catch (error: any) {
        console.error('Gemini incident analysis error:', error);
        throw new Error(`AI service error: ${error.message}`);
    }
};

export const getLegalAssistantResponse = async (
    reports: Report[], 
    documents: StoredDocument[], 
    query: string, 
    userProfile: UserProfile | null,
    analysisContext: string | null
): Promise<{ response: LegalAssistantResponse & { sources?: any[] }; tokensUsed: number }> => {
    try {
        const genAI = getGeminiAPI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        
        const reportsContent = reports.map(r => `--- REPORT ---\n${r.content}\n--- END REPORT ---`).join('\n\n');
        const documentsContent = documents.map(d => `--- DOCUMENT: ${d.name} ---\nFolder: ${d.folder}\n--- END DOCUMENT ---`).join('\n\n');
        
        let prompt = `You are CustodyX.AI's legal assistant. Provide helpful responses about custody and co-parenting matters. Always include disclaimers about seeking professional legal advice.

        ${formatUserProfileContext(userProfile)}
        
        Knowledge Base - Reports:
        ${reportsContent}
        
        Knowledge Base - Documents:
        ${documentsContent}`;
        
        if (analysisContext) {
            prompt += `\n\nForensic Analysis Context:\n${analysisContext}`;
        }
        
        prompt += `\n\nUser Question: ${query}`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        
        return { 
            response: {
                type: 'chat',
                content: response.text(),
                sources: []
            }, 
            tokensUsed: result.response.usageMetadata?.totalTokenCount ?? 0 
        };
    } catch (error: any) {
        console.error('Gemini legal assistant error:', error);
        throw new Error(`AI service error: ${error.message}`);
    }
};

export const getInitialLegalAnalysis = async (mainReport: Report, allReports: Report[], userProfile: UserProfile | null): Promise<{ response: LegalAssistantResponse & { sources?: any[] }; tokensUsed: number }> => {
    try {
        const genAI = getGeminiAPI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        
        const mainReportContent = `--- PRIMARY INCIDENT ---\n${mainReport.content}\n--- END PRIMARY INCIDENT ---`;
        const otherReportsContent = allReports
            .filter(r => r.id !== mainReport.id)
            .map(r => `--- SUPPORTING REPORT ---\n${r.content}\n--- END SUPPORTING REPORT ---`)
            .join('\n\n');
            
        const prompt = `Analyze these incident reports and suggest potential legal strategies or documentation improvements. Focus on factual analysis and pattern recognition.

        ${formatUserProfileContext(userProfile)}
        
        ${mainReportContent}
        
        ${otherReportsContent}`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        
        return { 
            response: {
                type: 'chat',
                content: response.text(),
                sources: []
            }, 
            tokensUsed: result.response.usageMetadata?.totalTokenCount ?? 0 
        };
    } catch (error: any) {
        console.error('Gemini legal analysis error:', error);
        throw new Error(`AI service error: ${error.message}`);
    }
};

export const analyzeDocument = async (
    fileData: string, 
    mimeType: string, 
    userProfile: UserProfile | null
): Promise<{ analysis: string; tokensUsed: number }> => {
    try {
        const genAI = getGeminiAPI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        
        const prompt = `Analyze this document for legal relevance, completeness, and potential improvements. Focus on clarity, legal accuracy, and strategic value.

        ${formatUserProfileContext(userProfile)}
        
        Please review and analyze the document provided.`;
        
        const result = await model.generateContent([
            { text: prompt },
            { inlineData: { data: fileData, mimeType: mimeType } }
        ]);
        const response = result.response;
        
        return { 
            analysis: response.text(), 
            tokensUsed: result.response.usageMetadata?.totalTokenCount ?? 0 
        };
    } catch (error: any) {
        console.error('Gemini document analysis error:', error);
        throw new Error(`AI service error: ${error.message}`);
    }
};

export const redraftDocument = async (
    fileData: string,
    mimeType: string,
    analysisText: string,
    userProfile: UserProfile | null
): Promise<{ redraftedDoc: StructuredLegalDocument | null; tokensUsed: number }> => {
    try {
        const genAI = getGeminiAPI();
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        
        const prompt = `Redraft this document incorporating the analysis suggestions. Return a structured JSON document with title, metadata, preamble, sections array, and closing.

        ${formatUserProfileContext(userProfile)}
        
        Analysis to incorporate:
        ${analysisText}
        
        Return JSON format:
        {
          "title": "Document Title",
          "metadata": {"date": "YYYY-MM-DD"},
          "preamble": "Introduction text",
          "sections": [{"heading": "Section Title", "body": "Section content"}],
          "closing": "Closing text"
        }`;
        
        const result = await model.generateContent([
            { inlineData: { data: fileData, mimeType: mimeType } },
            { text: prompt }
        ]);
        const response = result.response;
        
        try {
            const redraftedDoc = JSON.parse(response.text()) as StructuredLegalDocument;
            return { 
                redraftedDoc, 
                tokensUsed: result.response.usageMetadata?.totalTokenCount ?? 0 
            };
        } catch {
            return { 
                redraftedDoc: null, 
                tokensUsed: result.response.usageMetadata?.totalTokenCount ?? 0 
            };
        }
    } catch (error: any) {
        console.error('Gemini document redraft error:', error);
        throw new Error(`AI service error: ${error.message}`);
    }
};

export const generateEvidencePackage = async (
    selectedReports: Report[],
    selectedDocuments: StoredDocument[],
    userProfile: UserProfile | null,
    packageObjective: string,
): Promise<{ evidencePackage: StructuredLegalDocument | null; tokensUsed: number }> => {
    try {
        const genAI = getGeminiAPI();
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        
        const reportsString = selectedReports
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map(r => `--- INCIDENT REPORT ---\nID: ${r.id}\nDate: ${new Date(r.createdAt).toLocaleString()}\nCategory: ${r.category}\nTags: [${r.tags.join(', ')}]\nContent:\n${r.content}\n--- END REPORT ---`)
            .join('\n\n');
            
        const documentsString = selectedDocuments
            .map(d => `--- DOCUMENT ---\nName: ${d.name}\nDate: ${new Date(d.createdAt).toLocaleString()}\n--- END DOCUMENT ---`)
            .join('\n\n');
        
        const prompt = `Generate a comprehensive evidence package for legal presentation. Structure it professionally with the objective: ${packageObjective}

        ${formatUserProfileContext(userProfile)}
        
        Selected Reports:
        ${reportsString}
        
        Selected Documents:
        ${documentsString}
        
        Return JSON format:
        {
          "title": "Evidence Package Title",
          "metadata": {"date": "${new Date().toLocaleDateString('en-CA')}"},
          "preamble": "Introduction and summary",
          "sections": [{"heading": "Section Title", "body": "Detailed content"}],
          "closing": "Conclusion and recommendations"
        }`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        
        try {
            const evidencePackage = JSON.parse(response.text()) as StructuredLegalDocument;
            return { 
                evidencePackage, 
                tokensUsed: result.response.usageMetadata?.totalTokenCount ?? 0 
            };
        } catch {
            return { 
                evidencePackage: null, 
                tokensUsed: result.response.usageMetadata?.totalTokenCount ?? 0 
            };
        }
    } catch (error: any) {
        console.error('Gemini evidence package error:', error);
        throw new Error(`AI service error: ${error.message}`);
    }
};

export const countAgentTokens = async (text: string): Promise<number> => {
    // Simple estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
};
