import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle2, Loader2, Pencil, Plus } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import {
  createBusiness,
  listBusinesses,
  updateBusiness,
  type Business,
  type BusinessType,
  type CreateBusinessPayload,
  type UpdateBusinessPayload
} from "../../api/businesses";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { authStore } from "../../lib/auth-store";
import { formatDate } from "../../lib/format";

export function BusinessesPage() {
  const queryClient = useQueryClient();
  const selectedBusinessId = authStore((state) => state.selectedBusinessId);
  const setBusiness = authStore((state) => state.setBusiness);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [type, setType] = useState<BusinessType>("INDIVIDUAL");
  const [formError, setFormError] = useState<string | null>(null);

  const businessesQuery = useQuery({
    queryKey: ["businesses"],
    queryFn: () => listBusinesses({ limit: 20 })
  });

  const businesses = businessesQuery.data?.businesses ?? [];
  const activeBusiness = useMemo(
    () => businesses.find((business) => business.id === selectedBusinessId) ?? businesses[0],
    [businesses, selectedBusinessId]
  );

  const invalidateBusinesses = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["businesses"] }),
      queryClient.invalidateQueries({ queryKey: ["businesses", "selector"] })
    ]);
  };

  const createMutation = useMutation({
    mutationFn: createBusiness,
    onSuccess: async (business) => {
      setBusiness(business.id);
      setCreateOpen(false);
      await invalidateBusinesses();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ businessId, payload }: { businessId: string; payload: UpdateBusinessPayload }) =>
      updateBusiness(businessId, payload),
    onSuccess: async (business) => {
      setBusiness(business.id);
      setEditingBusiness(null);
      await invalidateBusinesses();
    }
  });

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const form = new FormData(event.currentTarget);
    const payload = buildBusinessPayload(form, type);

    try {
      await createMutation.mutateAsync(payload);
      event.currentTarget.reset();
      setType("INDIVIDUAL");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not create business");
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingBusiness) return;

    setFormError(null);
    const form = new FormData(event.currentTarget);
    const payload = buildBusinessPayload(form, String(form.get("type")) as BusinessType);

    try {
      await updateMutation.mutateAsync({ businessId: editingBusiness.id, payload });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not update business");
    }
  }

  return (
    <>
      <PageHeader
        title="Businesses"
        description="Create merchant workspaces, update business records, and choose the active business for dashboard operations."
        action={
          <button
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white"
            type="button"
            onClick={() => {
              setCreateOpen((current) => !current);
              setEditingBusiness(null);
              setFormError(null);
            }}
          >
            <Plus size={17} />
            New business
          </button>
        }
      />

      {businessesQuery.isLoading ? (
        <div className="flex min-h-60 items-center justify-center rounded-lg border border-line bg-white">
          <Loader2 className="animate-spin text-muted" size={24} />
        </div>
      ) : businessesQuery.isError ? (
        <div className="rounded-lg border border-rose-100 bg-rose-50 p-5 text-sm text-rose-700">
          {businessesQuery.error instanceof Error ? businessesQuery.error.message : "Could not load businesses"}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <section className="rounded-lg border border-line bg-white shadow-panel">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-semibold">Business workspaces</h2>
              <p className="mt-1 text-sm text-muted">Dashboard and API resources are scoped to a business.</p>
            </div>

            {businesses.length === 0 ? (
              <div className="p-8 text-center">
                <Building2 className="mx-auto text-muted" size={32} />
                <h3 className="mt-4 font-semibold">No business yet</h3>
                <p className="mt-2 text-sm text-muted">Create a business before issuing API keys or billing customers.</p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {businesses.map((business) => (
                  <article className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between" key={business.id}>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{business.name}</h3>
                        <StatusBadge tone={business.status === "ACTIVE" ? "success" : "warning"}>{business.status}</StatusBadge>
                        <StatusBadge>{business.type}</StatusBadge>
                        {selectedBusinessId === business.id && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
                            <CheckCircle2 size={13} />
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted">
                        {business.contactEmail} · {business.contactPhone} · {business.country}
                      </p>
                      <p className="mt-1 text-xs text-muted">Created {formatDate(business.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        className="rounded-md border border-line px-3 py-2 text-sm font-medium"
                        type="button"
                        onClick={() => setBusiness(business.id)}
                      >
                        Select
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium"
                        type="button"
                        onClick={() => {
                          setEditingBusiness(business);
                          setCreateOpen(false);
                          setFormError(null);
                        }}
                      >
                        <Pencil size={15} />
                        Edit
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            {activeBusiness && (
              <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
                <p className="text-sm font-medium text-muted">Active business</p>
                <h2 className="mt-2 text-xl font-semibold">{activeBusiness.name}</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <InfoRow label="ID" value={activeBusiness.id} />
                  <InfoRow label="Type" value={activeBusiness.type} />
                  <InfoRow label="Status" value={activeBusiness.status} />
                  <InfoRow label="Contact" value={activeBusiness.contactName} />
                  <InfoRow label="Updated" value={formatDate(activeBusiness.updatedAt)} />
                </dl>
              </section>
            )}

            {createOpen && (
              <BusinessForm
                title="Create business"
                type={type}
                setType={setType}
                loading={createMutation.isPending}
                error={formError}
                onSubmit={handleCreate}
              />
            )}

            {editingBusiness && (
              <BusinessForm
                title={`Edit ${editingBusiness.name}`}
                business={editingBusiness}
                type={editingBusiness.type}
                setType={() => undefined}
                loading={updateMutation.isPending}
                error={formError}
                onCancel={() => setEditingBusiness(null)}
                onSubmit={handleUpdate}
              />
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function BusinessForm({
  title,
  business,
  type,
  setType,
  loading,
  error,
  onCancel,
  onSubmit
}: {
  title: string;
  business?: Business;
  type: BusinessType;
  setType: (type: BusinessType) => void;
  loading: boolean;
  error: string | null;
  onCancel?: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const currentType = business?.type ?? type;

  return (
    <form className="rounded-lg border border-line bg-white p-5 shadow-panel" onSubmit={onSubmit}>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">Business records are used for ownership, API keys, logs, and webhook settings.</p>

      <div className="mt-5 space-y-4">
        <label className="block text-sm font-medium">
          Type
          <select
            className="mt-2 w-full rounded-md border border-line px-3 py-2"
            name="type"
            value={currentType}
            disabled={Boolean(business)}
            onChange={(event) => setType(event.target.value as BusinessType)}
          >
            <option value="INDIVIDUAL">Individual</option>
            <option value="BUSINESS">Business</option>
          </select>
        </label>

        {currentType === "BUSINESS" ? (
          <>
            <TextField label="Business name" name="businessName" defaultValue={business?.businessName ?? business?.name} required />
            <TextField label="Registration number" name="businessRegistrationNumber" defaultValue={business?.businessRegistrationNumber ?? ""} />
            <TextField label="Tax ID" name="taxId" defaultValue={business?.taxId ?? ""} />
            <TextField label="Website" name="website" type="url" defaultValue={business?.website ?? ""} />
          </>
        ) : (
          <TextField label="Legal name" name="legalName" defaultValue={business?.legalName ?? business?.name} required />
        )}

        <TextField label="Contact name" name="contactName" defaultValue={business?.contactName ?? ""} required />
        <TextField label="Contact email" name="contactEmail" type="email" defaultValue={business?.contactEmail ?? ""} required />
        <TextField label="Contact phone" name="contactPhone" defaultValue={business?.contactPhone ?? ""} required />
        <TextField label="Country" name="country" defaultValue={business?.country ?? "NG"} required />
      </div>

      {error && <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="mt-5 flex gap-2">
        <button className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" disabled={loading} type="submit">
          {loading ? "Saving..." : "Save business"}
        </button>
        {onCancel && (
          <button className="rounded-md border border-line px-4 py-2 text-sm font-medium" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function TextField({
  label,
  name,
  type = "text",
  defaultValue,
  required
}: {
  label: string;
  name: string;
  type?: string;
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
      />
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="break-all font-medium">{value}</dd>
    </div>
  );
}

function buildBusinessPayload(form: FormData, type: BusinessType): CreateBusinessPayload {
  const base = {
    contactName: String(form.get("contactName")),
    contactEmail: String(form.get("contactEmail")),
    contactPhone: String(form.get("contactPhone")),
    country: String(form.get("country") || "NG")
  };

  if (type === "BUSINESS") {
    return {
      ...base,
      type,
      businessName: String(form.get("businessName")),
      businessRegistrationNumber: optionalValue(form.get("businessRegistrationNumber")),
      taxId: optionalValue(form.get("taxId")),
      website: optionalValue(form.get("website"))
    };
  }

  return {
    ...base,
    type,
    legalName: String(form.get("legalName"))
  };
}

function optionalValue(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : undefined;
}
