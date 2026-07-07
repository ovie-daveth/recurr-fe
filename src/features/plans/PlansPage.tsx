import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, FileText, Loader2, Pencil, Plus, X } from "lucide-react";
import { FormEvent, type ReactNode, useState } from "react";
import { getBusiness } from "../../api/businesses";
import {
  archivePlan,
  createPlan,
  listPlans,
  updatePlan,
  type Plan,
  type PlanInterval,
  type PlanPayload,
  type PlanStatus
} from "../../api/plans";
import { PageHeader } from "../../components/ui/PageHeader";
import { CopyButton } from "../../components/ui/CopyButton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { authStore } from "../../lib/auth-store";
import { formatDate, formatMoney } from "../../lib/format";

export function PlansPage() {
  const queryClient = useQueryClient();
  const businessId = authStore((state) => state.selectedBusinessId);
  const selectedMode = authStore((state) => state.selectedMode);
  const [statusFilter, setStatusFilter] = useState<PlanStatus | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const plansQuery = useQuery({
    queryKey: ["plans", businessId, selectedMode, statusFilter],
    queryFn: () =>
      listPlans({ businessId: businessId!, mode: selectedMode }, {
        limit: 20,
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {})
      }),
    enabled: Boolean(businessId)
  });

  const businessQuery = useQuery({
    queryKey: ["business", businessId],
    queryFn: () => getBusiness(businessId!),
    enabled: Boolean(businessId)
  });

  const invalidatePlans = () => queryClient.invalidateQueries({ queryKey: ["plans", businessId, selectedMode] });

  const createMutation = useMutation({
    mutationFn: (payload: PlanPayload) => createPlan({ businessId: businessId!, mode: selectedMode }, payload),
    onSuccess: async () => {
      setCreateOpen(false);
      await invalidatePlans();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ planId, payload }: { planId: string; payload: Partial<PlanPayload> & { status?: PlanStatus } }) =>
      updatePlan({ businessId: businessId!, mode: selectedMode }, planId, payload),
    onSuccess: async () => {
      setEditingPlan(null);
      await invalidatePlans();
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (planId: string) => archivePlan({ businessId: businessId!, mode: selectedMode }, planId),
    onSuccess: invalidatePlans
  });

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    createMutation.mutate(buildPlanPayload(new FormData(event.currentTarget)), {
      onError: (error) => setFormError(error instanceof Error ? error.message : "Could not create plan")
    });
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingPlan) return;
    setFormError(null);
    updateMutation.mutate(
      { planId: editingPlan.id, payload: buildPlanPayload(new FormData(event.currentTarget)) },
      { onError: (error) => setFormError(error instanceof Error ? error.message : "Could not update plan") }
    );
  }

  return (
    <>
      <PageHeader
        title="Plans"
        description={`Create and manage ${selectedMode.toLowerCase()} recurring billing plans.`}
        action={
          <button
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!businessId}
            type="button"
            onClick={() => {
              setCreateOpen(true);
              setFormError(null);
            }}
          >
            <Plus size={17} />
            New plan
          </button>
        }
      />

      {!businessId ? (
        <EmptyState title="Select a business first" description="Plans are scoped to a business workspace." />
      ) : (
        <section className="rounded-lg border border-line bg-white shadow-panel">
          <div className="flex flex-col gap-4 border-b border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold">Billing plans</h2>
              <p className="mt-1 text-sm text-muted">Showing {selectedMode.toLowerCase()} plans.</p>
            </div>
            <select
              className="rounded-md border border-line bg-white px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as PlanStatus | "ALL")}
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {plansQuery.isLoading ? (
            <div className="flex min-h-60 items-center justify-center">
              <Loader2 className="animate-spin text-muted" size={24} />
            </div>
          ) : plansQuery.isError ? (
            <div className="m-5 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {plansQuery.error instanceof Error ? plansQuery.error.message : "Could not load plans"}
            </div>
          ) : (plansQuery.data?.plans.length ?? 0) === 0 ? (
            <EmptyState title="No plans found" description="Create a plan before creating subscriptions." />
          ) : (
            <div className="divide-y divide-line">
              {plansQuery.data?.plans.map((plan) => (
                <article className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between" key={plan.id}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{plan.name}</h3>
                      <StatusBadge tone={plan.status === "ACTIVE" ? "success" : plan.status === "PAUSED" ? "warning" : "danger"}>{plan.status}</StatusBadge>
                      <StatusBadge>{plan.mode}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {formatMoney(plan.amountMinor, plan.currency)} every {plan.intervalCount} {plan.interval.toLowerCase()}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Code {plan.code} · Trial {plan.trialDays} days · Created {formatDate(plan.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {businessQuery.data?.slug && (
                      <CopyButton
                        className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium"
                        value={`${window.location.origin}/subscribe/${businessQuery.data.slug}/${plan.code}?mode=${selectedMode}`}
                        copiedLabel="Copied link"
                      >
                        Copy link
                      </CopyButton>
                    )}
                    <button
                      className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium"
                      type="button"
                      onClick={() => {
                        setEditingPlan(plan);
                        setFormError(null);
                      }}
                    >
                      <Pencil size={15} />
                      Edit
                    </button>
                    {plan.status !== "ARCHIVED" && (
                      <button
                        className="inline-flex items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700"
                        type="button"
                        onClick={() => archiveMutation.mutate(plan.id)}
                      >
                        <Archive size={15} />
                        Archive
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {createOpen && (
        <PlanModal title="Create plan" onClose={() => setCreateOpen(false)}>
          <PlanForm error={formError} loading={createMutation.isPending} onSubmit={handleCreate} title="Create plan" />
        </PlanModal>
      )}

      {editingPlan && (
        <PlanModal title={`Edit ${editingPlan.name}`} onClose={() => setEditingPlan(null)}>
          <PlanForm
            error={formError}
            loading={updateMutation.isPending}
            onCancel={() => setEditingPlan(null)}
            onSubmit={handleUpdate}
            plan={editingPlan}
            title="Edit plan"
          />
        </PlanModal>
      )}
    </>
  );
}

function PlanModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
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

function PlanForm({
  title,
  plan,
  loading,
  error,
  onCancel,
  onSubmit
}: {
  title: string;
  plan?: Plan;
  loading: boolean;
  error: string | null;
  onCancel?: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <TextField label="Name" name="name" defaultValue={plan?.name} required />
        <TextField label="Code" name="code" defaultValue={plan?.code} required />
        <TextField
          label="Amount (NGN)"
          name="amountMajor"
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={plan ? String(plan.amountMinor / 100) : ""}
          required
        />
        <TextField label="Currency" name="currency" defaultValue={plan?.currency ?? "NGN"} required />
        <label className="block text-sm font-medium">
          Interval
          <select className="mt-2 w-full rounded-md border border-line px-3 py-2" name="interval" defaultValue={plan?.interval ?? "MONTH"}>
            <option value="DAY">Day</option>
            <option value="WEEK">Week</option>
            <option value="MONTH">Month</option>
            <option value="YEAR">Year</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </label>
        <TextField label="Interval count" name="intervalCount" type="number" defaultValue={String(plan?.intervalCount ?? 1)} required />
        <TextField label="Trial days" name="trialDays" type="number" defaultValue={String(plan?.trialDays ?? 0)} required />
      </div>
      {error && <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-2 border-t border-line pt-5">
        {onCancel && (
          <button className="rounded-md border border-line px-4 py-2 text-sm font-medium" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" disabled={loading} type="submit">
          {loading ? "Saving..." : "Save plan"}
        </button>
      </div>
    </form>
  );
}

function TextField({
  label,
  name,
  type = "text",
  min,
  step,
  defaultValue,
  required
}: {
  label: string;
  name: string;
  type?: string;
  min?: string;
  step?: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        className="mt-2 w-full rounded-md border border-line px-3 py-2"
        defaultValue={defaultValue ?? ""}
        name={name}
        required={required}
        type={type}
        min={min}
        step={step}
      />
    </label>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-8 text-center shadow-panel">
      <FileText className="mx-auto text-muted" size={32} />
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
    </div>
  );
}

function buildPlanPayload(form: FormData): PlanPayload {
  return {
    name: String(form.get("name")),
    code: String(form.get("code")),
    amountMinor: Math.round(Number(String(form.get("amountMajor"))) * 100),
    currency: String(form.get("currency") || "NGN"),
    interval: String(form.get("interval")) as PlanInterval,
    intervalCount: Number(form.get("intervalCount") || 1),
    trialDays: Number(form.get("trialDays") || 0)
  };
}
