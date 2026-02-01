import React, { useState, useEffect, useMemo } from 'react';
import { Plus, MessageSquare, List, Loader2 } from 'lucide-react';
import { IcpProfile } from '../../types/tam-types';
import {
  useTamProjects,
  useTamProject,
  useCreateTamProjectMutation,
  useUpdateTamProjectMutation,
} from '../../hooks/useTamProject';
import IcpWizard from './IcpWizard';
import TamDashboard from './TamDashboard';
import { ChatInterface } from '../chat';

type Phase = 'wizard' | 'chat' | 'dashboard';
type TabView = 'strategy' | 'list';

interface TamBuilderProps {
  userId: string;
}

const TamBuilder: React.FC<TamBuilderProps> = ({ userId }) => {
  const [phase, setPhase] = useState<Phase>('wizard');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>('strategy');
  const [initialized, setInitialized] = useState(false);

  // Queries
  const { data: projects, isLoading: projectsLoading } = useTamProjects(userId);
  const { data: activeProject } = useTamProject(activeProjectId ?? undefined);

  // Mutations
  const createProject = useCreateTamProjectMutation();
  const updateProject = useUpdateTamProjectMutation();

  // Find the most recent incomplete project for resume logic
  const resumableProject = useMemo(() => {
    if (!projects || projects.length === 0) return null;
    // Find the most recently updated project that is not complete
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
            // ICP already filled out, go to chat
            setPhase('chat');
            setActiveTab('strategy');
          } else {
            setPhase('wizard');
          }
          break;
        case 'sourcing':
        case 'enriching':
          setPhase('chat');
          setActiveTab('strategy');
          break;
        case 'complete':
          setPhase('dashboard');
          setActiveTab('list');
          break;
        default:
          setPhase('wizard');
      }
    } else {
      // Check if there's a completed project to view
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

  // Handle ICP Wizard completion: create project and transition to chat
  const handleWizardComplete = async (icpProfile: IcpProfile) => {
    try {
      const project = await createProject.mutateAsync({
        userId,
        name: `TAM Project - ${new Date().toLocaleDateString()}`,
        icpProfile,
      });
      setActiveProjectId(project.id);
      setPhase('chat');
      setActiveTab('strategy');
    } catch (err) {
      console.error('Failed to create TAM project:', err);
    }
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
      {/* Header with tab navigation (shown in chat/dashboard phases) */}
      {phase !== 'wizard' && activeProjectId && (
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3">
          <div className="flex items-center gap-1">
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
            <IcpWizard onComplete={handleWizardComplete} userId={userId} />
          </div>
        )}

        {/* Chat Phase */}
        {phase === 'chat' && activeProjectId && (
          <div className="h-full">
            <ChatInterface toolSlug="tam-builder" studentId={userId} />
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
