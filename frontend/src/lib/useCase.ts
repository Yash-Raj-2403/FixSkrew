import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type Case, type ChatMessage, type DiagnoseResult, type Source, type Vehicle } from "./api";

const STORAGE_KEY = "fixskrew.caseId";

function readStoredId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
function storeId(id: string | null) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode: the case simply won't survive a reload */
  }
}

export interface PendingUpload {
  key: string;
  name: string;
  size: number;
  /** 0..1 while bytes are sent; then the server extracts and indexes. */
  progress: number;
  stage: "uploading" | "processing" | "failed";
  error?: string;
}

/** A reply being streamed, shown until the server confirms the stored messages. */
export interface StreamingTurn {
  user: string;
  reply: string;
  sources: Source[];
  vehicleMatch?: DiagnoseResult["retrieval"]["vehicleMatch"];
  error?: string;
}

export function useCase() {
  const [data, setData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(() => Boolean(readStoredId()));
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [turn, setTurn] = useState<StreamingTurn | null>(null);
  const [report, setReport] = useState<DiagnoseResult | null>(null);
  const [reportState, setReportState] = useState<{ kind: "idle" | "running" } | { kind: "error"; message: string }>({ kind: "idle" });
  const idRef = useRef<string | null>(readStoredId());
  const creating = useRef<Promise<string> | null>(null);
  const chatAbort = useRef<AbortController | null>(null);

  // Restore the case from a previous visit.
  useEffect(() => {
    const id = idRef.current;
    if (!id) return;
    const ctrl = new AbortController();
    api
      .getCase(id, ctrl.signal)
      .then(async (c) => {
        setData(c);
        if (c.hasReport) setReport(await api.getReport(c.id, ctrl.signal).catch(() => null));
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        if (err instanceof ApiError && err.status === 404) {
          idRef.current = null;
          storeId(null);
        } else setError(err instanceof Error ? err.message : "Could not load the case.");
      })
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
  }, []);

  /** Return the current case id, creating a case on first use. */
  const ensure = useCallback(async (): Promise<string> => {
    if (idRef.current) return idRef.current;
    creating.current ??= api
      .createCase()
      .then((c) => {
        idRef.current = c.id;
        storeId(c.id);
        setData(c);
        return c.id;
      })
      .finally(() => (creating.current = null));
    return creating.current;
  }, []);

  const saveVehicle = useCallback(
    async (vehicle: Vehicle) => {
      const id = await ensure();
      setData(await api.updateVehicle(id, vehicle));
    },
    [ensure],
  );

  const upload = useCallback(
    async (files: File[]) => {
      let id: string;
      try {
        id = await ensure();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not start a case.");
        return;
      }
      const entries = files.map((f, i) => ({
        key: `${Date.now()}-${i}-${f.name}`,
        name: f.name,
        size: f.size,
        progress: 0,
        stage: "uploading" as const,
      }));
      setUploads((u) => [...u, ...entries]);
      const patch = (key: string, p: Partial<PendingUpload>) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, ...p } : x)));

      // One request per file so each gets its own progress and result; two at a time.
      const queue = [...entries.map((e, i) => ({ e, f: files[i] }))];
      const worker = async () => {
        for (let job = queue.shift(); job; job = queue.shift()) {
          const { e, f } = job;
          try {
            const res = await api.uploadDocuments(id, [f], (fraction) =>
              patch(e.key, { progress: fraction, stage: fraction >= 1 ? "processing" : "uploading" }),
            );
            setData(res.case);
            const r = res.results[0];
            if (r && !r.ok) patch(e.key, { stage: "failed", error: r.message });
            else setUploads((u) => u.filter((x) => x.key !== e.key));
          } catch (err) {
            patch(e.key, { stage: "failed", error: err instanceof Error ? err.message : "Upload failed." });
          }
        }
      };
      await Promise.all([worker(), worker()]);
    },
    [ensure],
  );

  const dismissUpload = useCallback((key: string) => setUploads((u) => u.filter((x) => x.key !== key)), []);

  const removeDocument = useCallback(async (docId: string) => {
    if (!idRef.current) return;
    setData(await api.removeDocument(idRef.current, docId));
  }, []);

  const send = useCallback(
    async (message: string, language: string) => {
      const id = await ensure();
      chatAbort.current?.abort();
      const ctrl = new AbortController();
      chatAbort.current = ctrl;
      setTurn({ user: message, reply: "", sources: [] });
      await api.chat(
        id,
        message,
        language,
        {
          onSources: (sources, vehicleMatch) => setTurn((t) => t && { ...t, sources, vehicleMatch }),
          onDelta: (text) => setTurn((t) => t && { ...t, reply: t.reply + text }),
          onDone: ({ user, assistant }) => {
            setData((c) => c && { ...c, messages: [...c.messages, user, assistant] });
            setTurn(null);
          },
          onError: (message) => setTurn((t) => t && { ...t, error: message }),
        },
        ctrl.signal,
      );
    },
    [ensure],
  );

  const dismissTurn = useCallback(() => setTurn(null), []);

  const generateReport = useCallback(async (language: string) => {
    if (!idRef.current) return;
    setReportState({ kind: "running" });
    try {
      const r = await api.generateReport(idRef.current, language);
      setReport(r);
      setData((c) => c && { ...c, hasReport: true });
      setReportState({ kind: "idle" });
    } catch (err) {
      setReportState({ kind: "error", message: err instanceof Error ? err.message : "The report could not be generated." });
    }
  }, []);

  const newCase = useCallback(() => {
    chatAbort.current?.abort();
    idRef.current = null;
    storeId(null);
    setData(null);
    setUploads([]);
    setTurn(null);
    setReport(null);
    setReportState({ kind: "idle" });
    setError(null);
  }, []);

  const messages: ChatMessage[] = data?.messages ?? [];
  return {
    data,
    messages,
    loading,
    error,
    uploads,
    turn,
    report,
    reportState,
    saveVehicle,
    upload,
    dismissUpload,
    removeDocument,
    send,
    dismissTurn,
    generateReport,
    newCase,
  };
}

export type CaseState = ReturnType<typeof useCase>;
