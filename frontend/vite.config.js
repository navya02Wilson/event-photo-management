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
		host: "0.0.0.0", // Listen on all network interfaces to allow access from other devices
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
