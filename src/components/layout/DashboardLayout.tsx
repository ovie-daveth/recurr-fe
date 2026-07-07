import {
  Activity,
  BellRing,
  Building2,
  Code2,
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
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavLink, Outlet } from "react-router-dom";
import { logoutMerchant } from "../../api/auth";
import { listBusinesses } from "../../api/businesses";
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
  const selectedBusinessId = authStore((state) => state.selectedBusinessId);
  const setMode = authStore((state) => state.setMode);
  const setBusiness = authStore((state) => state.setBusiness);
  const logout = authStore((state) => state.logout);
  const refreshToken = authStore((state) => state.refreshToken);
  const businessesQuery = useQuery({
    queryKey: ["businesses", "selector"],
    queryFn: () => listBusinesses({ limit: 20 })
  });

  const businesses = businessesQuery.data?.businesses ?? [];

  useEffect(() => {
    if (!selectedBusinessId && businesses[0]) {
      setBusiness(businesses[0].id);
      return;
    }

    if (
      businessesQuery.isSuccess &&
      selectedBusinessId &&
      !businesses.some((business) => business.id === selectedBusinessId)
    ) {
      setBusiness(null);
    }
  }, [businesses, businessesQuery.isSuccess, selectedBusinessId, setBusiness]);

  async function handleLogout() {
    try {
      await logoutMerchant(refreshToken ?? undefined);
    } finally {
      logout();
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white lg:block">
        <div className="flex h-16 items-center border-b border-line px-5">
          <div className="text-xl font-semibold">Recurr</div>
        </div>
        <div className="flex h-[calc(100%-4rem)] flex-col">
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
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

          <div className="border-t border-line px-3 py-4">
            <NavLink
              className={({ isActive }) =>
                [
                  "mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                ].join(" ")
              }
              to="/dashboard/settings"
            >
              <Settings2 size={18} />
              Settings
            </NavLink>
            <a
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              href="/dashboard/developers"
              rel="noreferrer"
              target="_blank"
            >
              <Code2 size={18} />
              Developers
            </a>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-white px-5">
          <div>
            <p className="text-sm font-semibold">Merchant workspace</p>
            <p className="text-xs text-muted">
              {businessesQuery.isLoading ? "Loading businesses..." : `${businesses.length} business workspace${businesses.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="max-w-56 rounded-md border border-line bg-white px-3 py-2 text-sm"
              value={selectedBusinessId ?? ""}
              onChange={(event) => setBusiness(event.target.value || null)}
            >
              <option value="">Select business</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
            <div className="flex rounded-md border border-line bg-slate-50 p-1" aria-label="Dashboard environment">
              {(["TEST", "LIVE"] as const).map((mode) => (
                <button
                  key={mode}
                  className={[
                    "rounded px-3 py-1.5 text-xs font-semibold transition",
                    selectedMode === mode
                      ? mode === "LIVE"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-ink text-white shadow-sm"
                      : "text-slate-600 hover:text-ink"
                  ].join(" ")}
                  type="button"
                  onClick={() => setMode(mode)}
                >
                  {mode === "TEST" ? "Test" : "Live"}
                </button>
              ))}
            </div>
            <button className="rounded-md border border-line p-2 text-slate-600" type="button">
              <BellRing size={18} />
            </button>
            <button
              className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-white"
              type="button"
              onClick={handleLogout}
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
