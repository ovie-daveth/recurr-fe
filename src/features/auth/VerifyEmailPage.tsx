import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyMerchantEmail } from "../../api/auth";
import { authStore } from "../../lib/auth-store";

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setSession = authStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const session = await verifyMerchantEmail(String(form.get("email")), String(form.get("token")));
      setSession({
        accessToken: session.accessToken ?? session.token ?? "",
        refreshToken: session.refreshToken
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    }
  }

  return (
    <form className="w-full max-w-md rounded-lg bg-white p-8 shadow-panel" onSubmit={handleSubmit}>
      <h1 className="text-2xl font-semibold">Verify email</h1>
      <p className="mt-2 text-sm text-muted">Paste the verification token from your signup response or email.</p>
      <label className="mt-6 block text-sm font-medium">Email</label>
      <input
        className="mt-2 w-full rounded-md border border-line px-3 py-2"
        name="email"
        type="email"
        defaultValue={params.get("email") ?? ""}
        required
      />
      <label className="mt-4 block text-sm font-medium">Token</label>
      <input
        className="mt-2 w-full rounded-md border border-line px-3 py-2"
        name="token"
        defaultValue={params.get("token") ?? ""}
        required
      />
      {error && <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <button className="mt-6 w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white">Verify</button>
    </form>
  );
}
