import "./styles/StandaloneSettings.styles.css";
import "./styles/Scrollbars.styles.css";
import "./styles/SharedPills.styles.css";
import { BrowserRouter } from "react-router";
import { createRoot } from "react-dom/client";
import "./i18n";
import App from "./App";
import "./index.css";
import "./styles/SharedTypography.styles.css";
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
