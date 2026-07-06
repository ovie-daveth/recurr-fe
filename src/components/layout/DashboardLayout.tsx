import {
  Activity,
  BellRing,
  Building2,
  CreditCard,
  FileText,
  Gauge,
  KeyRound,
  ListRestart,
  Receipt,
  ScrollText,
  Settings2,
  Users,
  Webhook
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { authStore } from "../../lib/auth-store";

const navItems = [
  { to: "/dashboard", label: "Overview", icon: Gauge },
  { to: "/dashboard/businesses", label: "Businesses", icon: Building2 },
  { to: "/dashboard/api-keys", label: "API keys", icon: KeyRound },
  { to: "/dashboard/customers", label: "Customers", icon: Users },
  { to: "/dashboard/plans", label: "Plans", icon: FileText },
  { to: "/dashboard/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/dashboard/invoices", label: "Invoices", icon: Receipt },
  { to: "/dashboard/payment-attempts", label: "Attempts", icon: Activity },
  { to: "/dashboard/webhooks", label: "Webhooks", icon: Webhook },
  { to: "/dashboard/dunning", label: "Dunning", icon: ListRestart },
  { to: "/dashboard/logs", label: "Logs", icon: ScrollText }
];

export function DashboardLayout() {
  const selectedMode = authStore((state) => state.selectedMode);
  const setMode = authStore((state) => state.setMode);
  const logout = authStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white lg:block">
        <div className="flex h-16 items-center border-b border-line px-5">
          <div className="text-xl font-semibold">Recurr</div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                ].join(" ")
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-white px-5">
          <div>
            <p className="text-sm font-semibold">Merchant workspace</p>
            <p className="text-xs text-muted">Dashboard auth uses merchant JWT sessions.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="rounded-md border border-line bg-white px-3 py-2 text-sm"
              value={selectedMode}
              onChange={(event) => setMode(event.target.value as "TEST" | "LIVE")}
            >
              <option value="TEST">Test mode</option>
              <option value="LIVE">Live mode</option>
            </select>
            <button className="rounded-md border border-line p-2 text-slate-600" type="button">
              <BellRing size={18} />
            </button>
            <button className="rounded-md border border-line p-2 text-slate-600" type="button">
              <Settings2 size={18} />
            </button>
            <button
              className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-white"
              type="button"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="px-5 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
