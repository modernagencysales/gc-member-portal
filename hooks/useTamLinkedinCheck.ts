import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { createTamJob, fetchTamJobs } from '../services/tam-supabase';

const MAX_POLL_ATTEMPTS = 600; // 3s * 600 = 30 minutes
const MAX_CONSECUTIVE_ERRORS = 10;

interface UseTamLinkedinCheckReturn {
  start: (projectId: string) => Promise<void>;
  progress: number;
  isRunning: boolean;
  isComplete: boolean;
  error: string | null;
}

export function useTamLinkedinCheck(): UseTamLinkedinCheckReturn {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortedRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      abortedRef.current = true;
    };
  }, []);

  const start = useCallback(async (projectId: string) => {
    setIsRunning(true);
    setIsComplete(false);
    setError(null);
    setProgress(0);
    abortedRef.current = false;

    try {
      const job = await createTamJob({
        projectId,
        jobType: 'check_linkedin',
      });

      const { error: invokeError } = await supabase.functions.invoke('tam-run-job', {
        body: { jobId: job.id },
      });

      if (invokeError) {
        throw new Error(`Failed to start LinkedIn check: ${invokeError.message}`);
      }

      // Poll for completion
      await new Promise<void>((resolve, reject) => {
        let attempts = 0;
        let consecutiveErrors = 0;

        const poll = async () => {
          if (abortedRef.current) {
            cleanup();
            reject(new Error('Aborted'));
            return;
          }

          attempts++;
          if (attempts > MAX_POLL_ATTEMPTS) {
            cleanup();
            reject(new Error('LinkedIn check timed out after 30 minutes'));
            return;
          }

          try {
            const jobs = await fetchTamJobs(projectId);
            const current = jobs.find((j) => j.id === job.id);
            if (!current) {
              cleanup();
              reject(new Error('Job not found'));
              return;
            }

            consecutiveErrors = 0;
            setProgress(current.progress);

            if (current.status === 'completed') {
              cleanup();
              setProgress(100);
              resolve();
            } else if (current.status === 'failed') {
              cleanup();
              reject(
                new Error((current.resultSummary?.error as string) || 'LinkedIn check failed')
              );
            }
          } catch {
            consecutiveErrors++;
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              cleanup();
              reject(new Error('Polling failed after too many consecutive errors'));
            }
          }
        };

        const cleanup = () => {
          if (intervalId) {
            clearInterval(intervalId);
            if (pollRef.current === intervalId) pollRef.current = null;
          }
        };

        const intervalId = setInterval(poll, 3000);
        pollRef.current = intervalId;
        poll();
      });

      setIsComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'LinkedIn check failed');
    } finally {
      setIsRunning(false);
    }
  }, []);

  return { start, progress, isRunning, isComplete, error };
}
