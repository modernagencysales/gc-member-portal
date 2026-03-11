/**
 * Cold Email Recipes Supabase Service. Manages bootcamp cold-email recipes, contact lists,
 * and enrichment status for student outreach campaigns.
 * Constraint: Never imports React components or UI elements.
 */

import { supabase } from '../lib/supabaseClient';
import type {
  BootcampRecipe,
  BootcampContactList,
  BootcampContact,
  RecipeStep,
  EmailTemplate,
  EnrichmentStatus,
} from '../types/cold-email-recipe-types';

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapRecipe(data: Record<string, unknown>): BootcampRecipe {
  return {
    id: data.id as string,
    studentId: data.student_id as string,
    name: data.name as string,
    slug: data.slug as string,
    description: (data.description as string) || '',
    steps: (data.steps as RecipeStep[]) || [],
    emailTemplate: (data.email_template as EmailTemplate) || null,
    isActive: data.is_active as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapContactList(data: Record<string, unknown>): BootcampContactList {
  return {
    id: data.id as string,
    studentId: data.student_id as string,
    name: data.name as string,
    contactCount: data.contact_count as number,
    columnMapping: (data.column_mapping as Record<string, string>) || {},
    createdAt: data.created_at as string,
  };
}

function mapContact(data: Record<string, unknown>): BootcampContact {
  return {
    id: data.id as string,
    listId: data.list_id as string,
    studentId: data.student_id as string,
    firstName: (data.first_name as string) || '',
    lastName: (data.last_name as string) || '',
    email: (data.email as string) || '',
    company: (data.company as string) || '',
    title: (data.title as string) || '',
    linkedinUrl: (data.linkedin_url as string) || '',
    customFields: (data.custom_fields as Record<string, string>) || {},
    stepOutputs: (data.step_outputs as Record<string, string>) || {},
    enrichmentStatus: (data.enrichment_status as EnrichmentStatus) || 'pending',
    createdAt: data.created_at as string,
  };
}

// ─── Column Selects ──────────────────────────────────────────────────────────

const RECIPE_COLUMNS =
  'id, student_id, name, slug, description, steps, email_template, is_active, created_at, updated_at';
const CONTACT_LIST_COLUMNS = 'id, student_id, name, contact_count, column_mapping, created_at';
const CONTACT_COLUMNS =
  'id, list_id, student_id, first_name, last_name, email, company, title, linkedin_url, custom_fields, step_outputs, enrichment_status, created_at';

// ─── Recipes ─────────────────────────────────────────────────────────────────

export async function fetchRecipes(studentId: string): Promise<BootcampRecipe[]> {
  const { data, error } = await supabase
    .from('bootcamp_recipes')
    .select(RECIPE_COLUMNS)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapRecipe);
}

export async function fetchRecipeById(recipeId: string): Promise<BootcampRecipe | null> {
  const { data, error } = await supabase
    .from('bootcamp_recipes')
    .select(RECIPE_COLUMNS)
    .eq('id', recipeId)
    .single();

  if (error || !data) return null;
  return mapRecipe(data);
}

export async function createRecipe(input: {
  studentId: string;
  name: string;
  slug: string;
  description: string;
  steps: RecipeStep[];
  emailTemplate: EmailTemplate | null;
}): Promise<BootcampRecipe> {
  const { data, error } = await supabase
    .from('bootcamp_recipes')
    .insert({
      student_id: input.studentId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      steps: input.steps,
      email_template: input.emailTemplate,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRecipe(data);
}

export async function updateRecipe(
  recipeId: string,
  updates: {
    name?: string;
    slug?: string;
    description?: string;
    steps?: RecipeStep[];
    emailTemplate?: EmailTemplate | null;
    isActive?: boolean;
  }
): Promise<BootcampRecipe> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.slug !== undefined) payload.slug = updates.slug;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.steps !== undefined) payload.steps = updates.steps;
  if (updates.emailTemplate !== undefined) payload.email_template = updates.emailTemplate;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;

  const { data, error } = await supabase
    .from('bootcamp_recipes')
    .update(payload)
    .eq('id', recipeId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRecipe(data);
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  const { error } = await supabase.from('bootcamp_recipes').delete().eq('id', recipeId);
  if (error) throw new Error(error.message);
}

// ─── Contact Lists ───────────────────────────────────────────────────────────

export async function fetchContactLists(studentId: string): Promise<BootcampContactList[]> {
  const { data, error } = await supabase
    .from('bootcamp_contact_lists')
    .select(CONTACT_LIST_COLUMNS)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapContactList);
}

export async function createContactList(input: {
  studentId: string;
  name: string;
  columnMapping: Record<string, string>;
}): Promise<BootcampContactList> {
  const { data, error } = await supabase
    .from('bootcamp_contact_lists')
    .insert({
      student_id: input.studentId,
      name: input.name,
      column_mapping: input.columnMapping,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapContactList(data);
}

export async function deleteContactList(listId: string): Promise<void> {
  const { error } = await supabase.from('bootcamp_contact_lists').delete().eq('id', listId);
  if (error) throw new Error(error.message);
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export async function fetchContacts(
  listId: string,
  limit = 100,
  offset = 0
): Promise<{ contacts: BootcampContact[]; total: number }> {
  const { data, error, count } = await supabase
    .from('bootcamp_contacts')
    .select(CONTACT_COLUMNS, { count: 'exact' })
    .eq('list_id', listId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return { contacts: (data || []).map(mapContact), total: count || 0 };
}

export async function insertContacts(
  contacts: Array<{
    listId: string;
    studentId: string;
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    title: string;
    linkedinUrl: string;
    customFields: Record<string, string>;
  }>
): Promise<void> {
  const rows = contacts.map((c) => ({
    list_id: c.listId,
    student_id: c.studentId,
    first_name: c.firstName,
    last_name: c.lastName,
    email: c.email,
    company: c.company,
    title: c.title,
    linkedin_url: c.linkedinUrl,
    custom_fields: c.customFields,
  }));

  const { error } = await supabase.from('bootcamp_contacts').insert(rows);
  if (error) throw new Error(error.message);
}

export async function updateContactListCount(listId: string): Promise<void> {
  const { count } = await supabase
    .from('bootcamp_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('list_id', listId);

  await supabase
    .from('bootcamp_contact_lists')
    .update({ contact_count: count || 0 })
    .eq('id', listId);
}

export async function updateContactEnrichment(
  contactId: string,
  stepOutputs: Record<string, string>,
  status: EnrichmentStatus
): Promise<void> {
  const { error } = await supabase
    .from('bootcamp_contacts')
    .update({ step_outputs: stepOutputs, enrichment_status: status })
    .eq('id', contactId);

  if (error) throw new Error(error.message);
}

export async function resetContactEnrichment(listId: string): Promise<void> {
  const { error } = await supabase
    .from('bootcamp_contacts')
    .update({ step_outputs: {}, enrichment_status: 'pending' })
    .eq('list_id', listId);

  if (error) throw new Error(error.message);
}

// ─── Edge Functions ──────────────────────────────────────────────────────────

interface RecipeStepContact {
  id: string;
  fields: Record<string, string>;
}

export async function invokeRunRecipeSteps(contacts: RecipeStepContact[], steps: RecipeStep[]) {
  return supabase.functions.invoke('run-recipe-steps', {
    body: { contacts, steps },
  });
}
