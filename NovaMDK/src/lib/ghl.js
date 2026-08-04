export const treatmentLabel = (product) =>
  product ? `${product.categoryName} - ${product.name}` : "";

export async function syncToGhl(payload) {
  try {
    const res = await fetch("/api/ghl-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch {
    return { ok: false };
  }
}
