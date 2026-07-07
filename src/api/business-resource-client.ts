import axios from "axios";

export const businessResourceBaseURL = `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000"}${
  import.meta.env.VITE_API_VERSION ?? "/api/v1"
}`;

export function idempotencyKey(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${random}`;
}

export function businessResourceHeaders(apiKeySecret: string, idempotency?: string) {
  return {
    Authorization: `Bearer ${apiKeySecret}`,
    "Content-Type": "application/json",
    ...(idempotency ? { "Idempotency-Key": idempotency } : {})
  };
}

export async function businessResourceRequest<T>(input: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  apiKeySecret: string;
  data?: unknown;
  params?: Record<string, unknown>;
  idempotencyKey?: string;
}) {
  try {
    const response = await axios.request<T>({
      baseURL: businessResourceBaseURL,
      url: input.path,
      method: input.method,
      data: input.data,
      params: input.params,
      headers: businessResourceHeaders(input.apiKeySecret, input.idempotencyKey)
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
      throw new Error(data?.error?.message ?? data?.message ?? error.message);
    }
    throw error;
  }
}
