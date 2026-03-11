/**
 * VirtualLessonRouter. Renders the correct virtual-page component based on the
 * current lesson ID. Handles lazy loading with a consistent Suspense spinner.
 * Never manages state — purely a routing/rendering concern.
 */

import React, { lazy, Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import MyPosts from './MyPosts';
import ErrorBoundary from '../shared/ErrorBoundary';
import LessonView from './LessonView';
import type { Lesson, Week } from '../../types';
import type { BootcampStudent } from '../../types/bootcamp-types';

// ─── Lazy-loaded virtual pages ─────────────────────────────────────────────

const TamBuilder = lazy(() => import('../tam/TamBuilder'));
const ConnectionQualifier = lazy(() => import('./connection-qualifier/ConnectionQualifier'));
const InfrastructurePage = lazy(() => import('./infrastructure/InfrastructurePage'));
const ColdEmailRecipesPage = lazy(() => import('./cold-email-recipes/ColdEmailRecipesPage'));
const EmailEnrichmentPage = lazy(() => import('./email-enrichment/EmailEnrichmentPage'));
const IntroOffer = lazy(() => import('./IntroOffer'));

// ─── Shared spinner ────────────────────────────────────────────────────────

const Spinner: React.FC = () => (
  <div className="flex items-center justify-center h-96">
    <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
  </div>
);

// ─── Props ─────────────────────────────────────────────────────────────────

export interface VirtualLessonRouterProps {
  currentLesson: Lesson;
  currentWeek: Week | undefined;
  bootcampStudent: BootcampStudent | null;
  // LessonView passthrough props
  completedItems: Set<string>;
  proofOfWork: Record<string, string>;
  taskNotes: Record<string, string>;
  onToggleItem: (itemId: string) => void;
  onUpdateProof: (itemId: string, value: string) => void;
  onUpdateNote: (itemId: string, value: string) => void;
  isWeekSubmitted: boolean;
  onWeekSubmit: (weekId: string) => void;
  onSelectLesson: (lesson: Lesson) => void;
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
}

// ─── Component ─────────────────────────────────────────────────────────────

const VirtualLessonRouter: React.FC<VirtualLessonRouterProps> = ({
  currentLesson,
  currentWeek,
  bootcampStudent,
  completedItems,
  proofOfWork,
  taskNotes,
  onToggleItem,
  onUpdateProof,
  onUpdateNote,
  isWeekSubmitted,
  onWeekSubmit,
  onSelectLesson,
  prevLesson,
  nextLesson,
}) => {
  const userId = bootcampStudent?.id || '';

  if (currentLesson.id === 'virtual:tam-builder') {
    return (
      <ErrorBoundary
        fallback={
          <div className="flex flex-col items-center justify-center h-96 gap-4 p-8">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              TAM Builder encountered an error
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md">
              Try reloading the page. If the issue persists, your project data is safe — contact
              support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        }
      >
        <Suspense fallback={<Spinner />}>
          <TamBuilder userId={userId} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (currentLesson.id === 'virtual:connection-qualifier') {
    return (
      <Suspense fallback={<Spinner />}>
        <ConnectionQualifier userId={userId} />
      </Suspense>
    );
  }

  if (
    currentLesson.id === 'virtual:infra-account-setup' ||
    currentLesson.id === 'virtual:infra-email-infra' ||
    currentLesson.id === 'virtual:infrastructure-manager'
  ) {
    return (
      <Suspense fallback={<Spinner />}>
        <InfrastructurePage
          userId={userId}
          mode={currentLesson.id === 'virtual:infra-email-infra' ? 'email_infra' : 'account_setup'}
        />
      </Suspense>
    );
  }

  if (currentLesson.id === 'virtual:cold-email-recipes') {
    return (
      <Suspense fallback={<Spinner />}>
        <ColdEmailRecipesPage userId={userId} />
      </Suspense>
    );
  }

  if (currentLesson.id === 'virtual:email-enrichment') {
    return (
      <Suspense fallback={<Spinner />}>
        <EmailEnrichmentPage userId={userId} />
      </Suspense>
    );
  }

  if (currentLesson.id === 'virtual:intro-offer') {
    return (
      <Suspense fallback={<Spinner />}>
        <IntroOffer />
      </Suspense>
    );
  }

  if (currentLesson.id === 'virtual:my-posts') {
    return <MyPosts prospectId={bootcampStudent?.prospectId} studentId={bootcampStudent?.id} />;
  }

  // Default: standard lesson view
  return (
    <LessonView
      lesson={currentLesson}
      currentWeek={currentWeek}
      completedItems={completedItems}
      proofOfWork={proofOfWork}
      taskNotes={taskNotes}
      onToggleItem={onToggleItem}
      onUpdateProof={onUpdateProof}
      onUpdateNote={onUpdateNote}
      isWeekSubmitted={isWeekSubmitted}
      onWeekSubmit={onWeekSubmit}
      onSelectLesson={onSelectLesson}
      studentId={bootcampStudent?.id}
      bootcampStudent={bootcampStudent}
      prevLesson={prevLesson}
      nextLesson={nextLesson}
    />
  );
};

export default VirtualLessonRouter;
