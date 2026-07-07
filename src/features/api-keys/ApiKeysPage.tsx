import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clipboard, KeyRound, Loader2, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type ApiKey,
  type ApiKeyMode,
  type ApiKeyStatus,
  type CreateApiKeyResult
} from "../../api/api-keys";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { authStore } from "../../lib/auth-store";
import { formatDate } from "../../lib/format";

export function ApiKeysPage() {
  const queryClient = useQueryClient();
  const businessId = authStore((state) => state.selectedBusinessId);
  const selectedMode = authStore((state) => state.selectedMode);
  const [statusFilter, setStatusFilter] = useState<ApiKeyStatus | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResult | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      limit: 20,
      mode: selectedMode,
      ...(statusFilter !== "ALL" ? { status: statusFilter } : {})
    }),
    [selectedMode, statusFilter]
  );

  const apiKeysQuery = useQuery({
    queryKey: ["api-keys", businessId, queryParams],
    queryFn: () => listApiKeys(businessId!, queryParams),
    enabled: Boolean(businessId)
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; mode: ApiKeyMode; expiresAt?: string }) => createApiKey(businessId!, payload),
    onSuccess: async (result) => {
      setCreatedKey(result);
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["api-keys", businessId] });
    }
  });

  const revokeMutation = useMutation({
    mutationFn: (apiKeyId: string) => revokeApiKey(businessId!, apiKeyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["api-keys", businessId] });
    }
  });

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setCreatedKey(null);

    const form = new FormData(event.currentTarget);
    const expiresAtDate = String(form.get("expiresAt") ?? "").trim();

    try {
      await createMutation.mutateAsync({
        name: String(form.get("name")),
        mode: selectedMode,
        expiresAt: expiresAtDate ? new Date(expiresAtDate).toISOString() : undefined
      });
      event.currentTarget.reset();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not create API key");
    }
  }

  async function copySecret() {
    if (!createdKey?.secret) return;
    await navigator.clipboard.writeText(createdKey.secret);
    setCopiedSecret(true);
    window.setTimeout(() => setCopiedSecret(false), 1800);
  }

  return (
    <>
      <PageHeader
        title="API keys"
        description="Create test and live keys for the selected business, copy newly-created secrets, and revoke keys safely."
        action={
          <button
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!businessId}
            type="button"
            onClick={() => {
              setCreateOpen((current) => !current);
              setFormError(null);
            }}
          >
            <Plus size={17} />
            New API key
          </button>
        }
      />

      {!businessId ? (
        <EmptyState
          title="Select a business first"
          description="API keys are tied to a business. Choose one from the dashboard header or create a business first."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <section className="rounded-lg border border-line bg-white shadow-panel">
            <div className="flex flex-col gap-4 border-b border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold">Business API keys</h2>
                <p className="mt-1 text-sm text-muted">
                  Showing {selectedMode.toLowerCase()} keys for the selected business. Use the dashboard switch to change environment.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="inline-flex items-center rounded-md border border-line bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  {selectedMode} mode
                </span>
                <select
                  className="rounded-md border border-line bg-white px-3 py-2 text-sm"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as ApiKeyStatus | "ALL")}
                >
                  <option value="ALL">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="REVOKED">Revoked</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
            </div>

            {apiKeysQuery.isLoading ? (
              <div className="flex min-h-60 items-center justify-center">
                <Loader2 className="animate-spin text-muted" size={24} />
              </div>
            ) : apiKeysQuery.isError ? (
              <div className="m-5 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {apiKeysQuery.error instanceof Error ? apiKeysQuery.error.message : "Could not load API keys"}
              </div>
            ) : (apiKeysQuery.data?.apiKeys.length ?? 0) === 0 ? (
              <EmptyState
                title={`No ${selectedMode.toLowerCase()} API keys found`}
                description={`Create a ${selectedMode.toLowerCase()} key for this business, or switch environment from the dashboard header.`}
              />
            ) : (
              <div className="divide-y divide-line">
                {apiKeysQuery.data?.apiKeys.map((apiKey) => (
                  <ApiKeyRow
                    apiKey={apiKey}
                    key={apiKey.id}
                    revoking={revokeMutation.isPending}
                    onRevoke={() => revokeMutation.mutate(apiKey.id)}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            {createdKey && (
              <section className="rounded-lg border border-emerald-100 bg-emerald-50 p-5 shadow-panel">
                <div className="flex items-center gap-2 text-emerald-800">
                  <ShieldAlert size={19} />
                  <h2 className="font-semibold">Copy this key now</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  {createdKey.warning}
                </p>
                <div className="mt-4 rounded-md border border-emerald-200 bg-white p-3">
                  <code className="block break-all text-sm text-slate-800">{createdKey.secret}</code>
                </div>
                <button
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
                  type="button"
                  onClick={copySecret}
                >
                  {copiedSecret ? <Check size={17} /> : <Clipboard size={17} />}
                  {copiedSecret ? "Copied" : "Copy secret"}
                </button>
              </section>
            )}

            {createOpen && (
              <form className="rounded-lg border border-line bg-white p-5 shadow-panel" onSubmit={handleCreate}>
                <h2 className="font-semibold">Create API key</h2>
                <p className="mt-1 text-sm text-muted">The secret is shown once after creation.</p>

                <label className="mt-5 block text-sm font-medium">
                  Name
                  <input className="mt-2 w-full rounded-md border border-line px-3 py-2" name="name" placeholder="Backend server key" required />
                </label>

                <label className="mt-4 block text-sm font-medium">
                  Environment
                  <div className="mt-2 rounded-md border border-line bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                    {selectedMode} mode
                  </div>
                </label>

                <label className="mt-4 block text-sm font-medium">
                  Expires at
                  <input className="mt-2 w-full rounded-md border border-line px-3 py-2" name="expiresAt" type="datetime-local" />
                </label>

                {formError && <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>}

                <button className="mt-5 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create key"}
                </button>
              </form>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function ApiKeyRow({
  apiKey,
  revoking,
  onRevoke
}: {
  apiKey: ApiKey;
  revoking: boolean;
  onRevoke: () => void;
}) {
  const status = getKeyStatus(apiKey);

  return (
    <article className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <KeyRound size={18} className="text-muted" />
          <h3 className="font-semibold">{apiKey.name}</h3>
          <StatusBadge tone={apiKey.mode === "LIVE" ? "success" : "neutral"}>{apiKey.mode}</StatusBadge>
          <StatusBadge tone={status === "ACTIVE" ? "success" : status === "EXPIRED" ? "warning" : "danger"}>{status}</StatusBadge>
        </div>
        <p className="mt-2 text-sm text-muted">
          Prefix <span className="font-mono text-slate-700">{apiKey.prefix}</span> · Created {formatDate(apiKey.createdAt)}
        </p>
        <p className="mt-1 text-xs text-muted">
          Last used {formatDate(apiKey.lastUsedAt)} · Expires {formatDate(apiKey.expiresAt)}
        </p>
      </div>

      <button
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={status === "REVOKED" || revoking}
        type="button"
        onClick={onRevoke}
      >
        <Trash2 size={15} />
        Revoke
      </button>
    </article>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-8 text-center shadow-panel">
      <KeyRound className="mx-auto text-muted" size={32} />
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
    </div>
  );
}

function getKeyStatus(apiKey: ApiKey): ApiKeyStatus {
  if (apiKey.revokedAt) return "REVOKED";
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) <= new Date()) return "EXPIRED";
  return "ACTIVE";
}
