// QA: the whole app on a fake API (no sign-in, no database). Open
// /tests/app-preview.html?path=/entries on the dev server; add &hang to keep
// the data pending, so the page stays on its skeleton. window.__layout() lists
// the top and height of each block, to compare a skeleton with its page.
import type { Category, Entry, Subcategory } from "../src/types";

const day = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  return date.toISOString().slice(0, 10);
};
const categories: Category[] = [
  ["c1", "Casa", "#0a84ff"],
  ["c2", "Spesa alimentare", "#30d158"],
  ["c3", "Trasporti", "#ff9f0a"],
  ["c4", "Svago", "#bf5af2"],
  ["c5", "Lavoro", "#64d2ff"],
].map(([_id, name, color]) => ({ _id, name, color }));
const subcategories: Subcategory[] = [
  ["s1", "Affitto", "c1"],
  ["s2", "Bollette", "c1"],
  ["s3", "Supermercato", "c2"],
  ["s4", "Benzina", "c3"],
  ["s5", "Cinema", "c4"],
  ["s6", "Stipendio", "c5"],
].map(([_id, name, category]) => ({ _id, name, category }));
const entries: Entry[] = Array.from({ length: 14 }, (_, index) => {
  const income = index % 5 === 0;
  const sub = income ? subcategories[5] : subcategories[index % 5];
  return {
    _id: `x${index}`,
    kind: income ? "income" : "expense",
    amountCents: income ? 180000 : 1250 + index * 731,
    date: day(index * 2),
    category: sub.category,
    subcategory: sub._id,
    conversion: null,
  };
});
const totals = (list: Entry[]) => {
  const income = list.filter((e) => e.kind === "income").reduce((t, e) => t + e.amountCents, 0);
  const expense = list.filter((e) => e.kind === "expense").reduce((t, e) => t + e.amountCents, 0);
  return {
    income,
    expense,
    balance: income - expense,
    count: list.length,
    byCategory: categories.map((c) => ({
      _id: c._id,
      total: list.filter((e) => e.category === c._id && e.kind === "expense").reduce((t, e) => t + e.amountCents, 0),
    })),
    daily: list.map((e) => ({ _id: { date: e.date, kind: e.kind }, total: e.amountCents })),
  };
};
const user = {
  id: "u1",
  name: "Kevin",
  surname: "QA",
  email: "qa@example.com",
  monthlyBudgetCents: 150000,
  currency: "EUR",
};
const answer = (path: string): unknown => {
  const url = new URL(path, location.origin);
  const route = url.pathname.replace(/^\/api/, "");
  if (route === "/auth/me") return { user };
  if (route === "/categories") return { categories, subcategories };
  if (route === "/entries") return { entries: entries.slice(0, 10), total: entries.length, totalPages: 2 };
  if (route === "/summary") return totals(entries);
  if (route === "/annual-summary")
    return {
      ...totals(entries),
      year: url.searchParams.get("year") ?? String(new Date().getFullYear()),
      monthly: Array.from({ length: 12 }, (_, m) => [
        { _id: { month: String(m + 1).padStart(2, "0"), kind: "expense" as const }, total: 90000 + m * 4000 },
        { _id: { month: String(m + 1).padStart(2, "0"), kind: "income" as const }, total: 180000 },
      ]).flat(),
      entries,
    };
  return {};
};
const params = new URLSearchParams(location.search);
const hang = params.has("hang");
const realFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const path = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (!path.includes("/api/")) return realFetch(input, init);
  if (hang && !path.includes("/auth/me")) return new Promise<Response>(() => {});
  return new Response(JSON.stringify(answer(path)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
(window as unknown as { __layout: () => string[] }).__layout = () => {
  const grid =
    document.querySelector(
      "main .ios-analytics__grid, main .et-categories, main .ios-page, main .et-entries-list",
    ) ?? document.querySelector("main");
  return [...(grid?.children ?? [])].map((child) => {
    const rect = child.getBoundingClientRect();
    const name = child.className.toString().split(" ").slice(0, 2).join(".");
    return `${name} top=${Math.round(rect.top + scrollY)} h=${Math.round(rect.height)}`;
  });
};
history.replaceState({}, "", params.get("path") ?? "/");
await import("../src/main");
