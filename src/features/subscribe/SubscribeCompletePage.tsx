import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, Copy, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getPublicSubscriptionPage } from "../../api/public-subscriptions";
import { formatMoney } from "../../lib/format";

export function SubscribeCompletePage() {
  const { businessSlug = "", planCode = "" } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") === "LIVE" ? "LIVE" : "TEST";
  const orderReference = searchParams.get("orderReference") || searchParams.get("reference") || "";
  const orderId = searchParams.get("orderId") || "";

  const pageQuery = useQuery({
    queryKey: ["public-subscribe-complete", businessSlug, planCode, mode],
    queryFn: () => getPublicSubscriptionPage(businessSlug, planCode, mode),
    enabled: Boolean(businessSlug && planCode)
  });

  if (pageQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas">
        <Loader2 className="animate-spin text-muted" size={28} />
      </main>
    );
  }

  const businessName = pageQuery.data?.business.name ?? "the merchant";
  const merchantWebsite = normalizeWebsiteUrl(pageQuery.data?.business.website);
  const planName = pageQuery.data?.plan.name ?? planCode;
  const planPrice = pageQuery.data?.plan
    ? formatMoney(pageQuery.data.plan.amountMinor, pageQuery.data.plan.currency)
    : null;

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-5 py-10">
        <section className="w-full rounded-lg border border-line bg-white p-6 shadow-2xl md:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={30} />
          </div>

          <div className="mt-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
              <Clock3 size={15} />
              Confirmation in progress
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-normal md:text-4xl">
              Checkout completed
            </h1>
            <p className="mt-4 text-base leading-7 text-muted">
              Your payment was completed on Nomba. Recurr is waiting for the secure webhook confirmation before activating your recurring subscription for {businessName}.
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-line bg-slate-50 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Info label="Merchant" value={businessName} />
              <Info label="Plan" value={planPrice ? `${planName} · ${planPrice}` : planName} />
              <Info label="Mode" value={mode} />
              <Info label="Order ID" value={orderId || "-"} />
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="text-xs uppercase tracking-wide text-muted">Order reference</p>
              <div className="mt-2 flex items-center gap-2 rounded-md border border-line bg-white p-3">
                <code className="min-w-0 flex-1 break-all text-sm">{orderReference || "-"}</code>
                {orderReference && (
                  <button
                    aria-label="Copy order reference"
                    className="rounded-md border border-line p-2 text-muted"
                    type="button"
                    onClick={() => navigator.clipboard.writeText(orderReference)}
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 shrink-0" size={18} />
              <p>
                You do not need to pay again. If this page does not update immediately, the merchant will still receive confirmation once Recurr processes the webhook.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {merchantWebsite ? (
              <a
                className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white"
                href={merchantWebsite}
                rel="noreferrer"
              >
                Return to {businessName}
                <ExternalLink size={16} />
              </a>
            ) : (
              <Link className="inline-flex justify-center rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white" to={`/subscribe/${businessSlug}/${planCode}?mode=${mode}`}>
                Back to plan
              </Link>
            )}
            <Link className="inline-flex justify-center rounded-md border border-line px-4 py-2.5 text-sm font-semibold" to={`/subscribe/${businessSlug}/${planCode}?mode=${mode}`}>
              View plan
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function normalizeWebsiteUrl(value?: string | null) {
  const website = value?.trim();
  if (!website) return null;
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}
