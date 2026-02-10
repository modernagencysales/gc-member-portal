import React, { useState } from 'react';
import { Pencil, Trash2, Sparkles, Wrench } from 'lucide-react';
import { useRecipes, useDeleteRecipe } from '../../../../hooks/useColdEmailRecipes';
import type { BootcampRecipe } from '../../../../types/cold-email-recipe-types';
import RecipeEditor from './RecipeEditor';
import EmailFirstRecipeBuilder from './EmailFirstRecipeBuilder';

interface Props {
  userId: string;
}

type CreateMode = null | 'email-first' | 'manual';

export default function RecipeList({ userId }: Props) {
  const { data: recipes, isLoading } = useRecipes(userId);
  const deleteRecipe = useDeleteRecipe();
  const [editingRecipe, setEditingRecipe] = useState<BootcampRecipe | null>(null);
  const [createMode, setCreateMode] = useState<CreateMode>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Email-first builder
  if (createMode === 'email-first') {
    return <EmailFirstRecipeBuilder userId={userId} onClose={() => setCreateMode(null)} />;
  }

  // Manual recipe editor (existing)
  if (editingRecipe || createMode === 'manual') {
    return (
      <RecipeEditor
        userId={userId}
        recipe={editingRecipe}
        onClose={() => {
          setEditingRecipe(null);
          setCreateMode(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with create buttons */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {recipes?.length || 0} recipe{recipes?.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateMode('manual')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Wrench size={12} />
            Manual
          </button>
          <button
            onClick={() => setCreateMode('email-first')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            <Sparkles size={14} />
            Create from Email
          </button>
        </div>
      </div>

      {!recipes || recipes.length === 0 ? (
        /* Empty state -- prominently features the email-first flow */
        <div className="text-center py-12 px-4">
          <div className="max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-900/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-violet-500" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">
              Build your first recipe from an email
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
              Write a personalized cold email, and AI will automatically detect your variables and
              build the enrichment recipe to fill them. No manual step configuration needed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setCreateMode('email-first')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-sm"
              >
                <Sparkles size={14} />
                Create from Email
              </button>
              <button
                onClick={() => setCreateMode('manual')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <Wrench size={14} />
                Or build manually
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {recipe.name}
                  </h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{recipe.slug}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingRecipe(recipe)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-violet-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this recipe?')) {
                        deleteRecipe.mutate({ recipeId: recipe.id, studentId: userId });
                      }
                    }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {recipe.description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2">
                  {recipe.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                <span>
                  {recipe.steps.length} step{recipe.steps.length !== 1 ? 's' : ''}
                </span>
                <span>{recipe.emailTemplate ? 'Template set' : 'No template'}</span>
                {!recipe.isActive && <span className="text-amber-500">Inactive</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
