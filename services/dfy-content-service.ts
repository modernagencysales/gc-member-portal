/** DFY content item service. Reads/writes content items for client review. Never imports React, component-layer code, or NextRequest/NextResponse. */

import { supabase } from '../lib/supabaseClient';
import { logError } from '../lib/logError';

import type {
  DfyContentItem,
  DfyContentRevision,
  RevisionAuthor,
} from '../types/dfy-content-types';

// ─── Column Constants ─────────────────────────────────────

const CONTENT_ITEM_COLUMNS =
  'id, engagement_id, title, content, content_type, sort_order, status, feedback, approved_at, revision_count, created_at, updated_at';

const REVISION_COLUMNS =
  'id, content_item_id, engagement_id, round, content, feedback, author, created_at';

// ─── Update Whitelists ───────────────────────────────────

const APPROVE_ALLOWED_FIELDS: readonly string[] = ['status', 'approved_at'] as const;

const REVISION_ALLOWED_FIELDS: readonly string[] = [
  'status',
  'feedback',
  'revision_count',
] as const;

const CONTENT_UPDATE_ALLOWED_FIELDS: readonly string[] = ['content'] as const;

/** Filters an update object to only include whitelisted keys. */
function filterFields(
  input: Record<string, unknown>,
  whitelist: readonly string[]
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const key of whitelist) {
    if (key in input) {
      filtered[key] = input[key];
    }
  }
  return filtered;
}

// ─── Reads ────────────────────────────────────────────────

/**
 * Fetches all content items for an engagement, ordered by sort_order ascending.
 * Returns [] on error or when no items found.
 */
export async function getContentItems(engagementId: string): Promise<DfyContentItem[]> {
  const { data, error } = await supabase
    .from('dfy_content_items')
    .select(CONTENT_ITEM_COLUMNS)
    .eq('engagement_id', engagementId)
    .order('sort_order', { ascending: true });

  if (error) {
    logError('getContentItems', error, { engagementId });
    return [];
  }

  return (data as DfyContentItem[]) ?? [];
}

// ─── Revision History ─────────────────────────────────────

/**
 * Fetches all revisions for a content item, ordered by round ascending.
 * Returns [] on error or when no revisions found.
 */
export async function getRevisionHistory(contentItemId: string): Promise<DfyContentRevision[]> {
  const { data, error } = await supabase
    .from('dfy_content_revisions')
    .select(REVISION_COLUMNS)
    .eq('content_item_id', contentItemId)
    .order('round', { ascending: true });

  if (error) {
    logError('getRevisionHistory', error, { contentItemId });
    return [];
  }
  return (data as DfyContentRevision[]) ?? [];
}

/**
 * Returns the highest revision round number for a content item.
 * Returns 0 if no revisions exist or on error.
 */
async function getLatestRevisionRound(contentItemId: string): Promise<number> {
  const { data, error } = await supabase
    .from('dfy_content_revisions')
    .select('round')
    .eq('content_item_id', contentItemId)
    .order('round', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return 0;
  return (data as { round: number }).round;
}

// ─── Helpers ──────────────────────────────────────────────

interface InsertRevisionInput {
  content_item_id: string;
  engagement_id: string;
  round: number;
  content: string;
  feedback: string | null;
  author: RevisionAuthor;
}

async function insertRevision(input: InsertRevisionInput): Promise<DfyContentRevision> {
  const { data, error } = await supabase
    .from('dfy_content_revisions')
    .insert(input)
    .select(REVISION_COLUMNS)
    .single();

  if (error || !data) {
    logError('insertRevision', error ?? new Error('No data returned'), { input });
    throw Object.assign(new Error('Failed to insert revision'), { statusCode: 500 });
  }
  return data as DfyContentRevision;
}

// ─── Writes ───────────────────────────────────────────────

/**
 * Updates content item text and records a human revision.
 * Backfills round 1 (original) if no revision history exists.
 * Throws with statusCode on error.
 */
export async function adminUpdateContent(
  itemId: string,
  engagementId: string,
  newContent: string
): Promise<void> {
  const trimmed = newContent.trim();
  if (!trimmed) {
    throw Object.assign(new Error('Content cannot be empty'), { statusCode: 400 });
  }

  // Get current content for backfill
  const { data: current, error: fetchError } = await supabase
    .from('dfy_content_items')
    .select('id, content')
    .eq('id', itemId)
    .eq('engagement_id', engagementId)
    .single();

  if (fetchError || !current) {
    logError('adminUpdateContent:fetch', fetchError ?? new Error('Not found'), { itemId });
    throw Object.assign(new Error('Content item not found'), { statusCode: 404 });
  }

  const currentContent = (current as { content: string }).content;

  // Skip if content unchanged
  if (currentContent === trimmed) return;

  // Get latest round
  const latestRound = await getLatestRevisionRound(itemId);

  // Backfill round 1 if no revisions exist
  if (latestRound === 0) {
    await insertRevision({
      content_item_id: itemId,
      engagement_id: engagementId,
      round: 1,
      content: currentContent,
      feedback: null,
      author: 'original',
    });
  }

  const nextRound = latestRound === 0 ? 2 : latestRound + 1;

  // Insert human revision
  await insertRevision({
    content_item_id: itemId,
    engagement_id: engagementId,
    round: nextRound,
    content: trimmed,
    feedback: 'Admin edit',
    author: 'human',
  });

  // Update content on the item
  const updates = filterFields({ content: trimmed }, CONTENT_UPDATE_ALLOWED_FIELDS);
  const { error: updateError } = await supabase
    .from('dfy_content_items')
    .update(updates)
    .eq('id', itemId)
    .eq('engagement_id', engagementId);

  if (updateError) {
    logError('adminUpdateContent:update', updateError, { itemId });
    throw Object.assign(new Error('Failed to update content'), { statusCode: 500 });
  }
}

/**
 * Approves a single content item. Sets status='approved' and approved_at=now().
 * Throws with statusCode on error.
 */
export async function approveContentItem(itemId: string, engagementId: string): Promise<void> {
  const rawUpdate = {
    status: 'approved' as const,
    approved_at: new Date().toISOString(),
  };

  const updates = filterFields(rawUpdate, APPROVE_ALLOWED_FIELDS);

  const { error } = await supabase
    .from('dfy_content_items')
    .update(updates)
    .eq('id', itemId)
    .eq('engagement_id', engagementId);

  if (error) {
    logError('approveContentItem', error, { itemId, engagementId });
    throw Object.assign(new Error('Failed to approve content item'), { statusCode: 500 });
  }
}

/**
 * Bulk-approves all content items with status='review' for an engagement.
 * Returns the count of updated items. Returns 0 on error.
 */
export async function bulkApproveContentItems(engagementId: string): Promise<number> {
  const rawUpdate = {
    status: 'approved' as const,
    approved_at: new Date().toISOString(),
  };

  const updates = filterFields(rawUpdate, APPROVE_ALLOWED_FIELDS);

  const { data, error } = await supabase
    .from('dfy_content_items')
    .update(updates)
    .eq('engagement_id', engagementId)
    .eq('status', 'review')
    .select('id');

  if (error) {
    logError('bulkApproveContentItems', error, { engagementId });
    return 0;
  }

  return data?.length ?? 0;
}
