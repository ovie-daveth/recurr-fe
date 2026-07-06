import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginMerchant } from "../../api/auth";
import { authStore } from "../../lib/auth-store";

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = authStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      const session = await loginMerchant({
        email: String(form.get("email")),
        password: String(form.get("password"))
      });
      setSession({
        accessToken: session.accessToken ?? session.token ?? "",
        refreshToken: session.refreshToken
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="w-full max-w-md rounded-lg bg-white p-8 shadow-panel" onSubmit={handleSubmit}>
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="mt-2 text-sm text-muted">Access your Recurr merchant dashboard.</p>

      <label className="mt-6 block text-sm font-medium">Email</label>
      <input className="mt-2 w-full rounded-md border border-line px-3 py-2" name="email" type="email" required />

      <label className="mt-4 block text-sm font-medium">Password</label>
      <input className="mt-2 w-full rounded-md border border-line px-3 py-2" name="password" type="password" required />

      {error && <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <button className="mt-6 w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white" disabled={loading}>
        {loading ? "Logging in..." : "Log in"}
      </button>

      <p className="mt-5 text-center text-sm text-muted">
        New to Recurr? <Link className="font-medium text-brand-700" to="/auth/signup">Create account</Link>
      </p>
    </form>
  );
}
