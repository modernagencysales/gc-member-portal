import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { createTamJob, fetchTamJobs } from '../services/tam-supabase';
import { TamJobType, TamJob } from '../types/tam-types';

export type PipelineStep = 'source_companies' | 'qualify' | 'find_contacts';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface PipelineStepState {
  step: PipelineStep;
  label: string;
  status: StepStatus;
  progress: number;
  resultSummary: Record<string, unknown> | null;
}

interface UseTamPipelineReturn {
  startPipeline: (projectId: string) => Promise<void>;
  steps: PipelineStepState[];
  currentStep: PipelineStep | null;
  isRunning: boolean;
  isComplete: boolean;
  error: string | null;
}

const PIPELINE_STEPS: { step: PipelineStep; label: string }[] = [
  { step: 'source_companies', label: 'Source Companies' },
  { step: 'qualify', label: 'Qualify Companies' },
  { step: 'find_contacts', label: 'Find Contacts' },
];

// Max polling attempts before timing out (3s * 600 = 30 minutes)
const MAX_POLL_ATTEMPTS = 600;
// Max consecutive polling errors before giving up
const MAX_CONSECUTIVE_ERRORS = 10;

export function useTamPipeline(): UseTamPipelineReturn {
  const [steps, setSteps] = useState<PipelineStepState[]>(
    PIPELINE_STEPS.map((s) => ({
      ...s,
      status: 'pending',
      progress: 0,
      resultSummary: null,
    }))
  );
  const [currentStep, setCurrentStep] = useState<PipelineStep | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortedRef = useRef(false);
  const activePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (activePollRef.current) clearInterval(activePollRef.current);
      abortedRef.current = true;
    };
  }, []);

  const updateStepState = useCallback((step: PipelineStep, update: Partial<PipelineStepState>) => {
    setSteps((prev) => prev.map((s) => (s.step === step ? { ...s, ...update } : s)));
  }, []);

  const waitForJobCompletion = useCallback(
    (projectId: string, jobId: string, step: PipelineStep): Promise<TamJob> => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        let consecutiveErrors = 0;

        const cleanup = () => {
          if (intervalId) {
            clearInterval(intervalId);
            if (activePollRef.current === intervalId) {
              activePollRef.current = null;
            }
          }
        };

        const poll = async () => {
          if (abortedRef.current) {
            cleanup();
            reject(new Error('Pipeline aborted'));
            return;
          }

          attempts++;
          if (attempts > MAX_POLL_ATTEMPTS) {
            cleanup();
            updateStepState(step, { status: 'failed' });
            reject(
              new Error(
                `Job ${step} timed out after ${Math.round((MAX_POLL_ATTEMPTS * 3) / 60)} minutes`
              )
            );
            return;
          }

          try {
            const jobs = await fetchTamJobs(projectId);
            const job = jobs.find((j) => j.id === jobId);
            if (!job) {
              cleanup();
              reject(new Error(`Job ${jobId} not found`));
              return;
            }

            consecutiveErrors = 0; // Reset on success
            updateStepState(step, { progress: job.progress });

            if (job.status === 'completed') {
              cleanup();
              updateStepState(step, {
                status: 'completed',
                progress: 100,
                resultSummary: job.resultSummary,
              });
              resolve(job);
            } else if (job.status === 'failed') {
              cleanup();
              updateStepState(step, { status: 'failed' });
              reject(new Error((job.resultSummary?.error as string) || `Job ${step} failed`));
            }
          } catch (err) {
            consecutiveErrors++;
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              cleanup();
              updateStepState(step, { status: 'failed' });
              reject(
                new Error(
                  `Job ${step} polling failed after ${MAX_CONSECUTIVE_ERRORS} consecutive errors`
                )
              );
            }
            // Otherwise keep polling on transient errors
          }
        };

        const intervalId = setInterval(poll, 3000);
        activePollRef.current = intervalId;
        // Also run immediately
        poll();
      });
    },
    [updateStepState]
  );

  const runStep = useCallback(
    async (projectId: string, step: PipelineStep) => {
      setCurrentStep(step);
      updateStepState(step, { status: 'running', progress: 0 });

      // Create the job
      const job = await createTamJob({
        projectId,
        jobType: step as TamJobType,
      });

      // Invoke the edge function and check for errors
      const { error: invokeError } = await supabase.functions.invoke('tam-run-job', {
        body: { jobId: job.id },
      });

      if (invokeError) {
        updateStepState(step, { status: 'failed' });
        throw new Error(`Failed to start ${step}: ${invokeError.message}`);
      }

      // Wait for completion via polling
      return waitForJobCompletion(projectId, job.id, step);
    },
    [updateStepState, waitForJobCompletion]
  );

  const startPipeline = useCallback(
    async (projectId: string) => {
      setIsRunning(true);
      setIsComplete(false);
      setError(null);
      abortedRef.current = false;

      // Reset all steps
      setSteps(
        PIPELINE_STEPS.map((s) => ({
          ...s,
          status: 'pending',
          progress: 0,
          resultSummary: null,
        }))
      );

      try {
        // Check for existing jobs to avoid duplicates
        let existingJobs: TamJob[] = [];
        try {
          existingJobs = await fetchTamJobs(projectId);
        } catch {
          // If fetch fails, proceed without dedup (creates fresh jobs)
        }

        for (const stepDef of PIPELINE_STEPS) {
          if (abortedRef.current) return;

          const existingJob = existingJobs.find((j) => j.jobType === stepDef.step);

          if (existingJob?.status === 'completed') {
            // Already done — skip
            updateStepState(stepDef.step, {
              status: 'completed',
              progress: 100,
              resultSummary: existingJob.resultSummary,
            });
            continue;
          }

          if (existingJob?.status === 'running' || existingJob?.status === 'pending') {
            // Resume polling the existing job
            setCurrentStep(stepDef.step);
            updateStepState(stepDef.step, {
              status: 'running',
              progress: existingJob.progress,
            });
            await waitForJobCompletion(projectId, existingJob.id, stepDef.step);
            continue;
          }

          // No existing job (or failed) — create and run new one
          await runStep(projectId, stepDef.step);
        }

        setIsComplete(true);
        setCurrentStep(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Pipeline failed');
      } finally {
        setIsRunning(false);
      }
    },
    [runStep, updateStepState, waitForJobCompletion]
  );

  return {
    startPipeline,
    steps,
    currentStep,
    isRunning,
    isComplete,
    error,
  };
}
