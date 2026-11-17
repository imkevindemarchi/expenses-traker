// QA preview of the "new movement" sheet with fake categories (no sign-in).
// Open /tests/entry-preview.html on the dev server.
import { createRoot } from "react-dom/client";
import "../src/styles/NavigationFeedback.styles.css";
import "../src/styles/StandaloneSettings.styles.css";
import "../src/styles/Scrollbars.styles.css";
import "../src/index.css";
import "../src/i18n";
import "../src/styles/SharedTypography.styles.css";
import "../src/styles/SafeArea.styles.css";
import "../src/styles/v2/Tokens.styles.css";
import "../src/styles/v2/Base.styles.css";
import "../src/styles/v2/Glass.styles.css";
import "../src/styles/v2/Content.styles.css";
import "../src/styles/v2/Fields.styles.css";
import "../src/styles/v2/Toolbar.styles.css";
import "../src/styles/v2/System.styles.css";
import "../src/styles/v2/Detail.styles.css";
import "../src/styles/v2/IosDetail.styles.css";
import "../src/styles/v2/IosForm.styles.css";
import "../src/styles/v2/Buttons.styles.css";
import "../src/styles/v2/Legacy.styles.css";
import "../src/styles/v2/Desktop.styles.css";
import "../src/styles/FormErrors.styles.css";
import "../src/styles/v2/Expenses.styles.css";
import { ThemeProvider } from "../src/providers/theme.provider";
import EntryModal from "../src/components/EntryModal.component";

const categories = [
  ["c1", "Casa", "#0a84ff"],
  ["c2", "Spesa alimentare", "#30d158"],
  ["c3", "Trasporti", "#ff9f0a"],
  ["c4", "Svago", "#bf5af2"],
  ["c5", "Salute", "#ff375f"],
].map(([_id, name, color]) => ({ _id, name, color }));
const subcategories = [
  ["s1", "Affitto", "c1"],
  ["s2", "Bollette", "c1"],
  ["s3", "Supermercato", "c2"],
].map(([_id, name, category]) => ({ _id, name, category }));

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <EntryModal
      initial={{
        kind: "expense",
        category: "",
        subcategory: "",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
      }}
      editing={false}
      categories={categories}
      subcategories={subcategories}
      busy={false}
      onClose={() => {}}
      onSave={async (form) => console.log("save", form)}
    />
  </ThemeProvider>,
);
