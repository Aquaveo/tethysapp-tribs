// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "App";

let container = null;

document.addEventListener("DOMContentLoaded", () => {
  if (!container) {
    container = document.getElementById("react-root");
    const root = createRoot(container);
    // TODO FIGURE OUT STRICT MODE!!
    // https://github.com/reearth/resium/issues/618
    root.render(
      <App />
    );

    if (module.hot) {
      module.hot.accept();
    }
  }
});
