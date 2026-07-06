import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto grid min-h-screen grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden border-r border-line bg-ink px-10 py-12 text-white lg:block">
          <div className="text-2xl font-semibold">Recurr</div>
          <div className="mt-20 max-w-md">
            <p className="text-sm uppercase tracking-[0.2em] text-brand-100">Merchant dashboard</p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight">
              Subscription billing controls for modern Nigerian businesses.
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-300">
              Manage API keys, customers, plans, tokenized payment methods, subscriptions, invoices,
              retries, and webhooks from one workspace.
            </p>
          </div>
        </section>
        <section className="flex items-center justify-center px-5 py-10">
          <Outlet />
        </section>
      </div>
    </main>
  );
}
