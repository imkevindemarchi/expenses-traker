// Isolated responsive fixture of the loading states. No API requests.
import { createRoot } from "react-dom/client";
import { useState } from "react";
import { MemoryRouter } from "react-router";
import "../src/i18n";
import "../src/index.css";
import "../src/styles/v2/Tokens.styles.css";
import "../src/styles/v2/Base.styles.css";
import "../src/styles/v2/Glass.styles.css";
import "../src/styles/v2/Content.styles.css";
import "../src/styles/v2/Fields.styles.css";
import "../src/styles/v2/Toolbar.styles.css";
import "../src/styles/v2/System.styles.css";
import "../src/styles/v2/IosForm.styles.css";
import "../src/styles/v2/Legacy.styles.css";
import "../src/styles/v2/Desktop.styles.css";
import "../src/styles/v2/Analytics.styles.css";
import "../src/styles/v2/Expenses.styles.css";
import RouteSkeleton from "../src/components/RouteSkeleton.component";
import {
  CategoriesSkeleton,
  EntriesSkeleton,
  OverviewSkeleton,
} from "../src/components/Skeletons.component";
const views = ["/annual", "/settings", "overview", "entries", "categories"];
function Preview() {
  const [view, setView] = useState(views[0]);
  return (
    <div className="app-page-container px-5 pb-40 pt-8">
      <select aria-label="Schermata" value={view} onChange={(e) => setView(e.target.value)}>
        {views.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      {view === "overview" ? (
        <OverviewSkeleton budget />
      ) : view === "entries" ? (
        <EntriesSkeleton rows={8} />
      ) : view === "categories" ? (
        <CategoriesSkeleton />
      ) : (
        <MemoryRouter key={view} initialEntries={[view]}>
          <RouteSkeleton />
        </MemoryRouter>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Preview />);
