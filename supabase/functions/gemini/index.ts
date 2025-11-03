import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenAI, Part, Content, Type } from "https://esm.sh/@google/genai@0.21.0";

// Import interfaces (we'll define them inline for now)
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  images?: Array<{ mimeType: string; data: string }>;
}

interface GeneratedReportData {
  content: string;
  category: string;
  tags: string[];
  legalContext?: string;
}

interface Report {
  id: string;
  content: string;
  category: string;
  tags: string[];
  legalContext?: string;
  createdAt: string;
}

interface Theme {
  name: string;
  value: number;
}

interface UserProfile {
  name?: string;
  role?: 'Mother' | 'Father' | '';
  children?: string[];
}

interface StoredDocument {
  id: string;
  name: string;
  mimeType: string;
  data: string;
  folder: string;
  createdAt: string;
}

interface StructuredLegalDocument {
  title: string;
  subtitle?: string;
  metadata: {
    date: string;
    clientName?: string;
    caseNumber?: string;
  };
  preamble: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
  closing: string;
  notes?: string;
}

interface LegalAssistantResponse {
  type: string;
  content: string;
  sources?: any[];
}

// System prompts - you'll need to add these to your constants
const SYSTEM_PROMPT_CHAT = `You are CustodyX.AI, an advanced AI assistant designed to help co-parents document incidents, analyze patterns, and provide strategic guidance for custody matters. Your role is to be supportive, objective, and focused on the best interests of the children involved.

{USER_PROFILE_CONTEXT}

Key Guidelines:
- Maintain a professional, empathetic tone
- Focus on factual documentation and objective analysis
- Provide constructive suggestions for co-parenting improvement
- Prioritize child welfare in all recommendations
- Avoid taking sides or making legal judgments
- Encourage healthy communication when possible`;

const SYSTEM_PROMPT_REPORT_GENERATION = `You are CustodyX.AI's report generation system. Based on the conversation provided, generate a structured incident report in JSON format.

{USER_PROFILE_CONTEXT}

Generate only valid JSON with these fields:
- content: Detailed, objective description of the incident
- category: Most appropriate category for this incident
- tags: Relevant tags for organization and search
- legalContext: Brief note on potential legal relevance (optional)`;

const SYSTEM_PROMPT_THEME_ANALYSIS = `Analyze the provided incident reports for category '{CATEGORY_NAME}' and identify recurring themes or patterns. Return an array of themes with their frequency/relevance scores (0-100).`;

const SYSTEM_PROMPT_SINGLE_INCIDENT_ANALYSIS = `You are a forensic behavioral analyst specializing in co-parenting dynamics. Analyze the primary incident in context of supporting reports to identify patterns, escalation factors, and provide objective insights.`;

const SYSTEM_PROMPT_LEGAL_ASSISTANT = `You are CustodyX.AI's legal assistant module. Provide helpful, informative responses about custody and co-parenting matters based on the knowledge base provided. Always include appropriate disclaimers about seeking professional legal advice.`;

const SYSTEM_PROMPT_LEGAL_ANALYSIS_SUGGESTION = `Analyze the provided incident reports and suggest potential legal strategies or documentation improvements. Focus on factual analysis and pattern recognition.`;

const SYSTEM_PROMPT_DOCUMENT_ANALYSIS = `Analyze the provided document for legal relevance, completeness, and potential improvements. Focus on clarity, legal accuracy, and strategic value.`;

const SYSTEM_PROMPT_DOCUMENT_REDRAFT = `Redraft the provided document incorporating the analysis suggestions. Improve clarity, legal accuracy, and strategic positioning while maintaining the original intent.`;

const SYSTEM_PROMPT_EVIDENCE_PACKAGE = `Generate a comprehensive evidence package based on the selected reports and documents. Structure it professionally for legal presentation. {USER_PROFILE_CONTEXT} Current date: {CURRENT_DATE}. Package objective: {PACKAGE_OBJECTIVE}`;

// JSON schemas
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

// Helper functions
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

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get Gemini API key from environment variables
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    return new Response(JSON.stringify({ message: 'GEMINI_API_KEY is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  try {
    const { action, payload } = await req.json();
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

    return new Response(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in Supabase Edge Function:', error);
    return new Response(JSON.stringify({ message: error.message || 'An internal server error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});