import { useQuery } from "@tanstack/react-query";
import { Eye, Loader2, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import {
  getPaymentAttempt,
  listPaymentAttempts,
  type PaymentAttempt,
  type PaymentAttemptStatus
} from "../../api/payment-attempts";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { authStore } from "../../lib/auth-store";
import { formatDate, formatMoney } from "../../lib/format";

export function PaymentAttemptsPage() {
  const businessId = authStore((state) => state.selectedBusinessId);
  const selectedMode = authStore((state) => state.selectedMode);
  const [statusFilter, setStatusFilter] = useState<PaymentAttemptStatus | "ALL">("ALL");
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const context = businessId ? { businessId, mode: selectedMode } : null;

  const attemptsQuery = useQuery({
    queryKey: ["payment-attempts", businessId, selectedMode, statusFilter],
    queryFn: () =>
      listPaymentAttempts(context!, {
        limit: 20,
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {})
      }),
    enabled: Boolean(context)
  });

  const detailQuery = useQuery({
    queryKey: ["payment-attempt", businessId, selectedMode, selectedAttemptId],
    queryFn: () => getPaymentAttempt(context!, selectedAttemptId!),
    enabled: Boolean(context && selectedAttemptId)
  });

  return (
    <>
      <PageHeader title="Payment attempts" description={`Inspect ${selectedMode.toLowerCase()} recurring charge attempts, references, and failures.`} />

      {!context ? (
        <EmptyState title="Select a business first" description="Payment attempts are scoped to a business workspace." />
      ) : (
        <section className="rounded-lg border border-line bg-white shadow-panel">
          <div className="flex flex-col gap-4 border-b border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold">Attempt records</h2>
              <p className="mt-1 text-sm text-muted">Showing {selectedMode.toLowerCase()} payment attempts.</p>
            </div>
            <select className="rounded-md border border-line bg-white px-3 py-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as PaymentAttemptStatus | "ALL")}>
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SUCCEEDED">Succeeded</option>
              <option value="FAILED">Failed</option>
              <option value="REQUIRES_ACTION">Requires action</option>
              <option value="ABANDONED">Abandoned</option>
            </select>
          </div>

          {attemptsQuery.isLoading ? (
            <LoaderBlock />
          ) : attemptsQuery.isError ? (
            <ErrorBlock message={attemptsQuery.error instanceof Error ? attemptsQuery.error.message : "Could not load payment attempts"} />
          ) : (attemptsQuery.data?.paymentAttempts.length ?? 0) === 0 ? (
            <EmptyState title="No attempts found" description="Attempts appear when Recurr tries to charge a subscription invoice." />
          ) : (
            <div className="divide-y divide-line">
              {attemptsQuery.data?.paymentAttempts.map((attempt) => (
                <article className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between" key={attempt.id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{formatMoney(attempt.amountMinor, attempt.currency)}</h3>
                      <StatusBadge tone={attemptTone(attempt.status)}>{attempt.status}</StatusBadge>
                      <StatusBadge>{attempt.mode}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {attempt.customer?.email ?? attempt.customerId} · Attempt {attempt.attemptNumber}
                    </p>
                    <p className="mt-1 break-all text-xs text-muted">
                      Ref {attempt.providerReference ?? "-"} · Requested {formatDate(attempt.requestedAt)}
                    </p>
                    {attempt.failureReason && <p className="mt-1 text-xs text-rose-700">{attempt.failureReason}</p>}
                  </div>
                  <button className="inline-flex shrink-0 items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium" type="button" onClick={() => setSelectedAttemptId(attempt.id)}>
                    <Eye size={15} />
                    Details
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedAttemptId && (
        <Modal title="Payment attempt details" onClose={() => setSelectedAttemptId(null)}>
          {detailQuery.isLoading ? <LoaderBlock compact /> : detailQuery.isError ? <ErrorBlock message={detailQuery.error instanceof Error ? detailQuery.error.message : "Could not load payment attempt"} /> : detailQuery.data ? <AttemptDetails attempt={detailQuery.data} /> : null}
        </Modal>
      )}
    </>
  );
}

function AttemptDetails({ attempt }: { attempt: PaymentAttempt }) {
  return (
    <div className="grid gap-3 rounded-lg border border-line bg-slate-50 p-4 text-sm md:grid-cols-2">
      <Info label="Status" value={attempt.status} />
      <Info label="Amount" value={formatMoney(attempt.amountMinor, attempt.currency)} />
      <Info label="Provider" value={attempt.provider} />
      <Info label="Provider reference" value={attempt.providerReference ?? "-"} />
      <Info label="Customer" value={attempt.customer?.email ?? attempt.customerId} />
      <Info label="Payment method" value={attempt.paymentMethod?.last4 ? `${attempt.paymentMethod.brand ?? "Card"} ${attempt.paymentMethod.last4}` : attempt.paymentMethodId} />
      <Info label="Requested" value={formatDate(attempt.requestedAt)} />
      <Info label="Processed" value={formatDate(attempt.processedAt)} />
      <Info label="Failure" value={attempt.failureReason ?? "-"} />
      <Info label="Invoice" value={attempt.invoiceId} />
    </div>
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
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}

function attemptTone(status: PaymentAttemptStatus) {
  if (status === "SUCCEEDED") return "success";
  if (["FAILED", "ABANDONED"].includes(status)) return "danger";
  if (["PENDING", "PROCESSING", "REQUIRES_ACTION"].includes(status)) return "warning";
  return "neutral";
}
