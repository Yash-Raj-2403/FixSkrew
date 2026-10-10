import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { goToAbout, goToSection, goToTourPhase, openDiagnosis, useRoute } from "../lib/router";
import { HoveredLink, Menu, MenuItem } from "./ui/navbar-menu";

const ABOUT_LINKS = [
  { id: "capabilities", label: "Capabilities" },
  { id: "principles", label: "Principles" },
  { id: "technology", label: "Technology" },
];

const LINKS = [
  { id: "home", label: "Home", href: "/" },
  { id: "about", label: "About", href: "/about" },
] as const;

type SectionId = (typeof LINKS)[number]["id"];

export function Navbar() {
  const route = useRoute();
  const [scrolled, setScrolled] = useState(false);
  // The diagnosis page is reached through the "Start Diagnosis" button, which shows its own active state.
  const active: SectionId | null = route === "/diagnose" ? null : route === "/about" ? "about" : "home";
  const onDiagnose = route === "/diagnose";
  const [menu, setMenu] = useState<string | null>(null);
  const pick = (fn: () => void) => {
    setMenu(null);
    fn();
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [route]);

  const go = (id: SectionId) => (id === "about" ? goToAbout() : goToSection("home"));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background,border-color,backdrop-filter] duration-500 ${
        scrolled || route !== "/" ? "border-b border-white/[0.06] bg-ink-900/60 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:h-20 lg:px-12" aria-label="Main">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
          aria-label="FixSkrew home"
        >
          <Logo />
        </a>

        <Menu setActive={setMenu} className="hidden md:flex">
          {LINKS.map((l) => (
            <MenuItem
              key={l.id}
              item={l.id}
              active={menu}
              setActive={setMenu}
              trigger={
                <a
                  href={l.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setMenu(null);
                    go(l.id);
                  }}
                  aria-current={active === l.id ? "page" : undefined}
                  aria-haspopup="true"
                  aria-expanded={menu === l.id}
                  className={`relative block px-5 py-2.5 text-sm transition-colors ${
                    active === l.id ? "text-fog-100" : "text-fog-400 hover:text-fog-100"
                  }`}
                >
                  {l.label}
                  {active === l.id && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-3 -bottom-0.5 h-px bg-volt-400 shadow-[0_0_12px_rgba(63,216,242,0.8)]"
                      transition={{ type: "spring", stiffness: 380, damping: 34 }}
                    />
                  )}
                </a>
              }
            >
              {l.id === "home" && (
                <div className="flex w-48 flex-col gap-3 p-1">
                  <HoveredLink onSelect={() => pick(() => goToTourPhase(0))}>Vehicle overview</HoveredLink>
                  <HoveredLink onSelect={() => pick(() => goToTourPhase(0.3))}>Body disassembly</HoveredLink>
                  <HoveredLink onSelect={() => pick(() => goToTourPhase(0.62))}>Battery reveal</HoveredLink>
                  <HoveredLink onSelect={() => pick(() => goToTourPhase(0.76))}>Explore components</HoveredLink>
                  <HoveredLink onSelect={() => pick(() => goToSection("how-it-works"))}>How it works</HoveredLink>
                  <HoveredLink onSelect={() => pick(() => goToSection("report"))}>What you get</HoveredLink>
                </div>
              )}
              {l.id === "about" && (
                <div className="flex w-56 flex-col gap-3 p-1">
                  {ABOUT_LINKS.map((a) => (
                    <HoveredLink key={a.id} onSelect={() => pick(() => goToAbout(a.id))}>
                      {a.label}
                    </HoveredLink>
                  ))}
                </div>
              )}
            </MenuItem>
          ))}
        </Menu>

        <button
          type="button"
          onClick={openDiagnosis}
          aria-current={onDiagnose ? "page" : undefined}
          className={`group flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all sm:px-6 sm:py-2.5 ${
            onDiagnose
              ? "border-volt-400 bg-volt-400 font-medium text-ink-900 shadow-[0_0_24px_rgba(63,216,242,0.35)]"
              : "border-volt-400/50 text-fog-100 hover:border-volt-400 hover:bg-volt-400/10 hover:shadow-[0_0_24px_rgba(63,216,242,0.25)]"
          }`}
        >
          Start Diagnosis
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </button>
      </nav>
      {/* Compact section links for small screens. */}
      <ul className="flex justify-center gap-1 pb-2 md:hidden">
        {LINKS.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => go(l.id)}
              aria-current={active === l.id ? "page" : undefined}
              className={`rounded-full px-3.5 py-1 text-xs transition-colors ${
                active === l.id ? "bg-white/10 text-fog-100" : "text-fog-400"
              }`}
            >
              {l.label}
            </button>
          </li>
        ))}
      </ul>
    </header>
  );
}
