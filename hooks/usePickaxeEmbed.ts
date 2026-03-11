/**
 * usePickaxeEmbed.ts
 * Manages Pickaxe/custom-embed script injection and iframe permission patching.
 * Handles MutationObserver to fix iframe sandbox/allow attributes injected by the embed bundle.
 * No UI rendering. Pure lifecycle side-effect hook.
 */

import { useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PickaxeEmbedOptions {
  /** Whether the lesson uses a Pickaxe/custom-embed URL scheme. */
  isPickaxe: boolean;
  /** The extracted deployment ID (e.g. "deployment-abc123"). Null if not applicable. */
  pickaxeId: string | null;
  /** The embed bundle script URL to inject. */
  scriptSrc: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REQUIRED_ALLOW = [
  'microphone *',
  'camera *',
  'storage-access *',
  'clipboard-write *',
  'encrypted-media *',
  'fullscreen *',
] as const;

const REQUIRED_SANDBOX = [
  'allow-same-origin',
  'allow-scripts',
  'allow-forms',
  'allow-popups',
  'allow-modals',
] as const;

// ─── Permission Fixer ─────────────────────────────────────────────────────────

/** Patches an iframe element to add required allow and sandbox attributes. */
const fixIframePermissions = (iframe: HTMLIFrameElement): void => {
  let allow = iframe.getAttribute('allow') || '';
  let allowChanged = false;

  REQUIRED_ALLOW.forEach((req) => {
    if (!allow.includes(req)) {
      allow += (allow ? '; ' : '') + req;
      allowChanged = true;
    }
  });
  if (allowChanged) iframe.setAttribute('allow', allow);

  if (iframe.hasAttribute('sandbox')) {
    let sandbox = iframe.getAttribute('sandbox') || '';
    let sandboxChanged = false;

    REQUIRED_SANDBOX.forEach((req) => {
      if (!sandbox.includes(req)) {
        sandbox += (sandbox ? ' ' : '') + req;
        sandboxChanged = true;
      }
    });
    if (sandboxChanged) iframe.setAttribute('sandbox', sandbox.trim());
  }
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Injects the Pickaxe embed bundle script and sets up a MutationObserver to
 * patch iframe permissions as they are added to the DOM by the embed bundle.
 * Cleans up both the script tag and observer on unmount or when pickaxeId changes.
 */
export const usePickaxeEmbed = ({ isPickaxe, pickaxeId, scriptSrc }: PickaxeEmbedOptions): void => {
  useEffect(() => {
    if (!isPickaxe || !pickaxeId) return;

    // Remove any pre-existing bundle scripts to avoid duplicates
    document.querySelectorAll('script[src*="bundle.js"]').forEach((s) => s.remove());

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeName === 'IFRAME') {
            fixIframePermissions(node as HTMLIFrameElement);
          }
          if (node instanceof HTMLElement) {
            node.querySelectorAll('iframe').forEach(fixIframePermissions);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.defer = true;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      observer.disconnect();
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [isPickaxe, pickaxeId, scriptSrc]);
};
