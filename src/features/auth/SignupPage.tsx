import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupMerchant, type MerchantSignupPayload } from "../../api/auth";

export function SignupPage() {
  const navigate = useNavigate();
  const [merchantType, setMerchantType] = useState<"INDIVIDUAL" | "BUSINESS">("INDIVIDUAL");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);

    const base = {
      email: String(form.get("email")),
      password: String(form.get("password")),
      contactPhone: String(form.get("contactPhone")),
      country: String(form.get("country") || "NG")
    };

    const payload: MerchantSignupPayload =
      merchantType === "BUSINESS"
        ? {
            ...base,
            type: "BUSINESS",
            name: String(form.get("ownerName")),
            businessName: String(form.get("businessName")),
            contactName: String(form.get("contactName")),
            businessRegistrationNumber: optionalValue(form.get("businessRegistrationNumber")),
            taxId: optionalValue(form.get("taxId")),
            website: optionalValue(form.get("website"))
          }
        : {
            ...base,
            type: "INDIVIDUAL",
            legalName: String(form.get("legalName")),
            displayName: optionalValue(form.get("displayName"))
          };

    try {
      const signup = await signupMerchant(payload);
      setMessage("Signup created. Verify your email to continue.");

      if (signup.verificationToken) {
        const params = new URLSearchParams({
          email: base.email,
          token: signup.verificationToken
        });
        navigate(`/auth/verify-email?${params.toString()}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="w-full max-w-lg rounded-lg bg-white p-8 shadow-panel" onSubmit={handleSubmit}>
      <h1 className="text-2xl font-semibold">Create merchant account</h1>
      <p className="mt-2 text-sm text-muted">Start with owner access to your first business.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Type
          <select
            className="mt-2 w-full rounded-md border border-line px-3 py-2"
            name="type"
            value={merchantType}
            onChange={(event) => setMerchantType(event.target.value as "INDIVIDUAL" | "BUSINESS")}
          >
            <option value="INDIVIDUAL">Individual</option>
            <option value="BUSINESS">Business</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Country
          <input className="mt-2 w-full rounded-md border border-line px-3 py-2" name="country" defaultValue="NG" required />
        </label>
        <label className="block text-sm font-medium md:col-span-2">
          Email
          <input className="mt-2 w-full rounded-md border border-line px-3 py-2" name="email" type="email" required />
        </label>
        <label className="block text-sm font-medium md:col-span-2">
          Password
          <input className="mt-2 w-full rounded-md border border-line px-3 py-2" name="password" type="password" required />
        </label>

        {merchantType === "INDIVIDUAL" ? (
          <>
            <label className="block text-sm font-medium">
              Legal name
              <input className="mt-2 w-full rounded-md border border-line px-3 py-2" name="legalName" required />
            </label>
            <label className="block text-sm font-medium">
              Display name
              <input className="mt-2 w-full rounded-md border border-line px-3 py-2" name="displayName" />
            </label>
          </>
        ) : (
          <>
            <label className="block text-sm font-medium">
              Owner name
              <input className="mt-2 w-full rounded-md border border-line px-3 py-2" name="ownerName" required />
            </label>
            <label className="block text-sm font-medium">
              Business name
              <input className="mt-2 w-full rounded-md border border-line px-3 py-2" name="businessName" required />
            </label>
            <label className="block text-sm font-medium">
              Contact name
              <input className="mt-2 w-full rounded-md border border-line px-3 py-2" name="contactName" required />
            </label>
            <label className="block text-sm font-medium">
              Registration number
              <input className="mt-2 w-full rounded-md border border-line px-3 py-2" name="businessRegistrationNumber" />
            </label>
            <label className="block text-sm font-medium">
              Tax ID
              <input className="mt-2 w-full rounded-md border border-line px-3 py-2" name="taxId" />
            </label>
            <label className="block text-sm font-medium">
              Website
              <input className="mt-2 w-full rounded-md border border-line px-3 py-2" name="website" type="url" />
            </label>
          </>
        )}

        <label className="block text-sm font-medium md:col-span-2">
          Contact phone
          <input className="mt-2 w-full rounded-md border border-line px-3 py-2" name="contactPhone" required />
        </label>
      </div>

      {message && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <button className="mt-6 w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white" disabled={loading}>
        {loading ? "Creating..." : "Create account"}
      </button>

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account? <Link className="font-medium text-brand-700" to="/auth/login">Log in</Link>
      </p>
    </form>
  );
}

function optionalValue(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : undefined;
}
