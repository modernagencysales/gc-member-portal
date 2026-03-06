# DFY Call Transcript Intake Step — Design

**Date**: 2026-03-04
**Linear**: MOD-388
**Status**: Approved

## Problem

The DFY intake wizard has no place for call transcripts. Without transcripts, magnetlab's content generation can't learn the client's voice or extract real customer insights (pain points, objections, language patterns).

## Solution

Add a dedicated **"Call Transcript"** step to the intake wizard (new step 3, between Data Dump and Quick Confirms).

## Changes

### 1. `types/dfy-intake-types.ts`
- Add `callTranscript: string` to `IntakeWizardData`
- Add `'call-transcript'` to `INTAKE_STEPS` (index 3)
- Add step title: `'Call Transcript'`

### 2. New: `components/client-portal/intake-wizard/StepCallTranscript.tsx`
- Large textarea for pasting transcript
- Helper text explaining purpose
- Optional step (no validation required to advance)
- Character count indicator

### 3. `components/client-portal/intake-wizard/IntroOfferIntakeWizard.tsx`
- Import and render `StepCallTranscript` at step index 3
- Initialize `callTranscript: ''` in `createInitialData()`
- Wire state updates

### 4. `services/dfy-intake-service.ts`
- Include `call_transcript: data.callTranscript` in `wizardPayload`

## Data Flow

```
Client pastes transcript in wizard
  → gc-member-portal sends call_transcript in wizard_data to gtm-system
  → gtm-system forwards to magnetlab POST /api/external/ingest-transcript
  → magnetlab: classify → extract knowledge → embeddings → cp_knowledge_entries
  → Content generation pulls from knowledge base with transcript insights
```

## Out of Scope (future PRs)
- gtm-system forwarding logic (separate repo)
- Client dashboard ongoing transcript upload
- Transcript file upload (audio/video)
