import { useSyncExternalStore } from "react";
import { phaseAt, type ComponentId, type PhaseId } from "../data/components";

/**
 * Minimal shared store. Scroll progress is written every frame by GSAP and read inside
 * the render loop, so it lives on a plain mutable object; only discrete UI state (phase,
 * selection) notifies React subscribers.
 */
interface UiState {
  phase: PhaseId;
  selected: ComponentId | null;
  hovered: ComponentId | null;
  /** Component handed from the component details panel to the diagnostic form. */
  agentFocus: ComponentId | null;
  sceneReady: boolean;
}

export const motion = {
  /** Raw scroll progress through the hero (0..1). */
  target: 0,
  /** Damped progress used for rendering. */
  current: 0,
};

let state: UiState = { phase: "overview", selected: null, hovered: null, agentFocus: null, sceneReady: false };
const listeners = new Set<() => void>();

export function setUi(patch: Partial<UiState>) {
  const next = { ...state, ...patch };
  if ((Object.keys(patch) as (keyof UiState)[]).every((k) => next[k] === state[k])) return;
  state = next;
  listeners.forEach((l) => l());
}

export function getUi() {
  return state;
}

export function useUi<T>(selector: (s: UiState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selector(state),
  );
}

export function setProgress(p: number) {
  motion.target = p;
  const phase = phaseAt(p);
  if (phase !== state.phase) setUi({ phase });
}
