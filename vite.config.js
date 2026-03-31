import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import laravel from "laravel-vite-plugin";
import path from "path";
import { defineConfig } from "vite";
import fs from 'fs'

function caseInsensitiveResolver() {
    const atAlias = path.resolve(__dirname, './resources/js')

    function resolvePathCaseInsensitive(absolutePath) {
        const parts = absolutePath.split(path.sep)
        let resolved = parts[0] || '/'

        for (let i = 1; i < parts.length; i++) {
            const segment = parts[i]
            if (!segment) continue

            try {
                const entries = fs.readdirSync(resolved)
                const match = entries.find(
                    e => e.toLowerCase() === segment.toLowerCase()
                )
                if (!match) return null
                resolved = path.join(resolved, match)
            } catch (e) {
                return null
            }
        }

        return resolved
    }

    return {
        name: 'case-insensitive-resolver',
        resolveId(id, importer) {
            const extensions = ['.jsx', '.js', '.tsx', '.ts']

            let absoluteId

            if (id.startsWith('@/')) {
								absoluteId = path.resolve(atAlias, id.slice(2))
						} else if (id.startsWith('.') && importer) {
								absoluteId = path.resolve(path.dirname(importer), id)
						} else if (path.isAbsolute(id)) {
								absoluteId = id
						} else {
								return null
						}

            if (fs.existsSync(absoluteId)) return null

            // Try as-is first
            const direct = resolvePathCaseInsensitive(absoluteId)
            if (direct && fs.existsSync(direct)) return direct

            // Try with extensions
            for (const ext of extensions) {
                const withExt = resolvePathCaseInsensitive(absoluteId + ext)
                if (withExt && fs.existsSync(withExt)) return withExt
            }

            return null
        }
    }
}

export default defineConfig({
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './resources/js'),
			ziggy: path.resolve("vendor/tightenco/ziggy/dist"),
			"ziggy-js": path.resolve("vendor/tightenco/ziggy/dist/index.esm.js"),
		},
	},
	plugins: [
		caseInsensitiveResolver(),
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
