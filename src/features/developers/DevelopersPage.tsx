import {
  BookOpenText,
  CheckCircle2,
  Code2,
  ExternalLink,
  KeyRound,
  Link as LinkIcon,
  Server,
  ShieldCheck,
  Webhook
} from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { CopyButton } from "../../components/ui/CopyButton";
import { authStore } from "../../lib/auth-store";

const apiBaseUrl = `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000"}${
  import.meta.env.VITE_API_VERSION ?? "/api/v1"
}`;
const docsUrl = `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000"}/api/docs`;

const endpoints = [
  {
    method: "POST",
    path: "/plans",
    label: "Create a plan",
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
    method: "POST",
    path: "/customers",
    label: "Create a customer",
    body: `{
  "email": "ada@example.com",
  "name": "Ada Lovelace",
  "externalReference": "user_123"
}`
  },
  {
    method: "POST",
    path: "/customers/{customerId}/payment-methods/setup-checkout",
    label: "Start Nomba card setup checkout",
    body: `{
  "callbackUrl": "https://merchant.app/billing/return",
  "metadata": {
    "source": "merchant_app"
  }
}`
  },
  {
    method: "POST",
    path: "/subscriptions",
    label: "Create a subscription",
    body: `{
  "customerId": "customer_uuid",
  "planId": "plan_uuid",
  "paymentMethodId": "payment_method_uuid"
}`
  }
];

const webhookEvents = [
  "subscription.created",
  "subscription.active",
  "subscription.past_due",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "payment_method.updated"
];

export function DevelopersPage() {
  const selectedMode = authStore((state) => state.selectedMode);
  const sampleKey = selectedMode === "LIVE" ? "sk_live_your_key" : "sk_test_your_key";
  const authSnippet = `curl --request GET \\
  --url ${apiBaseUrl}/plans \\
  --header 'Authorization: Bearer ${sampleKey}' \\
  --header 'Content-Type: application/json'`;
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
        title="Developers"
        description="API reference, integration flow, authentication headers, and webhook behavior for connecting your app to Recurr."
        action={
          <a
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white"
            href={docsUrl}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink size={17} />
            Open Swagger
          </a>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-6">
          <section className="rounded-lg border border-line bg-white shadow-panel">
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <Server className="text-brand-600" size={19} />
                <h2 className="font-semibold">Base URL and authentication</h2>
              </div>
              <p className="mt-1 text-sm text-muted">Use the business API key from the API keys page. Keys are environment-specific.</p>
            </div>
            <div className="grid gap-4 p-5 lg:grid-cols-2">
              <InfoBlock label="Base URL" value={apiBaseUrl} />
              <InfoBlock label="Current dashboard mode" value={selectedMode} />
              <CodeBlock title="Authenticated request" code={authSnippet} />
              <div className="rounded-lg border border-line bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <KeyRound size={18} className="text-muted" />
                  <h3 className="font-semibold">Required headers</h3>
                </div>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="font-mono text-xs text-muted">Authorization</dt>
                    <dd className="mt-1 break-all rounded-md bg-white px-3 py-2">Bearer {sampleKey}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs text-muted">Idempotency-Key</dt>
                    <dd className="mt-1 rounded-md bg-white px-3 py-2">Recommended for all POST requests.</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white shadow-panel">
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <BookOpenText className="text-brand-600" size={19} />
                <h2 className="font-semibold">Core integration flow</h2>
              </div>
              <p className="mt-1 text-sm text-muted">The normal merchant path is plan, customer, card setup, then subscription.</p>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {[
                ["1", "Create plans", "Define recurring prices using amountMinor. For NGN, 400000 means NGN 4,000."],
                ["2", "Create customers", "Store the subscriber under your business before starting checkout."],
                ["3", "Set up payment method", "Redirect the subscriber to Nomba checkout. Recurr requests card tokenization."],
                ["4", "Create subscription", "After the payment method is active, create or activate the subscription."]
              ].map(([step, title, description]) => (
                <article className="rounded-lg border border-line p-4" key={step}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-50 text-sm font-semibold text-brand-700">
                      {step}
                    </span>
                    <h3 className="font-semibold">{title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white shadow-panel">
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <Code2 className="text-brand-600" size={19} />
                <h2 className="font-semibold">Endpoint quick reference</h2>
              </div>
              <p className="mt-1 text-sm text-muted">Copy the examples and replace IDs with values returned by earlier requests.</p>
            </div>
            <div className="divide-y divide-line">
              {endpoints.map((endpoint) => (
                <article className="p-5" key={endpoint.path}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-semibold">{endpoint.label}</h3>
                      <p className="mt-1 break-all font-mono text-sm text-muted">
                        <span className="font-semibold text-brand-700">{endpoint.method}</span> {endpoint.path}
                      </p>
                    </div>
                    <CopyButton value={`${endpoint.method} ${endpoint.path}`} />
                  </div>
                  <CodeBlock className="mt-4" title="Request body" code={endpoint.body} />
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white shadow-panel">
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <Webhook className="text-brand-600" size={19} />
                <h2 className="font-semibold">Webhooks</h2>
              </div>
              <p className="mt-1 text-sm text-muted">Register a merchant webhook endpoint to receive billing events from Recurr.</p>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <h3 className="font-semibold">Common event types</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {webhookEvents.map((event) => (
                    <span className="rounded-md border border-line bg-slate-50 px-3 py-1.5 font-mono text-xs" key={event}>
                      {event}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-muted">
                  Recurr signs merchant webhook deliveries with HMAC SHA-256. Store the signing secret when you create the endpoint.
                </p>
              </div>
              <CodeBlock title="Verify signature" code={webhookSnippet} />
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
                "Use a LIVE business API key for live subscriptions.",
                "Send Idempotency-Key on create and charge requests.",
                "Store Recurr IDs returned by the API in your own database.",
                "Verify webhook signatures before trusting event payloads.",
                "Treat amountMinor as the source of truth for money."
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
              <LinkIcon className="text-brand-600" size={19} />
              <h2 className="font-semibold">Useful links</h2>
            </div>
            <div className="mt-4 space-y-3">
              <a className="block rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-slate-50" href="/dashboard/api-keys">
                API keys
              </a>
              <a className="block rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-slate-50" href="/dashboard/webhooks">
                Webhook endpoints
              </a>
              <a className="block rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-slate-50" href={docsUrl} rel="noreferrer" target="_blank">
                Swagger reference
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
