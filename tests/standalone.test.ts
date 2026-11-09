import { it, expect } from "vitest";
import { standaloneScripts } from "../scripts/standalone";
it("runs standalone scripts without module loading and defers until HTML is ready", () => {
  const source =
    '<script type="module" crossorigin>window.started = true;</script><script id="attendance-data" type="application/json">{"snapshots":[]}</script>';
  const html = standaloneScripts(source);
  expect(html).not.toContain('type="module"');
  expect(html).toContain('document.addEventListener("DOMContentLoaded",start');
  expect(html).toContain("window.started = true;");
  expect(html).toContain(
    '<script id="attendance-data" type="application/json">{"snapshots":[]}</script>',
  );
});
it("does not reinterpret dollar substitution sequences or nested-looking strings", () => {
  const code = 'const text = `$& <script type="module"> test`';
  expect(
    standaloneScripts('<script type="module">' + code + "</script>"),
  ).toContain(code);
});
it("rejects scripts that still require external resources", () => {
  expect(() =>
    standaloneScripts('<script type="module" src="/app.js"></script>'),
  ).toThrow("external");
});
