/** DFY Content Review types. Client-facing content approval/revision flow. Never imports React or component-layer code. */

// ─── Status & Type Unions ─────────────────────────────────

export type ContentItemStatus = 'review' | 'approved' | 'revision_requested' | 'revision_ready';

export type ContentType = 'lead_magnet_post' | 'content_post';

// ─── DB-Backed Interfaces ─────────────────────────────────

export interface DfyContentItem {
  id: string;
  engagement_id: string;
  title: string;
  content: string;
  content_type: ContentType;
  sort_order: number;
  status: ContentItemStatus;
  feedback: string | null;
  approved_at: string | null;
  revision_count: number;
  created_at: string;
  updated_at: string;
}

// ─── Display Helpers ──────────────────────────────────────

export interface ContentAuthor {
  name: string;
  headline: string;
  avatarUrl: string | null;
}

// ─── Mutation Inputs ──────────────────────────────────────

export interface ContentItemApproveInput {
  status: 'approved';
  approved_at: string;
}

export interface ContentItemRevisionInput {
  status: 'revision_requested';
  feedback: string;
  revision_count: number;
}

// ─── Revision History ────────────────────────────────────

export type RevisionAuthor = 'original' | 'ai' | 'human';

export interface DfyContentRevision {
  id: string;
  content_item_id: string;
  engagement_id: string;
  round: number;
  content: string;
  feedback: string | null;
  author: RevisionAuthor;
  created_at: string;
}
