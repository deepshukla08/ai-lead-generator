const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function toError(response: Response, method: string, path: string): Promise<ApiError> {
  // FastAPI puts the useful message in `detail`; fall back to the status line.
  let detail = `${method} ${path} → ${response.status}`;
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") detail = body.detail;
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(response.status, detail);
}

/** Single place every JSON request goes through: base URL, headers, error shape. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? "GET";
  const response = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) throw await toError(response, method, path);
  return response.json() as Promise<T>;
}

/**
 * Multipart upload. Deliberately separate from `api`: setting Content-Type by
 * hand on a FormData body strips the boundary and the server rejects it.
 */
export async function uploadFile<T>(path: string, file: File, kind: string): Promise<T> {
  const form = new FormData();
  form.append("kind", kind);
  form.append("file", file);

  const response = await fetch(`${BASE_URL}/api/v1${path}`, { method: "POST", body: form });
  if (!response.ok) throw await toError(response, "POST", path);
  return response.json() as Promise<T>;
}
