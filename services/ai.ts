import { GoogleGenAI } from '@google/genai';

// Initialize Gemini Client
// Always use a named parameter and obtain API key directly from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Simulates fetching a transcript from YouTube.
 *
 * Since we cannot fetch actual YouTube captions client-side without a backend proxy,
 * this function uses a hybrid approach for the demo:
 * 1. Returns a hardcoded transcript for the specific demo video.
 * 2. Uses GenAI to "hallucinate" a realistic transcript for any other video title.
 *    This ensures the "Summarize" feature works impressively for ANY video in the prototype.
 */
export async function getYouTubeTranscript(
  videoId: string,
  videoTitle: string = 'Video Lesson'
): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // 1. Hardcoded Mock for the specific Demo Video (Course Kickoff)
  // ID from constants.ts: aqz-KE-bpKQ
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

  // 2. AI-Generated Transcript for all other videos
  // This allows the demo to feel "real" for any video the user clicks on.
  try {
    if (!process.env.API_KEY) throw new Error('No API Key');

    // Use gemini-3-flash-preview for basic text tasks
    const model = 'gemini-3-flash-preview';
    const prompt = `
      Act as a transcript generator.
      Generate a realistic, spoken-word transcript for an educational video titled "${videoTitle}".
      The context is a professional course about LinkedIn Automation, Sales, and Data Enrichment.
      The transcript should be about 300-400 words.
      Include:
      - An enthusiastic introduction.
      - 3 main teaching points relevant to the title "${videoTitle}".
      - A summary conclusion.
      Do not include timestamps or speaker labels, just the raw spoken text.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    // Access the .text property directly
    return response.text || `[Transcript auto-generation failed for: ${videoTitle}]`;
  } catch (error) {
    console.warn('Mock transcript generation failed:', error);
    return `
      In this video lesson titled "${videoTitle}", the instructor covers the core concepts of the topic.
      They demonstrate how to configure the necessary tools and discuss best practices for implementation.
      Please watch the video to understand the full workflow and specific settings required.
    `;
  }
}

/**
 * Uses Gemini to summarize the transcript.
 */
export async function summarizeLesson(
  lessonTitle: string,
  transcriptText: string
): Promise<string> {
  try {
    if (!process.env.API_KEY) {
      throw new Error('API_KEY not configured');
    }

    // Use gemini-3-flash-preview for basic text tasks
    const model = 'gemini-3-flash-preview';
    const prompt = `
      You are an expert educational assistant. 
      Analyze the following video transcript for the lesson titled "${lessonTitle}".
      
      Please provide:
      1. A 2-sentence executive summary of the content.
      2. A list of 3-5 key takeaways or action items.
      
      Format the output with Markdown. Use bolding for emphasis.
      
      Transcript:
      ${transcriptText}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    // Use the .text property directly (do not call as a method)
    return response.text || 'Could not generate summary.';
  } catch (error) {
    console.error('Gemini Summarization Failed:', error);
    return 'Unable to generate summary at this time. Please ensure the API Key is configured correctly.';
  }
}
