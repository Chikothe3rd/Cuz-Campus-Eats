import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";
import "./initGlobalErrorHandling"; // sets up window error listeners
import "./lib/startupDiagnostics"; // runs configuration checks on startup

createRoot(document.getElementById("root")!).render(
	<ErrorBoundary>
		<App />
	</ErrorBoundary>
);
