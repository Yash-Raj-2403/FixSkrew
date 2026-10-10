import path from "node:path";
import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

/** A unit of extracted text with its location in the source document. */
export interface Section {
  text: string;
  page?: number;
  section?: string;
}

export const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".md", ".txt", ".log", ".csv", ".json", ".jsonl"] as const;

export function isSupported(filename: string): boolean {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(path.extname(filename).toLowerCase());
}

/** Extract text sections (with page numbers where the format has them) from a file. */
export async function extractSections(buffer: Uint8Array, filename: string): Promise<Section[]> {
  const ext = path.extname(filename).toLowerCase();

  if (ext === ".pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: false });
    return text.map((t, i) => ({ text: t, page: i + 1 }));
  }
  if (ext === ".docx") {
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    return [{ text: value }];
  }
  const raw = Buffer.from(buffer).toString("utf8");
  if (ext === ".md") {
    // Split on headings so each chunk keeps its section title.
    return raw.split(/^(?=#{1,4} )/m).map((p) => ({ text: p, section: p.match(/^#{1,4} (.+)$/m)?.[1]?.trim() }));
  }
  if (ext === ".json" || ext === ".jsonl") {
    // Diagnostic logs / repair histories: one record per section.
    const records: unknown[] =
      ext === ".jsonl" ? raw.split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l)) : [JSON.parse(raw)].flat();
    return records.map((r, i) => ({
      text: typeof r === "object" && r && "text" in r ? String((r as { text: unknown }).text) : JSON.stringify(r, null, 2),
      section: `record ${i + 1}`,
    }));
  }
  if (ext === ".txt" || ext === ".log" || ext === ".csv") return [{ text: raw }];
  throw new UnsupportedFileError(filename);
}

const CHUNK_CHARS = 1800;
const OVERLAP_CHARS = 200;

/** Split text into overlapping chunks on paragraph boundaries. */
export function chunkText(text: string): string[] {
  const clean = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (clean.length <= CHUNK_CHARS) return clean ? [clean] : [];
  const paragraphs = clean.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";
  for (const p of paragraphs) {
    if ((current + "\n\n" + p).length > CHUNK_CHARS && current) {
      chunks.push(current.trim());
      current = current.slice(-OVERLAP_CHARS) + "\n\n" + p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
    // Hard-split very long paragraphs (tables flattened by PDF extraction).
    while (current.length > CHUNK_CHARS * 1.5) {
      chunks.push(current.slice(0, CHUNK_CHARS).trim());
      current = current.slice(CHUNK_CHARS - OVERLAP_CHARS);
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/** Chunks shorter than this are page furniture (headers, page numbers). */
export const MIN_CHUNK_CHARS = 40;

export class UnsupportedFileError extends Error {
  constructor(public readonly filename: string) {
    super(`Unsupported file type for "${filename}". Use ${SUPPORTED_EXTENSIONS.join(", ")}.`);
    this.name = "UnsupportedFileError";
  }
}
