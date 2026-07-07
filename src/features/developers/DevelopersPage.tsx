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
import { PageHeader } from "../../components/ui/PageHeader";
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
    <>
      <PageHeader
        title="Developer integration"
        description="A practical path for connecting your app to Recurr: create a business, get an API key, send customers to checkout, then listen for billing events."
        action={
          <a
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white"
            href={docsUrl}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink size={17} />
            Open API reference
          </a>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-6">
          <section className="rounded-lg border border-line bg-white shadow-panel">
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <div className="flex items-center gap-2">
                  <Server className="text-brand-600" size={19} />
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
              <CodeBlock title="Authenticated request" code={authSnippet} />
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white shadow-panel">
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <Route className="text-brand-600" size={19} />
                <h2 className="font-semibold">Integration path</h2>
              </div>
              <p className="mt-1 text-sm text-muted">Follow these steps in order for a normal subscription integration.</p>
            </div>
            <div className="divide-y divide-line">
              {steps.map((step, index) => (
                <article className="grid gap-4 p-5 lg:grid-cols-[220px_1fr]" key={step.id}>
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

          <section className="rounded-lg border border-line bg-white shadow-panel">
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <Code2 className="text-brand-600" size={19} />
                <h2 className="font-semibold">Copy-ready examples</h2>
              </div>
              <p className="mt-1 text-sm text-muted">Start with the hosted subscription flow if you want Recurr and Nomba to handle card setup.</p>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                {endpointGroups.map((endpoint) => (
                  <article className="rounded-lg border border-line p-4" key={endpoint.path}>
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

          <section className="rounded-lg border border-line bg-white shadow-panel">
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <Webhook className="text-brand-600" size={19} />
                <h2 className="font-semibold">Webhooks and automatic billing</h2>
              </div>
              <p className="mt-1 text-sm text-muted">Your integration should trust webhook events, not the customer returning to your callback URL.</p>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <div className="rounded-lg border border-line bg-slate-50 p-4">
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
              <CodeBlock title="Verify Recurr webhook signature" code={webhookSnippet} />
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
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

          <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
            <div className="flex items-center gap-2">
              <ArrowRight className="text-brand-600" size={19} />
              <h2 className="font-semibold">Dashboard shortcuts</h2>
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
    </>
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
    <div className={`overflow-hidden rounded-lg border border-line bg-slate-950 ${className}`}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <p className="text-xs font-semibold text-slate-300">{title}</p>
        <CopyButton className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200" copiedLabel="Copied" value={code}>
          Copy
        </CopyButton>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-6 text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
