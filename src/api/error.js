export function getApiErrorMessage(err, fallback = "Something went wrong") {
  const data = err?.response?.data;

  if (typeof data === "string" && data.trim()) return data;
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  if (typeof data?.detail === "string" && data.detail.trim()) return data.detail;
  if (Array.isArray(data?.message) && data.message.length > 0) return data.message.join(", ");
  if (Array.isArray(data?.detail) && data.detail.length > 0) return data.detail.join(", ");

  return fallback;
}
