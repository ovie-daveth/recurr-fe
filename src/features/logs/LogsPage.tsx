import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Eye, FileSearch, Loader2, X } from "lucide-react";
import { FormEvent, type ReactNode, useState } from "react";
import {
  getOperationalLog,
  getOperationalLogSummary,
  listOperationalLogs,
  type ListOperationalLogsParams,
  type OperationalLog,
  type OperationalLogSeverity
} from "../../api/logs";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { authStore } from "../../lib/auth-store";
import { formatDate } from "../../lib/format";

type LogFilters = {
  severity: OperationalLogSeverity | "ALL";
  event: string;
  entityType: string;
  entityId: string;
  requestId: string;
};

export function LogsPage() {
  const businessId = authStore((state) => state.selectedBusinessId);
  const selectedMode = authStore((state) => state.selectedMode);
  const [filters, setFilters] = useState<LogFilters>({
    severity: "ALL",
    event: "",
    entityType: "",
    entityId: "",
    requestId: ""
  });
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const queryParams = buildQueryParams(filters, selectedMode);

  const logsQuery = useQuery({
    queryKey: ["operational-logs", businessId, queryParams],
    queryFn: () => listOperationalLogs(businessId!, queryParams),
    enabled: Boolean(businessId)
  });

  const summaryQuery = useQuery({
    queryKey: ["operational-logs-summary", businessId, queryParams],
    queryFn: () => getOperationalLogSummary(businessId!, queryParams),
    enabled: Boolean(businessId)
  });

  const detailQuery = useQuery({
    queryKey: ["operational-log", businessId, selectedLogId],
    queryFn: () => getOperationalLog(businessId!, selectedLogId!),
    enabled: Boolean(businessId && selectedLogId)
  });

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setFilters({
      severity: String(form.get("severity") || "ALL") as LogFilters["severity"],
      event: String(form.get("event") || "").trim(),
      entityType: String(form.get("entityType") || "").trim(),
      entityId: String(form.get("entityId") || "").trim(),
      requestId: String(form.get("requestId") || "").trim()
    });
  }

  function clearFilters() {
    setFilters({
      severity: "ALL",
      event: "",
      entityType: "",
      entityId: "",
      requestId: ""
    });
  }

  return (
    <>
      <PageHeader title="Logs" description={`Search ${selectedMode.toLowerCase()} business operational logs and debug merchant complaints.`} />

      {!businessId ? (
        <EmptyState title="Select a business first" description="Operational logs are scoped to a business workspace." />
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-4">
            <SummaryCard label="Total logs" value={String(summaryQuery.data?.total ?? 0)} loading={summaryQuery.isLoading} />
            <SummaryCard label="Errors" value={String(summaryQuery.data?.bySeverity.ERROR ?? 0)} tone="danger" loading={summaryQuery.isLoading} />
            <SummaryCard label="Warnings" value={String(summaryQuery.data?.bySeverity.WARN ?? 0)} tone="warning" loading={summaryQuery.isLoading} />
            <SummaryCard label="Info" value={String(summaryQuery.data?.bySeverity.INFO ?? 0)} tone="success" loading={summaryQuery.isLoading} />
          </section>

          <section className="rounded-lg border border-line bg-white shadow-panel">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-semibold">Filters</h2>
              <p className="mt-1 text-sm text-muted">Mode follows the dashboard Test/Live switch.</p>
            </div>
            <form className="grid gap-4 p-5 lg:grid-cols-6" onSubmit={handleFilterSubmit}>
              <label className="block text-sm font-medium">
                Severity
                <select className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2" defaultValue={filters.severity} name="severity">
                  <option value="ALL">All</option>
                  <option value="INFO">Info</option>
                  <option value="WARN">Warn</option>
                  <option value="ERROR">Error</option>
                </select>
              </label>
              <TextField defaultValue={filters.event} label="Event" name="event" placeholder="invoice.payment_failed" />
              <TextField defaultValue={filters.entityType} label="Entity type" name="entityType" placeholder="invoice" />
              <TextField defaultValue={filters.entityId} label="Entity ID" name="entityId" />
              <TextField defaultValue={filters.requestId} label="Request ID" name="requestId" />
              <div className="flex items-end gap-2">
                <button className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" type="submit">
                  Apply
                </button>
                <button className="rounded-md border border-line px-4 py-2 text-sm font-medium" type="button" onClick={clearFilters}>
                  Clear
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-lg border border-line bg-white shadow-panel">
            <div className="flex flex-col gap-4 border-b border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold">Operational logs</h2>
                <p className="mt-1 text-sm text-muted">Showing {selectedMode.toLowerCase()} logs for the selected business.</p>
              </div>
              <StatusBadge>{selectedMode}</StatusBadge>
            </div>

            {logsQuery.isLoading ? (
              <LoaderBlock />
            ) : logsQuery.isError ? (
              <ErrorBlock message={logsQuery.error instanceof Error ? logsQuery.error.message : "Could not load logs"} />
            ) : (logsQuery.data?.logs.length ?? 0) === 0 ? (
              <EmptyState title="No logs found" description="Try clearing filters or running billing/webhook activity first." />
            ) : (
              <div className="divide-y divide-line">
                {logsQuery.data?.logs.map((log) => (
                  <article className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between" key={log.id}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{log.event}</h3>
                        <StatusBadge tone={severityTone(log.severity)}>{log.severity}</StatusBadge>
                        {log.mode && <StatusBadge>{log.mode}</StatusBadge>}
                      </div>
                      <p className="mt-2 text-sm text-muted">{log.message || "No message"}</p>
                      <p className="mt-1 break-all text-xs text-muted">
                        {log.entityType || "entity"} {log.entityId || "-"} · Request {log.requestId || "-"} · {formatDate(log.createdAt)}
                      </p>
                    </div>
                    <button className="inline-flex shrink-0 items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium" type="button" onClick={() => setSelectedLogId(log.id)}>
                      <Eye size={15} />
                      Details
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
            <h2 className="font-semibold">Top events</h2>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {(summaryQuery.data?.topEvents ?? []).map((event) => (
                <div className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm" key={event.event}>
                  <span className="truncate">{event.event}</span>
                  <span className="font-semibold">{event.count}</span>
                </div>
              ))}
              {(summaryQuery.data?.topEvents.length ?? 0) === 0 && <p className="text-sm text-muted">No event summary yet.</p>}
            </div>
          </section>
        </div>
      )}

      {selectedLogId && (
        <Modal title="Log details" onClose={() => setSelectedLogId(null)}>
          {detailQuery.isLoading ? (
            <LoaderBlock compact />
          ) : detailQuery.isError ? (
            <ErrorBlock message={detailQuery.error instanceof Error ? detailQuery.error.message : "Could not load log"} />
          ) : detailQuery.data ? (
            <LogDetails log={detailQuery.data} />
          ) : null}
        </Modal>
      )}
    </>
  );
}

function LogDetails({ log }: { log: OperationalLog }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-lg border border-line bg-slate-50 p-4 text-sm md:grid-cols-2">
        <Info label="Event" value={log.event} />
        <Info label="Severity" value={log.severity} />
        <Info label="Mode" value={log.mode ?? "-"} />
        <Info label="Created" value={formatDate(log.createdAt)} />
        <Info label="Entity" value={`${log.entityType ?? "-"} ${log.entityId ?? ""}`.trim()} />
        <Info label="Request ID" value={log.requestId ?? "-"} />
        <Info label="Message" value={log.message ?? "-"} />
      </div>
      <div>
        <h3 className="font-semibold">Details</h3>
        <pre className="mt-2 max-h-96 overflow-auto rounded-lg border border-line bg-slate-950 p-4 text-xs text-slate-100">
          {JSON.stringify(log.details ?? {}, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, loading, tone = "neutral" }: { label: string; value: string; loading: boolean; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const toneClass = {
    neutral: "text-ink",
    success: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-rose-700"
  }[tone];

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-panel">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${toneClass}`}>{loading ? "-" : value}</p>
    </div>
  );
}

function TextField({ label, name, defaultValue, placeholder }: { label: string; name: string; defaultValue?: string; placeholder?: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input className="mt-2 w-full rounded-md border border-line px-3 py-2" defaultValue={defaultValue} name={name} placeholder={placeholder} />
    </label>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold">{title}</h2>
          <button aria-label="Close modal" className="rounded-md border border-line p-2 text-muted" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}

function LoaderBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${compact ? "min-h-40" : "min-h-60"}`}>
      <Loader2 className="animate-spin text-muted" size={24} />
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return <div className="m-5 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white px-6 py-12 text-center">
      <FileSearch className="mx-auto text-muted" size={32} />
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}

function buildQueryParams(filters: LogFilters, mode: "TEST" | "LIVE"): ListOperationalLogsParams {
  return {
    limit: 20,
    mode,
    ...(filters.severity !== "ALL" ? { severity: filters.severity } : {}),
    ...(filters.event ? { event: filters.event } : {}),
    ...(filters.entityType ? { entityType: filters.entityType } : {}),
    ...(filters.entityId ? { entityId: filters.entityId } : {}),
    ...(filters.requestId ? { requestId: filters.requestId } : {})
  };
}

function severityTone(severity: OperationalLogSeverity) {
  if (severity === "ERROR") return "danger";
  if (severity === "WARN") return "warning";
  return "success";
}
