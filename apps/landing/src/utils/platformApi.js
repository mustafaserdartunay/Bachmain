const DEFAULT_LEGACY_API = "https://yonetim.bachmain.com/api";
const DEFAULT_V1_API = import.meta.env.VITE_API_URL || "";

const APP_URL = "https://uygulama.bachmain.com";

/** Prefer centralized apps/api (/v1). Fall back to legacy yonetim API. */
export function getPlatformApiBase() {
  if (DEFAULT_V1_API) return String(DEFAULT_V1_API).replace(/\/$/, "");
  if (import.meta.env.VITE_PLATFORM_API_URL) {
    return String(import.meta.env.VITE_PLATFORM_API_URL).replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://127.0.0.1:8080";
    }
  }
  return DEFAULT_LEGACY_API;
}

function isV1Base(base) {
  return /:8080$|api\.bachmain\.com|\/v1$/.test(base) || Boolean(DEFAULT_V1_API);
}

export async function platformPost(path, body) {
  const base = getPlatformApiBase();
  const clean = String(path).replace(/^\//, "");

  // Map legacy paths → v1 when talking to new API
  let urlPath = clean;
  if (isV1Base(base) || base.includes("8080")) {
    if (clean === "leads/demo" || clean === "demo-requests") urlPath = "v1/leads/demo";
    else if (clean === "auth/register") urlPath = "v1/auth/register";
    else if (clean === "auth/login") urlPath = "v1/auth/login";
    else if (!clean.startsWith("v1/")) urlPath = clean.startsWith("auth/") || clean.startsWith("leads/") ? `v1/${clean}` : clean;
  }

  const res = await fetch(`${base}/${urlPath}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP_${res.status}`);
    err.code = data.error;
    err.status = res.status;
    throw err;
  }

  // Normalize new API token shape for landing handoff
  if (data.tokens?.accessToken && !data.token) {
    data.token = data.tokens.accessToken;
  }
  // Map register field aliases from landing form
  return data;
}

export function redirectToAppWithToken(token) {
  const url = new URL(APP_URL);
  if (token) url.searchParams.set("authToken", token);
  window.location.href = url.toString();
}
