// Isolated browser regression fixture; no database writes.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "../src/i18n";
import "../src/index.css";
import "../src/styles/v2/Tokens.styles.css";
import "../src/styles/v2/Base.styles.css";
import "../src/styles/v2/System.styles.css";
import EntryList from "../src/components/EntryList.component";
function Preview() {
  const [opened, setOpened] = useState(0);
  return (
    <main className="ios-analytics">
      <output>Opened: {opened}</output>
      <EntryList
        entries={[
          {
            _id: "demo",
            kind: "expense",
            amountCents: 1250,
            date: "2026-11-10",
            category: "c",
            subcategory: "s",
          },
        ]}
        categories={new Map([["c", { _id: "c", name: "Necessità", color: "#38bdf8" }]])}
        subcategories={new Map([["s", { _id: "s", name: "Spesa", category: "c" }]])}
        onOpen={() => setOpened((value) => value + 1)}
      />
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Preview />);
