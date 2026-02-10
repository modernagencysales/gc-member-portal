// ============================================
// Email-First Recipe Builder Types
// ============================================

/**
 * DetectedVariable as returned by the gtm-system analyze endpoint.
 *
 * API returns camelCase field names with numeric confidence (0-1).
 * The UI maps these to a display-friendly 'high'|'medium'|'low' label.
 */
export interface DetectedVariable {
  /** Snake_case variable name, e.g. "company_pain_point" */
  variableName: string;
  /** Human-readable description */
  description: string;
  /** Where the data comes from (e.g. "company website", "LinkedIn") */
  dataSource: string;
  /** Numeric confidence score from AI (0-1) */
  confidence: number;
  /** Example value for this variable */
  exampleValue: string;
  /** The email snippet where this variable was found */
  emailSnippet: string;
}

/** Convenience label for display */
export type ConfidenceLabel = 'high' | 'medium' | 'low';

/** Convert a numeric confidence (0-1) to a display label */
export function confidenceToLabel(confidence: number): ConfidenceLabel {
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.4) return 'medium';
  return 'low';
}

/** A suggested step from the analyze endpoint (extends RecipeStep with metadata) */
export interface SuggestedStep {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  output_fields: string[];
  required: boolean;
  skip_if_missing?: string[];
  /** Which variables this step produces */
  produces_variables: string[];
  /** Why this step type was chosen */
  rationale: string;
}

/** Push configuration for campaign delivery */
export interface PushConfig {
  campaign_id: string;
  gate_fields: string[];
  variable_map: Record<string, string>;
}

/**
 * Full response from POST /api/cold-email/recipes/analyze
 *
 * The API wraps the response under `analysis` and `ready_recipe` (snake_case).
 */
export interface AnalyzeEmailResponse {
  success: boolean;
  analysis: {
    summary: string;
    variables: DetectedVariable[];
    suggested_steps: SuggestedStep[];
    suggested_push_config: PushConfig;
    suggested_name: string;
    suggested_slug: string;
  };
  ready_recipe: {
    name: string;
    slug: string;
    description: string;
    steps: Array<{
      id: string;
      type: string;
      name: string;
      config: Record<string, unknown>;
      output_fields: string[];
      required: boolean;
      skip_if_missing?: string[];
    }>;
    push_config: PushConfig;
  };
  warnings?: string[];
}

/** A single step result from the preview endpoint */
export interface StepPreviewResult {
  step_id: string;
  step_type: string;
  step_name: string;
  success: boolean;
  duration_ms: number;
  outputs: Record<string, unknown>;
  error?: string;
}

/**
 * Full response from POST /api/cold-email/recipes/preview
 *
 * The API returns step-by-step results under `preview`.
 */
export interface PreviewResult {
  success: boolean;
  preview: {
    step_results: StepPreviewResult[];
    final_lead_data: Record<string, unknown>;
    summary: {
      total_steps: number;
      executed: number;
      succeeded: number;
      failed: number;
      skipped: number;
      total_duration_ms: number;
    };
  };
}

export type EmailFirstStep = 'write' | 'variables' | 'recipe' | 'save';
