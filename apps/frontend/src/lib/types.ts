/** Mirrors the API's Pydantic schemas. Real types — not mock scaffolding. */

export type CompanyProfileStatus = "onboarding" | "analyzing" | "ready";
export type KnowledgeSourceKind =
  "brochure" | "pitch_deck" | "case_study" | "documentation" | "website" | "other";
export type KnowledgeSourceStatus = "pending" | "parsing" | "ready" | "failed";
export type CampaignStatus =
  "draft" | "prospecting" | "researching" | "ready" | "running" | "paused" | "completed";
export type LeadStatus =
  "discovered" | "researching" | "qualified" | "rejected" | "outreach_ready" | "approved" | "sent";
export type EmailStatus = "verified" | "guessed" | "unknown" | "not_found";
export type DraftStatus = "pending" | "approved" | "rejected" | "edited" | "skipped";
export type ContactRole =
  "founder" | "ceo" | "marketing" | "growth" | "sales" | "operations" | "engineering" | "other";

export interface KnowledgeSource {
  id: string;
  kind: KnowledgeSourceKind;
  original_filename: string | null;
  source_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  status: KnowledgeSourceStatus;
  error: string | null;
  parsed_at: string | null;
  created_at: string;
}

/** Written by the Company Knowledge Agent. Every field is optional until it runs. */
export interface ProductKnowledge {
  products?: string[];
  services?: string[];
  features?: string[];
  benefits?: string[];
  pain_points?: string[];
  industries?: string[];
  company_sizes?: string[];
  differentiators?: string[];
  competitors?: string[];
  use_cases?: string[];
  value_props?: string[];
  success_stories?: { customer: string; outcome: string }[];
}

export interface CompanyProfile {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
  icp_description: string | null;
  status: CompanyProfileStatus;
  product_knowledge: ProductKnowledge;
  knowledge_ready_at: string | null;
  created_at: string;
  updated_at: string;
  sources?: KnowledgeSource[];
}

export interface Evidence {
  claim: string;
  source: string;
}

export interface ProspectCompany {
  id: string;
  domain: string;
  name: string;
  website: string | null;
  description: string | null;
  industry: string | null;
  employee_range: string | null;
  country: string | null;
}

export interface Contact {
  id: string;
  full_name: string | null;
  title: string | null;
  role_category: ContactRole | null;
  email: string | null;
  email_status: EmailStatus;
  linkedin_url: string | null;
  confidence: number | null;
}

export interface Research {
  summary: string | null;
  signals: Record<string, string[]>;
  sources: string[];
  created_at: string;
}

export interface Lead {
  id: string;
  campaign_id: string;
  status: LeadStatus;
  fit_score: number | null;
  confidence: number | null;
  qualification_reason: string | null;
  qualification_evidence: Evidence[];
  opportunity_summary: string | null;
  opportunity_evidence: Evidence[];
  rejected_reason: string | null;
  prospect_company: ProspectCompany;
}

export interface LeadDetail extends Lead {
  research: Research | null;
  contacts: Contact[];
  drafts: EmailDraft[];
  timeline: TimelineEvent[];
}

export interface EmailDraft {
  id: string;
  lead_id: string;
  subject: string | null;
  body: string | null;
  linkedin_message: string | null;
  follow_up: string | null;
  cta: string | null;
  status: DraftStatus;
  revision: number;
  edited_by_human: boolean;
  critic_verdict: { passed: boolean; notes: string[] } | null;
  contact: Contact | null;
  company_name: string;
}

export interface Campaign {
  id: string;
  name: string;
  goal: string | null;
  status: CampaignStatus;
  target_criteria: Record<string, unknown>;
  created_at: string;
  lead_count: number;
  qualified_count: number;
  sent_count: number;
}

export type TimelineEventKind =
  | "discovered"
  | "researched"
  | "qualified"
  | "rejected"
  | "contact_found"
  | "draft_generated"
  | "draft_approved"
  | "draft_rejected"
  | "email_sent"
  | "email_replied";

export interface TimelineEvent {
  id: string;
  kind: TimelineEventKind;
  message: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  agent_outputs?: { agent: string; status: "running" | "done"; detail?: string }[];
  created_at: string;
}
