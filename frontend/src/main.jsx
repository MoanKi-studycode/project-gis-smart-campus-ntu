import "cesium/Build/Cesium/Widgets/widgets.css";
import "./styles/app.css";
import "./styles/layout.css";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
