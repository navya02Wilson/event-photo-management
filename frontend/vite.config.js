import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
	root: ".",
	publicDir: "public",
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
	server: {
		port: 5173,
		open: true,
		proxy: {
			"/api": {
				target: "http://localhost:8080",
				changeOrigin: true,
			},
		},
	},
});
