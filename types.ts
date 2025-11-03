export enum IncidentCategory {
    COMMUNICATION_ISSUE = 'Communication Issue',
    SCHEDULING_CONFLICT = 'Scheduling Conflict',
    FINANCIAL_DISPUTE = 'Financial Dispute',
    MISSED_VISITATION = 'Missed Visitation',
    PARENTAL_ALIENATION_CONCERN = 'Parental Alienation Concern',
    CHILD_WELLBEING = 'Child Wellbeing',
    LEGAL_DOCUMENTATION = 'Legal Documentation',
    OTHER = 'Other',
}

export enum DocumentFolder {
    DRAFTED_MOTIONS = 'Drafted Motions',
    FORENSIC_ANALYSES = 'Forensic Analyses',
    EVIDENCE_PACKAGES = 'Evidence Packages',
    USER_UPLOADS = 'User Uploads',
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    images?: { mimeType: string; data: string }[];
}

export interface GeneratedReportData {
    content: string;
    category: IncidentCategory;
    tags: string[];
    legalContext?: string;
}

export interface Report extends GeneratedReportData {
    id: string;
    createdAt: string; // ISO string
    images: string[]; // base64 data URLs
}

export interface Theme {
    name: string;
    value: number; // count
}

export interface UserProfile {
    name: string;
    role: 'Mother' | 'Father' | '';
    children: string[];
    email?: string; // Optional for now to maintain backward compatibility
}

export interface CoParentMessage {
    id: string;
    content: string;
    senderId: string; // UUID of the sender
    conversationId: string; // UUID of the conversation
    createdAt: string; // ISO string
    readAt?: string; // ISO string, optional
}

export interface Conversation {
    id: string;
    parent1Id: string; // UUID
    parent2Id: string; // UUID
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
    lastMessage?: CoParentMessage;
    otherParentName?: string; // Derived from user profile
    otherParentRole?: string; // Derived from user profile
}

export interface StructuredLegalDocument {
  title: string;
  subtitle?: string | null;
  metadata: {
    date: string; // "YYYY-MM-DD"
    clientName?: string | null;
    caseNumber?: string | null;
  };
  preamble: string;
  sections: {
    heading: string;
    body: string; // Raw text, can contain newlines for paragraphs
  }[];
  closing: string;
  notes?: string | null;
}

export interface LegalAssistantResponse {
    type: 'chat' | 'document';
    content: string; // Always contains the chat message
    title?: string; // Document title
    documentText?: StructuredLegalDocument; // Full document text as structured data
}

export interface StoredDocument {
    id: string;
    name: string;
    mimeType: string;
    data: string; // base64 representation of the content (plain text for structured docs, or binary data for files)
    createdAt: string; // ISO string
    folder: DocumentFolder;
    structuredData?: StructuredLegalDocument; // The original structured data, if applicable
}

export interface IncidentTemplate {
  id: string;
  title: string;
  content: string; // The full markdown content
  category: IncidentCategory;
  tags: string[];
  legalContext?: string;
}

export type SubscriptionTier = 'Free' | 'Plus' | 'Pro';

export interface TokenUsage {
  used: number;
  resetDate: string; // ISO string
}

export type View = 'dashboard' | 'timeline' | 'new_report' | 'patterns' | 'insights' | 'assistant' | 'profile' | 'documents' | 'calendar' | 'messaging' | 'netlify_form' | 'onboarding_info';