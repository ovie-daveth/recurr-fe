import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  getPublicSubscriptionPage,
  startPublicSubscription,
  type StartPublicSubscriptionPayload
} from "../../api/public-subscriptions";
import { formatMoney } from "../../lib/format";

export function SubscribePage() {
  const { businessSlug = "", planCode = "" } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") === "LIVE" ? "LIVE" : "TEST";

  const pageQuery = useQuery({
    queryKey: ["public-subscribe", businessSlug, planCode, mode],
    queryFn: () => getPublicSubscriptionPage(businessSlug, planCode, mode),
    enabled: Boolean(businessSlug && planCode)
  });

  const startMutation = useMutation({
    mutationFn: (payload: StartPublicSubscriptionPayload) => startPublicSubscription(businessSlug, planCode, payload),
    onSuccess: (result) => {
      window.location.assign(result.checkout.checkoutUrl);
    }
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startMutation.mutate({
      mode,
      email: String(formData.get("email") || ""),
      name: optionalValue(formData.get("name")),
      phone: optionalValue(formData.get("phone")),
      callbackUrl: `${window.location.origin}/subscribe/${businessSlug}/${planCode}/complete?mode=${mode}`,
      metadata: {
        source: "hosted_subscription_page"
      }
    });
  }

  if (pageQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas">
        <Loader2 className="animate-spin text-muted" size={28} />
      </main>
    );
  }

  if (pageQuery.isError || !pageQuery.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-md rounded-lg border border-line bg-white p-8 text-center shadow-panel">
          <p className="text-lg font-semibold">Subscription page not found</p>
          <p className="mt-2 text-sm text-muted">The plan may be unavailable or the link may be incorrect.</p>
          <Link className="mt-6 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" to="/">
            Go to Recurr
          </Link>
        </div>
      </main>
    );
  }

  const { business, plan } = pageQuery.data;

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-ink">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[1fr_440px] lg:items-center">
        <section>
          <Link className="text-xl font-semibold" to="/">
            Recurr
          </Link>
          <div className="mt-16 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              <ShieldCheck size={16} />
              Secure recurring checkout
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-normal md:text-5xl">
              Subscribe to {business.name}
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted">
              Complete checkout once. Your card is securely tokenized by Nomba, then {business.name} can bill this plan automatically on schedule.
            </p>
          </div>

          <div className="mt-10 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
            <Feature text="Card handled by Nomba" />
            <Feature text="No merchant dashboard signup" />
            <Feature text="Recurring billing enabled" />
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-6 shadow-2xl">
          <div className="border-b border-line pb-5">
            <p className="text-sm font-medium text-muted">{business.name}</p>
            <h2 className="mt-2 text-2xl font-semibold">{plan.name}</h2>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-4xl font-semibold">{formatMoney(plan.amountMinor, plan.currency)}</span>
              <span className="pb-1 text-sm text-muted">
                / {plan.intervalCount} {plan.interval.toLowerCase()}
              </span>
            </div>
            {mode === "TEST" && (
              <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Test mode checkout. Use this for sandbox/demo payments.
              </p>
            )}
          </div>

          <form className="mt-6" onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <TextField label="Email" name="email" required type="email" />
              <TextField label="Full name" name="name" />
              <TextField label="Phone" name="phone" />
            </div>

            {startMutation.isError && (
              <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {startMutation.error instanceof Error ? startMutation.error.message : "Could not start checkout"}
              </div>
            )}

            <button
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={startMutation.isPending}
              type="submit"
            >
              {startMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
              Continue to secure checkout
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-muted">
            By continuing, you authorize recurring billing for this plan.
          </p>
        </section>
      </div>
    </main>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-3 shadow-panel">
      <CheckCircle2 className="text-emerald-600" size={17} />
      {text}
    </div>
  );
}

function TextField({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input className="mt-2 w-full rounded-md border border-line px-3 py-2.5 outline-none focus:border-brand-500" name={name} required={required} type={type} />
    </label>
  );
}

function optionalValue(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : undefined;
}
