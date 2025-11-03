import { Handler } from '@netlify/functions';
import { GoogleGenAI, Part, Content, Type } from "@google/genai";
import { ChatMessage, GeneratedReportData, Report, Theme, UserProfile, StoredDocument, StructuredLegalDocument } from '../../types';
import { SYSTEM_PROMPT_CHAT, SYSTEM_PROMPT_REPORT_GENERATION, SYSTEM_PROMPT_THEME_ANALYSIS } from '../../constants';
import { SYSTEM_PROMPT_SINGLE_INCIDENT_ANALYSIS } from '../../constants/behavioralPrompts';
import { SYSTEM_PROMPT_LEGAL_ASSISTANT, SYSTEM_PROMPT_LEGAL_ANALYSIS_SUGGESTION, SYSTEM_PROMPT_DOCUMENT_ANALYSIS, SYSTEM_PROMPT_DOCUMENT_REDRAFT, SYSTEM_PROMPT_EVIDENCE_PACKAGE } from '../../constants/legalPrompts';

// IMPORTANT: This function runs on the server, so it can securely access environment variables.
// The variable name GEMINI_API_KEY must match the one set in the Netlify UI.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Schemas for structured JSON responses (copied from original service)
const reportResponseSchema = {
    type: Type.OBJECT,
    properties: {
        content: { type: Type.STRING },
        category: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        legalContext: { type: Type.STRING }
    },
    required: ['content', 'category', 'tags']
};

const themeAnalysisSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER } },
        required: ['name', 'value']
    }
};

const structuredLegalDocumentSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        subtitle: { type: Type.STRING },
        metadata: {
            type: Type.OBJECT,
            properties: {
                date: { type: Type.STRING },
                clientName: { type: Type.STRING },
                caseNumber: { type: Type.STRING }
            },
            required: ['date']
        },
        preamble: { type: Type.STRING },
        sections: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { heading: { type: Type.STRING }, body: { type: Type.STRING } },
                required: ['heading', 'body']
            }
        },
        closing: { type: Type.STRING },
        notes: { type: Type.STRING }
    },
    required: ['title', 'metadata', 'preamble', 'sections', 'closing']
};


// Helper functions (copied from original service)
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
}

const formatMessagesToContent = (messages: ChatMessage[]): Content[] => {
    return messages.map(msg => {
        const parts: Part[] = [{ text: msg.content }];
        if (msg.images) {
            msg.images.forEach(image => {
                parts.push({
                    inlineData: {
                        mimeType: image.mimeType,
                        data: image.data,
                    },
                });
            });
        }
        return { role: msg.role, parts };
    });
};

const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }
    if (!process.env.GEMINI_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ message: 'API key is not configured on the server.' }) };
    }

    try {
        const { action, payload } = JSON.parse(event.body || '{}');
        let responseData: any;

        switch (action) {
            case 'getChatResponse': {
                const { messages, userProfile } = payload;
                const contents = formatMessagesToContent(messages);
                const systemInstruction = SYSTEM_PROMPT_CHAT.replace('{USER_PROFILE_CONTEXT}', formatUserProfileContext(userProfile));
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: contents,
                    config: { systemInstruction }
                });
                responseData = { text: response.text, tokensUsed: response.usageMetadata?.totalTokenCount ?? 0 };
                break;
            }

            case 'generateJsonReport': {
                const { messages, userProfile } = payload;
                const conversationText = messages.map((m: ChatMessage) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
                const userPrompt = `Based on the conversation transcript provided below, please generate the incident report JSON.\n\n--- CONVERSATION START ---\n\n${conversationText}\n\n--- CONVERSATION END ---`;
                const systemInstruction = SYSTEM_PROMPT_REPORT_GENERATION.replace('{USER_PROFILE_CONTEXT}', formatUserProfileContext(userProfile));
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: userPrompt,
                    config: {
                        systemInstruction,
                        responseMimeType: "application/json",
                        responseSchema: reportResponseSchema,
                    }
                });
                const jsonText = response.text.trim();
                const reportData = jsonText ? JSON.parse(jsonText) as GeneratedReportData : null;
                responseData = { reportData, tokensUsed: response.usageMetadata?.totalTokenCount ?? 0 };
                break;
            }

            case 'getThemeAnalysis': {
                const { reports, category } = payload;
                const reportsContent = reports.map((r: Report) => `--- REPORT ---\n${r.content}\n--- END REPORT ---`).join('\n\n');
                const prompt = SYSTEM_PROMPT_THEME_ANALYSIS.replace('{CATEGORY_NAME}', category);
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `${prompt}\n\n## Incident Reports Content\n\n${reportsContent}`,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: themeAnalysisSchema,
                    }
                });
                const themes = JSON.parse(response.text.trim()) as Theme[];
                responseData = { themes, tokensUsed: response.usageMetadata?.totalTokenCount ?? 0 };
                break;
            }
            
             case 'getSingleIncidentAnalysis': {
                const { mainReport, allReports, userProfile } = payload;
                const mainReportContent = `--- PRIMARY INCIDENT TO ANALYZE (ID: ${mainReport.id}, Date: ${new Date(mainReport.createdAt).toLocaleDateString()}) ---\n${mainReport.content}\n--- END PRIMARY INCIDENT ---`;
                const otherReportsContent = allReports
                    .filter((r: Report) => r.id !== mainReport.id)
                    .map((r: Report) => `--- SUPPORTING REPORT (ID: ${r.id}, Date: ${new Date(r.createdAt).toLocaleDateString()}) ---\n${r.content}\n--- END SUPPORTING REPORT ---`)
                    .join('\n\n');
                const systemInstruction = SYSTEM_PROMPT_SINGLE_INCIDENT_ANALYSIS;
                const fullPrompt = `${systemInstruction}\n\n${formatUserProfileContext(userProfile)}\n\n## Incident Reports for Analysis:\n\n${mainReportContent}\n\n${otherReportsContent}`;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: fullPrompt,
                    config: { tools: [{ googleSearch: {} }] }
                });
                const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
                responseData = { analysis: response.text, sources: sources, tokensUsed: response.usageMetadata?.totalTokenCount ?? 0 };
                break;
            }

            case 'getLegalAssistantResponse': {
                const { reports, documents, query, userProfile, analysisContext } = payload;
                const reportsContent = reports.map((r: Report) => `--- REPORT (ID: ${r.id}, Date: ${new Date(r.createdAt).toLocaleDateString()}) ---\n${r.content}\n--- END REPORT ---`).join('\n\n');
                const textDocuments = documents.filter((d: StoredDocument) => d.mimeType.startsWith('text/'));
                const binaryDocuments = documents.filter((d: StoredDocument) => !d.mimeType.startsWith('text/'));
                const textDocumentsContent = textDocuments.length > 0 ? textDocuments
                    .sort((a: StoredDocument, b: StoredDocument) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((doc: StoredDocument) => {
                        let contentSummary = '';
                        try {
                            const decodedText = decodeURIComponent(escape(atob(doc.data)));
                            contentSummary = `Content Preview: ${decodedText.substring(0, 750)}...`;
                        } catch (e) {
                            contentSummary = 'Content could not be decoded.';
                        }
                        return `--- DOCUMENT ---\nFolder: ${doc.folder}\nName: ${doc.name}\nDate Created: ${new Date(doc.createdAt).toLocaleString()}\n${contentSummary}\n--- END DOCUMENT ---`;
                    }).join('\n\n') : "No text documents available.";
                const binaryDocumentParts: Part[] = binaryDocuments.map((doc: StoredDocument) => ({
                    inlineData: { data: doc.data, mimeType: doc.mimeType }
                }));
                const systemInstruction = `${SYSTEM_PROMPT_LEGAL_ASSISTANT}\n${formatUserProfileContext(userProfile)}`;
                let promptText = `${systemInstruction}\n\n## KNOWLEDGE BASE: Incident Reports\n\n${reportsContent}\n\n## KNOWLEDGE BASE: Generated & Text Documents\n\n${textDocumentsContent}`;
                if (analysisContext) promptText += `\n\n## Forensic Incident Analysis (Primary Context):\n\n${analysisContext}`;
                promptText += `\n\n## User's Question:\n\n${query}`;
                const textPart: Part = { text: promptText };
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: [textPart, ...binaryDocumentParts] },
                    config: { tools: [{ googleSearch: {} }] }
                });
                const responseText = response.text;
                const firstBrace = responseText.indexOf('{');
                const lastBrace = responseText.lastIndexOf('}');
                let finalResponse;
                if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
                    finalResponse = { type: 'chat', content: responseText, sources: [] };
                } else {
                    const jsonText = responseText.substring(firstBrace, lastBrace + 1);
                    finalResponse = JSON.parse(jsonText);
                }
                const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
                finalResponse.sources = sources;
                responseData = { response: finalResponse, tokensUsed: response.usageMetadata?.totalTokenCount ?? 0 };
                break;
            }

            case 'getInitialLegalAnalysis': {
                const { mainReport, allReports, userProfile } = payload;
                 const mainReportContent = `--- PRIMARY INCIDENT TO ANALYZE (ID: ${mainReport.id}, Date: ${new Date(mainReport.createdAt).toLocaleDateString()}) ---\n${mainReport.content}\n--- END PRIMARY INCIDENT ---`;
                const otherReportsContent = allReports
                    .filter((r: Report) => r.id !== mainReport.id)
                    .map((r: Report) => `--- SUPPORTING REPORT (ID: ${r.id}, Date: ${new Date(r.createdAt).toLocaleDateString()}) ---\n${r.content}\n--- END SUPPORTING REPORT ---`)
                    .join('\n\n');
                const systemInstruction = `${SYSTEM_PROMPT_LEGAL_ANALYSIS_SUGGESTION}\n${formatUserProfileContext(userProfile)}`;
                const fullPrompt = `${systemInstruction}\n\n## Incident Reports for Analysis:\n\n${mainReportContent}\n\n${otherReportsContent}`;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: fullPrompt,
                    config: { tools: [{ googleSearch: {} }] }
                });
                const responseText = response.text;
                const firstBrace = responseText.indexOf('{');
                const lastBrace = responseText.lastIndexOf('}');
                if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) throw new Error("No valid JSON object found in the response from Legal Analysis API.");
                const jsonText = responseText.substring(firstBrace, lastBrace + 1);
                const parsedResponse = JSON.parse(jsonText);
                const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
                parsedResponse.sources = sources;
                responseData = { response: parsedResponse, tokensUsed: response.usageMetadata?.totalTokenCount ?? 0 };
                break;
            }

            case 'analyzeDocument': {
                const { fileData, mimeType, userProfile } = payload;
                const systemInstruction = `${SYSTEM_PROMPT_DOCUMENT_ANALYSIS}\n${formatUserProfileContext(userProfile)}`;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: [{ inlineData: { data: fileData, mimeType: mimeType } }, { text: "Please review and analyze this document according to your instructions." }] },
                    config: { systemInstruction }
                });
                responseData = { analysis: response.text, tokensUsed: response.usageMetadata?.totalTokenCount ?? 0 };
                break;
            }

            case 'redraftDocument': {
                const { fileData, mimeType, analysisText, userProfile } = payload;
                const systemInstruction = `${SYSTEM_PROMPT_DOCUMENT_REDRAFT}\n${formatUserProfileContext(userProfile)}`;
                const textPart = { text: `Here is the analysis of the document you are about to redraft. Please incorporate all these suggestions into the new version:\n\n--- ANALYSIS ---\n${analysisText}\n--- END ANALYSIS ---` };
                const documentPart = { inlineData: { data: fileData, mimeType: mimeType } };
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: [documentPart, textPart] },
                    config: {
                        systemInstruction,
                        responseMimeType: "application/json",
                        responseSchema: structuredLegalDocumentSchema,
                    }
                });
                const redraftedDoc = JSON.parse(response.text.trim()) as StructuredLegalDocument;
                responseData = { redraftedDoc, tokensUsed: response.usageMetadata?.totalTokenCount ?? 0 };
                break;
            }

            case 'generateEvidencePackage': {
                const { selectedReports, selectedDocuments, userProfile, packageObjective } = payload;
                const reportsString = selectedReports
                    .sort((a: Report, b: Report) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((r: Report) => `\n--- INCIDENT REPORT ---\nID: ${r.id}\nDate of Incident: ${new Date(r.createdAt).toLocaleString()}\nCategory: ${r.category}\nTags: [${r.tags.join(', ')}]\nLegal Context Note: ${r.legalContext || 'None provided.'}\nReport Content:\n${r.content}\n--- END REPORT ---`).join('\n\n');
                const documentsString = selectedDocuments.map((d: StoredDocument) => `\n--- DOCUMENT ---\nName: ${d.name}\nDate Uploaded: ${new Date(d.createdAt).toLocaleString()}\n--- END DOCUMENT ---`).join('\n\n');
                let systemInstruction = SYSTEM_PROMPT_EVIDENCE_PACKAGE.replace('{USER_PROFILE_CONTEXT}', formatUserProfileContext(userProfile));
                systemInstruction = systemInstruction.replace('{CURRENT_DATE}', new Date().toLocaleDateString('en-CA'));
                systemInstruction = systemInstruction.replace('{PACKAGE_OBJECTIVE}', packageObjective);
                const userPrompt = `Please generate the evidence package based on the following data.\n\n## SELECTED INCIDENT REPORTS ##\n\n${reportsString}\n\n## SELECTED DOCUMENTS ##\n\n${documentsString}`;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: userPrompt,
                    config: {
                        systemInstruction,
                        responseMimeType: "application/json",
                        responseSchema: structuredLegalDocumentSchema,
                    }
                });
                const evidencePackage = JSON.parse(response.text.trim()) as StructuredLegalDocument;
                responseData = { evidencePackage, tokensUsed: response.usageMetadata?.totalTokenCount ?? 0 };
                break;
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify(responseData),
        };

    } catch (error: any) {
        console.error('Error in Netlify function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message || 'An internal server error occurred.' }),
        };
    }
};

export { handler };
