import { KeyRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { businessApiKeySecretId, authStore } from "../../lib/auth-store";

type BusinessApiKeyGateProps = {
  title: string;
  description: string;
};

export function BusinessApiKeyGate({ title, description }: BusinessApiKeyGateProps) {
  const businessId = authStore((state) => state.selectedBusinessId);
  const selectedMode = authStore((state) => state.selectedMode);
  const setBusinessApiKeySecret = authStore((state) => state.setBusinessApiKeySecret);
  const [secret, setSecret] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!businessId || !secret.trim()) return;
    setBusinessApiKeySecret({
      businessId,
      mode: selectedMode,
      secret: secret.trim()
    });
    setSecret("");
  }

  return (
    <section className="rounded-lg border border-line bg-white p-8 text-center shadow-panel">
      <KeyRound className="mx-auto text-muted" size={34} />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">{description}</p>
      <form className="mx-auto mt-5 flex max-w-xl flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
        <input
          className="min-w-0 flex-1 rounded-md border border-line px-3 py-2 text-sm"
          placeholder={`${selectedMode === "TEST" ? "sk_test" : "sk_live"}_...`}
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
        />
        <button className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" type="submit">
          Use key
        </button>
      </form>
      {businessId && (
        <p className="mt-3 text-xs text-muted">
          Stored locally for `{businessApiKeySecretId(businessId, selectedMode)}`.
        </p>
      )}
    </section>
  );
}
