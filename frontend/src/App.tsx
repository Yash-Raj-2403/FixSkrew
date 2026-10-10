import { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
// The diagnosis workspace and About page are loaded on demand to keep the landing page light.
const AgentPage = lazy(() => import("./pages/AgentPage").then((m) => ({ default: m.AgentPage })));
const AboutPage = lazy(() => import("./pages/AboutPage").then((m) => ({ default: m.AboutPage })));
import { flushPending, useRoute } from "./lib/router";
import { scrollToId } from "./lib/scroll";

const TITLES = {
  "/": "FixSkrew — EV Battery Diagnostics",
  "/diagnose": "Start a Diagnosis — FixSkrew",
  "/about": "About — FixSkrew",
} as const;

export default function App() {
  const route = useRoute();

  useLayoutEffect(() => {
    // Canonicalise the legacy /agent address.
    if (window.location.pathname.replace(/\/+$/, "") === "/agent") window.history.replaceState({}, "", "/diagnose");
    // The About section used to live at /#about.
    if (route === "/" && window.location.hash === "#about") {
      window.history.replaceState({}, "", "/about");
      window.dispatchEvent(new PopStateEvent("popstate"));
      return;
    }
    document.title = TITLES[route];
    flushPending();
  }, [route]);

  // Deep link such as /#about on first load.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (route === "/" && id && id !== "about") {
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToId(id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-volt-400 px-4 py-2 text-ink-900 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Navbar />
      <Suspense fallback={<div className="min-h-[100svh]" role="status" aria-label="Loading" />}>
        {route === "/diagnose" ? <AgentPage key="diagnose" /> : route === "/about" ? <AboutPage key="about" /> : <HomePage key="home" />}
      </Suspense>
      <Footer />
    </>
  );
}
