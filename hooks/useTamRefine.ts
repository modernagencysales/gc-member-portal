import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { createTamJob, fetchTamJobs } from '../services/tam-supabase';
import { TamJob } from '../types/tam-types';

interface UseTamRefineReturn {
  startRefine: (projectId: string) => Promise<void>;
  isRefining: boolean;
  progress: number;
  result: Record<string, unknown> | null;
  error: string | null;
}

const MAX_POLL_ATTEMPTS = 200; // 3s * 200 = 10 minutes
const MAX_CONSECUTIVE_ERRORS = 10;

export function useTamRefine(): UseTamRefineReturn {
  const [isRefining, setIsRefining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortedRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      abortedRef.current = true;
    };
  }, []);

  const waitForCompletion = useCallback((projectId: string, jobId: string): Promise<TamJob> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      let consecutiveErrors = 0;

      const cleanup = () => {
        if (intervalId) {
          clearInterval(intervalId);
          if (pollRef.current === intervalId) pollRef.current = null;
        }
      };

      const poll = async () => {
        if (abortedRef.current) {
          cleanup();
          reject(new Error('Refine aborted'));
          return;
        }

        attempts++;
        if (attempts > MAX_POLL_ATTEMPTS) {
          cleanup();
          reject(new Error('Refine timed out after 10 minutes'));
          return;
        }

        try {
          const jobs = await fetchTamJobs(projectId);
          const job = jobs.find((j) => j.id === jobId);
          if (!job) {
            cleanup();
            reject(new Error(`Refine job ${jobId} not found`));
            return;
          }

          consecutiveErrors = 0;
          setProgress(job.progress);

          if (job.status === 'completed') {
            cleanup();
            setResult(job.resultSummary);
            resolve(job);
          } else if (job.status === 'failed') {
            cleanup();
            reject(new Error((job.resultSummary?.error as string) || 'Refine job failed'));
          }
        } catch {
          consecutiveErrors++;
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            cleanup();
            reject(new Error('Refine polling failed after multiple errors'));
          }
        }
      };

      const intervalId = setInterval(poll, 3000);
      pollRef.current = intervalId;
      poll();
    });
  }, []);

  const startRefine = useCallback(
    async (projectId: string) => {
      setIsRefining(true);
      setProgress(0);
      setResult(null);
      setError(null);
      abortedRef.current = false;

      try {
        const job = await createTamJob({
          projectId,
          jobType: 'refine_discolike',
        });

        // Fire-and-forget — don't await the edge function response
        supabase.functions.invoke('tam-run-job', {
          body: { jobId: job.id },
        });

        // Poll for completion
        await waitForCompletion(projectId, job.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Refine failed');
      } finally {
        setIsRefining(false);
      }
    },
    [waitForCompletion]
  );

  return { startRefine, isRefining, progress, result, error };
}
