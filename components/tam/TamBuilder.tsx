import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, MessageSquare, List, Loader2, BarChart3 } from 'lucide-react';
import { IcpProfile } from '../../types/tam-types';
import { queryKeys } from '../../lib/queryClient';
import {
  useTamProjects,
  useTamProject,
  useCreateTamProjectMutation,
  useUpdateTamProjectMutation,
} from '../../hooks/useTamProject';
import { useTamPipeline } from '../../hooks/useTamPipeline';
import IcpWizard from './IcpWizard';
import TamDashboard from './TamDashboard';
import PipelineProgress from './PipelineProgress';
import TamCsvImport from './TamCsvImport';
import { ChatInterface } from '../chat';

type Phase = 'wizard' | 'pipeline' | 'chat' | 'dashboard' | 'import';
type TabView = 'strategy' | 'pipeline' | 'list';

interface TamBuilderProps {
  userId: string;
}

const TamBuilder: React.FC<TamBuilderProps> = ({ userId }) => {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>('wizard');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>('strategy');
  const [initialized, setInitialized] = useState(false);

  // Queries
  const { data: projects, isLoading: projectsLoading } = useTamProjects(userId || undefined);
  const { data: activeProject } = useTamProject(activeProjectId ?? undefined);

  // Mutations
  const createProject = useCreateTamProjectMutation();
  const updateProject = useUpdateTamProjectMutation();

  // Pipeline orchestration
  const pipeline = useTamPipeline();

  // Find the most recent incomplete project for resume logic
  const resumableProject = useMemo(() => {
    if (!projects || projects.length === 0) return null;
    const incomplete = projects
      .filter((p) => p.status !== 'complete')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return incomplete.length > 0 ? incomplete[0] : null;
  }, [projects]);

  // On mount: determine starting phase based on existing project state
  useEffect(() => {
    if (initialized || projectsLoading) return;

    if (resumableProject) {
      setActiveProjectId(resumableProject.id);

      switch (resumableProject.status) {
        case 'draft':
          if (resumableProject.icpProfile) {
            setPhase('chat');
            setActiveTab('strategy');
          } else {
            setPhase('wizard');
          }
          break;
        case 'sourcing':
          setPhase('chat');
          setActiveTab('strategy');
          break;
        case 'enriching':
          // Imported projects have no ICP profile — show dashboard (may still be running)
          if (!resumableProject.icpProfile) {
            setPhase('dashboard');
            setActiveTab('list');
          } else {
            setPhase('chat');
            setActiveTab('strategy');
          }
          break;
        case 'complete':
          setPhase('dashboard');
          setActiveTab('list');
          break;
        default:
          setPhase('wizard');
      }
    } else {
      const completedProject = projects
        ?.filter((p) => p.status === 'complete')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

      if (completedProject) {
        setActiveProjectId(completedProject.id);
        setPhase('dashboard');
        setActiveTab('list');
      } else {
        setPhase('wizard');
      }
    }

    setInitialized(true);
  }, [projects, projectsLoading, resumableProject, initialized]);

  // When pipeline completes, invalidate caches and transition to dashboard
  useEffect(() => {
    if (pipeline.isComplete && activeProjectId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.tamProject(activeProjectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tamCompanies(activeProjectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tamContacts(activeProjectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tamStats(activeProjectId) });
      setPhase('dashboard');
      setActiveTab('list');
    }
  }, [pipeline.isComplete, activeProjectId, queryClient]);

  // Handle ICP Wizard completion: create project and start pipeline
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleWizardComplete = async (icpProfile: IcpProfile) => {
    if (!userId) {
      setWizardError('Unable to create project — user ID not found. Please refresh and try again.');
      return;
    }
    setWizardError(null);
    setIsCreating(true);
    try {
      const project = await createProject.mutateAsync({
        userId,
        name: `TAM Project - ${new Date().toLocaleDateString()}`,
        icpProfile,
      });
      setActiveProjectId(project.id);
      setPhase('pipeline');
      setActiveTab('pipeline');

      // Auto-start the pipeline
      pipeline.startPipeline(project.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setWizardError(`Failed to create project: ${message}`);
      console.error('Failed to create TAM project:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle CSV import completion
  const handleImportComplete = (projectId: string) => {
    setActiveProjectId(projectId);
    queryClient.invalidateQueries({ queryKey: queryKeys.tamProjects(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tamContacts(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tamStats(projectId) });
    setPhase('dashboard');
    setActiveTab('list');
  };

  // Start a new project from scratch
  const handleNewProject = () => {
    setActiveProjectId(null);
    setPhase('wizard');
    setActiveTab('strategy');
  };

  // Switch to chat from dashboard
  const handleOpenChat = () => {
    setPhase('chat');
    setActiveTab('strategy');
  };

  // Loading state
  if (projectsLoading || !initialized) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with tab navigation (shown in non-wizard phases with active project) */}
      {phase !== 'wizard' && phase !== 'import' && activeProjectId && (
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3">
          <div className="flex items-center gap-1">
            {/* Hide Strategy tab for imported projects (no ICP profile) */}
            {activeProject?.icpProfile && (
              <button
                onClick={() => {
                  setPhase('chat');
                  setActiveTab('strategy');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  phase === 'chat' && activeTab === 'strategy'
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Strategy
              </button>
            )}
            {pipeline.isRunning && (
              <button
                onClick={() => {
                  setPhase('pipeline');
                  setActiveTab('pipeline');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  phase === 'pipeline'
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Pipeline
              </button>
            )}
            <button
              onClick={() => {
                setPhase('dashboard');
                setActiveTab('list');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                phase === 'dashboard' && activeTab === 'list'
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>

          <div className="flex items-center gap-3">
            {activeProject && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {activeProject.name}
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {activeProject.status}
                </span>
              </span>
            )}
            <button
              onClick={handleNewProject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>
      )}

      {/* Phase Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Wizard Phase */}
        {phase === 'wizard' && (
          <div className="p-6">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                Build Your Target Market
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Define your ideal customer profile and we will build a qualified prospect list
              </p>
            </div>
            <IcpWizard
              onComplete={handleWizardComplete}
              userId={userId}
              isSubmitting={isCreating}
              error={wizardError}
            />

            <div className="mt-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white dark:bg-zinc-950 px-4 text-sm text-zinc-500 dark:text-zinc-400">
                    or
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPhase('import')}
                className="mt-4 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
              >
                Import a List (CSV) to check LinkedIn activity
              </button>
            </div>
          </div>
        )}

        {/* Pipeline Phase */}
        {phase === 'pipeline' && activeProjectId && (
          <div className="p-6 flex items-center justify-center min-h-[500px]">
            <PipelineProgress
              steps={pipeline.steps}
              error={pipeline.error}
              onNewProject={handleNewProject}
            />
          </div>
        )}

        {/* Chat Phase */}
        {phase === 'chat' && activeProjectId && (
          <div className="h-full">
            <ChatInterface toolSlug="tam-builder" studentId={userId} />
          </div>
        )}

        {/* Import Phase */}
        {phase === 'import' && (
          <div className="p-6">
            <TamCsvImport
              userId={userId}
              onComplete={handleImportComplete}
              onBack={() => setPhase('wizard')}
            />
          </div>
        )}

        {/* Dashboard Phase */}
        {phase === 'dashboard' && activeProjectId && (
          <div className="p-6">
            <TamDashboard projectId={activeProjectId} onOpenChat={handleOpenChat} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TamBuilder;
