import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CreditCard,
  FileText,
  KeyRound,
  Loader2,
  Plus,
  Receipt,
  ScrollText,
  Users,
  Webhook,
  X
} from "lucide-react";
import { FormEvent, type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { listCustomers } from "../../api/customers";
import {
  fastForwardSubscriptionBilling,
  simulateNombaWebhook,
  type FastForwardSubscriptionBillingResult,
  type SimulateNombaWebhookPayload,
  type SimulateNombaWebhookResult
} from "../../api/dev-tools";
import { listInvoices } from "../../api/invoices";
import { listOperationalLogs } from "../../api/logs";
import { listPaymentAttempts } from "../../api/payment-attempts";
import { listSubscriptions } from "../../api/subscriptions";
import { listWebhookEndpoints } from "../../api/webhooks";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { authStore } from "../../lib/auth-store";
import { formatDate, formatMoney } from "../../lib/format";

export function DashboardPage() {
  const queryClient = useQueryClient();
  const businessId = authStore((state) => state.selectedBusinessId);
  const selectedMode = authStore((state) => state.selectedMode);
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [fastForwardOpen, setFastForwardOpen] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulateNombaWebhookResult | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [fastForwardResult, setFastForwardResult] = useState<FastForwardSubscriptionBillingResult | null>(null);
  const [fastForwardError, setFastForwardError] = useState<string | null>(null);
  const context = businessId ? { businessId, mode: selectedMode } : null;

  const customersQuery = useQuery({
    queryKey: ["dashboard", "customers", businessId, selectedMode],
    queryFn: () => listCustomers(context!, { limit: 100, status: "ACTIVE" }),
    enabled: Boolean(context)
  });

  const activeSubscriptionsQuery = useQuery({
    queryKey: ["dashboard", "subscriptions", businessId, selectedMode],
    queryFn: () => listSubscriptions(context!, { limit: 100, status: "ACTIVE" }),
    enabled: Boolean(context)
  });

  const paidInvoicesQuery = useQuery({
    queryKey: ["dashboard", "paid-invoices", businessId, selectedMode],
    queryFn: () => listInvoices(context!, { limit: 100, status: "PAID" }),
    enabled: Boolean(context)
  });

  const paymentIssuesQuery = useQuery({
    queryKey: ["dashboard", "payment-issues", businessId, selectedMode],
    queryFn: () => listPaymentAttempts(context!, { limit: 100 }),
    enabled: Boolean(context)
  });

  const recentInvoicesQuery = useQuery({
    queryKey: ["dashboard", "recent-invoices", businessId, selectedMode],
    queryFn: () => listInvoices(context!, { limit: 5 }),
    enabled: Boolean(context)
  });

  const recentAttemptsQuery = useQuery({
    queryKey: ["dashboard", "recent-attempts", businessId, selectedMode],
    queryFn: () => listPaymentAttempts(context!, { limit: 5 }),
    enabled: Boolean(context)
  });

  const logsQuery = useQuery({
    queryKey: ["dashboard", "logs", businessId, selectedMode],
    queryFn: () => listOperationalLogs(businessId!, { limit: 5, mode: selectedMode }),
    enabled: Boolean(businessId)
  });

  const webhookEndpointsQuery = useQuery({
    queryKey: ["dashboard", "webhook-endpoints", businessId],
    queryFn: () => listWebhookEndpoints(businessId!, { limit: 20 }),
    enabled: Boolean(businessId)
  });

  const paidVolumeMinor =
    paidInvoicesQuery.data?.invoices.reduce((total, invoice) => total + invoice.amountPaidMinor, 0) ?? 0;
  const activeWebhookCount =
    webhookEndpointsQuery.data?.webhookEndpoints.filter((endpoint) => endpoint.status === "ACTIVE").length ?? 0;
  const paymentIssueCount =
    paymentIssuesQuery.data?.paymentAttempts.filter(
      (attempt) => attempt.status === "FAILED" || Boolean(attempt.failureReason)
    ).length ?? 0;

  const simulateMutation = useMutation({
    mutationFn: (payload: SimulateNombaWebhookPayload) => simulateNombaWebhook(payload),
    onSuccess: async (result) => {
      setSimulationResult(result);
      setSimulationError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions", businessId, selectedMode] }),
        queryClient.invalidateQueries({ queryKey: ["invoices", businessId, selectedMode] }),
        queryClient.invalidateQueries({ queryKey: ["payment-attempts", businessId, selectedMode] }),
        queryClient.invalidateQueries({ queryKey: ["payment-methods", businessId, selectedMode] }),
        queryClient.invalidateQueries({ queryKey: ["provider-webhook-events"] }),
        queryClient.invalidateQueries({ queryKey: ["operational-logs", businessId] })
      ]);
    },
    onError: (error) => {
      setSimulationResult(null);
      setSimulationError(error instanceof Error ? error.message : "Could not simulate webhook");
    }
  });

  const fastForwardMutation = useMutation({
    mutationFn: ({ subscriptionId, minutesAgo }: { subscriptionId: string; minutesAgo: number }) =>
      fastForwardSubscriptionBilling(subscriptionId, {
        businessId: businessId!,
        mode: selectedMode,
        minutesAgo
      }),
    onSuccess: async (result) => {
      setFastForwardResult(result);
      setFastForwardError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions", businessId, selectedMode] }),
        queryClient.invalidateQueries({ queryKey: ["invoices", businessId, selectedMode] }),
        queryClient.invalidateQueries({ queryKey: ["payment-attempts", businessId, selectedMode] }),
        queryClient.invalidateQueries({ queryKey: ["operational-logs", businessId] })
      ]);
    },
    onError: (error) => {
      setFastForwardResult(null);
      setFastForwardError(error instanceof Error ? error.message : "Could not fast-forward billing");
    }
  });

  function handleSimulationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const simulationType = String(formData.get("simulationType") || "hosted_checkout");
    const reference = String(formData.get("reference") || "").trim();

    setSimulationResult(null);
    setSimulationError(null);
    simulateMutation.mutate({
      ...(simulationType === "payment_attempt" ? { merchantTxRef: reference } : { orderReference: reference }),
      amountMinor: toMinorAmount(formData.get("amountMajor")),
      currency: String(formData.get("currency") || "NGN").trim().toUpperCase(),
      eventType: String(formData.get("eventType") || "payment_success") as SimulateNombaWebhookPayload["eventType"],
      mode: "TEST",
      cardId: optionalValue(formData.get("cardId")),
      nombaCustomerId: optionalValue(formData.get("nombaCustomerId")),
      cardBrand: optionalValue(formData.get("cardBrand")),
      cardLast4: optionalValue(formData.get("cardLast4")),
      customerEmail: optionalValue(formData.get("customerEmail")),
      skipTransactionVerification: true
    });
  }

  function handleFastForwardSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const subscriptionId = String(formData.get("subscriptionId") || "").trim();
    const minutesAgo = Number(formData.get("minutesAgo") || 1);

    setFastForwardResult(null);
    setFastForwardError(null);
    fastForwardMutation.mutate({ subscriptionId, minutesAgo });
  }

  return (
    <>
      <PageHeader
        title="Overview"
        description={`A compact operating view for ${selectedMode.toLowerCase()} customers, subscriptions, invoices, attempts, webhooks, and logs.`}
      />

      {!businessId ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-4  sm:grid-cols-2">
            <MetricCard
              icon={Users}
              label="Active customers"
              loading={customersQuery.isLoading}
              value={String(customersQuery.data?.customers.length ?? 0)}
              to="/dashboard/customers"
            />
            <MetricCard
              icon={CreditCard}
              label="Active subscriptions"
              loading={activeSubscriptionsQuery.isLoading}
              value={String(activeSubscriptionsQuery.data?.subscriptions.length ?? 0)}
              to="/dashboard/subscriptions"
            />
            <MetricCard
              icon={Receipt}
              label="Paid invoices"
              loading={paidInvoicesQuery.isLoading}
              subvalue={formatMoney(paidVolumeMinor)}
              value={String(paidInvoicesQuery.data?.invoices.length ?? 0)}
              to="/dashboard/invoices"
            />
            <MetricCard
              icon={AlertTriangle}
              label="Payment issues"
              loading={paymentIssuesQuery.isLoading}
              tone="danger"
              value={String(paymentIssueCount)}
              to="/dashboard/payment-attempts"
            />
          </section>

          <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Quick actions</h2>
                <p className="mt-1 text-sm text-muted">Jump into the core setup and support workflows.</p>
              </div>
              <StatusBadge>{selectedMode}</StatusBadge>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              <QuickAction icon={Plus} label="Create customer" to="/dashboard/customers" />
              <QuickAction icon={FileText} label="Create plan" to="/dashboard/plans" />
              <QuickAction icon={CreditCard} label="Create subscription" to="/dashboard/subscriptions" />
              <QuickAction icon={KeyRound} label="Rotate API key" to="/dashboard/api-keys" />
              <QuickAction icon={Webhook} label="Add webhook" to="/dashboard/webhooks" />
              <QuickAction icon={ScrollText} label="Search logs" to="/dashboard/logs" />
            </div>
          </section>

          <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-panel">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">MVP test tool</h2>
                  <StatusBadge tone="warning">TEST ONLY</StatusBadge>
                </div>
                <p className="mt-1 text-sm text-amber-800">
                  Simulate a Nomba webhook to activate a hosted subscription or settle a recurring payment attempt during the hackathon demo.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={selectedMode !== "TEST" || (activeSubscriptionsQuery.data?.subscriptions.length ?? 0) === 0}
                  type="button"
                  onClick={() => {
                    setFastForwardResult(null);
                    setFastForwardError(null);
                    setFastForwardOpen(true);
                  }}
                >
                  <CalendarClock size={16} />
                  Fast-forward billing
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={selectedMode !== "TEST"}
                  type="button"
                  onClick={() => {
                    setSimulationResult(null);
                    setSimulationError(null);
                    setSimulateOpen(true);
                  }}
                >
                  <Webhook size={16} />
                  Simulate payment
                </button>
              </div>
            </div>
            {selectedMode !== "TEST" && (
              <p className="mt-3 text-xs text-amber-800">Switch the dashboard to Test mode to use the simulator.</p>
            )}
            {selectedMode === "TEST" && (activeSubscriptionsQuery.data?.subscriptions.length ?? 0) === 0 && (
              <p className="mt-3 text-xs text-amber-800">Create an active test subscription before using fast-forward billing.</p>
            )}
          </section>

          <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
            <h2 className="font-semibold">Integration health</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-line p-4">
                <HealthRow
                  label="Webhook endpoints"
                  status={activeWebhookCount > 0 ? "Ready" : "Not configured"}
                  tone={activeWebhookCount > 0 ? "success" : "warning"}
                  value={`${activeWebhookCount} active`}
                />
              </div>
              <div className="rounded-lg border border-line p-4">
                <HealthRow
                  label="Recent errors"
                  status={(logsQuery.data?.logs.some((log) => log.severity === "ERROR") ?? false) ? "Needs review" : "Clean"}
                  tone={(logsQuery.data?.logs.some((log) => log.severity === "ERROR") ?? false) ? "danger" : "success"}
                  value={`${logsQuery.data?.logs.filter((log) => log.severity === "ERROR").length ?? 0} in latest logs`}
                />
              </div>
              <div className="rounded-lg border border-line p-4">
                <HealthRow
                  label="Payment failures"
                  status={paymentIssueCount > 0 ? "Needs review" : "Clean"}
                  tone={paymentIssueCount > 0 ? "danger" : "success"}
                  value={`${paymentIssueCount} issue${paymentIssueCount === 1 ? "" : "s"}`}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <RecentInvoices invoices={recentInvoicesQuery.data?.invoices ?? []} loading={recentInvoicesQuery.isLoading} />
            <RecentAttempts attempts={recentAttemptsQuery.data?.paymentAttempts ?? []} loading={recentAttemptsQuery.isLoading} />
            <RecentLogs logs={logsQuery.data?.logs ?? []} loading={logsQuery.isLoading} />
          </section>
        </div>
      )}

      {simulateOpen && (
        <Modal title="Simulate Nomba payment" onClose={() => setSimulateOpen(false)}>
          <SimulationForm
            error={simulationError}
            loading={simulateMutation.isPending}
            attempts={recentAttemptsQuery.data?.paymentAttempts ?? []}
            result={simulationResult}
            onSubmit={handleSimulationSubmit}
          />
        </Modal>
      )}

      {fastForwardOpen && (
        <Modal title="Fast-forward billing" onClose={() => setFastForwardOpen(false)}>
          <FastForwardBillingForm
            error={fastForwardError}
            loading={fastForwardMutation.isPending}
            result={fastForwardResult}
            subscriptions={activeSubscriptionsQuery.data?.subscriptions ?? []}
            onSubmit={handleFastForwardSubmit}
          />
        </Modal>
      )}
    </>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subvalue,
  loading,
  to,
  tone = "neutral"
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subvalue?: string;
  loading: boolean;
  to: string;
  tone?: "neutral" | "danger";
}) {
  return (
    <Link className="rounded-lg border border-line bg-white p-5 shadow-panel transition hover:-translate-y-0.5 hover:shadow-lg" to={to}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className={`mt-3 text-3xl font-semibold ${tone === "danger" ? "text-rose-700" : "text-ink"}`}>
            {loading ? "-" : value}
          </p>
          {subvalue && <p className="mt-1 text-xs text-muted">{subvalue}</p>}
        </div>
        <div className={`rounded-md p-2 ${tone === "danger" ? "bg-rose-50 text-rose-700" : "bg-brand-50 text-brand-700"}`}>
          <Icon size={20} />
        </div>
      </div>
    </Link>
  );
}

function QuickAction({ icon: Icon, label, to }: { icon: React.ElementType; label: string; to: string }) {
  return (
    <Link className="group flex items-center justify-between rounded-lg border border-line px-4 py-3 text-sm font-medium transition hover:border-brand-200 hover:bg-brand-50" to={to}>
      <span className="inline-flex items-center gap-2">
        <Icon className="text-muted group-hover:text-brand-700" size={17} />
        {label}
      </span>
      <ArrowRight className="text-muted group-hover:text-brand-700" size={16} />
    </Link>
  );
}

function SimulationForm({
  attempts,
  loading,
  error,
  result,
  onSubmit
}: {
  attempts: Array<{
    id: string;
    providerReference: string | null;
    amountMinor: number;
    currency: string;
    status: string;
    customer?: { email: string };
  }>;
  loading: boolean;
  error: string | null;
  result: SimulateNombaWebhookResult | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Simulation type
          <select className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2" name="simulationType" defaultValue="hosted_checkout">
            <option value="hosted_checkout">Hosted checkout/order reference</option>
            <option value="payment_attempt">Recurring attempt/merchantTxRef</option>
          </select>
        </label>
        <TextField label="Reference" name="reference" placeholder="hosted_sub_... or recur_attempt_..." required />
        <TextField label="Amount (NGN)" name="amountMajor" type="number" min="0.01" step="0.01" defaultValue="1" required />
        <TextField label="Currency" name="currency" defaultValue="NGN" required />
        <label className="block text-sm font-medium">
          Event
          <select className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2" name="eventType" defaultValue="payment_success">
            <option value="payment_success">Payment success</option>
            <option value="payment_failed">Payment failed</option>
          </select>
        </label>
        <TextField label="Customer email" name="customerEmail" type="email" placeholder="customer@example.com" />
        <TextField label="Card token" name="cardId" defaultValue="tok_test_5fa12b" />
        <TextField label="Nomba customer ID" name="nombaCustomerId" defaultValue="cus_8821" />
        <TextField label="Card brand" name="cardBrand" defaultValue="Mastercard" />
        <TextField label="Card last4" name="cardLast4" defaultValue="6666" />
      </div>

      <p className="mt-3 text-xs text-muted">
        For hosted subscription checkout, paste the `orderReference` from the callback URL. For recurring charge attempts, paste the `recur_attempt_...` provider reference and use the exact naira amount.
      </p>

      {attempts.length > 0 && (
        <div className="mt-4 rounded-md border border-line bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-muted">Recent recurring attempts to copy from</p>
          <div className="mt-2 space-y-2">
            {attempts.slice(0, 3).map((attempt) => (
              <div className="rounded-md border border-line bg-white p-3 text-xs" key={attempt.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{attempt.customer?.email ?? attempt.id}</span>
                  <StatusBadge tone={attempt.status === "SUCCEEDED" ? "success" : attempt.status === "FAILED" ? "danger" : "warning"}>
                    {attempt.status}
                  </StatusBadge>
                </div>
                <p className="mt-1 break-all text-muted">Reference: {attempt.providerReference ?? "-"}</p>
                <p className="mt-1 text-muted">
                  Amount: {formatMoney(attempt.amountMinor, attempt.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {result && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p className="font-semibold">Webhook simulated</p>
          <p className="mt-1">Status: {result.event?.status ?? "-"}</p>
          <p className="mt-1 break-all">Provider event ID: {result.event?.providerEventId ?? "-"}</p>
          {result.event?.failureReason && <p className="mt-1 text-amber-800">Note: {result.event.failureReason}</p>}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={loading} type="submit">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Webhook size={16} />}
          Run simulation
        </button>
      </div>
    </form>
  );
}

function FastForwardBillingForm({
  subscriptions,
  loading,
  error,
  result,
  onSubmit
}: {
  subscriptions: Array<{
    id: string;
    status: string;
    nextBillingAt: string | null;
    currentPeriodEnd: string;
    customer?: { email: string };
    plan?: { name: string; code: string };
  }>;
  loading: boolean;
  error: string | null;
  result: FastForwardSubscriptionBillingResult | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4">
        <label className="block text-sm font-medium">
          Subscription
          <select className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2" name="subscriptionId" required>
            {subscriptions.map((subscription) => (
              <option key={subscription.id} value={subscription.id}>
                {subscription.plan?.name ?? subscription.plan?.code ?? "Subscription"} - {subscription.customer?.email ?? subscription.id}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Move next billing to
          <select className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2" name="minutesAgo" defaultValue="1">
            <option value="1">1 minute ago</option>
            <option value="5">5 minutes ago</option>
            <option value="30">30 minutes ago</option>
            <option value="60">1 hour ago</option>
            <option value="1440">1 day ago</option>
          </select>
        </label>
      </div>

      <p className="mt-3 text-xs text-muted">
        This makes an active subscription due for recurring billing. The BullMQ worker will charge it on the next billing run.
      </p>

      {error && <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {result && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p className="font-semibold">Billing date fast-forwarded</p>
          <p className="mt-1">Subscription: {result.subscription.id}</p>
          <p className="mt-1">Next billing: {result.subscription.nextBillingAt ? formatDate(result.subscription.nextBillingAt) : "-"}</p>
          <p className="mt-1 text-emerald-700">{result.workerHint}</p>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading || subscriptions.length === 0}
          type="submit"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <CalendarClock size={16} />}
          Fast-forward billing
        </button>
      </div>
    </form>
  );
}

function TextField({
  label,
  name,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-brand-500" name={name} {...props} />
    </label>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold">{title}</h2>
          <button aria-label="Close modal" className="rounded-md border border-line p-2 text-muted" type="button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function HealthRow({ label, status, value, tone }: { label: string; status: string; value: string; tone: "success" | "warning" | "danger" }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-4 last:border-0 last:pb-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted">{value}</p>
      </div>
      <StatusBadge tone={tone}>{status}</StatusBadge>
    </div>
  );
}

function RecentInvoices({ invoices, loading }: { invoices: Array<{ id: string; status: string; amountDueMinor: number; currency: string; customer?: { email: string }; createdAt: string }>; loading: boolean }) {
  return (
    <Panel title="Recent invoices" to="/dashboard/invoices">
      {loading ? <MiniLoader /> : invoices.length === 0 ? <EmptyPanelText text="No invoices yet." /> : invoices.map((invoice) => (
        <div className="border-b border-line py-3 last:border-0" key={invoice.id}>
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium">{invoice.customer?.email ?? invoice.id}</p>
            <StatusBadge tone={invoice.status === "PAID" ? "success" : invoice.status === "PAYMENT_FAILED" ? "danger" : "warning"}>{invoice.status}</StatusBadge>
          </div>
          <p className="mt-1 text-xs text-muted">{formatMoney(invoice.amountDueMinor, invoice.currency)} · {formatDate(invoice.createdAt)}</p>
        </div>
      ))}
    </Panel>
  );
}

function RecentAttempts({ attempts, loading }: { attempts: Array<{ id: string; status: string; amountMinor: number; currency: string; customer?: { email: string }; createdAt: string; failureReason: string | null }>; loading: boolean }) {
  return (
    <Panel title="Recent attempts" to="/dashboard/payment-attempts">
      {loading ? <MiniLoader /> : attempts.length === 0 ? <EmptyPanelText text="No payment attempts yet." /> : attempts.map((attempt) => (
        <div className="border-b border-line py-3 last:border-0" key={attempt.id}>
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium">{attempt.customer?.email ?? attempt.id}</p>
            <StatusBadge tone={attempt.status === "SUCCEEDED" ? "success" : attempt.status === "FAILED" ? "danger" : "warning"}>{attempt.status}</StatusBadge>
          </div>
          <p className="mt-1 text-xs text-muted">{formatMoney(attempt.amountMinor, attempt.currency)} · {formatDate(attempt.createdAt)}</p>
          {attempt.failureReason && <p className="mt-1 truncate text-xs text-rose-700">{attempt.failureReason}</p>}
        </div>
      ))}
    </Panel>
  );
}

function RecentLogs({ logs, loading }: { logs: Array<{ id: string; severity: string; event: string; message: string | null; createdAt: string }>; loading: boolean }) {
  return (
    <Panel title="Recent logs" to="/dashboard/logs">
      {loading ? <MiniLoader /> : logs.length === 0 ? <EmptyPanelText text="No logs yet." /> : logs.map((log) => (
        <div className="border-b border-line py-3 last:border-0" key={log.id}>
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium">{log.event}</p>
            <StatusBadge tone={log.severity === "ERROR" ? "danger" : log.severity === "WARN" ? "warning" : "success"}>{log.severity}</StatusBadge>
          </div>
          <p className="mt-1 truncate text-xs text-muted">{log.message || formatDate(log.createdAt)}</p>
        </div>
      ))}
    </Panel>
  );
}

function Panel({ title, to, children }: { title: string; to: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Link className="text-sm font-medium text-brand-700" to={to}>
          View all
        </Link>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function MiniLoader() {
  return (
    <div className="flex min-h-28 items-center justify-center">
      <Loader2 className="animate-spin text-muted" size={22} />
    </div>
  );
}

function EmptyPanelText({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted">{text}</p>;
}

function EmptyState() {
  return (
    <section className="rounded-lg border border-dashed border-line bg-white px-6 py-12 text-center">
      <Activity className="mx-auto text-muted" size={34} />
      <h2 className="mt-4 font-semibold">Select or create a business</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Dashboard metrics appear after a business workspace is selected.
      </p>
      <Link className="mt-5 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" to="/dashboard/businesses">
        Manage businesses
      </Link>
    </section>
  );
}

function optionalValue(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : undefined;
}

function toMinorAmount(value: FormDataEntryValue | null) {
  const amountMajor = Number(String(value ?? "").trim());
  if (!Number.isFinite(amountMajor) || amountMajor <= 0) {
    return 100;
  }

  return Math.round(amountMajor * 100);
}
