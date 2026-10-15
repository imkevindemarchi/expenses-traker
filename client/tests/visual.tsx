import { MemoryRouter } from "react-router";
// Isolated visual fixture. This file is not an entry point of the production build.
import { createRoot } from "react-dom/client";
import "../src/i18n";
import App from "../src/App";
import { today } from "../src/api";
import "../src/index.css?revision=final";
const previewTheme = new URLSearchParams(location.search).get("theme");
if (previewTheme === "dark" || previewTheme === "light") {
  const deviceMatchMedia = window.matchMedia.bind(window);
  window.matchMedia = (query) =>
    query === "(prefers-color-scheme: dark)"
      ? ({
          matches: previewTheme === "dark",
          media: query,
          onchange: null,
          addListener() {},
          removeListener() {},
          addEventListener() {},
          removeEventListener() {},
          dispatchEvent() {
            return false;
          },
        } as MediaQueryList)
      : deviceMatchMedia(query);
}
const month = today().slice(0, 7);
const categories = [
  { _id: "a".repeat(24), name: "Lavoro", color: "#32cd32" },
  { _id: "b".repeat(24), name: "Extra", color: "#8b5cf6" },
  { _id: "c".repeat(24), name: "Necessità", color: "#38bdf8" },
];
const subcategories = [
  { _id: "d".repeat(24), name: "Stipendio", category: categories[0]._id },
  { _id: "e".repeat(24), name: "Visite", category: categories[2]._id },
];
let demoUser = {
  id: "f".repeat(24),
  name: "Account di esempio",
  email: "demo@example.invalid",
  currency: "EUR",
  monthlyBudgetCents: 100000 as number | null,
};
let entries = [
  {
    _id: "1".repeat(24),
    kind: "income",
    amountCents: 240000,
    date: `${month}-01`,
    category: categories[0]._id,
    subcategory: subcategories[0]._id,
  },
  {
    _id: "2".repeat(24),
    kind: "expense",
    amountCents: 9500,
    date: `${month}-08`,
    category: categories[2]._id,
    subcategory: subcategories[1]._id,
  },
  {
    _id: "3".repeat(24),
    kind: "expense",
    amountCents: 6245,
    date: `${month}-05`,
    category: categories[2]._id,
    subcategory: "",
  },
  {
    _id: "4".repeat(24),
    kind: "expense",
    amountCents: 3800,
    date: `${month}-04`,
    category: categories[1]._id,
    subcategory: "",
  },
];
window.fetch = async (request, init) => {
  const url = new URL(String(request), location.origin);
  const selectedEntries = entries.filter((entry) => {
    const matches = ["category", "subcategory", "kind"] as const;
    const query = url.searchParams.get("q")?.trim().toLocaleLowerCase();
    return (
      matches.every(
        (key) => !url.searchParams.get(key) || entry[key] === url.searchParams.get(key),
      ) &&
      (!url.searchParams.get("month") || entry.date.startsWith(url.searchParams.get("month")!)) &&
      (!query ||
        [
          categories.find((item) => item._id === entry.category)?.name,
          subcategories.find((item) => item._id === entry.subcategory)?.name,
        ].some((name) => name?.toLocaleLowerCase().includes(query)))
    );
  });
  let data: unknown = {};
  if (url.pathname.endsWith("/auth/me")) data = { user: demoUser };
  else if (url.pathname.endsWith("/backup/import")) {
    const body = JSON.parse(String(init?.body));
    data = { categories: body.categories.length, subcategories: body.subcategories.length, entries: body.entries.length };
  }
  else if (url.pathname.endsWith("/account/settings")) {
    const body = JSON.parse(String(init?.body));
    demoUser = {
      ...demoUser,
      currency: body.currency,
      monthlyBudgetCents:
        body.monthlyBudget === ""
          ? null
          : Math.round(Number(body.monthlyBudget.replace(",", ".")) * 100),
    };
    data = { user: demoUser };
  } else if (url.pathname.endsWith("/categories")) data = { categories, subcategories };
  else if (url.pathname.endsWith("/annual-summary")) {
    const selected = entries.filter((entry) =>
      entry.date.startsWith(url.searchParams.get("year") ?? ""),
    );
    const income = selected
      .filter((entry) => entry.kind === "income")
      .reduce((sum, entry) => sum + entry.amountCents, 0);
    const expense = selected
      .filter((entry) => entry.kind === "expense")
      .reduce((sum, entry) => sum + entry.amountCents, 0);
    data = {
      year: url.searchParams.get("year"),
      income,
      expense,
      balance: income - expense,
      count: selected.length,
      daily: [],
      monthly: selected.map((entry) => ({
        _id: { month: entry.date.slice(0, 7), kind: entry.kind },
        total: entry.amountCents,
      })),
      byCategory: categories
        .map((category) => ({
          _id: category._id,
          total: selected
            .filter((entry) => entry.kind === "expense" && entry.category === category._id)
            .reduce((sum, entry) => sum + entry.amountCents, 0),
        }))
        .filter((item) => item.total),
      entries: selected.slice(0, 5),
    };
  } else if (url.pathname.endsWith("/summary")) {
    const income = selectedEntries
      .filter((entry) => entry.kind === "income")
      .reduce((sum, entry) => sum + entry.amountCents, 0);
    const expense = selectedEntries
      .filter((entry) => entry.kind === "expense")
      .reduce((sum, entry) => sum + entry.amountCents, 0);
    data = {
      income,
      expense,
      balance: income - expense,
      count: selectedEntries.length,
      byCategory: categories
        .map((category) => ({
          _id: category._id,
          total: selectedEntries
            .filter((entry) => entry.kind === "expense" && entry.category === category._id)
            .reduce((sum, entry) => sum + entry.amountCents, 0),
        }))
        .filter((item) => item.total),
      daily: selectedEntries.map((entry) => ({
        _id: { date: entry.date, kind: entry.kind },
        total: entry.amountCents,
      })),
    };
  } else if (url.pathname.endsWith("/entries") && init?.method === "POST") {
    const body = JSON.parse(String(init.body));
    entries = [
      {
        ...body,
        _id: "5".repeat(24),
        amountCents: Math.round(Number(body.amount.replace(",", ".")) * 100),
      },
      ...entries,
    ];
  } else if (url.pathname.endsWith("/entries"))
    data = {
      entries: [...selectedEntries].sort((a, b) => b.date.localeCompare(a.date)),
      total: selectedEntries.length,
      totalPages: selectedEntries.length ? 1 : 0,
    };
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
};
createRoot(document.getElementById("root")!).render(
  <MemoryRouter initialEntries={[new URLSearchParams(location.search).get("route") || "/"]}>
    <App />
  </MemoryRouter>,
);
