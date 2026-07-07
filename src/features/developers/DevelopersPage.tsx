import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  KeyRound,
  Link as LinkIcon,
  Route,
  Server,
  ShieldCheck,
  UserPlus,
  Webhook
} from "lucide-react";
import { Link } from "react-router-dom";
import { CopyButton } from "../../components/ui/CopyButton";
import { authStore } from "../../lib/auth-store";

const apiOrigin = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
const apiBaseUrl = `${apiOrigin}${import.meta.env.VITE_API_VERSION ?? "/api/v1"}`;
const docsUrl = `${apiOrigin}/api/docs`;

const steps = [
  {
    id: "signup",
    icon: UserPlus,
    title: "Sign up and create a business",
    description:
      "Create your merchant account, verify your email, then create the business that owns plans, customers, subscriptions, and webhooks.",
    actions: ["Open the dashboard", "Create or select a business", "Switch to Test mode while building"]
  },
  {
    id: "api-key",
    icon: KeyRound,
    title: "Get your API key",
    description:
      "Generate a Test key first. Use Live keys only when your Nomba live credentials and webhook URL are ready.",
    actions: ["Go to API keys", "Create a secret key", "Store it only on your server"]
  },
  {
    id: "plan",
    icon: BookOpenText,
    title: "Create your recurring plan",
    description:
      "A plan is the price and billing interval your customer subscribes to. Money is sent as amountMinor.",
    actions: ["Create a plan code", "Set amountMinor", "Choose month, week, year, or custom interval"]
  },
  {
    id: "customer",
    icon: UserPlus,
    title: "Create or reuse a customer",
    description:
      "Before checkout, create a customer in Recurr or reuse the customer record you already have for that subscriber.",
    actions: ["Send name and email", "Store the returned customer ID", "Use externalReference for your own user ID"]
  },
  {
    id: "checkout",
    icon: LinkIcon,
    title: "Send the customer to checkout",
    description:
      "Start the hosted subscription flow or payment method setup. Nomba collects the card and Recurr stores the reusable token after payment_success.",
    actions: ["Redirect to checkoutLink", "Customer enters card and OTP", "Wait for webhook confirmation"]
  },
  {
    id: "webhooks",
    icon: Webhook,
    title: "Listen for lifecycle events",
    description:
      "Register your webhook endpoint so your app knows when subscriptions, invoices, payment methods, and retries change.",
    actions: ["Create webhook endpoint", "Store signing secret", "Verify every delivery"]
  }
];

const endpointGroups = [
  {
    id: "plans",
    title: "Plans",
    description: "Create the recurring price your customers will subscribe to.",
    method: "POST",
    path: "/plans",
    body: `{
  "name": "Pro Monthly",
  "code": "pro_monthly",
  "amountMinor": 400000,
  "currency": "NGN",
  "interval": "MONTH",
  "intervalCount": 1
}`
  },
  {
    id: "customers",
    title: "Customers",
    description: "Create or find the subscriber inside your business workspace.",
    method: "POST",
    path: "/customers",
    body: `{
  "email": "ada@example.com",
  "name": "Ada Lovelace",
  "externalReference": "user_123"
}`
  },
  {
    id: "checkout",
    title: "Hosted subscription",
    description: "Use this when you want Recurr to collect the card and activate the subscription after Nomba payment_success.",
    method: "POST",
    path: "/public/subscribe/{businessSlug}/{planCode}/start",
    body: `{
  "customerEmail": "ada@example.com",
  "customerName": "Ada Lovelace",
  "callbackUrl": "https://yourapp.com/billing/complete"
}`
  },
  {
    id: "webhook-endpoints",
    title: "Merchant webhooks",
    description: "Send subscription and billing events from Recurr back to your app.",
    method: "POST",
    path: "/webhook-endpoints",
    body: `{
  "url": "https://yourapp.com/webhooks/recurr",
  "events": [
    "subscription.created",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
    "payment_method.updated"
  ]
}`
  }
];

const webhookEvents = [
  "subscription.created",
  "subscription.active",
  "subscription.past_due",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "payment_method.updated",
  "dunning.retry_scheduled"
];

const docsNav = [
  {
    title: "API Documentation",
    links: [
      ["Introduction", "#introduction", "GET"],
      ["Get API keys", "#api-key", "GET"]
    ]
  },
  {
    title: "Core integration",
    links: [
      ["Create plans", "#plans", "POST"],
      ["Create customers", "#customers", "POST"],
      ["Start hosted checkout", "#checkout", "POST"],
      ["Listen for webhooks", "#webhooks", "POST"]
    ]
  },
  {
    title: "Operations",
    links: [
      ["Recurring billing", "#automatic-billing", "GET"],
      ["Production checklist", "#checklist", "GET"]
    ]
  }
];

export function DevelopersPage() {
  const selectedMode = authStore((state) => state.selectedMode);
  const sampleKey = selectedMode === "LIVE" ? "sk_live_your_key" : "sk_test_your_key";
  const authSnippet = `curl --request GET \\
  --url ${apiBaseUrl}/plans \\
  --header 'Authorization: Bearer ${sampleKey}' \\
  --header 'Content-Type: application/json'`;
  const hostedSnippet = `const response = await fetch("${apiBaseUrl}/public/subscribe/acme/pro_monthly/start?mode=${selectedMode}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    customerEmail: "ada@example.com",
    customerName: "Ada Lovelace",
    callbackUrl: "https://yourapp.com/billing/complete"
  })
});

const { data } = await response.json();
window.location.href = data.checkoutUrl;`;
  const webhookSnippet = `const crypto = require("crypto");

function verifyRecurrSignature(rawBody, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`;

  return (
    <main className="min-h-screen bg-white text-[#1f2328]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-6 px-5 lg:px-8">
          <Link className="mr-3 text-xl font-semibold text-[#06150f]" to="/">
            Recurr
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
            <a className="border-b-2 border-[#d1a000] py-5 text-[#06150f]" href="#introduction">
              Documentation
            </a>
            <a className="py-5 hover:text-[#06150f]" href="#api-reference">
              API Reference
            </a>
            <a className="py-5 hover:text-[#06150f]" href="#webhooks">
              Webhooks
            </a>
          </nav>
          <div className="ml-auto hidden w-full max-w-sm items-center rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-500 lg:flex">
            Search documentation
            <span className="ml-auto rounded bg-white px-2 py-0.5 text-xs text-slate-500">Ctrl K</span>
          </div>
          <Link
            className="ml-auto rounded-md bg-[#c99a00] px-4 py-2 text-sm font-semibold text-white lg:ml-0"
            to="/auth/login"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_240px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] overflow-y-auto border-r border-slate-200 px-5 py-6 lg:block">
          {docsNav.map((group) => (
            <div className="mb-8" key={group.title}>
              <p className="mb-3 text-xs font-semibold text-slate-500">{group.title}</p>
              <div className="space-y-1">
                {group.links.map(([label, href, method]) => (
                  <a
                    className="flex items-start gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-[#faf6e7] hover:text-[#a77a00]"
                    href={href}
                    key={href}
                  >
                    <span
                      className={[
                        "mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold",
                        method === "POST"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      ].join(" ")}
                    >
                      {method}
                    </span>
                    <span>{label}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <article className="min-w-0 overflow-hidden px-5 py-8 lg:px-10 lg:py-12 xl:px-14">
          <section id="introduction" className="mb-12">
            <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm leading-6 text-blue-900">
              <strong>No account required to read these docs.</strong> Create a merchant account only when you are ready to generate real API keys and configure live billing.
            </div>
            <p className="text-sm font-semibold uppercase text-[#c99a00]">API Documentation</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-[#1f2328]">Integrate Recurr subscriptions</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Connect your product to Recurr by creating a merchant business, generating API keys, creating plans and customers, sending subscribers to checkout, and listening for lifecycle webhooks.
            </p>
          </section>

          <section id="api-reference" className="mb-10 rounded-xl border border-slate-200 bg-white">
            <div className="grid min-w-0 gap-5 p-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div>
                <div className="flex items-center gap-2">
                  <Server className="text-[#c99a00]" size={19} />
                  <h2 className="font-semibold">Connect to Recurr</h2>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Use the dashboard to manage your business setup, then call the API from your backend. Keep secret keys server-side and use webhooks as the source of truth for payment outcomes.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <InfoBlock label="Base URL" value={apiBaseUrl} />
                  <InfoBlock label="Current mode" value={selectedMode} />
                </div>
              </div>
              <CodeBlock className="min-w-0" title="Authenticated request" code={authSnippet} />
            </div>
          </section>

          <section className="mb-10 rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <Route className="text-[#c99a00]" size={19} />
                <h2 className="font-semibold">Integration path</h2>
              </div>
              <p className="mt-1 text-sm text-muted">Follow these steps in order for a normal subscription integration.</p>
            </div>
            <div className="divide-y divide-line">
              {steps.map((step, index) => (
                <article className="grid gap-4 p-5 lg:grid-cols-[220px_1fr]" id={step.id} key={step.id}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-sm font-semibold text-brand-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-normal text-muted">Step {index + 1}</p>
                      <h3 className="font-semibold">{step.title}</h3>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm leading-6 text-slate-700">{step.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {step.actions.map((action) => (
                        <span className="rounded-md border border-line bg-slate-50 px-2.5 py-1 text-xs text-slate-700" key={action}>
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mb-10 rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <Code2 className="text-[#c99a00]" size={19} />
                <h2 className="font-semibold">Copy-ready examples</h2>
              </div>
              <p className="mt-1 text-sm text-muted">Start with the hosted subscription flow if you want Recurr and Nomba to handle card setup.</p>
            </div>
            <div className="grid min-w-0 gap-5 p-5 xl:grid-cols-[minmax(230px,0.55fr)_minmax(0,1fr)] 2xl:grid-cols-[minmax(230px,0.5fr)_minmax(0,1fr)]">
              <div className="space-y-4">
                {endpointGroups.map((endpoint) => (
                  <article className="rounded-lg border border-line p-4" id={endpoint.id} key={endpoint.path}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{endpoint.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted">{endpoint.description}</p>
                      </div>
                      <CopyButton iconOnly value={`${endpoint.method} ${endpoint.path}`}>
                        <Copy size={16} />
                      </CopyButton>
                    </div>
                    <p className="mt-3 break-all font-mono text-xs text-slate-600">
                      <span className="font-semibold text-brand-700">{endpoint.method}</span> {endpoint.path}
                    </p>
                  </article>
                ))}
              </div>
              <div className="space-y-4">
                <CodeBlock title="Hosted subscription redirect" code={hostedSnippet} />
                <CodeBlock title="Create plan body" code={endpointGroups[0].body} />
              </div>
            </div>
          </section>

          <section id="webhooks" className="mb-10 rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <Webhook className="text-[#c99a00]" size={19} />
                <h2 className="font-semibold">Webhooks and automatic billing</h2>
              </div>
              <p className="mt-1 text-sm text-muted">Your integration should trust webhook events, not the customer returning to your callback URL.</p>
            </div>
            <div className="grid min-w-0 gap-5 p-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div>
                <div id="automatic-billing" className="rounded-lg border border-line bg-slate-50 p-4">
                  <h3 className="font-semibold">What happens after Nomba payment_success</h3>
                  <ol className="mt-3 space-y-3 text-sm text-slate-700">
                    {[
                      "Recurr verifies the Nomba webhook signature.",
                      "The tokenized card is stored as a reusable payment method.",
                      "The first invoice is marked paid.",
                      "The next billing date is scheduled.",
                      "The worker charges the saved token when the subscription is due."
                    ].map((item) => (
                      <li className="flex gap-2" key={item}>
                        <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={16} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <h3 className="mt-5 font-semibold">Events to handle</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {webhookEvents.map((event) => (
                    <span className="rounded-md border border-line bg-white px-3 py-1.5 font-mono text-xs" key={event}>
                      {event}
                    </span>
                  ))}
                </div>
              </div>
              <CodeBlock className="min-w-0" title="Verify Recurr webhook signature" code={webhookSnippet} />
            </div>
          </section>

          <section id="checklist" className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-emerald-600" size={19} />
              <h2 className="font-semibold">Production checklist</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {[
                "Create separate Test and Live API keys.",
                "Keep secret keys out of frontend code.",
                "Use amountMinor for all money values.",
                "Verify webhook signatures before updating local records.",
                "Run the Recurr worker so due subscriptions are charged.",
                "Set live Nomba credentials before switching customers to Live mode."
              ].map((item) => (
                <li className="flex gap-2" key={item}>
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] overflow-y-auto border-l border-slate-200 px-5 py-12 2xl:block">
          <div className="mb-7">
            <p className="mb-3 text-sm font-semibold text-slate-800">On this page</p>
            <div className="space-y-2 text-sm text-slate-600">
              <a className="block hover:text-[#c99a00]" href="#introduction">Welcome</a>
              <a className="block hover:text-[#c99a00]" href="#api-reference">Authentication</a>
              <a className="block hover:text-[#c99a00]" href="#api-key">Get API keys</a>
              <a className="block hover:text-[#c99a00]" href="#checkout">Hosted checkout</a>
              <a className="block hover:text-[#c99a00]" href="#webhooks">Webhooks</a>
              <a className="block hover:text-[#c99a00]" href="#checklist">Checklist</a>
            </div>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <ArrowRight className="text-brand-600" size={19} />
              <h2 className="font-semibold">Quick actions</h2>
            </div>
            <div className="mt-4 space-y-3">
              <a className="block rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-slate-50" href="/dashboard/api-keys">
                API keys
              </a>
              <a className="block rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-slate-50" href="/dashboard/plans">
                Plans
              </a>
              <a className="block rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-slate-50" href="/dashboard/customers">
                Customers
              </a>
              <a className="block rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-slate-50" href="/dashboard/webhooks">
                Webhooks
              </a>
              <a className="block rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-slate-50" href={docsUrl} rel="noreferrer" target="_blank">
                Full API reference
              </a>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-normal text-muted">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all text-sm text-slate-800">{value}</code>
        <CopyButton iconOnly value={value} />
      </div>
    </div>
  );
}

function CodeBlock({ title, code, className = "" }: { title: string; code: string; className?: string }) {
  return (
    <div className={`min-w-0 max-w-full overflow-hidden rounded-lg border border-line bg-slate-950 ${className}`}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <p className="min-w-0 truncate text-xs font-semibold text-slate-300">{title}</p>
        <CopyButton className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200" copiedLabel="Copied" value={code}>
          Copy
        </CopyButton>
      </div>
      <pre className="max-w-full overflow-x-auto p-4 text-xs leading-6 text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
