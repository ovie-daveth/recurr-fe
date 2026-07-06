import { PageHeader } from "../../components/ui/PageHeader";

const metrics = [
  ["Customers", "0"],
  ["Active subscriptions", "0"],
  ["Paid invoices", "0"],
  ["Failed payments", "0"]
];

export function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="A compact operating view for customers, subscriptions, invoices, attempts, webhooks, and logs."
      />
      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map(([label, value]) => (
          <section className="rounded-lg border border-line bg-white p-5 shadow-panel" key={label}>
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
          </section>
        ))}
      </div>
      <section className="mt-6 rounded-lg border border-line bg-white p-5 shadow-panel">
        <h2 className="text-base font-semibold">Next milestone</h2>
        <p className="mt-2 text-sm text-muted">
          Wire overview metrics to the logs, customers, subscriptions, invoices, and payment-attempt APIs.
        </p>
      </section>
    </>
  );
}
