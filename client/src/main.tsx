import "./styles/NavigationFeedback.styles.css";
import "./styles/StandaloneSettings.styles.css";
import "./styles/Scrollbars.styles.css";
import { BrowserRouter } from "react-router";
import { createRoot } from "react-dom/client";
import { applyGlassClarity, setGlassClarityPersistence } from "./utils/glass-clarity.util";
import { api } from "./api";
import "./index.css";
import "./i18n";
import App from "./App";
import Bootloader from "./components/Bootloader.component";
import { ThemeProvider } from "./providers/theme.provider";

import "./styles/SharedTypography.styles.css";
import "./styles/SafeArea.styles.css";

// Liquid Glass clarity chosen in Settings → Appearance (iOS 27 style): saved on
// the account, so every device shows the same glass.
applyGlassClarity();
setGlassClarityPersistence((glassClarity) =>
  api("/account/appearance", { method: "PATCH", body: { glassClarity } }),
);

createRoot(document.getElementById("root")!).render(
  // Commit the destination immediately so its loading UI and navigation stay responsive.
  <BrowserRouter unstable_useTransitions={false}>
    <ThemeProvider>
      <Bootloader>
        <App />
      </Bootloader>
    </ThemeProvider>
  </BrowserRouter>,
);

// Liquid Glass design layer (loaded last so it wins over the base styles).
import "./styles/v2/Tokens.styles.css";
import "./styles/v2/Base.styles.css";
import "./styles/v2/Glass.styles.css";
import "./styles/v2/Content.styles.css";
import "./styles/v2/Fields.styles.css";
import "./styles/v2/Toolbar.styles.css";
// iOS 27 system layer: must stay last.
import "./styles/v2/System.styles.css";
import "./styles/v2/Detail.styles.css";
import "./styles/v2/IosDetail.styles.css";
import "./styles/v2/IosForm.styles.css";
import "./styles/v2/Buttons.styles.css";
import "./styles/v2/Legacy.styles.css";
import "./styles/v2/Desktop.styles.css";
// Errors: one look in every app, like the sign-in screens (must stay last).
import "./styles/FormErrors.styles.css";
