import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchBatchRun, triggerBatchEnrichment } from '../services/enrichment-batch-supabase';

const MAX_POLL_ATTEMPTS = 600; // 3s * 600 = 30 minutes
const MAX_CONSECUTIVE_ERRORS = 10;

export interface EnrichmentStats {
  totalContacts: number;
  processedContacts: number;
  emailsFound: number;
}

interface UseEmailEnrichmentReturn {
  start: (runId: string) => Promise<void>;
  progress: number;
  isRunning: boolean;
  isComplete: boolean;
  error: string | null;
  stats: EnrichmentStats;
}

export function useEmailEnrichment(): UseEmailEnrichmentReturn {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<EnrichmentStats>({
    totalContacts: 0,
    processedContacts: 0,
    emailsFound: 0,
  });
  const abortedRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      abortedRef.current = true;
    };
  }, []);

  const start = useCallback(async (runId: string) => {
    setIsRunning(true);
    setIsComplete(false);
    setError(null);
    setProgress(0);
    setStats({ totalContacts: 0, processedContacts: 0, emailsFound: 0 });
    abortedRef.current = false;

    try {
      await triggerBatchEnrichment(runId);

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
            reject(new Error('Enrichment timed out after 30 minutes'));
            return;
          }

          try {
            const run = await fetchBatchRun(runId);
            if (!run) {
              cleanup();
              reject(new Error('Run not found'));
              return;
            }

            consecutiveErrors = 0;

            const total = run.totalContacts || 1;
            const pct = Math.round((run.processedContacts / total) * 100);
            setProgress(pct);
            setStats({
              totalContacts: run.totalContacts,
              processedContacts: run.processedContacts,
              emailsFound: run.emailsFound,
            });

            if (run.status === 'completed') {
              cleanup();
              setProgress(100);
              resolve();
            } else if (run.status === 'failed') {
              cleanup();
              reject(new Error('Enrichment run failed'));
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
      setError(err instanceof Error ? err.message : 'Enrichment failed');
    } finally {
      setIsRunning(false);
    }
  }, []);

  return { start, progress, isRunning, isComplete, error, stats };
}
