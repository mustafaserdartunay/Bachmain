const DEFAULT_API = "https://yonetim.bachmain.com/api";
const APP_URL = "https://uygulama.bachmain.com";

export function getPlatformApiBase() {
  const fromEnv = import.meta.env.VITE_PLATFORM_API_URL;
  if (fromEnv) return String(fromEnv).replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://127.0.0.1:5201/api";
    }
  }
  return DEFAULT_API;
}

export async function platformPost(path, body) {
  const base = getPlatformApiBase();
  const res = await fetch(`${base}/${String(path).replace(/^\//, "")}`, {
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
  return data;
}

export function redirectToAppWithToken(token) {
  const url = new URL(APP_URL);
  if (token) url.searchParams.set("authToken", token);
  window.location.href = url.toString();
}
