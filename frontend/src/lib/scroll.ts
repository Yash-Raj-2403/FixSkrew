export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToId(id: string, focusSelector?: string, instant = false) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - (id === "home" ? 0 : 72);
  window.scrollTo({ top, behavior: instant || prefersReducedMotion() ? "auto" : "smooth" });
  if (focusSelector) {
    window.setTimeout(() => (document.querySelector(focusSelector) as HTMLElement | null)?.focus({ preventScroll: true }), 700);
  }
}

/** Scroll to a fraction of the hero's pinned scroll distance. */
export function scrollToHeroProgress(p: number, instant = false) {
  const hero = document.getElementById("home");
  if (!hero) return;
  const start = hero.offsetTop;
  const distance = hero.offsetHeight - window.innerHeight;
  window.scrollTo({ top: start + distance * p + 1, behavior: instant || prefersReducedMotion() ? "auto" : "smooth" });
}
