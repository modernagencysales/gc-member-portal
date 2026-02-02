import { supabase } from '../lib/supabaseClient';

/**
 * ICP Generation result structure
 */
export interface ICPSuggestion {
  targetDescription?: string;
  verticals?: string;
  companySize?: string;
  jobTitles?: string;
  geography?: string;
  painPoints?: string;
  offer?: string;
  differentiator?: string;
  socialProof?: string;
  commonObjections?: string;
}

/**
 * Uses Claude (via Supabase edge function) to generate ICP suggestions
 */
export async function generateICPSuggestions(
  companyName: string,
  website?: string,
  existingData?: Partial<ICPSuggestion>
): Promise<ICPSuggestion> {
  const { data, error } = await supabase.functions.invoke('generate-icp', {
    body: { companyName, website, existingData },
  });

  if (error) {
    console.error('ICP Generation Failed:', error);
    throw new Error('Unable to generate ICP suggestions. Please try again.');
  }

  return {
    targetDescription: data.targetDescription || '',
    verticals: data.verticals || '',
    companySize: data.companySize || '',
    jobTitles: data.jobTitles || '',
    geography: data.geography || '',
    painPoints: data.painPoints || '',
    offer: data.offer || '',
    differentiator: data.differentiator || '',
    socialProof: data.socialProof || '',
    commonObjections: data.commonObjections || '',
  };
}

/**
 * Returns a hardcoded transcript for the demo video,
 * or a placeholder for any other video.
 */
export async function getYouTubeTranscript(
  videoId: string,
  videoTitle: string = 'Video Lesson'
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (videoId === 'aqz-KE-bpKQ') {
    return `
      Welcome everyone to the LinkedIn Bootcamp. I'm so excited to have you all here.
      In this course, we are going to dive deep into automation using Clay.
      First, we'll start with the fundamentals. It's crucial you understand how to set up your sources.
      A lot of people jump straight to enrichment, but if your data source isn't clean, your results won't be either.
      We will be using webhooks extensively. This allows us to trigger workflows from other apps.
      Make sure you have your Clay account set up by the end of this week.
      Also, the community is your biggest asset. Please join the Slack channel.
      The link is in the dashboard. Introduce yourself, find a study buddy.
      We've seen that students who engage in the community are 3x more likely to complete the course.
      For this week's homework, you need to configure your first webhook source and pass the quiz.
      Don't worry if it feels overwhelming at first. The interface can be dense.
      Just focus on the navigation lesson we provided.
      Next week, we'll get into the fun stuff: OpenAI integration and writing AI prompts to personalize messages.
      But for now, get those foundations solid.
      If you have issues, post in the #help-desk channel on Slack.
      Let's get started!
    `;
  }

  return `
    In this video lesson titled "${videoTitle}", the instructor covers the core concepts of the topic.
    They demonstrate how to configure the necessary tools and discuss best practices for implementation.
    Please watch the video to understand the full workflow and specific settings required.
  `;
}

/**
 * Returns a placeholder summary (transcript summarization removed with Gemini).
 */
export async function summarizeLesson(
  lessonTitle: string,
  _transcriptText: string
): Promise<string> {
  return `**Summary for "${lessonTitle}"**\n\nPlease watch the video for a complete overview of this lesson's content.`;
}
