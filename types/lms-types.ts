/**
 * LMS (Learning Management System) Types
 * Supports cohort-independent curriculum management
 */

// ============================================
// Enums and Constants
// ============================================

export type LmsCohortStatus = 'Active' | 'Archived' | 'Draft';

export type LmsContentType =
  | 'video' // Grain, YouTube, Loom, Vimeo, etc.
  | 'slide_deck' // Gamma presentations
  | 'guide' // Guidde tutorials
  | 'clay_table' // Clay shared tables
  | 'ai_tool' // Reference to AI tool slug
  | 'text' // Plain text/markdown content
  | 'external_link' // Link to external resource
  | 'credentials'; // Login credentials with copy buttons

export const LMS_CONTENT_TYPE_LABELS: Record<LmsContentType, string> = {
  video: 'Video',
  slide_deck: 'Slide Deck',
  guide: 'Interactive Guide',
  clay_table: 'Clay Table',
  ai_tool: 'AI Tool',
  text: 'Text/Notes',
  external_link: 'External Link',
  credentials: 'Credentials',
};

// ============================================
// Core Types
// ============================================

export interface CohortOnboardingConfig {
  enabled: boolean;
  welcomeVideoUrl?: string;
  welcomeMessage?: string;
  surveyEnabled?: boolean;
  surveyQuestions?: string[];
  calcomEnabled?: boolean;
  calcomBookingUrl?: string;
  calcomQualifyField?: string;
  calcomQualifyValues?: string[];
  steps: string[];
}

export interface LmsCohort {
  id: string;
  name: string;
  description?: string;
  status: LmsCohortStatus;
  startDate?: Date;
  endDate?: Date;
  sidebarLabel?: string;
  icon?: string;
  sortOrder: number;
  productType?: string;
  thrivecartProductId?: string;
  onboardingConfig?: CohortOnboardingConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface LmsWeek {
  id: string;
  cohortId: string;
  title: string;
  description?: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LmsLesson {
  id: string;
  weekId: string;
  title: string;
  description?: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LmsCredentialsData {
  loginUrl?: string;
  username?: string;
  password?: string;
  notes?: string;
}

export interface LmsContentItem {
  id: string;
  lessonId: string;
  title: string;
  contentType: LmsContentType;
  embedUrl?: string;
  aiToolSlug?: string;
  contentText?: string;
  credentialsData?: LmsCredentialsData;
  description?: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LmsActionItem {
  id: string;
  weekId: string;
  text: string;
  description?: string;
  videoUrl?: string;
  sortOrder: number;
  assignedToEmail?: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Progress Types
// ============================================

export interface LmsLessonProgress {
  id: string;
  studentId: string;
  lessonId: string;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
}

export interface LmsActionItemProgress {
  id: string;
  studentId: string;
  actionItemId: string;
  completedAt?: Date;
  proofOfWork?: string;
  notes?: string;
  createdAt: Date;
}

// ============================================
// Aggregate/View Types for UI
// ============================================

export interface LmsWeekWithLessons extends LmsWeek {
  lessons: LmsLessonWithContent[];
  actionItems: LmsActionItem[];
}

export interface LmsLessonWithContent extends LmsLesson {
  contentItems: LmsContentItem[];
}

export interface LmsCohortWithWeeks extends LmsCohort {
  weeks: LmsWeekWithLessons[];
}

export interface LmsCurriculumData {
  cohort: LmsCohort;
  weeks: LmsWeekWithLessons[];
}

// For student view with progress
export interface LmsWeekWithProgress extends LmsWeekWithLessons {
  completedLessonsCount: number;
  completedActionItemsCount: number;
}

export interface LmsLessonWithProgress extends LmsLessonWithContent {
  isCompleted: boolean;
  completedAt?: Date;
}

export interface LmsActionItemWithProgress extends LmsActionItem {
  isCompleted: boolean;
  completedAt?: Date;
  proofOfWork?: string;
}

// ============================================
// Admin Form Types
// ============================================

export interface LmsCohortFormData {
  name: string;
  description?: string;
  status: LmsCohortStatus;
  startDate?: string;
  endDate?: string;
  sidebarLabel?: string;
  icon?: string;
  sortOrder?: number;
  productType?: string;
  thrivecartProductId?: string;
  onboardingConfig?: CohortOnboardingConfig;
}

export interface LmsWeekFormData {
  cohortId: string;
  title: string;
  description?: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface LmsLessonFormData {
  weekId: string;
  title: string;
  description?: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface LmsContentItemFormData {
  lessonId: string;
  title: string;
  contentType: LmsContentType;
  embedUrl?: string;
  aiToolSlug?: string;
  contentText?: string;
  credentialsData?: LmsCredentialsData;
  description?: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface LmsActionItemFormData {
  weekId: string;
  text: string;
  description?: string;
  videoUrl?: string;
  sortOrder: number;
  assignedToEmail?: string;
  isVisible: boolean;
}

// ============================================
// Cohort Duplication
// ============================================

export interface LmsCohortDuplicateRequest {
  sourceCohortId: string;
  newCohortName: string;
  newCohortDescription?: string;
}

// ============================================
// Content Type Detection Helpers
// ============================================

export function detectContentType(url: string): LmsContentType {
  if (!url) return 'text';

  const lowerUrl = url.toLowerCase();

  // AI Tool reference
  if (url.startsWith('ai-tool:')) return 'ai_tool';

  // Text content
  if (url.startsWith('text:')) return 'text';

  // Video platforms
  if (
    lowerUrl.includes('youtube.com') ||
    lowerUrl.includes('youtu.be') ||
    lowerUrl.includes('loom.com') ||
    lowerUrl.includes('grain.com') ||
    lowerUrl.includes('grain.co') ||
    lowerUrl.includes('vimeo.com')
  ) {
    return 'video';
  }

  // Slide decks
  if (lowerUrl.includes('gamma.app')) return 'slide_deck';

  // Interactive guides
  if (lowerUrl.includes('guidde.com')) return 'guide';

  // Clay tables
  if (lowerUrl.includes('clay.com')) return 'clay_table';

  // Default to external link
  return 'external_link';
}

export function extractAiToolSlug(url: string): string | undefined {
  if (url.startsWith('ai-tool:')) {
    return url.replace('ai-tool:', '').trim();
  }
  return undefined;
}

export function extractTextContent(url: string): string | undefined {
  if (url.startsWith('text:')) {
    return url.replace('text:', '').trim();
  }
  return undefined;
}

export function parseCredentialsFromText(text: string): LmsCredentialsData | undefined {
  // Parse text content that contains credentials
  // Format: "url: https://...\nemail: user@...\npassword: ..."
  const lines = text.split('\n').map((l) => l.trim());
  const data: LmsCredentialsData = {};

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).toLowerCase().trim();
    const value = line.slice(colonIndex + 1).trim();

    if (key.includes('url') || key.includes('login') || key.includes('link')) {
      data.loginUrl = value;
    } else if (key.includes('email') || key.includes('user')) {
      data.username = value;
    } else if (key.includes('pass')) {
      data.password = value;
    }
  }

  // Only return if we found at least one credential field
  if (data.loginUrl || data.username || data.password) {
    return data;
  }
  return undefined;
}

// ============================================
// URL Normalization Helpers
// ============================================

export function normalizeEmbedUrl(url: string): string {
  if (!url) return '';

  // YouTube normalization
  const youtubeRegex =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch && youtubeMatch[1]) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0`;
  }

  // Loom normalization
  if (url.includes('loom.com')) {
    const uuidMatch = url.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
    if (uuidMatch) {
      return `https://www.loom.com/embed/${uuidMatch[0]}`;
    }
    return url.replace(/\/share\/|\/v\//, '/embed/').split('?')[0];
  }

  // Gamma normalization - ensure it's an embed URL
  if (url.includes('gamma.app') && !url.includes('/embed/')) {
    // Extract the ID from various gamma URL formats
    const gammaMatch = url.match(/gamma\.app\/(?:docs\/[^/]+|embed)\/([a-zA-Z0-9]+)/);
    if (gammaMatch) {
      return `https://gamma.app/embed/${gammaMatch[1]}`;
    }
  }

  return url;
}
