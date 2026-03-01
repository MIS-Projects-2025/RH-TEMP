import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import AuthenticatedLayout from "./Layouts/AuthenticatedLayout";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

createInertiaApp({
	title: (title) => `${title} - ${appName}`,
	resolve: (name) => {
		const pages = import.meta.glob("./Pages/**/*.jsx", { eager: false });
		// const pages = import.meta.glob("./Pages/**/*.jsx");
		return resolvePageComponent(`./Pages/${name}.jsx`, pages).then((page) => {
			page.default.layout =
				page.default.layout ||
				((page) => <AuthenticatedLayout children={page} />);
			return page;
		});
	},
	setup({ el, App, props }) {
		const root = createRoot(el);

		root.render(
			<>
				<Toaster position="top-right" reverseOrder={false} />

				<StrictMode>
					<App {...props} />
				</StrictMode>
			</>,
		);
	},
	progress: {
		color: "#4B5563",
	},
});
