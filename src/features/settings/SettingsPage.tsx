import { Building2, KeyRound, Settings2, Webhook } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { authStore } from "../../lib/auth-store";

const settingsLinks = [
  {
    to: "/dashboard/businesses",
    icon: Building2,
    title: "Business workspace",
    description: "Manage the business profile used for plans, customers, invoices, and hosted subscription links."
  },
  {
    to: "/dashboard/api-keys",
    icon: KeyRound,
    title: "API keys",
    description: "Create and rotate Test or Live keys for server-side API access."
  },
  {
    to: "/dashboard/webhooks",
    icon: Webhook,
    title: "Webhook endpoints",
    description: "Configure where Recurr sends subscription, invoice, payment method, and dunning events."
  }
];

export function SettingsPage() {
  const selectedMode = authStore((state) => state.selectedMode);
  const selectedBusinessId = authStore((state) => state.selectedBusinessId);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Workspace configuration, API access, and webhook delivery settings."
      />

      <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
        <div className="flex items-center gap-2">
          <Settings2 className="text-brand-600" size={19} />
          <h2 className="font-semibold">Current workspace</h2>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Info label="Mode" value={selectedMode} />
          <Info label="Selected business" value={selectedBusinessId ?? "No business selected"} />
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {settingsLinks.map((item) => (
          <Link
            className="rounded-lg border border-line bg-white p-5 shadow-panel transition hover:border-brand-200 hover:bg-brand-50/40"
            key={item.to}
            to={item.to}
          >
            <item.icon className="text-brand-600" size={20} />
            <h3 className="mt-4 font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
          </Link>
        ))}
      </section>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</p>
      <p className="mt-2 break-all text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
