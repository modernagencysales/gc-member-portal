import { CourseData, Week, Lesson, User } from '../types';
import { COURSE_DATA as MOCK_DATA } from '../constants';

// Airtable record types for Bootcamp data
interface LessonFields {
  Title?: string;
  'Embed URL'?: string;
  Week?: string;
  Description?: string;
  Cohort?: string;
}

interface ActionItemFields {
  Text?: string;
  Week?: string;
  Cohort?: string;
  'Assigned To'?: string;
}

interface CohortCurriculumFields {
  Cohort?: string;
  Week?: string;
  'Sort Order'?: number;
  'Is Visible'?: boolean;
}

interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime?: string;
}

const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;

const LESSONS_TABLE = 'Lessons';
const ACTION_ITEMS_TABLE = 'Action Items';
const USERS_TABLE = 'Users';
const COHORT_CURRICULUM_TABLE = 'Cohort Curriculum';

function normalizeEmbedUrl(url: string): string {
  if (!url) return '';
  const youtubeRegex =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const match = url.match(youtubeRegex);
  if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}?rel=0`;

  if (url.includes('loom.com')) {
    const uuidMatch = url.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
    if (uuidMatch) return `https://www.loom.com/embed/${uuidMatch[0]}`;
    return url.replace(/\/share\/|\/v\//, '/embed/').split('?')[0];
  }
  return url;
}

/**
 * Validates a user against Airtable.
 * Supports exact email match or matching by the email domain.
 */
export async function verifyUser(email: string): Promise<User | null> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const domain = cleanEmail.split('@')[1];

    // Airtable filter logic:
    // 1. Check if Email field matches exactly
    // 2. OR check if the Email field in Airtable contains JUST the domain (e.g. "@acme.com")
    // 3. OR if you have a dedicated "Domain" field (we'll assume Email field is used for both for flexibility)
    const filter = encodeURIComponent(`OR(
      LOWER({Email}) = '${cleanEmail}',
      LOWER({Email}) = '@${domain}',
      LOWER({Email}) = '${domain}'
    )`);

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${USERS_TABLE}?filterByFormula=${filter}`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      }
    );
    const data = await res.json();

    if (data.records && data.records.length > 0) {
      const record = data.records[0];
      return {
        id: record.id,
        email: cleanEmail, // Use the login email
        name: record.fields['Name'], // Optional
        cohort: record.fields['Cohort'] || 'Global',
        status: record.fields['Status'] || 'Full Access',
      };
    }
    return null;
  } catch (e) {
    console.error('Verification failed', e);
    return null;
  }
}

async function fetchCohortCurriculum(
  cohort: string
): Promise<Map<string, { sortOrder: number; isVisible: boolean }>> {
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(COHORT_CURRICULUM_TABLE)}?view=Grid%20view`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      }
    );

    if (!res.ok) {
      console.warn('Failed to fetch cohort curriculum, using default ordering');
      return new Map();
    }

    const data = await res.json();
    const cohortConfig = new Map<string, { sortOrder: number; isVisible: boolean }>();
    const globalConfig = new Map<string, { sortOrder: number; isVisible: boolean }>();

    for (const record of data.records as AirtableRecord<CohortCurriculumFields>[]) {
      const fields = record.fields;
      if (!fields.Week) continue;

      const config = {
        sortOrder: fields['Sort Order'] ?? 999,
        isVisible: fields['Is Visible'] !== false,
      };

      if (fields.Cohort?.toLowerCase() === cohort.toLowerCase()) {
        cohortConfig.set(fields.Week, config);
      } else if (fields.Cohort === 'Global') {
        globalConfig.set(fields.Week, config);
      }
    }

    // Return cohort-specific if exists, otherwise Global
    return cohortConfig.size > 0 ? cohortConfig : globalConfig;
  } catch (error) {
    console.error('Failed to fetch cohort curriculum', error);
    return new Map();
  }
}

export async function fetchCourseData(
  targetCohort: string,
  userEmail: string
): Promise<CourseData> {
  try {
    const [lessonsRes, actionsRes] = await Promise.all([
      fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(LESSONS_TABLE)}?view=Grid%20view`,
        {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
        }
      ),
      fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(ACTION_ITEMS_TABLE)}?view=Grid%20view`,
        {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
        }
      ),
    ]);

    const lessonsData = lessonsRes.ok ? await lessonsRes.json() : { records: [] };
    const actionItemsData = actionsRes.ok ? await actionsRes.json() : { records: [] };

    const weeksMap = new Map<string, Week>();

    const isVisible = (recordCohort?: string, assignedTo?: string) => {
      if (assignedTo && assignedTo.toLowerCase() === userEmail.toLowerCase()) return true;
      if (assignedTo && assignedTo.toLowerCase() !== userEmail.toLowerCase()) return false;
      if (!targetCohort || targetCohort === 'Global') return true;
      if (!recordCohort || recordCohort === 'Global') return true;
      return recordCohort.toLowerCase() === targetCohort.toLowerCase();
    };

    lessonsData.records.forEach((record: AirtableRecord<LessonFields>) => {
      const fields = record.fields;
      if (!fields['Title'] || !fields['Embed URL']) return;
      if (!isVisible(fields['Cohort'])) return;

      const weekName = fields['Week'] || 'Uncategorized';
      const lesson: Lesson = {
        id: record.id,
        title: fields['Title'],
        embedUrl: normalizeEmbedUrl(fields['Embed URL']),
        description: fields['Description'] || '',
        cohort: fields['Cohort'],
        transcript: [],
      };
      if (!weeksMap.has(weekName)) {
        weeksMap.set(weekName, {
          id: weekName.toLowerCase().replace(/\s+/g, '-'),
          title: weekName,
          lessons: [],
          actionItems: [],
        });
      }
      weeksMap.get(weekName)!.lessons.push(lesson);
    });

    actionItemsData.records.forEach((record: AirtableRecord<ActionItemFields>) => {
      const fields = record.fields;
      if (!fields['Text']) return;
      if (!isVisible(fields['Cohort'], fields['Assigned To'])) return;

      const weekName = fields['Week'] || 'Uncategorized';
      if (!weeksMap.has(weekName)) {
        weeksMap.set(weekName, {
          id: weekName.toLowerCase().replace(/\s+/g, '-'),
          title: weekName,
          lessons: [],
          actionItems: [],
        });
      }
      weeksMap.get(weekName)!.actionItems.push({
        id: record.id,
        text: fields['Text'],
        cohort: fields['Cohort'],
        assignedTo: fields['Assigned To'],
      });
    });

    // Fetch cohort curriculum config for ordering and visibility
    const curriculumConfig = await fetchCohortCurriculum(targetCohort);

    const weeks = Array.from(weeksMap.values())
      .filter((week) => {
        const config = curriculumConfig.get(week.title);
        // If no config, show by default; if config exists, check isVisible
        return !config || config.isVisible;
      })
      .sort((a, b) => {
        const configA = curriculumConfig.get(a.title);
        const configB = curriculumConfig.get(b.title);
        const orderA = configA?.sortOrder ?? 999;
        const orderB = configB?.sortOrder ?? 999;
        // If same sort order, fall back to alphabetical
        if (orderA === orderB) {
          return a.title.localeCompare(b.title);
        }
        return orderA - orderB;
      });

    return {
      title: 'Modern Agency Sales',
      weeks,
      cohort: targetCohort,
    };
  } catch (error) {
    console.error('Fetch failed', error);
    return MOCK_DATA;
  }
}
