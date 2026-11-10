export const YEARS = ["7", "8", "9", "10", "11", "12", "13/14"];
export const HOUSES = ["Hawkwood", "Symonds", "Moynes", "Thomason"];
export type Counts = {
  total: number;
  years: Record<string, number>;
  houses: Record<string, number>;
  forms: Record<string, number>;
};
export type Snapshot = {
  id: string;
  timestamp: string;
  asOf?: string;
  campaign: string;
  schemaVersion: 1;
  fingerprint: string;
  counts: Counts;
  previous: Counts | null;
  baseline: Counts;
};
export type Store = {
  schemaVersion: 1;
  campaign: { name: string; year: number; id: string };
  snapshots: Snapshot[];
  audit: { timestamp: string; action: string; snapshot?: Snapshot }[];
  demo: boolean;
  published: boolean;
  auth?: { salt: string; hash: string };
  mascot?: string;
};
export type Mapping = {
  name: string;
  year: string;
  form: string;
  house: string;
  id?: string;
};
export const blank = (): Counts => ({
  total: 0,
  years: Object.fromEntries(YEARS.map((y) => [y, 0])),
  houses: Object.fromEntries(HOUSES.map((h) => [h, 0])),
  forms: {},
});
export function year(value: unknown) {
  const s = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/year|y|\s/g, "");
  return ["13", "14", "13/14"].includes(s)
    ? "13/14"
    : YEARS.includes(s)
      ? s
      : null;
}
export function detect(headers: string[]): Mapping {
  const find = (re: RegExp) => headers.find((h) => re.test(h)) || "";
  return {
    name: find(/^(student\s*)?(name|pupil name|full name)$/i),
    year: find(/year/i),
    form: find(/form|registration|reg group|tutor/i),
    house: find(/house/i),
    id: find(/^(student id|admission number|upn|id)$/i),
  };
}
export function validate(
  rows: Record<string, unknown>[],
  m: Mapping,
  history: Snapshot[],
) {
  const counts = blank(),
    skipped: string[] = [],
    errors: string[] = [],
    warnings: string[] = [],
    seen = new Set<string>(),
    names = new Set<string>();
  if (
    !m.name ||
    !m.year ||
    !m.form ||
    !m.house ||
    new Set([m.name, m.year, m.form, m.house]).size !== 4
  )
    errors.push("Map four different required columns.");
  rows.forEach((r, i) => {
    const name = String(r[m.name] ?? "").trim(),
      y = year(r[m.year]),
      form = String(r[m.form] ?? "")
        .trim()
        .toUpperCase(),
      house = HOUSES.find(
        (h) =>
          h.toLowerCase() ===
          String(r[m.house] ?? "")
            .trim()
            .toLowerCase(),
      ),
      id = m.id ? String(r[m.id] ?? "").trim() : "";
    if (!name || !y || !form || !house || (m.id && !id)) {
      skipped.push(
        `Row ${i + 2}: skipped — missing or invalid name, year, form, house or identifier.`,
      );
      return;
    }
    const key = JSON.stringify([name.toLowerCase(), y, form, house, id]);
    if (seen.has(key)) {
      errors.push(
        `Row ${i + 2}: exact duplicate; resolve in the source workbook.`,
      );
      return;
    }
    if (id && seen.has("id:" + id)) {
      errors.push(`Row ${i + 2}: repeated student identifier.`);
      return;
    }
    seen.add(key);
    if (id) seen.add("id:" + id);
    if (names.has(name.toLowerCase()))
      warnings.push(
        `Row ${i + 2}: repeated name; confirm these are distinct pupils.`,
      );
    names.add(name.toLowerCase());
    counts.total++;
    counts.years[y]++;
    counts.houses[house]++;
    const fk = y + "|" + form;
    counts.forms[fk] = (counts.forms[fk] || 0) + 1;
  });
  for (const s of history)
    for (const k of Object.keys(s.counts.forms)) counts.forms[k] ??= 0;
  const prev = history.at(-1)?.counts;
  if (prev) {
    if (counts.total > prev.total)
      errors.push(
        "Whole-school count increased. Resolve the workbook or use the explicit correction workflow.",
      );
    for (const group of ["years", "houses", "forms"] as const)
      for (const [k, v] of Object.entries(counts[group]))
        if (v > (prev[group][k] || 0))
          errors.push(
            `${group}: ${k.replace("|", " / ")} increased from ${prev[group][k] || 0} to ${v}.`,
          );
  }
  if (!counts.total) errors.push("The worksheet contains no valid student records.");
  return {
    counts,
    errors,
    warnings,
    skipped,
    valid: counts.total,
    rejected: rows.length - counts.total,
  };
}
export async function fingerprint(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
}
export function accept(
  store: Store,
  counts: Counts,
  fp: string,
  timestamp = new Date().toISOString(),
  asOf?: string,
): Store {
  if (store.snapshots.some((s) => s.fingerprint === fp))
    throw Error("This workbook has already been accepted.");
  const previous = store.snapshots.at(-1)?.counts || null;
  const snapshot: Snapshot = {
    id: crypto.randomUUID(),
    timestamp,
    ...(asOf ? { asOf } : {}),
    campaign: store.campaign.id,
    schemaVersion: 1,
    fingerprint: fp,
    counts: structuredClone(counts),
    previous: previous ? structuredClone(previous) : null,
    baseline: structuredClone(store.snapshots[0]?.counts || counts),
  };
  return { ...store, snapshots: [...store.snapshots, snapshot] };
}
export function safeJSON(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
export function exportHTML(source: string, store: Store) {
  const safe = cleanStore(store);
  // Parse the HTML rather than matching text: the bundled JavaScript itself
  // contains exporter strings that resemble the real JSON script element.
  const doc = new DOMParser().parseFromString(source, "text/html");
  const blocks = doc.querySelectorAll(
    'script#attendance-data[type="application/json"]',
  );
  if (blocks.length !== 1)
    throw Error(
      "Embedded data block missing or duplicated. Build the standalone HTML first.",
    );
  blocks[0].textContent = safeJSON(safe);
  const html = "<!doctype html>\n" + doc.documentElement.outerHTML;
  const verification = new DOMParser().parseFromString(html, "text/html");
  const checked = JSON.parse(
    verification.getElementById("attendance-data")!.textContent!,
  );
  if (
    checked.snapshots.length !== store.snapshots.length ||
    checked.snapshots.at(-1)?.counts.total !==
      store.snapshots.at(-1)?.counts.total
  )
    throw Error("Export verification failed.");
  return html;
}
function cleanCounts(v: any): Counts {
  if (!v || !Number.isInteger(v.total) || v.total < 0)
    throw Error("Invalid counts");
  const c = blank();
  for (const g of ["years", "houses", "forms"] as const) {
    if (!v[g] || typeof v[g] !== "object") throw Error("Invalid groups");
    c[g] = {};
    for (const [k, n] of Object.entries(v[g])) {
      if (
        typeof n !== "number" ||
        !Number.isInteger(n) ||
        n < 0 ||
        k.length > 100 ||
        ["__proto__", "constructor", "prototype"].includes(k)
      )
        throw Error("Invalid group count");
      if (
        (g === "years" && !YEARS.includes(k)) ||
        (g === "houses" && !HOUSES.includes(k)) ||
        (g === "forms" &&
          (!YEARS.includes(k.split("|")[0]) || !k.split("|")[1]))
      )
        throw Error("Unknown group");
      c[g][k] = n;
    }
  }
  for (const y of YEARS) c.years[y] ??= 0;
  for (const h of HOUSES) c.houses[h] ??= 0;
  c.total = v.total;
  for (const g of ["years", "houses", "forms"] as const)
    if (Object.values(c[g]).reduce((a, b) => a + b, 0) !== c.total)
      throw Error("Group totals do not reconcile");
  return c;
}
export function cleanStore(v: any): Store {
  if (v?.schemaVersion !== 1 || !Array.isArray(v.snapshots) || !v.campaign?.id)
    throw Error("Unsupported history backup");
  const snapshots: Snapshot[] = v.snapshots.map((s: any) => ({
    id: String(s.id),
    timestamp: new Date(s.timestamp).toISOString(),
    ...(s.asOf ? { asOf: String(s.asOf) } : {}),
    campaign: String(v.campaign.id),
    schemaVersion: 1,
    fingerprint: String(s.fingerprint),
    counts: cleanCounts(s.counts),
    previous: s.previous ? cleanCounts(s.previous) : null,
    baseline: cleanCounts(s.baseline),
  }));
  return {
    schemaVersion: 1,
    campaign: {
      id: String(v.campaign.id),
      name: String(v.campaign.name),
      year: Number(v.campaign.year),
    },
    snapshots,
    audit: (v.audit || []).map((a: any) => ({
      timestamp: new Date(a.timestamp).toISOString(),
      action: String(a.action),
      ...(a.snapshot
        ? {
            snapshot: cleanStore({ ...v, snapshots: [a.snapshot], audit: [] })
              .snapshots[0],
          }
        : {}),
    })),
    demo: !!v.demo,
    published: !!v.published,
    ...(v.auth
      ? { auth: { salt: String(v.auth.salt), hash: String(v.auth.hash) } }
      : {}),
    ...(typeof v.mascot === "string" &&
    /^data:image\/(png|jpeg|webp);base64,/.test(v.mascot)
      ? { mascot: v.mascot }
      : {}),
  };
}
export function emptyStore(): Store {
  return {
    schemaVersion: 1,
    campaign: { name: "Non-Stop November", year: 2026, id: "november-2026" },
    snapshots: [],
    audit: [],
    demo: false,
    published: false,
  };
}
export function demoStore(): Store {
  let s = { ...emptyStore(), demo: true };
  for (let day = 0; day < 3; day++) {
    const c = blank();
    YEARS.forEach((y, yi) => {
      for (let f = 0; f < (yi < 5 ? 6 : 3); f++) {
        let n = Math.max(0, 29 - yi * 2 - f - day * ((f % 3) + 1));
        c.forms[
          y +
            "|" +
            (y === "13/14" ? "13" : y) +
            ["HA", "SY", "MO", "TH", "A", "B"][f]
        ] = n;
        c.total += n;
        c.years[y] += n;
        c.houses[HOUSES[f % 4]] += n;
      }
    });
    s = accept(
      s,
      c,
      "demo-" + day,
      `2026-11-${String(2 + day * 3).padStart(2, "0")}T09:00:00.000Z`,
    );
  }
  return s;
}
export function comparison(
  current: number,
  previous: number | undefined,
  baseline: number,
) {
  return {
    previous:
      previous === undefined
        ? "Starting total"
        : previous === current
          ? "No change since last time"
          : `${previous - current} fewer than last time`,
    baseline:
      baseline === current
        ? "Starting total"
        : `${baseline - current} fewer since the start`,
  };
}
export function ranked(entries: [string, number][]) {
  return [...entries]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, value], i, all) => ({
      key,
      value,
      rank: all.findIndex((e) => e[1] === value) + 1,
    }));
}
