import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, ReceiptText, RefreshCcw, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { getInvoice, listInvoices, payInvoice, type Invoice, type InvoiceStatus } from "../../api/invoices";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { authStore } from "../../lib/auth-store";
import { formatDate, formatMoney } from "../../lib/format";

export function InvoicesPage() {
  const queryClient = useQueryClient();
  const businessId = authStore((state) => state.selectedBusinessId);
  const selectedMode = authStore((state) => state.selectedMode);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL">("ALL");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const context = businessId ? { businessId, mode: selectedMode } : null;

  const invoicesQuery = useQuery({
    queryKey: ["invoices", businessId, selectedMode, statusFilter],
    queryFn: () =>
      listInvoices(context!, {
        limit: 20,
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {})
      }),
    enabled: Boolean(context)
  });

  const invoiceDetailQuery = useQuery({
    queryKey: ["invoice", businessId, selectedMode, selectedInvoiceId],
    queryFn: () => getInvoice(context!, selectedInvoiceId!),
    enabled: Boolean(context && selectedInvoiceId)
  });

  const invalidateInvoices = () => queryClient.invalidateQueries({ queryKey: ["invoices", businessId, selectedMode] });

  const payMutation = useMutation({
    mutationFn: (invoiceId: string) => payInvoice(context!, invoiceId),
    onSuccess: async () => {
      await invalidateInvoices();
      if (selectedInvoiceId) {
        await queryClient.invalidateQueries({ queryKey: ["invoice", businessId, selectedMode, selectedInvoiceId] });
      }
    }
  });

  return (
    <>
      <PageHeader
        title="Invoices"
        description={`Track ${selectedMode.toLowerCase()} invoice status and manually retry collection.`}
      />

      {!context ? (
        <EmptyState title="Select a business first" description="Invoices are scoped to a business workspace." />
      ) : (
        <section className="rounded-lg border border-line bg-white shadow-panel">
          <div className="flex flex-col gap-4 border-b border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold">Invoice records</h2>
              <p className="mt-1 text-sm text-muted">Showing {selectedMode.toLowerCase()} invoices.</p>
            </div>
            <select
              className="rounded-md border border-line bg-white px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as InvoiceStatus | "ALL")}
            >
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="OPEN">Open</option>
              <option value="PAYMENT_PROCESSING">Payment processing</option>
              <option value="PAID">Paid</option>
              <option value="PAYMENT_FAILED">Payment failed</option>
              <option value="VOID">Void</option>
              <option value="UNCOLLECTIBLE">Uncollectible</option>
            </select>
          </div>

          {invoicesQuery.isLoading ? (
            <div className="flex min-h-60 items-center justify-center">
              <Loader2 className="animate-spin text-muted" size={24} />
            </div>
          ) : invoicesQuery.isError ? (
            <div className="m-5 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {invoicesQuery.error instanceof Error ? invoicesQuery.error.message : "Could not load invoices"}
            </div>
          ) : (invoicesQuery.data?.invoices.length ?? 0) === 0 ? (
            <EmptyState title="No invoices found" description="Invoices appear after a subscription is created or a billing cycle runs." />
          ) : (
            <div className="divide-y divide-line">
              {invoicesQuery.data?.invoices.map((invoice) => (
                <article className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between" key={invoice.id}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{formatMoney(invoice.amountDueMinor, invoice.currency)}</h3>
                      <StatusBadge tone={invoiceTone(invoice.status)}>{invoice.status}</StatusBadge>
                      <StatusBadge>{invoice.mode}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      Customer {invoice.customer?.email ?? invoice.customerId} · Paid {formatMoney(invoice.amountPaidMinor, invoice.currency)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Due {formatDate(invoice.dueAt)} · Period {formatDate(invoice.periodStart)} to {formatDate(invoice.periodEnd)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Attempts {invoice.attempts?.length ?? 0} · Subscription {invoice.subscriptionId}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium"
                      type="button"
                      onClick={() => setSelectedInvoiceId(invoice.id)}
                    >
                      <Eye size={15} />
                      Details
                    </button>
                    {canPayInvoice(invoice.status) && (
                      <button
                        className="inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={payMutation.isPending}
                        type="button"
                        onClick={() => payMutation.mutate(invoice.id)}
                      >
                        {payMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <RefreshCcw size={15} />}
                        Retry payment
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedInvoiceId && (
        <Modal title="Invoice details" onClose={() => setSelectedInvoiceId(null)}>
          {invoiceDetailQuery.isLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2 className="animate-spin text-muted" size={24} />
            </div>
          ) : invoiceDetailQuery.isError ? (
            <div className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {invoiceDetailQuery.error instanceof Error ? invoiceDetailQuery.error.message : "Could not load invoice"}
            </div>
          ) : invoiceDetailQuery.data ? (
            <InvoiceDetails invoice={invoiceDetailQuery.data} onPay={(id) => payMutation.mutate(id)} paying={payMutation.isPending} />
          ) : null}
        </Modal>
      )}
    </>
  );
}

function InvoiceDetails({ invoice, paying, onPay }: { invoice: Invoice; paying: boolean; onPay: (invoiceId: string) => void }) {
  return (
    <div>
      <div className="grid gap-3 rounded-lg border border-line bg-slate-50 p-4 text-sm md:grid-cols-2">
        <Info label="Status" value={invoice.status} />
        <Info label="Amount due" value={formatMoney(invoice.amountDueMinor, invoice.currency)} />
        <Info label="Amount paid" value={formatMoney(invoice.amountPaidMinor, invoice.currency)} />
        <Info label="Due at" value={formatDate(invoice.dueAt)} />
        <Info label="Paid at" value={formatDate(invoice.paidAt)} />
        <Info label="Customer" value={invoice.customer?.email ?? invoice.customerId} />
      </div>

      <div className="mt-5">
        <h3 className="font-semibold">Items</h3>
        <div className="mt-2 divide-y divide-line rounded-lg border border-line">
          {(invoice.items ?? []).map((item) => (
            <div className="flex items-center justify-between gap-3 p-3 text-sm" key={item.id}>
              <div>
                <p className="font-medium">{item.description}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatDate(item.periodStart)} to {formatDate(item.periodEnd)}
                </p>
              </div>
              <span>{formatMoney(item.amountMinor, item.currency)}</span>
            </div>
          ))}
          {(invoice.items?.length ?? 0) === 0 && <p className="p-3 text-sm text-muted">No invoice items found.</p>}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="font-semibold">Payment attempts</h3>
        <div className="mt-2 divide-y divide-line rounded-lg border border-line">
          {(invoice.attempts ?? []).map((attempt) => (
            <div className="p-3 text-sm" key={attempt.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">Attempt {attempt.attemptNumber}</p>
                <StatusBadge tone={attempt.status === "SUCCEEDED" ? "success" : attempt.status === "FAILED" ? "danger" : "warning"}>{attempt.status}</StatusBadge>
              </div>
              <p className="mt-1 text-xs text-muted">
                {attempt.providerReference ?? attempt.id} · {formatMoney(attempt.amountMinor, attempt.currency)} · {formatDate(attempt.requestedAt)}
              </p>
              {attempt.failureReason && <p className="mt-1 text-xs text-rose-700">{attempt.failureReason}</p>}
            </div>
          ))}
          {(invoice.attempts?.length ?? 0) === 0 && <p className="p-3 text-sm text-muted">No payment attempts found.</p>}
        </div>
      </div>

      {canPayInvoice(invoice.status) && (
        <div className="mt-6 flex justify-end">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={paying}
            type="button"
            onClick={() => onPay(invoice.id)}
          >
            {paying ? <Loader2 className="animate-spin" size={16} /> : <ReceiptText size={16} />}
            Retry payment
          </button>
        </div>
      )}
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

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white px-6 py-12 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}

function canPayInvoice(status: InvoiceStatus) {
  return ["OPEN", "PAYMENT_FAILED"].includes(status);
}

function invoiceTone(status: InvoiceStatus) {
  if (status === "PAID") return "success";
  if (["OPEN", "PAYMENT_PROCESSING", "PAYMENT_FAILED"].includes(status)) return "warning";
  if (["VOID", "UNCOLLECTIBLE"].includes(status)) return "danger";
  return "neutral";
}
