export function formatBDT(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  if (!isFinite(n)) return "৳ 0";
  return "৳ " + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function formatNumber(n: number | string | null | undefined): string {
  return Number(n ?? 0).toLocaleString("en-IN");
}

export function progressPercent(raised: number | string, target: number | string): number {
  const r = Number(raised ?? 0);
  const t = Number(target ?? 0);
  if (t <= 0) return 0;
  return Math.min(100, Math.round((r / t) * 100));
}

export function daysLeft(endDate: string | null | undefined): number | null {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
