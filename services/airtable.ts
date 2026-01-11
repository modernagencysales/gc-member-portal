import { CourseData, Week, Lesson, ActionItem, User } from '../types';
import { COURSE_DATA as MOCK_DATA } from '../constants';

const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;

const LESSONS_TABLE = 'Lessons';
const ACTION_ITEMS_TABLE = 'Action Items';
const USERS_TABLE = 'Users';

function normalizeEmbedUrl(url: string): string {
  if (!url) return '';
  const youtubeRegex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
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

    lessonsData.records.forEach((record: any) => {
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

    actionItemsData.records.forEach((record: any) => {
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

    const weeks = Array.from(weeksMap.values()).sort((a, b) => a.title.localeCompare(b.title));
    return {
      title: 'GTM OS',
      weeks,
      cohort: targetCohort,
    };
  } catch (error) {
    console.error('Fetch failed', error);
    return MOCK_DATA;
  }
}
