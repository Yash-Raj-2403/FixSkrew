import { useSyncExternalStore } from "react";
import { setUi } from "./store";
import { scrollToHeroProgress, scrollToId } from "./scroll";
import type { ComponentId } from "../data/components";

/** Minimal History API router for the FixSkrew pages. */
export type Route = "/" | "/diagnose" | "/about";

const listeners = new Set<() => void>();
let pending: (() => void) | null = null;

function normalize(path: string): Route {
  const p = path.replace(/\/+$/, "");
  // /agent is the old address of the diagnosis page; keep it working.
  if (p === "/diagnose" || p === "/agent") return "/diagnose";
  if (p === "/about") return "/about";
  return "/";
}

window.addEventListener("popstate", () => listeners.forEach((l) => l()));

export function useRoute(): Route {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => normalize(window.location.pathname),
  );
}

/**
 * Navigate to a page. `after` runs once the destination has rendered (or immediately
 * when already there), e.g. to scroll to a section.
 */
export function navigate(path: Route, after?: (changedPage: boolean) => void) {
  if (normalize(window.location.pathname) === path) {
    after?.(false);
    return;
  }
  window.history.pushState({}, "", path);
  window.scrollTo(0, 0);
  pending = after ? () => after(true) : null;
  listeners.forEach((l) => l());
}

/** Called by the app shell after a route change has committed. */
export function flushPending() {
  const fn = pending;
  pending = null;
  // Two frames: layout (and the hero's ScrollTrigger) must exist before scrolling.
  if (fn) requestAnimationFrame(() => requestAnimationFrame(fn));
}

export function openDiagnosis() {
  navigate("/diagnose", () => document.getElementById("symptoms")?.focus({ preventScroll: true }));
}

/** Go to the About page, optionally to one of its sections. */
export function goToAbout(sectionId?: string) {
  navigate("/about", (changed) => (sectionId ? scrollToId(sectionId, undefined, changed) : window.scrollTo(0, 0)));
}

/** Go to an element on the home page (e.g. "how-it-works"). */
export function goToSection(id: string) {
  // A long smooth scroll right after the page swaps gets cancelled by ScrollTrigger's
  // refresh, so cross-page jumps are instant.
  navigate("/", (changed) => scrollToId(id, undefined, changed));
}

/** Jump to a point of the landing-page vehicle tour. */
export function goToTourPhase(progress: number) {
  navigate("/", (changed) => scrollToHeroProgress(progress, changed));
}

/** Show a component's details on the home page (the explore phase of the tour). */
export function showComponentInfo(id: ComponentId) {
  navigate("/", () => {
    scrollToHeroProgress(0.76, true);
    // Select after ScrollTrigger has registered the new phase, otherwise the
    // overview phase clears the selection.
    window.setTimeout(() => setUi({ selected: id }), 250);
  });
}
