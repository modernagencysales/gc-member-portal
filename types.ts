export interface TranscriptEntry {
  timestamp: string;
  text: string;
}

export interface User {
  id: string;
  email: string;
  name?: string; // Changed: Optional field
  cohort: string;
  status: 'Full Access' | 'Curriculum Only' | 'Lead Magnet';
}

export interface Lesson {
  id: string;
  title: string;
  embedUrl: string;
  cohort?: string;
  description?: string;
  transcript?: TranscriptEntry[];
}

export interface ActionItem {
  id: string;
  text: string;
  cohort?: string;
  assignedTo?: string;
}

export interface Week {
  id: string;
  title: string;
  lessons: Lesson[];
  actionItems: ActionItem[];
}

export interface CourseData {
  title: string;
  weeks: Week[];
  cohort?: string;
}

export interface UserProgress {
  completedItems: string[];
  proofOfWork: Record<string, string>;
  taskNotes: Record<string, string>;
  lastLessonId?: string;
  isSubmitted?: Record<string, boolean>;
}
