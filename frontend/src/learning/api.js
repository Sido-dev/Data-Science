export const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const syncEnabled = Boolean(API) || import.meta.env.DEV;
export async function request(
  path,
  { token, body, method = "GET", admin } = {},
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API}/api/v2${path}`, {
      method,
      signal: controller.signal,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(admin ? { "X-Admin-Key": admin } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(
        typeof data.detail === "string"
          ? data.detail
          : "The request could not be completed. Check your details and try again.",
      );
    return data;
  } catch (e) {
    if (e.name === "AbortError")
      throw new Error(
        "The server took too long to respond. Your browser progress is still saved.",
      );
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
