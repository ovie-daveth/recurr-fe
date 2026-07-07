import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, ExternalLink, Loader2, Pencil, Plus, Trash2, UserRoundCheck, X } from "lucide-react";
import { FormEvent, type ReactNode, useState } from "react";
import {
  createCustomer,
  listCustomers,
  updateCustomer,
  updateCustomerStatus,
  type Customer,
  type CustomerPayload,
  type CustomerStatus
} from "../../api/customers";
import {
  listPaymentMethods,
  revokePaymentMethod,
  setupPaymentMethodCheckout,
  type PaymentMethod
} from "../../api/payment-methods";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { authStore } from "../../lib/auth-store";
import { formatDate } from "../../lib/format";

export function CustomersPage() {
  const queryClient = useQueryClient();
  const businessId = authStore((state) => state.selectedBusinessId);
  const selectedMode = authStore((state) => state.selectedMode);
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [paymentMethodsCustomer, setPaymentMethodsCustomer] = useState<Customer | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [paymentMethodActionError, setPaymentMethodActionError] = useState<string | null>(null);
  const context = businessId ? { businessId, mode: selectedMode } : null;

  const customersQuery = useQuery({
    queryKey: ["customers", businessId, selectedMode, statusFilter],
    queryFn: () =>
      listCustomers({ businessId: businessId!, mode: selectedMode }, {
        limit: 20,
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {})
      }),
    enabled: Boolean(businessId)
  });

  const paymentMethodsQuery = useQuery({
    queryKey: ["payment-methods", businessId, selectedMode, paymentMethodsCustomer?.id],
    queryFn: () => listPaymentMethods(context!, paymentMethodsCustomer!.id),
    enabled: Boolean(context && paymentMethodsCustomer)
  });

  const invalidateCustomers = () => queryClient.invalidateQueries({ queryKey: ["customers", businessId, selectedMode] });
  const invalidatePaymentMethods = () =>
    queryClient.invalidateQueries({ queryKey: ["payment-methods", businessId, selectedMode, paymentMethodsCustomer?.id] });

  const createMutation = useMutation({
    mutationFn: (payload: CustomerPayload) => createCustomer({ businessId: businessId!, mode: selectedMode }, payload),
    onSuccess: async () => {
      setCreateOpen(false);
      await invalidateCustomers();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ customerId, payload }: { customerId: string; payload: Partial<CustomerPayload> }) =>
      updateCustomer({ businessId: businessId!, mode: selectedMode }, customerId, payload),
    onSuccess: async () => {
      setEditingCustomer(null);
      await invalidateCustomers();
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ customerId, status }: { customerId: string; status: CustomerStatus }) =>
      updateCustomerStatus({ businessId: businessId!, mode: selectedMode }, customerId, status),
    onSuccess: invalidateCustomers
  });

  const setupPaymentMethodMutation = useMutation({
    mutationFn: (customerId: string) => setupPaymentMethodCheckout(context!, customerId),
    onSuccess: async (result) => {
      window.open(result.checkout.checkoutUrl, "_blank", "noopener,noreferrer");
      await invalidatePaymentMethods();
    },
    onError: (error) => setPaymentMethodActionError(error instanceof Error ? error.message : "Could not create payment setup checkout")
  });

  const revokePaymentMethodMutation = useMutation({
    mutationFn: ({ customerId, paymentMethodId }: { customerId: string; paymentMethodId: string }) =>
      revokePaymentMethod(context!, customerId, paymentMethodId),
    onSuccess: invalidatePaymentMethods,
    onError: (error) => setPaymentMethodActionError(error instanceof Error ? error.message : "Could not revoke payment method")
  });

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    createMutation.mutate(buildCustomerPayload(new FormData(event.currentTarget)), {
      onError: (error) => setFormError(error instanceof Error ? error.message : "Could not create customer")
    });
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCustomer) return;
    setFormError(null);
    updateMutation.mutate(
      { customerId: editingCustomer.id, payload: buildCustomerPayload(new FormData(event.currentTarget)) },
      { onError: (error) => setFormError(error instanceof Error ? error.message : "Could not update customer") }
    );
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description={`Manage ${selectedMode.toLowerCase()} customers for the selected business.`}
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
            New customer
          </button>
        }
      />

      {!businessId ? (
        <EmptyState title="Select a business first" description="Customers are scoped to a business workspace." />
      ) : (
        <section className="rounded-lg border border-line bg-white shadow-panel">
          <div className="flex flex-col gap-4 border-b border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold">Customer records</h2>
              <p className="mt-1 text-sm text-muted">Showing {selectedMode.toLowerCase()} customers.</p>
            </div>
            <select
              className="rounded-md border border-line bg-white px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as CustomerStatus | "ALL")}
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>

          {customersQuery.isLoading ? (
            <div className="flex min-h-60 items-center justify-center">
              <Loader2 className="animate-spin text-muted" size={24} />
            </div>
          ) : customersQuery.isError ? (
            <div className="m-5 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {customersQuery.error instanceof Error ? customersQuery.error.message : "Could not load customers"}
            </div>
          ) : (customersQuery.data?.customers.length ?? 0) === 0 ? (
            <EmptyState title="No customers found" description="Create a customer before setting up payment methods or subscriptions." />
          ) : (
            <div className="divide-y divide-line">
              {customersQuery.data?.customers.map((customer) => (
                <article className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between" key={customer.id}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{customer.name || customer.email}</h3>
                      <StatusBadge tone={customer.status === "ACTIVE" ? "success" : "danger"}>{customer.status}</StatusBadge>
                      <StatusBadge>{customer.mode}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {customer.email} {customer.phone ? `· ${customer.phone}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      External ref {customer.externalReference || "-"} · Created {formatDate(customer.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium"
                      type="button"
                      onClick={() => {
                        setPaymentMethodsCustomer(customer);
                        setPaymentMethodActionError(null);
                      }}
                    >
                      <CreditCard size={15} />
                      Payment methods
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium"
                      type="button"
                      onClick={() => {
                        setEditingCustomer(customer);
                        setFormError(null);
                      }}
                    >
                      <Pencil size={15} />
                      Edit
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium"
                      type="button"
                      onClick={() =>
                        statusMutation.mutate({
                          customerId: customer.id,
                          status: customer.status === "ACTIVE" ? "DISABLED" : "ACTIVE"
                        })
                      }
                    >
                      <UserRoundCheck size={15} />
                      {customer.status === "ACTIVE" ? "Disable" : "Enable"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {createOpen && (
        <CustomerModal title="Create customer" onClose={() => setCreateOpen(false)}>
          <CustomerForm error={formError} loading={createMutation.isPending} onSubmit={handleCreate} title="Create customer" />
        </CustomerModal>
      )}

      {editingCustomer && (
        <CustomerModal title={`Edit ${editingCustomer.name || editingCustomer.email}`} onClose={() => setEditingCustomer(null)}>
          <CustomerForm
            customer={editingCustomer}
            error={formError}
            loading={updateMutation.isPending}
            onCancel={() => setEditingCustomer(null)}
            onSubmit={handleUpdate}
            title="Edit customer"
          />
        </CustomerModal>
      )}

      {paymentMethodsCustomer && (
        <CustomerModal title={`Payment methods - ${paymentMethodsCustomer.name || paymentMethodsCustomer.email}`} onClose={() => setPaymentMethodsCustomer(null)}>
          <PaymentMethodsPanel
            customer={paymentMethodsCustomer}
            error={paymentMethodActionError}
            loading={paymentMethodsQuery.isLoading}
            paymentMethods={paymentMethodsQuery.data ?? []}
            queryError={paymentMethodsQuery.error}
            revoking={revokePaymentMethodMutation.isPending}
            settingUp={setupPaymentMethodMutation.isPending}
            onRevoke={(paymentMethodId) =>
              revokePaymentMethodMutation.mutate({
                customerId: paymentMethodsCustomer.id,
                paymentMethodId
              })
            }
            onSetup={() => setupPaymentMethodMutation.mutate(paymentMethodsCustomer.id)}
          />
        </CustomerModal>
      )}
    </>
  );
}

function PaymentMethodsPanel({
  customer,
  paymentMethods,
  loading,
  settingUp,
  revoking,
  queryError,
  error,
  onSetup,
  onRevoke
}: {
  customer: Customer;
  paymentMethods: PaymentMethod[];
  loading: boolean;
  settingUp: boolean;
  revoking: boolean;
  queryError: unknown;
  error: string | null;
  onSetup: () => void;
  onRevoke: (paymentMethodId: string) => void;
}) {
  return (
    <div>
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-muted">Reusable payment methods saved for {customer.email}.</p>
          <p className="mt-1 text-xs text-muted">A card becomes reusable after Nomba returns a token through webhook or simulator.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={settingUp || customer.status !== "ACTIVE"}
          type="button"
          onClick={onSetup}
        >
          {settingUp ? <Loader2 className="animate-spin" size={16} /> : <ExternalLink size={16} />}
          Setup card
        </button>
      </div>

      {error && <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="animate-spin text-muted" size={24} />
        </div>
      ) : queryError ? (
        <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {queryError instanceof Error ? queryError.message : "Could not load payment methods"}
        </div>
      ) : paymentMethods.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-line p-6 text-center">
          <CreditCard className="mx-auto text-muted" size={30} />
          <p className="mt-3 font-semibold">No payment methods yet</p>
          <p className="mt-1 text-sm text-muted">Start setup checkout so the customer can add a reusable card.</p>
        </div>
      ) : (
        <div className="mt-5 divide-y divide-line rounded-lg border border-line">
          {paymentMethods.map((method) => (
            <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between" key={method.id}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">
                    {method.brand || method.type} {method.last4 ? `**** ${method.last4}` : ""}
                  </p>
                  <StatusBadge tone={method.status === "ACTIVE" ? "success" : method.status === "PENDING_SETUP" ? "warning" : "danger"}>{method.status}</StatusBadge>
                  {method.reusable && <StatusBadge tone="success">REUSABLE</StatusBadge>}
                </div>
                <p className="mt-1 break-all text-xs text-muted">Token {method.providerPaymentMethodReference || "-"}</p>
                <p className="mt-1 text-xs text-muted">Created {formatDate(method.createdAt)}</p>
              </div>
              {method.status === "ACTIVE" && (
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={revoking}
                  type="button"
                  onClick={() => onRevoke(method.id)}
                >
                  <Trash2 size={15} />
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-lg bg-white shadow-2xl">
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

function CustomerForm({
  title,
  customer,
  loading,
  error,
  onCancel,
  onSubmit
}: {
  title: string;
  customer?: Customer;
  loading: boolean;
  error: string | null;
  onCancel?: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <TextField label="Email" name="email" type="email" defaultValue={customer?.email} required />
        <TextField label="Name" name="name" defaultValue={customer?.name} />
        <TextField label="Phone" name="phone" defaultValue={customer?.phone} />
        <TextField label="External reference" name="externalReference" defaultValue={customer?.externalReference} />
      </div>
      {error && <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-2 border-t border-line pt-5">
        {onCancel && (
          <button className="rounded-md border border-line px-4 py-2 text-sm font-medium" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" disabled={loading} type="submit">
          {loading ? "Saving..." : "Save customer"}
        </button>
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
      <input className="mt-2 w-full rounded-md border border-line px-3 py-2" defaultValue={defaultValue ?? ""} name={name} required={required} type={type} />
    </label>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-8 text-center shadow-panel">
      <UserRoundCheck className="mx-auto text-muted" size={32} />
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
    </div>
  );
}

function buildCustomerPayload(form: FormData): CustomerPayload {
  return {
    email: String(form.get("email")),
    name: optionalValue(form.get("name")),
    phone: optionalValue(form.get("phone")),
    externalReference: optionalValue(form.get("externalReference"))
  };
}

function optionalValue(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : undefined;
}
