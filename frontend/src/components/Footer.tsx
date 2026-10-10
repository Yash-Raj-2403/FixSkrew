import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { goToAbout, goToSection, goToTourPhase, navigate, openDiagnosis } from "../lib/router";

function FooterLink({ href, onClick, children }: { href: string; onClick: () => void; children: ReactNode }) {
  return (
    <li>
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
        className="text-sm text-fog-400 transition-colors hover:text-fog-100"
      >
        {children}
      </a>
    </li>
  );
}

const COLUMNS: { title: string; links: { label: string; href: string; onClick: () => void }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Vehicle tour", href: "/", onClick: () => goToTourPhase(0) },
      { label: "Battery reveal", href: "/", onClick: () => goToTourPhase(0.62) },
      { label: "How it works", href: "/#how-it-works", onClick: () => goToSection("how-it-works") },
      { label: "What you get", href: "/#report", onClick: () => goToSection("report") },
    ],
  },
  {
    title: "Diagnostics",
    links: [
      { label: "Start a diagnosis", href: "/diagnose", onClick: openDiagnosis },
      {
        label: "Service status",
        href: "/diagnose",
        onClick: () => navigate("/diagnose", () => document.getElementById("service-status")?.scrollIntoView({ block: "center" })),
      },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Overview", href: "/about", onClick: () => goToAbout() },
      { label: "Capabilities", href: "/about#capabilities", onClick: () => goToAbout("capabilities") },
      { label: "Principles", href: "/about#principles", onClick: () => goToAbout("principles") },
      { label: "Technology", href: "/about#technology", onClick: () => goToAbout("technology") },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-ink-950">
      <div className="mx-auto max-w-[1440px] px-4 pt-14 pb-10 sm:px-8 lg:px-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-fog-400">
              Evidence-based EV battery diagnostics for any make and model, in your own language.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="eyebrow mb-4 text-[10px]!">{col.title}</h2>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <FooterLink key={l.label} href={l.href} onClick={l.onClick}>
                    {l.label}
                  </FooterLink>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl text-xs leading-relaxed text-fog-500">
            FixSkrew supports qualified technicians and does not replace manufacturer procedures. Always follow the documented
            high-voltage isolation and safety steps before working on the battery system. Vehicle makes and models are trademarks of
            their respective owners.
          </p>
          <p className="shrink-0 font-mono text-[11px] text-fog-500">© {new Date().getFullYear()} FixSkrew</p>
        </div>
      </div>
    </footer>
  );
}
