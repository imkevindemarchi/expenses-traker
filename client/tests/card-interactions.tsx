// Isolated browser regression fixture; no database writes.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "../src/i18n";
import "../src/index.css";
import EntriesTable from "../src/components/EntriesTable.component";
function Preview() {
  const [edits, setEdits] = useState(0);
  const [deletes, setDeletes] = useState(0);
  return (
    <main className="app-main ui-refresh">
      <output>
        Edits: {edits}; Deletes: {deletes}
      </output>
      <EntriesTable
        entries={[
          {
            _id: "demo",
            kind: "expense",
            amountCents: 1250,
            date: "2026-10-28",
            category: "food",
            subcategory: null,
          },
        ]}
        categories={new Map([["food", { _id: "food", name: "Alimentari", color: "#528463" }]])}
        subcategories={new Map()}
        onEdit={() => setEdits((n) => n + 1)}
        onDelete={() => setDeletes((n) => n + 1)}
      />
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Preview />);
