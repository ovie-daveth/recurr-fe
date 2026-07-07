import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  KeyRound,
  ListRestart,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Webhook,
  Workflow
} from "lucide-react";
import { Link } from "react-router-dom";

const platformStats = [
  ["API-first", "Recurring billing"],
  ["Tokenized", "Nomba cards"],
  ["Live + test", "Business keys"],
  ["Retry logic", "Dunning engine"]
];

const capabilities = [
  {
    icon: KeyRound,
    title: "Business-scoped API keys",
    copy: "Issue separate test and live keys for each business, revoke compromised keys, and keep customer data isolated by business."
  },
  {
    icon: CreditCard,
    title: "Reusable payment methods",
    copy: "Create checkout links for customers, receive Nomba card tokens, and charge saved cards for subscriptions."
  },
  {
    icon: ReceiptText,
    title: "Invoices and attempts",
    copy: "Track invoices, payment attempts, provider references, failure reasons, and manual retry actions from one dashboard."
  },
  {
    icon: ListRestart,
    title: "Dunning policies",
    copy: "Configure retry timing and choose the final action when payment recovery is exhausted."
  },
  {
    icon: Webhook,
    title: "Merchant webhooks",
    copy: "Send subscription, invoice, and payment events back to merchants with delivery history and retries."
  },
  {
    icon: ShieldCheck,
    title: "Operational safeguards",
    copy: "Idempotency, request IDs, webhook signature verification, logs, cleanup jobs, and worker automation are built into the flow."
  }
];

const flow = [
  "Merchant creates a business and API key",
  "Merchant creates customer and plan",
  "Customer adds card through checkout",
  "Recurr stores reusable token reference",
  "Worker charges card on schedule",
  "Webhooks and logs show every event"
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#06150f] text-white">
      <section className="landing-hero relative min-h-[92vh] overflow-hidden">
        <div className="landing-grid" />
        <div className="landing-rail landing-rail-a" />
        <div className="landing-rail landing-rail-b" />
        <div className="landing-rail landing-rail-c" />

        <div className="absolute inset-0">
          <div className="payment-node node-a">
            <CreditCard size={20} />
            <span>Card tokenized</span>
          </div>
          <div className="payment-node node-b">
            <ReceiptText size={20} />
            <span>Invoice paid</span>
          </div>
          <div className="payment-node node-c">
            <Webhook size={20} />
            <span>Webhook delivered</span>
          </div>
          <div className="payment-node node-d">
            <ListRestart size={20} />
            <span>Retry scheduled</span>
          </div>

          <div className="dashboard-visual">
            <div className="visual-topbar">
              <span />
              <span />
              <span />
            </div>
            <div className="visual-body">
              <div className="visual-balance">
                <p>Monthly recurring revenue</p>
                <strong>NGN 8,420,000</strong>
              </div>
              <div className="visual-bars">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="visual-row">
                <BadgeCheck size={18} />
                <span>subscription.active</span>
                <b>delivered</b>
              </div>
              <div className="visual-row">
                <Workflow size={18} />
                <span>invoice.payment_succeeded</span>
                <b>processed</b>
              </div>
              <div className="visual-row">
                <LockKeyhole size={18} />
                <span>sk_live_**********</span>
                <b>secured</b>
              </div>
            </div>
          </div>
        </div>

        <header className="relative z-10 mx-auto flex items-center justify-between px-5 py-5 lg:px-16">
          <Link className="text-xl font-semibold" to="/">
            Recurr
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-emerald-50/80 md:flex">
            <a href="#platform">Platform</a>
            <a href="#flow">Flow</a>
            <a href="#developers">Developers</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link className="hidden text-sm font-medium text-emerald-50 md:inline" to="/auth/login">
              Sign in
            </Link>
            <Link
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#072016] transition hover:bg-emerald-50"
              to="/auth/signup"
            >
              Start building
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(92vh-82px)] items-center px-5 pb-16 pt-8 lg:px-16">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-emerald-300/30 bg-white/10 px-3 py-1 text-sm font-medium text-emerald-100 backdrop-blur">
              Subscription billing infrastructure for African merchants
            </p>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight tracking-normal md:text-7xl">
              Recurring payments that feel simple to ship.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/80">
              Recurr gives merchants the dashboard and APIs to create customers, save reusable
              payment methods, bill subscriptions, recover failed payments, and deliver webhooks.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#15c77b] px-5 py-3 text-sm font-semibold text-[#04130d] transition hover:bg-[#36d891]"
                to="/auth/signup"
              >
                Create merchant account
                <ArrowRight size={18} />
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-md border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                to="/auth/login"
              >
                Open dashboard
              </Link>
            </div>

            <div className="mt-12 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
              {platformStats.map(([value, label]) => (
                <div className="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur" key={label}>
                  <p className="text-base font-semibold">{value}</p>
                  <p className="mt-1 text-xs text-emerald-50/70">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="bg-[#f6faf8] px-5 py-20 text-[#102017] lg:px-16">
        <div className="mx-auto">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-emerald-700">Platform</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-normal">Everything the merchant needs after the first payment.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The platform is designed around the full recurring payment loop: setup, billing, retries,
              state changes, webhook delivery, and operational visibility.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {capabilities.map((item) => (
              <article className="rounded-lg border border-emerald-100 bg-white p-6 shadow-panel" key={item.title}>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                  <item.icon size={22} />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="flow" className="bg-white px-5 py-20 text-[#102017] lg:px-16">
        <div className="mx-auto grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">Payment flow</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-normal">From signup to recurring collection.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Merchants do not need customers to join Recurr. The merchant creates customers through
              the API, sends them to checkout, and Recurr stores the provider references needed for
              future billing.
            </p>
          </div>

          <div className="rounded-lg border border-line bg-[#f8fbfa] p-5">
            {flow.map((item, index) => (
              <div className="flex gap-4 border-b border-emerald-100 py-5 last:border-b-0" key={item}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#15c77b] text-sm font-semibold text-[#06150f]">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold">{item}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {index === 0 && "Dashboard users manage businesses, keys, and operating mode."}
                    {index === 1 && "Merchant APIs keep customers and plans tied to the right business."}
                    {index === 2 && "Hosted checkout keeps card handling outside the merchant app."}
                    {index === 3 && "Nomba returns token references that make later charges possible."}
                    {index === 4 && "BullMQ workers run billing, dunning, webhook retry, and cleanup jobs."}
                    {index === 5 && "Merchants can debug what happened without asking support first."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="developers" className="bg-[#071710] px-5 py-20 text-white lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-300">Developers</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-normal">Built like an API product from day one.</h2>
            <p className="mt-4 text-base leading-7 text-emerald-50/75">
              Recurr supports idempotency keys, request IDs, test/live key separation, webhook
              signatures, delivery retries, and direct operational logs.
            </p>
            <Link
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-[#071710]"
              to="/auth/signup"
            >
              Launch dashboard
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0c2017] p-5 shadow-panel">
            <div className="mb-4 flex gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-400" />
              <span className="h-3 w-3 rounded-full bg-amber-300" />
              <span className="h-3 w-3 rounded-full bg-emerald-300" />
            </div>
            <pre className="overflow-x-auto text-sm leading-7 text-emerald-50/90">
{`POST /api/v1/subscriptions
Authorization: Bearer sk_test_...
Idempotency-Key: idem_01J...

{
  "customerId": "cus_...",
  "planId": "plan_...",
  "paymentMethodId": "pm_..."
}`}
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}
