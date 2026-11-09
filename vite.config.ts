import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { readFileSync, existsSync } from "node:fs";
import { demoStore, safeJSON } from "./src/data";
import { standaloneScripts } from "./scripts/standalone";
export default defineConfig(({ mode }) => ({
  build: {
    target: "es2022",
    assetsInlineLimit: 10000000,
    outDir: mode === "presentation" ? "dist/presentation" : "dist",
    emptyOutDir: mode === "presentation",
  },
  plugins: [
    viteSingleFile(),
    {
      name: "template",
      transformIndexHtml(html) {
        html = html.replace(
          /(<script id="attendance-data" type="application\/json">)[\s\S]*?(<\/script>)/,
          (_, open, close) => open + safeJSON(demoStore()) + close,
        );
        if (
          mode !== "presentation" &&
          existsSync("dist/presentation/attendance-animations.html")
        )
          return html.replace(
            '<div id="root">',
            () =>
              `<script id="presentation-template" type="application/json">${JSON.stringify(readFileSync("dist/presentation/attendance-animations.html", "utf8")).replace(/</g, "\\u003c")}</script><div id="root">`,
          );
        return html;
      },
    },
    {
      name: "rename",
      enforce: "post",
      generateBundle: {
        order: "post",
        handler(_, bundle) {
          const asset = bundle["index.html"];
          if (asset && asset.type === "asset") {
            asset.source = standaloneScripts(String(asset.source));
            asset.fileName = "attendance-animations.html";
            bundle["attendance-animations.html"] = asset;
            delete bundle["index.html"];
          }
        },
      },
    },
  ],
}));
