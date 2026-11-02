import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import "../src/i18n";
import "../src/index.css";
import { ThemeContext } from "../src/contexts/theme.context";
import DatePicker from "../src/components/DatePicker.component";

function Preview() {
  const [date, setDate] = useState<Date | null>(new Date(2026, 9, 15));
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <ThemeContext.Provider value={{ theme, preference: theme, setPreference: () => {} }}>
      <main style={{ padding: 24, maxWidth: 500, marginInline: "auto" }}>
        <select
          aria-label="Tema"
          value={theme}
          onChange={(e) => setTheme(e.target.value as "light" | "dark")}
        >
          <option value="light">Chiaro</option>
          <option value="dark">Scuro</option>
        </select>
        <div style={{ marginTop: 40 }}>
          <DatePicker id="qa-date" label="Data" value={date} onChange={setDate} />
        </div>
        <output aria-label="Data selezionata">
          {date ? [date.getFullYear(), date.getMonth() + 1, date.getDate()].join("-") : ""}
        </output>
        <button type="button">Esterno</button>
      </main>
    </ThemeContext.Provider>
  );
}
createRoot(document.getElementById("root")!).render(<Preview />);
