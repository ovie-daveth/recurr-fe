import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CreditCard, Loader2, Pause, Play, Plus, Repeat2, X } from "lucide-react";
import { FormEvent, type ReactNode, useState } from "react";
import { listCustomers } from "../../api/customers";
import { listPaymentMethods, type PaymentMethod } from "../../api/payment-methods";
import { listPlans } from "../../api/plans";
import {
  cancelSubscription,
  changeSubscriptionPlan,
  createSubscription,
  listSubscriptions,
  pauseSubscription,
  resumeSubscription,
  type ChangeSubscriptionPlanPayload,
  type CreateSubscriptionPayload,
  type Subscription,
  type SubscriptionStatus
} from "../../api/subscriptions";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { authStore } from "../../lib/auth-store";
import { formatDate, formatMoney } from "../../lib/format";

type ConfirmAction =
  | { type: "pause"; subscription: Subscription }
  | { type: "resume"; subscription: Subscription }
  | { type: "cancel_later"; subscription: Subscription }
  | { type: "cancel_now"; subscription: Subscription };

export function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const businessId = authStore((state) => state.selectedBusinessId);
  const selectedMode = authStore((state) => state.selectedMode);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [createCustomerId, setCreateCustomerId] = useState("");
  const [changingSubscription, setChangingSubscription] = useState<Subscription | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const context = businessId ? { businessId, mode: selectedMode } : null;

  const subscriptionsQuery = useQuery({
    queryKey: ["subscriptions", businessId, selectedMode, statusFilter],
    queryFn: () =>
      listSubscriptions(context!, {
        limit: 20,
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {})
      }),
    enabled: Boolean(context)
  });

  const customersQuery = useQuery({
    queryKey: ["customers", businessId, selectedMode, "subscription-select"],
    queryFn: () => listCustomers(context!, { limit: 100, status: "ACTIVE" }),
    enabled: Boolean(context)
  });

  const plansQuery = useQuery({
    queryKey: ["plans", businessId, selectedMode, "subscription-select"],
    queryFn: () => listPlans(context!, { limit: 100, status: "ACTIVE" }),
    enabled: Boolean(context)
  });

  const paymentMethodsQuery = useQuery({
    queryKey: ["payment-methods", businessId, selectedMode, createCustomerId, "subscription-create"],
    queryFn: () => listPaymentMethods(context!, createCustomerId, { status: "ACTIVE" }),
    enabled: Boolean(context && createOpen && createCustomerId)
  });

  const invalidateSubscriptions = () => queryClient.invalidateQueries({ queryKey: ["subscriptions", businessId, selectedMode] });
  const invalidateInvoices = () => queryClient.invalidateQueries({ queryKey: ["invoices", businessId, selectedMode] });

  const createMutation = useMutation({
    mutationFn: (payload: CreateSubscriptionPayload) => createSubscription(context!, payload),
    onSuccess: async () => {
      setCreateOpen(false);
      await Promise.all([invalidateSubscriptions(), invalidateInvoices()]);
    }
  });

  const pauseMutation = useMutation({
    mutationFn: (subscriptionId: string) => pauseSubscription(context!, subscriptionId),
    onSuccess: async () => {
      setConfirmAction(null);
      setActionError(null);
      await invalidateSubscriptions();
    },
    onError: (error) => setActionError(error instanceof Error ? error.message : "Could not pause subscription")
  });

  const resumeMutation = useMutation({
    mutationFn: (subscriptionId: string) => resumeSubscription(context!, subscriptionId),
    onSuccess: async () => {
      setConfirmAction(null);
      setActionError(null);
      await invalidateSubscriptions();
    },
    onError: (error) => setActionError(error instanceof Error ? error.message : "Could not resume subscription")
  });

  const cancelMutation = useMutation({
    mutationFn: ({ subscriptionId, cancelAtPeriodEnd }: { subscriptionId: string; cancelAtPeriodEnd: boolean }) =>
      cancelSubscription(context!, subscriptionId, cancelAtPeriodEnd),
    onSuccess: async () => {
      setConfirmAction(null);
      setActionError(null);
      await invalidateSubscriptions();
    },
    onError: (error) => setActionError(error instanceof Error ? error.message : "Could not cancel subscription")
  });

  const changePlanMutation = useMutation({
    mutationFn: ({ subscriptionId, payload }: { subscriptionId: string; payload: ChangeSubscriptionPlanPayload }) =>
      changeSubscriptionPlan(context!, subscriptionId, payload),
    onSuccess: async () => {
      setChangingSubscription(null);
      await Promise.all([invalidateSubscriptions(), invalidateInvoices()]);
    }
  });

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    createMutation.mutate(buildCreatePayload(new FormData(event.currentTarget)), {
      onError: (error) => setFormError(error instanceof Error ? error.message : "Could not create subscription")
    });
  }

  function handleChangePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!changingSubscription) return;
    setFormError(null);
    changePlanMutation.mutate(
      {
        subscriptionId: changingSubscription.id,
        payload: buildChangePlanPayload(new FormData(event.currentTarget))
      },
      { onError: (error) => setFormError(error instanceof Error ? error.message : "Could not change subscription plan") }
    );
  }

  function openConfirmAction(action: ConfirmAction) {
    setActionError(null);
    setConfirmAction(action);
  }

  function runConfirmedAction() {
    if (!confirmAction) return;

    if (confirmAction.type === "pause") {
      pauseMutation.mutate(confirmAction.subscription.id);
      return;
    }

    if (confirmAction.type === "resume") {
      resumeMutation.mutate(confirmAction.subscription.id);
      return;
    }

    cancelMutation.mutate({
      subscriptionId: confirmAction.subscription.id,
      cancelAtPeriodEnd: confirmAction.type === "cancel_later"
    });
  }

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description={`Create and manage ${selectedMode.toLowerCase()} recurring subscriptions for the selected business.`}
        action={
          <button
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!context}
            type="button"
            onClick={() => {
              setCreateOpen(true);
              setCreateCustomerId("");
              setFormError(null);
            }}
          >
            <Plus size={17} />
            New subscription
          </button>
        }
      />

      {!context ? (
        <EmptyState title="Select a business first" description="Subscriptions are scoped to a business workspace." />
      ) : (
        <section className="rounded-lg border border-line bg-white shadow-panel">
          <div className="flex flex-col gap-4 border-b border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold">Subscription records</h2>
              <p className="mt-1 text-sm text-muted">Showing {selectedMode.toLowerCase()} subscriptions.</p>
            </div>
            <select
              className="rounded-md border border-line bg-white px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as SubscriptionStatus | "ALL")}
            >
              <option value="ALL">All statuses</option>
              <option value="INCOMPLETE">Incomplete</option>
              <option value="TRIALING">Trialing</option>
              <option value="ACTIVE">Active</option>
              <option value="PAST_DUE">Past due</option>
              <option value="PAUSED">Paused</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {subscriptionsQuery.isLoading ? (
            <div className="flex min-h-60 items-center justify-center">
              <Loader2 className="animate-spin text-muted" size={24} />
            </div>
          ) : subscriptionsQuery.isError ? (
            <div className="m-5 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {subscriptionsQuery.error instanceof Error ? subscriptionsQuery.error.message : "Could not load subscriptions"}
            </div>
          ) : (subscriptionsQuery.data?.subscriptions.length ?? 0) === 0 ? (
            <EmptyState title="No subscriptions found" description="Create a subscription after adding a customer, plan, and reusable payment method." />
          ) : (
            <div className="divide-y divide-line">
              {subscriptionsQuery.data?.subscriptions.map((subscription) => (
                <article className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between" key={subscription.id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{subscription.plan?.name ?? subscription.planId}</h3>
                      <StatusBadge tone={subscriptionTone(subscription.status)}>{subscription.status}</StatusBadge>
                      <StatusBadge>{subscription.mode}</StatusBadge>
                      {subscription.cancelAtPeriodEnd && <StatusBadge tone="warning">CANCELS AT PERIOD END</StatusBadge>}
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {subscription.customer?.email ?? subscription.customerId}
                      {subscription.plan ? ` · ${formatMoney(subscription.plan.amountMinor, subscription.plan.currency)}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Period {formatDate(subscription.currentPeriodStart)} to {formatDate(subscription.currentPeriodEnd)} · Next bill{" "}
                      {formatDate(subscription.nextBillingAt)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Payment method {subscription.paymentMethod?.brand ?? subscription.paymentMethod?.type ?? "ID"}{" "}
                      {subscription.paymentMethod?.last4 ? `•••• ${subscription.paymentMethod.last4}` : subscription.paymentMethodId}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {subscription.status === "PAUSED" ? (
                      <button
                        className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium"
                        type="button"
                        onClick={() => openConfirmAction({ type: "resume", subscription })}
                      >
                        <Play size={15} />
                        Resume
                      </button>
                    ) : (
                      !["CANCELLED", "EXPIRED"].includes(subscription.status) && (
                        <button
                          className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium"
                          type="button"
                          onClick={() => openConfirmAction({ type: "pause", subscription })}
                        >
                          <Pause size={15} />
                          Pause
                        </button>
                      )
                    )}
                    {!["CANCELLED", "EXPIRED"].includes(subscription.status) && (
                      <>
                        <button
                          className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium"
                          type="button"
                          onClick={() => {
                            setChangingSubscription(subscription);
                            setFormError(null);
                          }}
                        >
                          <Repeat2 size={15} />
                          Change plan
                        </button>
                        <button
                          className="inline-flex items-center gap-2 rounded-md border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700"
                          type="button"
                          onClick={() => openConfirmAction({ type: "cancel_later", subscription })}
                        >
                          <Ban size={15} />
                          Cancel later
                        </button>
                        <button
                          className="inline-flex items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700"
                          type="button"
                          onClick={() => openConfirmAction({ type: "cancel_now", subscription })}
                        >
                          <X size={15} />
                          Cancel now
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {createOpen && (
        <Modal title="Create subscription" onClose={() => setCreateOpen(false)}>
          <SubscriptionForm
            customers={customersQuery.data?.customers ?? []}
            error={formError}
            loading={createMutation.isPending}
            paymentMethods={(paymentMethodsQuery.data ?? []).filter((method) => method.reusable)}
            paymentMethodsLoading={paymentMethodsQuery.isLoading}
            plans={plansQuery.data?.plans ?? []}
            selectedCustomerId={createCustomerId}
            onCustomerChange={setCreateCustomerId}
            onSubmit={handleCreate}
          />
        </Modal>
      )}

      {changingSubscription && (
        <Modal title="Change subscription plan" onClose={() => setChangingSubscription(null)}>
          <ChangePlanForm
            currentPlanId={changingSubscription.planId}
            error={formError}
            loading={changePlanMutation.isPending}
            plans={plansQuery.data?.plans ?? []}
            onSubmit={handleChangePlan}
          />
        </Modal>
      )}

      {confirmAction && (
        <ConfirmActionModal
          action={confirmAction}
          error={actionError}
          loading={pauseMutation.isPending || resumeMutation.isPending || cancelMutation.isPending}
          onClose={() => {
            setConfirmAction(null);
            setActionError(null);
          }}
          onConfirm={runConfirmedAction}
        />
      )}
    </>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl">
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

function SubscriptionForm({
  customers,
  plans,
  paymentMethods,
  paymentMethodsLoading,
  selectedCustomerId,
  loading,
  error,
  onCustomerChange,
  onSubmit
}: {
  customers: Array<{ id: string; email: string; name: string | null }>;
  plans: Array<{ id: string; name: string; amountMinor: number; currency: string }>;
  paymentMethods: PaymentMethod[];
  paymentMethodsLoading: boolean;
  selectedCustomerId: string;
  loading: boolean;
  error: string | null;
  onCustomerChange: (customerId: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Customer"
          name="customerId"
          required
          value={selectedCustomerId}
          onChange={(event) => onCustomerChange(event.target.value)}
        >
          <option value="">Select customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name || customer.email}
            </option>
          ))}
        </SelectField>
        <SelectField label="Plan" name="planId" required>
          <option value="">Select plan</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} - {formatMoney(plan.amountMinor, plan.currency)}
            </option>
          ))}
        </SelectField>
        <SelectField label="Payment method" name="paymentMethodId" disabled={!selectedCustomerId || paymentMethodsLoading} required>
          <option value="">
            {!selectedCustomerId
              ? "Select customer first"
              : paymentMethodsLoading
                ? "Loading payment methods..."
                : paymentMethods.length === 0
                  ? "No active reusable payment method"
                  : "Select payment method"}
          </option>
          {paymentMethods.map((method) => (
            <option key={method.id} value={method.id}>
              {method.brand || method.type} {method.last4 ? `**** ${method.last4}` : method.providerPaymentMethodReference || method.id}
            </option>
          ))}
        </SelectField>
        <TextField label="Trial days" name="trialDays" type="number" min="0" max="365" defaultValue="0" />
      </div>
      <p className="mt-3 text-xs text-muted">
        The payment method is the reusable card token Nomba returned after the customer completed setup checkout.
      </p>
      {error && <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <div className="mt-6 flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" disabled={loading} type="submit">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={16} />}
          Create subscription
        </button>
      </div>
    </form>
  );
}

function ChangePlanForm({
  plans,
  currentPlanId,
  loading,
  error,
  onSubmit
}: {
  plans: Array<{ id: string; name: string; amountMinor: number; currency: string }>;
  currentPlanId: string;
  loading: boolean;
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="New plan" name="newPlanId" required>
          <option value="">Select plan</option>
          {plans.map((plan) => (
            <option disabled={plan.id === currentPlanId} key={plan.id} value={plan.id}>
              {plan.name} - {formatMoney(plan.amountMinor, plan.currency)}
            </option>
          ))}
        </SelectField>
        <SelectField label="Effective" name="effective" defaultValue="IMMEDIATE">
          <option value="IMMEDIATE">Immediately</option>
          <option value="PERIOD_END">At period end</option>
        </SelectField>
        <SelectField label="Proration" name="prorationBehavior" defaultValue="CREATE_PRORATION">
          <option value="CREATE_PRORATION">Create proration</option>
          <option value="NONE">No proration</option>
        </SelectField>
      </div>
      {error && <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <div className="mt-6 flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" disabled={loading} type="submit">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Repeat2 size={16} />}
          Change plan
        </button>
      </div>
    </form>
  );
}

function ConfirmActionModal({
  action,
  loading,
  error,
  onClose,
  onConfirm
}: {
  action: ConfirmAction;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const copy = confirmActionCopy(action);
  const planName = action.subscription.plan?.name ?? "this subscription";
  const customer = action.subscription.customer?.email ?? action.subscription.customerId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold">{copy.title}</h2>
          <button aria-label="Close modal" className="rounded-md border border-line p-2 text-muted" disabled={loading} type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-700">{copy.message}</p>
          <div className="mt-4 rounded-lg border border-line bg-slate-50 p-4 text-sm">
            <p className="font-medium">{planName}</p>
            <p className="mt-1 text-muted">{customer}</p>
            <p className="mt-1 text-muted">Current status: {action.subscription.status}</p>
          </div>
          {error && <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          <div className="mt-6 flex justify-end gap-3">
            <button className="rounded-md border border-line px-4 py-2 text-sm font-medium" disabled={loading} type="button" onClick={onClose}>
              No, go back
            </button>
            <button
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                copy.danger ? "bg-rose-600" : "bg-ink"
              }`}
              disabled={loading}
              type="button"
              onClick={onConfirm}
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              {copy.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TextField({ label, name, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand-500" name={name} {...props} />
    </label>
  );
}

function SelectField({
  label,
  name,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; name: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <select className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-500" name={name} {...props}>
        {children}
      </select>
    </label>
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

function buildCreatePayload(formData: FormData): CreateSubscriptionPayload {
  const trialDays = Number(formData.get("trialDays") || 0);
  return {
    customerId: String(formData.get("customerId") || ""),
    planId: String(formData.get("planId") || ""),
    paymentMethodId: String(formData.get("paymentMethodId") || ""),
    ...(trialDays > 0 ? { trialDays } : {})
  };
}

function buildChangePlanPayload(formData: FormData): ChangeSubscriptionPlanPayload {
  return {
    newPlanId: String(formData.get("newPlanId") || ""),
    effective: String(formData.get("effective") || "IMMEDIATE") as ChangeSubscriptionPlanPayload["effective"],
    prorationBehavior: String(formData.get("prorationBehavior") || "CREATE_PRORATION") as ChangeSubscriptionPlanPayload["prorationBehavior"]
  };
}

function subscriptionTone(status: SubscriptionStatus) {
  if (["ACTIVE", "TRIALING"].includes(status)) return "success";
  if (["INCOMPLETE", "PAST_DUE", "PAUSED"].includes(status)) return "warning";
  if (["CANCELLED", "EXPIRED"].includes(status)) return "danger";
  return "neutral";
}

function confirmActionCopy(action: ConfirmAction) {
  if (action.type === "pause") {
    return {
      title: "Pause subscription?",
      message: "This will pause recurring billing for this subscription until it is resumed.",
      confirmLabel: "Yes, pause it",
      danger: false
    };
  }

  if (action.type === "resume") {
    return {
      title: "Resume subscription?",
      message: "This will reactivate the subscription and allow future billing to continue.",
      confirmLabel: "Yes, resume it",
      danger: false
    };
  }

  if (action.type === "cancel_later") {
    return {
      title: "Cancel at period end?",
      message: "The customer keeps access until the current billing period ends, then the subscription will stop.",
      confirmLabel: "Yes, cancel later",
      danger: false
    };
  }

  return {
    title: "Cancel subscription now?",
    message: "This cancels the subscription immediately. Future billing for this subscription will stop.",
    confirmLabel: "Yes, cancel now",
    danger: true
  };
}
