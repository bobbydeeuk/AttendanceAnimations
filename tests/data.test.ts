import { describe, it, expect } from "vitest";
import {
  blank,
  year,
  detect,
  validate,
  accept,
  emptyStore,
  exportHTML,
  cleanStore,
  comparison,
  ranked,
  safeJSON,
  demoStore,
} from "../src/data";
const mapping = { name: "Name", year: "Year", form: "Form", house: "House" };
const row = (
  name = "Fictional A",
  y = "7",
  form = "7HA",
  house = "Hawkwood",
) => ({ Name: name, Year: y, Form: form, House: house });
const shell =
  '<!doctype html><script id="attendance-data" type="application/json">null</script><div>Application</div>';
function reopen(html: string) {
  return cleanStore(
    JSON.parse(
      new DOMParser()
        .parseFromString(html, "text/html")
        .getElementById("attendance-data")!.textContent!,
    ),
  );
}
describe("attendance engine", () => {
  it("normalises years and combines 13/14 forms", () => {
    expect(["Year 13", "Y14", 14, " 13/14 "].map(year)).toEqual([
      "13/14",
      "13/14",
      "13/14",
      "13/14",
    ]);
    const v = validate(
      [row("A", "13", "SIX"), row("B", "14", "SIX")],
      mapping,
      [],
    );
    expect(v.errors).toEqual([]);
    expect(v.counts.years["13/14"]).toBe(2);
    expect(v.counts.forms["13/14|SIX"]).toBe(2);
  });
  it("detects aliases, missing columns and invalid houses", () => {
    expect(detect(["Student Name", "Year Group", "Tutor", "House"]).form).toBe(
      "Tutor",
    );
    expect(
      validate([row()], { ...mapping, name: "" }, []).errors.length,
    ).toBeGreaterThan(0);
    expect(
      validate([row("A", "7", "7HA", "Unknown")], mapping, []).rejected,
    ).toBe(1);
  });
  it("blocks exact duplicates, IDs and reviews repeated names without silently merging", () => {
    expect(validate([row(), row()], mapping, []).errors.join()).toContain(
      "duplicate",
    );
    const v = validate([row(), row("Fictional A", "8", "8HA")], mapping, []);
    expect(v.valid).toBe(2);
    expect(v.warnings).toHaveLength(1);
    expect(
      validate(
        [
          { ...row("A"), ID: "1" },
          { ...row("B"), ID: "1" },
        ],
        { ...mapping, id: "ID" },
        [],
      ).errors.join(),
    ).toContain("identifier");
  });
  it("establishes baseline and computes reductions", () => {
    const a = validate([row("A"), row("B")], mapping, []);
    let s = accept(emptyStore(), a.counts, "a");
    expect(s.snapshots[0].previous).toBeNull();
    s = accept(s, validate([row("A")], mapping, s.snapshots).counts, "b");
    expect(s.snapshots[1].previous?.total).toBe(2);
    expect(s.snapshots[1].baseline.total).toBe(2);
    expect(comparison(1, 2, 2).previous).toBe("1 fewer than last time");
    expect(comparison(2, undefined, 2).previous).toBe("Starting total");
    expect(comparison(2, 2, 2).previous).toBe("No change since last time");
  });
  it("flags increases and retains forms at zero", () => {
    const c = validate([row()], mapping, []).counts;
    let s = accept(emptyStore(), c, "a");
    const v = validate(
      [row(), row("B", "8", "8SY", "Symonds")],
      mapping,
      s.snapshots,
    );
    expect(v.errors.join()).toContain("increased");
    const zero = validate(
      [row("B", "8", "8SY", "Symonds")],
      mapping,
      s.snapshots,
    );
    expect(zero.counts.forms["7|7HA"]).toBe(0);
    expect(zero.counts.years["7"]).toBe(0);
    expect(s.snapshots).toHaveLength(1);
  });
  it("preserves every snapshot through repeated export/reopen and excludes pupil records", () => {
    let s = emptyStore(),
      html = shell;
    for (let i = 0; i < 3; i++) {
      const rows = Array.from({ length: 3 - i }, (_, j) =>
        row("Secret Fictional Pupil " + j),
      );
      const result = validate(rows, mapping, s.snapshots);
      expect(result.errors).toEqual([]);
      s = accept(s, result.counts, "fp" + i);
      html = exportHTML(html, s);
      s = reopen(html);
      expect(s.snapshots).toHaveLength(i + 1);
      expect(s.snapshots.at(-1)?.counts.total).toBe(3 - i);
      expect(html).not.toContain("Secret Fictional Pupil");
    }
    expect(s.snapshots[2].baseline.total).toBe(3);
  });
  it("rejects identical workbooks and malformed backup without changing original", () => {
    const s = demoStore();
    expect(() => accept(s, s.snapshots[0].counts, "demo-0")).toThrow("already");
    expect(() =>
      cleanStore({ schemaVersion: 1, snapshots: [{}], campaign: { id: "a" } }),
    ).toThrow();
    expect(s.snapshots).toHaveLength(3);
  });
  it("whitelists backup fields to prevent student records escaping", () => {
    const s = demoStore();
    const clean = cleanStore({
      ...s,
      studentNames: ["Private Name"],
      snapshots: s.snapshots.map((x) => ({ ...x, students: ["Private Name"] })),
    });
    expect(safeJSON(clean)).not.toContain("Private Name");
    expect(() =>
      cleanStore({
        ...s,
        snapshots: [
          {
            ...s.snapshots[0],
            counts: { ...s.snapshots[0].counts, total: 99999 },
          },
        ],
      }),
    ).toThrow("reconcile");
  });
  it("escapes script terminators and verifies data blocks", () => {
    const s = emptyStore();
    s.campaign.name = "</script><script>alert(1)</script>";
    const html = exportHTML(shell, s);
    expect(html).not.toContain("<script>alert");
    expect(reopen(html).campaign.name).toBe(s.campaign.name);
    expect(() => exportHTML("<html/>", s)).toThrow("missing");
  });
  it("ranks ties correctly and keeps school rounds independent of chosen year", () => {
    expect(
      ranked([
        ["A", 5],
        ["B", 5],
        ["C", 3],
      ]).map((x) => x.rank),
    ).toEqual([1, 1, 3]);
    const c = demoStore().snapshots.at(-1)!.counts;
    for (const selected of ["7", "8", "13/14"]) {
      expect(Object.values(c.years).reduce((a, b) => a + b, 0)).toBe(c.total);
      expect(Object.values(c.houses).reduce((a, b) => a + b, 0)).toBe(c.total);
      expect(
        Object.keys(c.forms).filter((f) => f.startsWith(selected + "|")).length,
      ).toBeGreaterThan(0);
    }
  });
});

it("uses distinct stable IDs to distinguish pupils with the same name and group", () => {
  const result = validate(
    [
      { ...row(), ID: "101" },
      { ...row(), ID: "102" },
    ],
    { ...mapping, id: "ID" },
    [],
  );
  expect(result.valid).toBe(2);
  expect(result.errors).toEqual([]);
  expect(result.warnings).toHaveLength(1);
});

it("updates only the real data element when bundled code contains lookalike script text", () => {
  const code =
    '<script>const marker = `<script id="attendance-data" type="application/json">lookalike<\\/script>`; window.keep = true;</script>';
  const html = exportHTML(code + shell, demoStore());
  const parsed = new DOMParser().parseFromString(html, "text/html");
  expect(parsed.scripts[0].textContent).toContain("window.keep = true");
  expect(reopen(html).snapshots).toHaveLength(3);
});

it("preserves attendance coverage dates independently of upload timestamps through backup and export", () => {
  const store = accept(emptyStore(), blank(), "dated", "2026-11-10T10:00:00Z", "2026-11-06");
  expect(cleanStore(JSON.parse(JSON.stringify(store))).snapshots[0].asOf).toBe("2026-11-06");
  expect(reopen(exportHTML(shell, store, false)).snapshots[0].asOf).toBe("2026-11-06");
  expect(store.snapshots[0].timestamp).toBe("2026-11-10T10:00:00Z");
});

it("skips incomplete rows while retaining valid totals and blocks an entirely invalid upload", () => {
  const result = validate([row("Valid"), row(""), {...row("Missing house"), House: ""}], mapping, []);
  expect(result.errors).toEqual([]);
  expect(result.skipped).toHaveLength(2);
  expect(result.counts.total).toBe(1);
  expect(result.counts.years["7"]).toBe(1);
  expect(validate([row("")], mapping, []).errors.join()).toContain("no valid student records");
});

it("retains embedded music and a silent volume through export while rejecting non-audio URLs", () => {
  const store = { ...emptyStore(), music: { data: "data:audio/wav;base64,UklGRg==", name: "Theme.wav", volume: 0 } };
  expect(reopen(exportHTML(shell, store, true)).music).toEqual(store.music);
  expect(cleanStore({ ...store, music: { ...store.music, data: "https://example.com/song.mp3" } }).music).toBeUndefined();
});

it("preserves chosen reveal sounds and house badges in offline exports", () => {
  const store = { ...emptyStore(), revealSound: "steps" as const, houseBadges: { Hawkwood: "data:image/png;base64,aGVsbG8=", Symonds: "https://example.com/badge.png" } };
  const restored = reopen(exportHTML(shell, store, true));
  expect(restored.revealSound).toBe("steps");
  expect(restored.houseBadges).toEqual({ Hawkwood: store.houseBadges.Hawkwood });
});
