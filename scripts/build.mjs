import { build } from "esbuild";
import { execSync } from "child_process";
import { cpSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

console.log("🔨 Building extension...");

// Build the main extension
await build({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  external: ["vscode"],                // never bundle the vscode API
  outfile: "dist/extension.js",
  sourcemap: false,                    // set true if you want src maps
  minify: true,
});

console.log("✅ Extension built successfully");

console.log("🔨 Building webview...");

// Build the webview React app
try {
  execSync("cd webview && npm run build", { stdio: "inherit" });
  console.log("✅ Webview built successfully");
} catch (error) {
  console.error("❌ Failed to build webview:", error.message);
  process.exit(1);
}

console.log("📦 Copying webview build to dist...");

// Ensure dist directory exists
if (!existsSync("dist")) {
  mkdirSync("dist", { recursive: true });
}

// Copy webview build to dist/webview
const webviewBuildPath = join("webview", "build");
const distWebviewPath = join("dist", "webview");

if (existsSync(webviewBuildPath)) {
  cpSync(webviewBuildPath, distWebviewPath, { recursive: true });
  console.log("✅ Webview files copied to dist/webview");
} else {
  console.error("❌ Webview build folder not found at:", webviewBuildPath);
  process.exit(1);
}

console.log("🎉 Build completed successfully!");