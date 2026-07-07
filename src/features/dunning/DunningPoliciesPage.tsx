import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { FormEvent, type ReactNode, useState } from "react";
import {
  createDunningPolicy,
  listDunningPolicies,
  updateDunningPolicy,
  type DunningFinalAction,
  type DunningPolicy,
  type DunningPolicyPayload,
  type DunningPolicyStatus
} from "../../api/dunning-policies";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { authStore } from "../../lib/auth-store";
import { formatDate } from "../../lib/format";

export function DunningPoliciesPage() {
  const queryClient = useQueryClient();
  const businessId = authStore((state) => state.selectedBusinessId);
  const selectedMode = authStore((state) => state.selectedMode);
  const [statusFilter, setStatusFilter] = useState<DunningPolicyStatus | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<DunningPolicy | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const context = businessId ? { businessId, mode: selectedMode } : null;

  const policiesQuery = useQuery({
    queryKey: ["dunning-policies", businessId, selectedMode, statusFilter],
    queryFn: () =>
      listDunningPolicies(context!, {
        limit: 20,
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {})
      }),
    enabled: Boolean(context)
  });

  const invalidatePolicies = () => queryClient.invalidateQueries({ queryKey: ["dunning-policies", businessId, selectedMode] });

  const createMutation = useMutation({
    mutationFn: (payload: DunningPolicyPayload) => createDunningPolicy(context!, payload),
    onSuccess: async () => {
      setCreateOpen(false);
      await invalidatePolicies();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ policyId, payload }: { policyId: string; payload: DunningPolicyPayload }) => updateDunningPolicy(context!, policyId, payload),
    onSuccess: async () => {
      setEditingPolicy(null);
      await invalidatePolicies();
    }
  });

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    createMutation.mutate(buildPolicyPayload(new FormData(event.currentTarget)), {
      onError: (error) => setFormError(error instanceof Error ? error.message : "Could not create dunning policy")
    });
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingPolicy) return;
    setFormError(null);
    updateMutation.mutate(
      { policyId: editingPolicy.id, payload: buildPolicyPayload(new FormData(event.currentTarget)) },
      { onError: (error) => setFormError(error instanceof Error ? error.message : "Could not update dunning policy") }
    );
  }

  return (
    <>
      <PageHeader
        title="Dunning"
        description={`Configure ${selectedMode.toLowerCase()} retry timing and final action after failed subscription payments.`}
        action={
          <button className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!context} type="button" onClick={() => { setCreateOpen(true); setFormError(null); }}>
            <Plus size={17} />
            New policy
          </button>
        }
      />

      {!context ? (
        <EmptyState title="Select a business first" description="Dunning policies are scoped to a business workspace." />
      ) : (
        <section className="rounded-lg border border-line bg-white shadow-panel">
          <div className="flex flex-col gap-4 border-b border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold">Retry policies</h2>
              <p className="mt-1 text-sm text-muted">Showing {selectedMode.toLowerCase()} dunning policies.</p>
            </div>
            <select className="rounded-md border border-line bg-white px-3 py-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as DunningPolicyStatus | "ALL")}>
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>

          {policiesQuery.isLoading ? (
            <LoaderBlock />
          ) : policiesQuery.isError ? (
            <ErrorBlock message={policiesQuery.error instanceof Error ? policiesQuery.error.message : "Could not load dunning policies"} />
          ) : (policiesQuery.data?.dunningPolicies.length ?? 0) === 0 ? (
            <EmptyState title="No policies found" description="Create a policy to control retries after failed subscription payments." />
          ) : (
            <div className="divide-y divide-line">
              {policiesQuery.data?.dunningPolicies.map((policy) => (
                <article className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between" key={policy.id}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{policy.name}</h3>
                      <StatusBadge tone={policy.status === "ACTIVE" ? "success" : "danger"}>{policy.status}</StatusBadge>
                      {policy.isDefault && <StatusBadge tone="warning">DEFAULT</StatusBadge>}
                      <StatusBadge>{policy.mode}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      Final action: {formatFinalAction(policy.finalAction)} · Steps: {policy.steps.length}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {policy.steps.map((step) => `#${step.attemptNumber} after ${formatDelay(step.delayMinutes)}`).join(" -> ")}
                    </p>
                    <p className="mt-1 text-xs text-muted">Created {formatDate(policy.createdAt)}</p>
                  </div>
                  <button className="inline-flex shrink-0 items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium" type="button" onClick={() => { setEditingPolicy(policy); setFormError(null); }}>
                    <Pencil size={15} />
                    Edit
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {createOpen && (
        <Modal title="Create dunning policy" onClose={() => setCreateOpen(false)}>
          <PolicyForm error={formError} loading={createMutation.isPending} onSubmit={handleCreate} />
        </Modal>
      )}

      {editingPolicy && (
        <Modal title={`Edit ${editingPolicy.name}`} onClose={() => setEditingPolicy(null)}>
          <PolicyForm error={formError} loading={updateMutation.isPending} onSubmit={handleUpdate} policy={editingPolicy} />
        </Modal>
      )}
    </>
  );
}

function PolicyForm({ policy, loading, error, onSubmit }: { policy?: DunningPolicy; loading: boolean; error: string | null; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Policy name" name="name" defaultValue={policy?.name ?? "Default retry policy"} required />
        <SelectField label="Status" name="status" defaultValue={policy?.status ?? "ACTIVE"}>
          <option value="ACTIVE">Active</option>
          <option value="DISABLED">Disabled</option>
        </SelectField>
        <SelectField label="Default policy" name="isDefault" defaultValue={String(policy?.isDefault ?? true)}>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </SelectField>
        <SelectField label="Final action" name="finalAction" defaultValue={policy?.finalAction ?? "PAUSE_SUBSCRIPTION"}>
          <option value="PAUSE_SUBSCRIPTION">Pause subscription</option>
          <option value="CANCEL_SUBSCRIPTION">Cancel subscription</option>
          <option value="MARK_INVOICE_UNCOLLECTIBLE">Mark invoice uncollectible</option>
        </SelectField>
        <TextField label="Retry 1 delay minutes" name="step1" type="number" min="1" defaultValue={String(policy?.steps[0]?.delayMinutes ?? 60)} required />
        <TextField label="Retry 2 delay minutes" name="step2" type="number" min="1" defaultValue={String(policy?.steps[1]?.delayMinutes ?? 1440)} />
        <TextField label="Retry 3 delay minutes" name="step3" type="number" min="1" defaultValue={String(policy?.steps[2]?.delayMinutes ?? 4320)} />
        <TextField label="Channel" name="channel" defaultValue={policy?.steps[0]?.channel ?? "email"} required />
      </div>
      {error && <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <div className="mt-6 flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" disabled={loading} type="submit">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <RotateCcw size={16} />}
          Save policy
        </button>
      </div>
    </form>
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

function TextField({ label, name, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand-500" name={name} {...props} />
    </label>
  );
}

function SelectField({ label, name, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; name: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <select className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-500" name={name} {...props}>
        {children}
      </select>
    </label>
  );
}

function LoaderBlock() {
  return (
    <div className="flex min-h-60 items-center justify-center">
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

function buildPolicyPayload(formData: FormData): DunningPolicyPayload {
  const channel = String(formData.get("channel") || "email");
  const steps = ["step1", "step2", "step3"]
    .map((name) => Number(formData.get(name) || 0))
    .filter((delayMinutes) => delayMinutes > 0)
    .map((delayMinutes) => ({ delayMinutes, channel }));

  return {
    name: String(formData.get("name") || ""),
    status: String(formData.get("status") || "ACTIVE") as DunningPolicyStatus,
    isDefault: String(formData.get("isDefault") || "true") === "true",
    finalAction: String(formData.get("finalAction") || "PAUSE_SUBSCRIPTION") as DunningFinalAction,
    steps
  };
}

function formatDelay(minutes: number) {
  if (minutes % 1440 === 0) return `${minutes / 1440}d`;
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  return `${minutes}m`;
}

function formatFinalAction(action: DunningFinalAction) {
  return action.replace(/_/g, " ").toLowerCase();
}
