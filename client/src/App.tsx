import { receiveGlassClarity } from "./utils/glass-clarity.util";
import { lazyPage as lazy, useNavigationPreload } from "./utils/navigation-preload";
import { CurrencyContext } from "./contexts/currency.context";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import { ROUTE_PATHS, pageFromPath, safeReturnPath, type Page } from "./routes/routes.config";
import { usePageTitle } from "./hooks/use-page-title.hook";
import { useTranslation } from "react-i18next";
import { tr } from "./i18n";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Layers3 } from "lucide-react";
import { api, ApiError, today } from "./api";
import type { User, Category, Subcategory, Entry, Summary } from "./types";
import Layout from "./components/Layout.component";
import ActivitySnackbar from "./components/ActivitySnackbar.component";
import Popup from "./components/Popup.component";
import EntryModal from "./components/EntryModal.component";
import EntryFiltersModal from "./components/EntryFiltersModal.component";
import ManageModal, { type ManageForm } from "./components/ManageModal.component";
import DeleteConfirmModal from "./components/DeleteConfirmModal.component";
import AuthPage from "./pages/Auth.page";
import DashboardPage from "./pages/Dashboard.page";
import EntriesPage from "./pages/Entries.page";
import ManagementPage from "./pages/Management.page";
const AnnualPage = lazy(() => import("./pages/Annual.page"), ["/annual"]);
const SettingsPage = lazy(() => import("./pages/Settings.page"), ["/settings"]);

const emptySummary: Summary = {
  income: 0,
  expense: 0,
  balance: 0,
  count: 0,
  byCategory: [],
  daily: [],
};
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : tr("Si è verificato un errore.");
type EntryForm = {
  kind: "expense" | "income";
  amount: string;
  date: string;
  category: string;
  subcategory: string;
};
type DeleteAction = { endpoint: string; label: string; detail?: string; color?: string };

export default function App() {
  useTranslation();
  const [user, setUser] = useState<User | null>(null);
  useNavigationPreload(user ? ["/annual"] : []);
  const [boot, setBoot] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const page = pageFromPath(location.pathname);
  usePageTitle(
    location.pathname === ROUTE_PATHS.login
      ? tr("Accedi")
      : location.pathname === ROUTE_PATHS.register
        ? tr("Registrati")
        : tr(
            page === "dashboard"
              ? "Riepilogo mensile"
              : page === "entries"
                ? "Movimenti"
                : page === "settings"
                  ? "Impostazioni"
                  : page === "annual"
                    ? "Riepilogo annuale"
                    : "Management",
          ),
  );
  const [month, setMonth] = useState(today().slice(0, 7));
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");
  const [filterKind, setFilterKind] = useState("");
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtersChanged = Boolean(
    search || filterCategory || filterSubcategory || filterKind || month !== today().slice(0, 7),
  );
  const resetEntryFilters = () => {
    setFiltersModalOpen(false);
    setSearch("");
    setFilterCategory("");
    setFilterSubcategory("");
    setFilterKind("");
    setMonth(today().slice(0, 7));
    setListPage(1);
  };
  const [listPage, setListPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; message: string } | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [categoryRevision, setCategoryRevision] = useState(0);
  const [entryEdit, setEntryEdit] = useState<{ id?: string; form: EntryForm } | null>(null);
  const [manageEdit, setManageEdit] = useState<ManageForm | null>(null);
  const [deleteAction, setDeleteAction] = useState<DeleteAction | null>(null);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    api<{ user: User }>("/auth/me", { signal: controller.signal })
      .then((data) => {
        if (!active) return;
        setUser(data.user);
        receiveGlassClarity(data.user.glassClarity);
      })
      .catch((error) => {
        if (active && (!(error instanceof ApiError) || error.status !== 401))
          setNotice({ error: true, message: errorText(error) });
      })
      .finally(() => {
        if (active) setBoot(false);
      });
    const expired = () => {
      setUser(null);
      setCategories([]);
      setSubcategories([]);
      setEntries([]);
      setSummary(emptySummary);
      setEntryEdit(null);
      setManageEdit(null);
      setDeleteAction(null);
      setNotice({ error: true, message: "Sessione scaduta. Accedi di nuovo." });
    };
    window.addEventListener("session-expired", expired);
    return () => {
      active = false;
      controller.abort();
      window.removeEventListener("session-expired", expired);
    };
  }, []);
  useEffect(() => {
    if (!user) return;
    let active = true;
    const controller = new AbortController();
    setCategoriesLoading(true);
    api<{ categories: Category[]; subcategories: Subcategory[] }>("/categories", {
      signal: controller.signal,
    })
      .then((data) => {
        if (active) {
          setCategories(data.categories);
          setSubcategories(data.subcategories);
        }
      })
      .catch((error) => {
        if (active) setNotice({ error: true, message: errorText(error) });
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [user?.id, categoryRevision]);
  const needsMonthlyData = page === "dashboard" || page === "entries";
  useEffect(() => {
    if (!user || !needsMonthlyData) return;
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(
      () => {
        const query = new URLSearchParams({
          month,
          page: String(page === "dashboard" ? 1 : listPage),
          limit: String(page === "dashboard" ? 5 : pageLimit),
        });
        if (page === "entries") {
          if (filterCategory) query.set("category", filterCategory);
          if (filterSubcategory) query.set("subcategory", filterSubcategory);
          if (filterKind) query.set("kind", filterKind);
          if (search.trim()) query.set("q", search.trim());
        }
        api<{ entries: Entry[]; total: number; totalPages: number }>(`/entries?${query}`, {
          signal: controller.signal,
        })
          .then((list) => {
            if (!active) return;
            if (page === "entries" && listPage > Math.max(1, list.totalPages)) {
              setListPage(Math.max(1, list.totalPages));
              return;
            }
            setEntries(list.entries);
            setTotalEntries(list.total);
            setTotalPages(list.totalPages);
          })
          .catch((error) => {
            if (active) setNotice({ error: true, message: errorText(error) });
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      },
      search && page === "entries" ? 250 : 0,
    );
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [
    user?.id,
    needsMonthlyData,
    month,
    listPage,
    pageLimit,
    filterCategory,
    filterSubcategory,
    filterKind,
    search,
    refresh,
    page,
  ]);
  const summaryCategory = page === "entries" ? filterCategory : "";
  const summarySubcategory = page === "entries" ? filterSubcategory : "";
  const summaryKind = page === "entries" ? filterKind : "";
  const summarySearch = page === "entries" ? search.trim() : "";
  useEffect(() => {
    if (!user || !needsMonthlyData) return;
    let active = true;
    const controller = new AbortController();
    setSummaryLoading(true);
    const timer = window.setTimeout(
      () => {
        const query = new URLSearchParams({ month });
        if (summaryCategory) query.set("category", summaryCategory);
        if (summarySubcategory) query.set("subcategory", summarySubcategory);
        if (summaryKind) query.set("kind", summaryKind);
        if (summarySearch) query.set("q", summarySearch);
        api<Summary>(`/summary?${query}`, { signal: controller.signal })
          .then((result) => {
            if (active) setSummary(result);
          })
          .catch((error) => {
            if (active) setNotice({ error: true, message: errorText(error) });
          })
          .finally(() => {
            if (active) setSummaryLoading(false);
          });
      },
      summarySearch ? 250 : 0,
    );
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [
    user?.id,
    needsMonthlyData,
    month,
    summaryCategory,
    summarySubcategory,
    summaryKind,
    summarySearch,
    refresh,
  ]);
  const categoryById = useMemo(
    () => new Map(categories.map((item) => [item._id, item])),
    [categories],
  );
  const subcategoryById = useMemo(
    () => new Map(subcategories.map((item) => [item._id, item])),
    [subcategories],
  );
  const subcategoriesByCategory = useMemo(() => {
    const groups = new Map<string, Subcategory[]>();
    for (const item of subcategories) {
      const group = groups.get(item.category);
      if (group) group.push(item);
      else groups.set(item.category, [item]);
    }
    return groups;
  }, [subcategories]);
  const mutate = async (endpoint: string, method: string, body?: unknown) => {
    setBusy(true);
    setNotice(null);
    try {
      await api(endpoint, { method, body });
      if (/^\/(categories|subcategories)(?:\/|$)/.test(endpoint))
        setCategoryRevision((value) => value + 1);
      setRefresh((value) => value + 1);
      setNotice({ error: false, message: "Modifica salvata." });
      return true;
    } catch (error) {
      setNotice({ error: true, message: errorText(error) });
      return false;
    } finally {
      setBusy(false);
    }
  };
  const openEntry = (entry?: Entry) =>
    setEntryEdit(
      entry
        ? {
            id: entry._id,
            form: {
              kind: entry.kind,
              amount: (entry.amountCents / 100).toFixed(2),
              date: entry.date,
              category: entry.category,
              subcategory: entry.subcategory ?? "",
            },
          }
        : { form: { kind: "expense", amount: "", date: today(), category: "", subcategory: "" } },
    );
  const saveManage = async (event: FormEvent) => {
    event.preventDefault();
    if (!manageEdit) return;
    const route = manageEdit.mode === "category" ? "categories" : "subcategories";
    if (
      await mutate(
        `/${route}${manageEdit.id ? `/${manageEdit.id}` : ""}`,
        manageEdit.id ? "PATCH" : "POST",
        manageEdit,
      )
    )
      setManageEdit(null);
  };
  useEffect(() => {
    setSearch("");
    setFilterCategory("");
    setFilterSubcategory("");
    setFilterKind("");
    setListPage(1);
    setEntryEdit(null);
    setManageEdit(null);
    setDeleteAction(null);
    setFiltersModalOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  const changePage = (next: Page) => {
    navigate(ROUTE_PATHS[next]);
    setSearch("");
    setFilterCategory("");
    setFilterSubcategory("");
    setFilterKind("");
    setListPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const logout = async () => {
    if (await mutate("/auth/logout", "POST")) {
      setUser(null);
      setCategories([]);
      setSubcategories([]);
      setEntries([]);
      setSummary(emptySummary);
      navigate(ROUTE_PATHS.login, { replace: true });
      setNotice(null);
    }
  };
  const editingEntry = entries.find((entry) => entry._id === entryEdit?.id);

  return (
    <CurrencyContext.Provider value={user?.currency ?? "EUR"}>
      <ActivitySnackbar />
      {notice && (
        <Popup
          key={notice.message}
          popup={{ type: notice.error ? "error" : "success", message: tr(notice.message) }}
          isClosing={false}
          autoCloseMs={4000}
          onClose={() => setNotice(null)}
        />
      )}
      {boot ? null : !user ? (
        <Routes>
          {[ROUTE_PATHS.login, ROUTE_PATHS.register].map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <AuthPage
                  onLogin={(account) => {
                    setUser(account);
                    receiveGlassClarity(account.glassClarity);
                    setNotice(null);
                    navigate(safeReturnPath(location.state?.from), { replace: true });
                  }}
                />
              }
            />
          ))}
          <Route
            path="*"
            element={<Navigate to="/login" state={{ from: location.pathname }} replace />}
          />
        </Routes>
      ) : location.pathname === ROUTE_PATHS.login || location.pathname === ROUTE_PATHS.register ? (
        <Navigate to={safeReturnPath(location.state?.from)} replace />
      ) : (
        <>
          <Layout user={user} onLogout={() => void logout()}>
            <Routes>
              <Route
                path={ROUTE_PATHS.dashboard}
                element={
                  <DashboardPage
                    user={user}
                    month={month}
                    onMonthChange={(value) => {
                      setMonth(value);
                      setListPage(1);
                    }}
                    summary={summary}
                    summaryLoading={summaryLoading}
                    categoriesLoading={categoriesLoading}
                    entries={entries}
                    entriesLoading={loading || categoriesLoading}
                    categories={categoryById}
                    subcategories={subcategoryById}
                    onOpenEntry={openEntry}
                    onCreateEntry={() => openEntry()}
                    onSeeAll={() => changePage("entries")}
                  />
                }
              />
              <Route
                path={ROUTE_PATHS.entries}
                element={
                  <EntriesPage
                    month={month}
                    onMonthChange={(value) => {
                      setMonth(value);
                      setListPage(1);
                    }}
                    search={search}
                    onSearchChange={(value) => {
                      setSearch(value);
                      setListPage(1);
                    }}
                    kind={filterKind}
                    onKindChange={(value) => {
                      setFilterKind(value);
                      setListPage(1);
                    }}
                    category={filterCategory}
                    subcategory={filterSubcategory}
                    onClearCategory={() => {
                      setFilterCategory("");
                      setFilterSubcategory("");
                      setListPage(1);
                    }}
                    onClearSubcategory={() => {
                      setFilterSubcategory("");
                      setListPage(1);
                    }}
                    onOpenFilters={() => setFiltersModalOpen(true)}
                    filtersOpen={filtersModalOpen}
                    filtersChanged={filtersChanged}
                    onResetFilters={resetEntryFilters}
                    summary={summary}
                    summaryLoading={summaryLoading}
                    entries={entries}
                    loading={loading || categoriesLoading}
                    totalEntries={totalEntries}
                    page={listPage}
                    limit={pageLimit}
                    totalPages={totalPages}
                    onPageChange={setListPage}
                    onLimitChange={(limit) => {
                      setPageLimit(limit);
                      setListPage(1);
                    }}
                    categories={categoryById}
                    subcategories={subcategoryById}
                    onOpenEntry={openEntry}
                    onCreateEntry={() => openEntry()}
                  />
                }
              />
              <Route
                path={ROUTE_PATHS.management}
                element={
                  <ManagementPage
                    categories={categories}
                    subcategoriesByCategory={subcategoriesByCategory}
                    loading={categoriesLoading}
                    onCreateCategory={() =>
                      setManageEdit({ mode: "category", name: "", color: "#32cd32", category: "" })
                    }
                    onEditCategory={(category) =>
                      setManageEdit({
                        mode: "category",
                        id: category._id,
                        name: category.name,
                        color: category.color,
                        category: "",
                      })
                    }
                    onCreateSubcategory={(category) =>
                      setManageEdit({
                        mode: "subcategory",
                        name: "",
                        color: category.color,
                        category: category._id,
                      })
                    }
                    onEditSubcategory={(item, category) =>
                      setManageEdit({
                        mode: "subcategory",
                        id: item._id,
                        name: item.name,
                        color: category.color,
                        category: category._id,
                      })
                    }
                    onDeleteSubcategory={(item) =>
                      setDeleteAction({
                        endpoint: `/subcategories/${item._id}`,
                        label: item.name,
                        detail: categoryById.get(item.category)?.name,
                        color: categoryById.get(item.category)?.color,
                      })
                    }
                  />
                }
              />
              <Route
                path={ROUTE_PATHS.annual}
                element={
                  <AnnualPage
                    refresh={refresh}
                    categories={categoryById}
                    subcategories={subcategoryById}
                    onOpenEntry={openEntry}
                    onCreateEntry={() => openEntry()}
                  />
                }
              />
              <Route
                path={ROUTE_PATHS.settings}
                element={
                  <SettingsPage
                    onDeleted={() => {
                      setUser(null);
                      setCategories([]);
                      setSubcategories([]);
                      setEntries([]);
                      setSummary(emptySummary);
                      setEntryEdit(null);
                      setManageEdit(null);
                      setDeleteAction(null);
                      navigate(ROUTE_PATHS.login, { replace: true });
                      setNotice({ error: false, message: "Account eliminato." });
                    }}
                    user={user}
                    onImported={() => {
                      setCategoryRevision((value) => value + 1);
                      setRefresh((value) => value + 1);
                    }}
                    onSaved={setUser}
                    onNotice={(error, message) => setNotice({ error, message })}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>

          {filtersModalOpen && page === "entries" && (
            <EntryFiltersModal
              initial={{
                category: filterCategory,
                subcategory: filterSubcategory,
                kind: filterKind,
              }}
              categories={categories}
              subcategories={subcategories}
              loading={categoriesLoading}
              onClose={() => setFiltersModalOpen(false)}
              onApply={(filters) => {
                setFilterCategory(filters.category);
                setFilterSubcategory(filters.subcategory);
                setFilterKind(filters.kind);
                setListPage(1);
                setFiltersModalOpen(false);
              }}
            />
          )}
          {entryEdit && (
            <EntryModal
              initial={entryEdit.form}
              originalConversion={editingEntry?.conversion}
              editing={Boolean(entryEdit.id)}
              categories={categories}
              subcategories={subcategories}
              busy={busy}
              onClose={() => setEntryEdit(null)}
              onDelete={
                editingEntry
                  ? async () => {
                      if (await mutate(`/entries/${editingEntry._id}`, "DELETE")) {
                        setEntryEdit(null);
                        setListPage(1);
                      }
                    }
                  : undefined
              }
              onSave={async (form) => {
                if (
                  await mutate(
                    `/entries${entryEdit.id ? `/${entryEdit.id}` : ""}`,
                    entryEdit.id ? "PATCH" : "POST",
                    form,
                  )
                ) {
                  setEntryEdit(null);
                  setListPage(1);
                }
              }}
            />
          )}
          <ManageModal
            form={manageEdit}
            categories={categories}
            categoriesLoading={categoriesLoading}
            busy={busy}
            onChange={setManageEdit}
            onClose={() => setManageEdit(null)}
            onSubmit={saveManage}
            onDelete={async () => {
              if (!manageEdit?.id) return;
              const route = manageEdit.mode === "category" ? "categories" : "subcategories";
              if (await mutate(`/${route}/${manageEdit.id}`, "DELETE")) setManageEdit(null);
            }}
          />
          <DeleteConfirmModal
            isOpen={Boolean(deleteAction)}
            title={tr("Elimina sottocategoria")}
            description={tr("Vuoi eliminare “{{name}}”?", { name: deleteAction?.label ?? "" })}
            warning={tr(
              "Le categorie collegate a sottocategorie o movimenti non vengono eliminate: riassegna prima i dati collegati.",
            )}
            preview={
              deleteAction
                ? {
                    media: (
                      <span style={{ color: deleteAction.color }}>
                        <Layers3 size={20} strokeWidth={2} />
                      </span>
                    ),
                    title: deleteAction.label,
                    detail: deleteAction.detail,
                  }
                : undefined
            }
            isDeleting={busy}
            onClose={() => !busy && setDeleteAction(null)}
            onConfirm={async () => {
              if (deleteAction && (await mutate(deleteAction.endpoint, "DELETE"))) {
                setDeleteAction(null);
                setListPage(1);
              }
            }}
          />
        </>
      )}
    </CurrencyContext.Provider>
  );
}
