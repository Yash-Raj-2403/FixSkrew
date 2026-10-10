export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <path d="M16 3.5 26.8 9.75v12.5L16 28.5 5.2 22.25V9.75z" fill="none" stroke="#3fd8f2" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M20.6 12.2h-6.3l-2.9 3.7h6.5l-2.7 3.7" fill="none" stroke="#3fd8f2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[1.35rem] font-semibold tracking-tight text-fog-100">FixSkrew</span>
    </span>
  );
}
