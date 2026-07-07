import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, Plus, Send, Trash2, X } from "lucide-react";
import { FormEvent, type ReactNode, useState } from "react";
import {
  createWebhookEndpoint,
  disableWebhookEndpoint,
  listProviderWebhookEvents,
  listWebhookDeliveries,
  listWebhookEndpoints,
  merchantWebhookEvents,
  testWebhookEndpoint,
  type CreateWebhookEndpointPayload,
  type MerchantWebhookEvent,
  type WebhookEndpoint,
  type WebhookEvent
} from "../../api/webhooks";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { authStore } from "../../lib/auth-store";
import { formatDate } from "../../lib/format";

export function WebhooksPage() {
  const queryClient = useQueryClient();
  const businessId = authStore((state) => state.selectedBusinessId);
  const selectedMode = authStore((state) => state.selectedMode);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<WebhookEndpoint | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const endpointsQuery = useQuery({
    queryKey: ["webhook-endpoints", businessId],
    queryFn: () => listWebhookEndpoints(businessId!, { limit: 20 }),
    enabled: Boolean(businessId)
  });

  const deliveriesQuery = useQuery({
    queryKey: ["webhook-deliveries", businessId, selectedEndpoint?.id],
    queryFn: () => listWebhookDeliveries(businessId!, selectedEndpoint!.id, { limit: 20 }),
    enabled: Boolean(businessId && selectedEndpoint)
  });

  const providerEventsQuery = useQuery({
    queryKey: ["provider-webhook-events", selectedMode],
    queryFn: () => listProviderWebhookEvents({ mode: selectedMode, limit: 20 }),
    enabled: Boolean(businessId)
  });

  const invalidateEndpoints = () => queryClient.invalidateQueries({ queryKey: ["webhook-endpoints", businessId] });

  const createMutation = useMutation({
    mutationFn: (payload: CreateWebhookEndpointPayload) => createWebhookEndpoint(businessId!, payload),
    onSuccess: async (result) => {
      setNewSecret(result.signingSecret);
      setCreateOpen(false);
      await invalidateEndpoints();
    },
    onError: (error) => setFormError(error instanceof Error ? error.message : "Could not create webhook endpoint")
  });

  const disableMutation = useMutation({
    mutationFn: (endpointId: string) => disableWebhookEndpoint(businessId!, endpointId),
    onSuccess: invalidateEndpoints
  });

  const testMutation = useMutation({
    mutationFn: (endpointId: string) => testWebhookEndpoint(businessId!, endpointId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["webhook-deliveries", businessId] });
    }
  });

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    createMutation.mutate(buildEndpointPayload(new FormData(event.currentTarget)));
  }

  return (
    <>
      <PageHeader
        title="Webhooks"
        description="Configure merchant endpoints, inspect delivery attempts, and review incoming Nomba events."
        action={
          <button className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!businessId} type="button" onClick={() => { setCreateOpen(true); setFormError(null); }}>
            <Plus size={17} />
            New endpoint
          </button>
        }
      />

      {!businessId ? (
        <EmptyState title="Select a business first" description="Merchant webhook endpoints are scoped to a business workspace." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-lg border border-line bg-white shadow-panel">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-semibold">Merchant endpoints</h2>
              <p className="mt-1 text-sm text-muted">Recurr sends merchant events to these URLs.</p>
            </div>
            {endpointsQuery.isLoading ? (
              <LoaderBlock />
            ) : endpointsQuery.isError ? (
              <ErrorBlock message={endpointsQuery.error instanceof Error ? endpointsQuery.error.message : "Could not load webhook endpoints"} />
            ) : (endpointsQuery.data?.webhookEndpoints.length ?? 0) === 0 ? (
              <EmptyState title="No endpoints found" description="Add an endpoint to receive Recurr events in your merchant app." />
            ) : (
              <div className="divide-y divide-line">
                {endpointsQuery.data?.webhookEndpoints.map((endpoint) => (
                  <article className="p-5" key={endpoint.id}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-all font-semibold">{endpoint.url}</h3>
                          <StatusBadge tone={endpoint.status === "ACTIVE" ? "success" : "danger"}>{endpoint.status}</StatusBadge>
                        </div>
                        <p className="mt-2 text-sm text-muted">{endpoint.description || "No description"}</p>
                        <p className="mt-1 text-xs text-muted">Events: {endpoint.events.join(", ")}</p>
                        <p className="mt-1 text-xs text-muted">Created {formatDate(endpoint.createdAt)}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium" type="button" onClick={() => setSelectedEndpoint(endpoint)}>
                          Deliveries
                        </button>
                        <button className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium" disabled={endpoint.status !== "ACTIVE" || testMutation.isPending} type="button" onClick={() => testMutation.mutate(endpoint.id)}>
                          <Send size={15} />
                          Test
                        </button>
                        {endpoint.status === "ACTIVE" && (
                          <button className="inline-flex items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700" type="button" onClick={() => disableMutation.mutate(endpoint.id)}>
                            <Trash2 size={15} />
                            Disable
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <ProviderEventsPanel events={providerEventsQuery.data?.webhookEvents ?? []} error={providerEventsQuery.error} loading={providerEventsQuery.isLoading} mode={selectedMode} />
        </div>
      )}

      {selectedEndpoint && (
        <Modal title="Webhook deliveries" onClose={() => setSelectedEndpoint(null)}>
          <h3 className="break-all font-semibold">{selectedEndpoint.url}</h3>
          <div className="mt-4">
            {deliveriesQuery.isLoading ? (
              <LoaderBlock compact />
            ) : deliveriesQuery.isError ? (
              <ErrorBlock message={deliveriesQuery.error instanceof Error ? deliveriesQuery.error.message : "Could not load deliveries"} />
            ) : (deliveriesQuery.data?.webhookDeliveries.length ?? 0) === 0 ? (
              <p className="rounded-lg border border-dashed border-line p-5 text-sm text-muted">No deliveries found yet.</p>
            ) : (
              <div className="divide-y divide-line rounded-lg border border-line">
                {deliveriesQuery.data?.webhookDeliveries.map((delivery) => (
                  <div className="p-4 text-sm" key={delivery.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{delivery.eventType}</p>
                      <StatusBadge tone={delivery.status === "DELIVERED" ? "success" : delivery.status === "FAILED" ? "danger" : "warning"}>{delivery.status}</StatusBadge>
                    </div>
                    <p className="mt-1 text-xs text-muted">Attempt {delivery.attemptNumber} · HTTP {delivery.responseStatusCode ?? "-"} · Created {formatDate(delivery.createdAt)}</p>
                    {delivery.lastError && <p className="mt-1 text-xs text-rose-700">{delivery.lastError}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {createOpen && (
        <Modal title="Create webhook endpoint" onClose={() => setCreateOpen(false)}>
          <EndpointForm error={formError} loading={createMutation.isPending} onSubmit={handleCreate} />
        </Modal>
      )}

      {newSecret && (
        <Modal title="Webhook signing secret" onClose={() => setNewSecret(null)}>
          <p className="text-sm text-muted">Store this now. Recurr only shows this signing secret once.</p>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-slate-50 p-3">
            <code className="min-w-0 flex-1 break-all text-sm">{newSecret}</code>
            <button className="rounded-md border border-line p-2 text-muted" type="button" onClick={() => navigator.clipboard.writeText(newSecret)}>
              <Copy size={16} />
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function ProviderEventsPanel({ events, loading, error, mode }: { events: WebhookEvent[]; loading: boolean; error: unknown; mode: "TEST" | "LIVE" }) {
  return (
    <section className="rounded-lg border border-line bg-white shadow-panel">
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-semibold">Nomba events</h2>
        <p className="mt-1 text-sm text-muted">Incoming {mode.toLowerCase()} provider webhooks received by Recurr.</p>
      </div>
      {loading ? (
        <LoaderBlock />
      ) : error ? (
        <ErrorBlock message={error instanceof Error ? error.message : "Could not load Nomba events"} />
      ) : events.length === 0 ? (
        <EmptyState title="No Nomba events found" description="Provider events appear after Nomba sends webhooks to Recurr." />
      ) : (
        <div className="divide-y divide-line">
          {events.map((event) => (
            <article className="p-5" key={event.id}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{event.eventType}</h3>
                <StatusBadge tone={event.status === "PROCESSED" ? "success" : event.status === "FAILED" ? "danger" : "warning"}>{event.status}</StatusBadge>
                <StatusBadge>{event.mode}</StatusBadge>
              </div>
              <p className="mt-2 break-all text-xs text-muted">Provider event ID {event.providerEventId}</p>
              <p className="mt-1 text-xs text-muted">Received {formatDate(event.receivedAt)}</p>
              {event.failureReason && <p className="mt-1 text-xs text-rose-700">{event.failureReason}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function EndpointForm({ loading, error, onSubmit }: { loading: boolean; error: string | null; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4">
        <TextField label="Webhook URL" name="url" placeholder="https://merchant.app/webhooks/recurr" required type="url" />
        <TextField label="Description" name="description" placeholder="Production billing webhook" />
        <label className="block text-sm font-medium">
          Events
          <select className="mt-1 h-40 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-500" multiple name="events" defaultValue={["*"]}>
            {merchantWebhookEvents.map((event) => (
              <option key={event} value={event}>
                {event}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <div className="mt-6 flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" disabled={loading} type="submit">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
          Create endpoint
        </button>
      </div>
    </form>
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

function TextField({ label, name, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand-500" name={name} {...props} />
    </label>
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

function buildEndpointPayload(formData: FormData): CreateWebhookEndpointPayload {
  const events = formData.getAll("events").map(String) as MerchantWebhookEvent[];
  return {
    url: String(formData.get("url") || ""),
    description: String(formData.get("description") || "") || undefined,
    events: events.length > 0 ? events : ["*"]
  };
}
