import type { ReactNode } from "react";
import { DOC_TYPE_LABEL, type Source } from "../../lib/api";
import { LinkPreview } from "../ui/link-preview";

/** Hover card for a cited source. */
export function SourceCard({ s }: { s: Source }) {
  const meta = [
    s.origin === "case" ? "Uploaded to this case" : (DOC_TYPE_LABEL[s.docType] ?? s.docType),
    s.page != null && `p. ${s.page}`,
    s.section,
    s.publishedAt,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <>
      <p className="flex items-start gap-2 text-[13px] leading-snug font-medium text-fog-100">
        <span className="mt-px rounded bg-volt-400/10 px-1.5 py-px font-mono text-[10px] text-volt-300">{s.id}</span>
        {s.sourceTitle}
      </p>
      <p className="mt-1 font-mono text-[10.5px] text-fog-500">{meta}</p>
      <p className="mt-2 line-clamp-4 border-l border-white/10 pl-2.5 text-[12px] leading-relaxed text-fog-400">{s.excerpt}</p>
    </>
  );
}

function Citation({ id, source, anchorPrefix }: { id: string; source?: Source; anchorPrefix: string }) {
  const chip = "mx-0.5 rounded bg-volt-400/10 px-1.5 py-px align-baseline font-mono text-[10.5px] text-volt-300 transition-colors hover:bg-volt-400/20";
  if (!source) return <span className={chip}>{id}</span>;
  return (
    <LinkPreview url={`#${anchorPrefix}-${id}`} mode="card" card={<SourceCard s={source} />} className={chip} aria-label={`Source ${id}: ${source.sourceTitle}`}>
      {id}
    </LinkPreview>
  );
}

/** Inline formatting: **bold**, `code`, [S1] citations. */
function inline(text: string, sources: Map<string, Source>, anchorPrefix: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[S\d+\](?:\s*\[S\d+\])*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={`${keyBase}-${k++}`} className="font-semibold text-fog-100">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={`${keyBase}-${k++}`} className="rounded bg-white/[0.06] px-1 font-mono text-[0.85em]">{tok.slice(1, -1)}</code>);
    else
      for (const id of tok.match(/S\d+/g) ?? [])
        out.push(<Citation key={`${keyBase}-${k++}`} id={id} source={sources.get(id)} anchorPrefix={anchorPrefix} />);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * Minimal, safe Markdown subset for chat replies: paragraphs, bullet and numbered lists,
 * bold, inline code and citations. Built as React elements; no HTML injection.
 */
export function RichText({ text, sources = [], anchorPrefix }: { text: string; sources?: Source[]; anchorPrefix: string }) {
  const byId = new Map(sources.map((s) => [s.id, s]));
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let i = 0;
  let b = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const bullet = /^\s*[-*•]\s+/;
    const numbered = /^\s*\d+[.)]\s+/;
    if (bullet.test(line) || numbered.test(line)) {
      const ordered = numbered.test(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? numbered : bullet).test(lines[i])) {
        items.push(lines[i].replace(ordered ? numbered : bullet, ""));
        i++;
      }
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List key={b++} className={`space-y-1.5 pl-5 ${ordered ? "list-decimal" : "list-disc"} marker:text-fog-500`}>
          {items.map((it, j) => (
            <li key={j}>{inline(it, byId, anchorPrefix, `${b}-${j}`)}</li>
          ))}
        </List>,
      );
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !bullet.test(lines[i]) && !numbered.test(lines[i])) {
      para.push(lines[i].replace(/^#{1,6}\s+/, ""));
      i++;
    }
    blocks.push(<p key={b++}>{inline(para.join(" "), byId, anchorPrefix, `p${b}`)}</p>);
  }
  return <div className="space-y-3">{blocks}</div>;
}
