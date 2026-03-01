import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import laravel from "laravel-vite-plugin";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
	resolve: {
		alias: {
			// '@': path.resolve(__dirname, './resources/js'),
			ziggy: path.resolve("vendor/tightenco/ziggy/dist"),
			"ziggy-js": path.resolve("vendor/tightenco/ziggy/dist/index.esm.js"),
		},
	},
	plugins: [
		laravel({
			input: "resources/js/app.jsx",
			refresh: true,
		}),
		tailwindcss(),
		react(),
	],
	server: {
		port: 5173,
	},
});
