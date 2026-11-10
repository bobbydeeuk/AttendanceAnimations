import { useState, useRef, useEffect } from "react";
import {
  Upload,
  Download,
  ArrowRight,
  Check,
  ShieldCheck,
  Play,
  X,
} from "lucide-react";
import { houseBadges } from "./houseBadges";
import { playRevealSound } from "./revealSound";
import * as XLSX from "xlsx";
import {
  YEARS,
  HOUSES,
  Store,
  Mapping,
  Counts,
  emptyStore,
  detect,
  validate,
  fingerprint,
  accept,
  exportHTML,
  cleanStore,
  safeJSON,
} from "./data";
function download(text: string, name: string, type = "application/json") {
  const u = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 3000);
}
export function Admin({
  store,
  update,
  close,
  source,
}: {
  store: Store;
  update: (s: Store) => void;
  close: () => void;
  source: string;
}) {
  const previewSound = useRef<(() => void) | null>(null);
  useEffect(() => () => { previewSound.current?.(); }, []);
  const [tab, setTab] = useState("Import data"),
    [book, setBook] = useState<XLSX.WorkBook>(),
    [sheet, setSheet] = useState(""),
    [rows, setRows] = useState<Record<string, unknown>[]>([]),
    [headers, setHeaders] = useState<string[]>([]),
    [mapping, setMapping] = useState<Mapping>({
      name: "",
      year: "",
      form: "",
      house: "",
    }),
    [asOf, setAsOf] = useState(new Date().toLocaleDateString("en-CA")),
    [fp, setFp] = useState(""),
    [message, setMessage] = useState(""),
    [reviewed, setReviewed] = useState(false),
    [correction, setCorrection] = useState(false),
    [reason, setReason] = useState(""),
    [preview, setPreview] = useState(false),
    [trend, setTrend] = useState("total"),
    [inspect, setInspect] = useState(-1),
    [confirmBackup, setConfirmBackup] = useState<Store>(),
    [campaignName, setCampaignName] = useState(store.campaign.name),
    [campaignYear, setCampaignYear] = useState(store.campaign.year);
  const last = store.snapshots.at(-1);
  const check = validate(
    rows,
    mapping,
    correction
      ? store.snapshots.slice(0, -1)
      : store.demo
        ? []
        : store.snapshots,
  );
  const duplicate = store.snapshots.some((s) => s.fingerprint === fp);
  const canCommit =
    rows.length > 0 &&
    check.errors.length === 0 &&
    !duplicate &&
    (!check.warnings.length || reviewed) &&
    (!correction || reason.trim().length >= 10);
  function loadSheet(b: XLSX.WorkBook, s: string) {
    setSheet(s);
    const raw = XLSX.utils.sheet_to_json<unknown[]>(b.Sheets[s], {
      header: 1,
      defval: "",
      blankrows: false,
    });
    const hs = (raw[0] || []).map(String);
    if (new Set(hs).size !== hs.length)
      throw Error(
        "Duplicate column headers: rename them in the workbook first.",
      );
    setHeaders(hs);
    const rs = raw
      .slice(1)
      .filter((r) => r.some((v) => String(v).trim()))
      .map((r) => Object.fromEntries(hs.map((h, i) => [h, r[i] ?? ""])));
    setRows(rs);
    setMapping(detect(hs));
    setReviewed(false);
    setPreview(false);
  }
  async function importFile(file: File) {
    setMessage("");
    setRows([]);
    setPreview(false);
    setBook(undefined);
    try {
      const buffer = await file.arrayBuffer();
      if (!/\.(xlsx|xls)$/i.test(file.name))
        throw Error("Select an .xlsx or .xls workbook.");
      const b = XLSX.read(buffer, { type: "array" });
      if (!b.SheetNames.length) throw Error("No worksheets found.");
      setFp(await fingerprint(buffer));
      loadSheet(b, b.SheetNames[0]);
      setBook(b);
    } catch (e) {
      setMessage("Import rejected: " + (e as Error).message);
    }
  }
  function commit() {
    if (!canCommit || !/^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
      setMessage("Choose the date attendance is up to before accepting this upload.");
      return;
    }
    let base = store.demo
      ? { ...store, snapshots: [], demo: false, audit: [] }
      : store;
    if (correction) {
      const removed = base.snapshots.at(-1);
      base = {
        ...base,
        snapshots: base.snapshots.slice(0, -1),
        audit: [
          ...base.audit,
          {
            timestamp: new Date().toISOString(),
            action: "Correction: " + reason,
            snapshot: removed,
          },
        ],
      };
    }
    try {
      update(accept(base, check.counts, fp, new Date().toISOString(), asOf));
      setRows([]);
      setBook(undefined);
      setPreview(false);
      setCorrection(false);
      setReason("");
      setMessage(
        "Snapshot accepted. Export your updated administrator master and presentation now. Changes remain in memory until exported.",
      );
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  function save(published: boolean) {
    try {
      if (!published && !store.auth)
        throw Error("Set an administrator password first.");
      const data = {
        ...store,
        published,
        ...(published ? { auth: undefined } : {}),
      };
      const template = published
        ? JSON.parse(
            document.getElementById("presentation-template")?.textContent ||
              "null",
          )
        : source;
      if (!template)
        throw Error("Build the standalone application before exporting.");
      const html = exportHTML(template, data);
      download(html, "attendance-animations.html", "text/html");
      setMessage(
        `Export verified: ${data.snapshots.length} snapshots, latest total ${last?.counts.total ?? 0}. ${published ? "Presentation version" : "Administrator master"} downloaded.`,
      );
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  const tabs = [
    "Import data",
    "Current summary",
    "Upload history",
    "Historical progress",
    "Export HTML",
    "History backup",
    "Campaign settings",
  ];
  return (
    <div className="overlay admin-overlay">
      <section className="admin modal">
        <div className="admin-title">
          <div>
            <span className="eyebrow">BEHIND THE SCENES</span>
            <h2>Campaign studio</h2>
          </div>
          <button
            className="icon"
            aria-label="Close administration"
            onClick={close}
          >
            <X />
          </button>
        </div>
        <div className="admin-layout">
          <aside>
            {tabs.map((t, i) => (
              <button
                className={tab === t ? "active" : ""}
                key={t}
                onClick={() => {
                  setTab(t);
                  setMessage("");
                }}
              >
                <span>0{i + 1}</span>
                {t}
              </button>
            ))}
            <small>
              <ShieldCheck size={16} /> Offline by design.
              <br />
              Student records stay in memory.
            </small>
          </aside>
          <div className="admin-content">
            <h3>{tab}</h3>
            {message && (
              <div className="notice" role="status">
                {message}
              </div>
            )}
            {tab === "Import data" && (
              <>
                <p>
                  Upload the pupils who currently have 100% attendance. No names
                  are retained in accepted snapshots.
                </p>
                {store.demo && (
                  <div className="notice">
                    Demo mode: your first accepted workbook replaces the
                    fictional snapshots and establishes the official baseline.
                  </div>
                )}
                <label className="upload-zone">
                  <Upload size={28} />
                  <strong>Choose attendance workbook</strong>
                  <span>Excel .xlsx or .xls · processed on this device</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      e.currentTarget.value = "";
                      if (file) void importFile(file);
                    }}
                  />
                </label>
                {book && (
                  <>
                    <label>
                      Worksheet
                      <select
                        value={sheet}
                        onChange={(e) => {
                          try {
                            loadSheet(book, e.target.value);
                          } catch (e) {
                            setMessage((e as Error).message);
                          }
                        }}
                      >
                        {book.SheetNames.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Attendance up to
                      <input type="date" required value={asOf} onChange={(e) => { setAsOf(e.target.value); setPreview(false); }} />
                    </label>
                    <p>The last school day covered by this attendance file.</p>
                    <h4>Check column mapping</h4>
                    <div className="mapping">
                      {(["name", "year", "form", "house", "id"] as const).map(
                        (k) => (
                          <label key={k}>
                            {k === "id" ? "Student ID (optional)" : k}
                            <select
                              value={mapping[k] || ""}
                              onChange={(e) => {
                                setMapping({ ...mapping, [k]: e.target.value });
                                setPreview(false);
                                setReviewed(false);
                              }}
                            >
                              <option value="">
                                {k === "id"
                                  ? "No stable identifier"
                                  : "Select column"}
                              </option>
                              {headers.map((h) => (
                                <option key={h}>{h}</option>
                              ))}
                            </select>
                          </label>
                        ),
                      )}
                    </div>
                    <p className="muted">
                      Only aggregate history is retained, so identity matching
                      across reopened files is unavailable. Confirm that no
                      pupil re-entered or changed year, form or house before
                      accepting an upload.
                    </p>
                    {!store.demo && store.snapshots.length > 0 && (
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={correction}
                          onChange={(e) => {
                            setCorrection(e.target.checked);
                            setPreview(false);
                          }}
                        />{" "}
                        Correct the latest mistaken upload (preserves the
                        replaced snapshot in the audit trail)
                      </label>
                    )}
                    {correction && (
                      <label>
                        Reason for correction (at least 10 characters)
                        <input
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </label>
                    )}
                    <button
                      className="primary"
                      onClick={() => setPreview(true)}
                    >
                      Validate & preview <ArrowRight size={17} />
                    </button>
                    {preview && (
                      <>
                        <div className="summary-grid">
                          <div>
                            <small>VALID RECORDS</small>
                            <b>{check.valid}</b>
                          </div>
                          <div>
                            <small>EXCLUDED RECORDS</small>
                            <b>{check.rejected}</b>
                          </div>
                          <div>
                            <small>PREVIOUS TOTAL</small>
                            <b>
                              {store.demo ? "—" : (last?.counts.total ?? "—")}
                            </b>
                          </div>
                        </div>
                        <p>
                          Preview prepared {new Date().toLocaleString("en-GB")}.{" "}
                          {store.demo || !last
                            ? "This will establish the campaign baseline."
                            : `${last.counts.total - check.counts.total} fewer pupils than the latest upload.`}
                        </p>
                        {duplicate && (
                          <p className="error">
                            This workbook was already accepted. Duplicate
                            snapshot blocked.
                          </p>
                        )}
                        {check.skipped.length > 0 && (
                          <details><summary>{check.skipped.length} incomplete or invalid rows skipped</summary>
                            {check.skipped.map((message, i) => <p key={i}>{message}</p>)}
                          </details>
                        )}
                        {check.errors.map((e, i) => (
                          <p className="error" key={i}>
                            {e}
                          </p>
                        ))}
                        {check.warnings.map((e, i) => (
                          <p className="warning" key={i}>
                            {e}
                          </p>
                        ))}
                        {check.warnings.length > 0 && (
                          <label className="checkbox">
                            <input
                              type="checkbox"
                              checked={reviewed}
                              onChange={(e) => setReviewed(e.target.checked)}
                            />{" "}
                            I checked all repeated names and confirmed that they
                            represent distinct students.
                          </label>
                        )}
                        <CountTable
                          current={check.counts}
                          previous={
                            store.demo
                              ? undefined
                              : correction
                                ? store.snapshots.at(-2)?.counts
                                : last?.counts
                          }
                        />
                        <div className="actions">
                          <button
                            className="secondary"
                            onClick={() => {
                              setRows([]);
                              setBook(undefined);
                              setPreview(false);
                            }}
                          >
                            Cancel import
                          </button>
                          <button
                            className="primary"
                            disabled={!canCommit}
                            onClick={commit}
                          >
                            <Check size={16} /> Accept snapshot
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
            {tab === "Current summary" && (
              <>
                {last ? (
                  <>
                    <div className="summary-grid">
                      <div>
                        <small>STILL GOING STRONG</small>
                        <b>{last.counts.total}</b>
                      </div>
                      <div>
                        <small>CAMPAIGN BASELINE</small>
                        <b>{store.snapshots[0].counts.total}</b>
                      </div>
                      <div>
                        <small>SNAPSHOTS</small>
                        <b>{store.snapshots.length}</b>
                      </div>
                    </div>
                    <CountTable
                      current={last.counts}
                      previous={last.previous || undefined}
                    />
                  </>
                ) : (
                  <p>No uploads yet.</p>
                )}
              </>
            )}
            {tab === "Upload history" && (
              <>
                <p>
                  Accepted uploads are immutable. Corrections retain the
                  replaced upload in the audit trail.
                </p>
                <table>
                  <thead>
                    <tr>
                      <th>Imported</th>
                      <th>Total</th>
                      <th>Change</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {store.snapshots.map((s, i) => (
                      <tr key={s.id}>
                        <td>{new Date(s.timestamp).toLocaleString("en-GB")}</td>
                        <td>{s.counts.total}</td>
                        <td>
                          {s.previous
                            ? s.previous.total - s.counts.total + " fewer"
                            : "Starting total"}
                        </td>
                        <td>
                          <button
                            className="text-button"
                            onClick={() => setInspect(inspect === i ? -1 : i)}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {inspect >= 0 && store.snapshots[inspect] && (
                  <CountTable current={store.snapshots[inspect].counts} />
                )}
                <h4>Correction audit trail</h4>
                {store.audit.length ? (
                  store.audit.map((a, i) => (
                    <details key={i}>
                      <summary>
                        {new Date(a.timestamp).toLocaleString("en-GB")} ·{" "}
                        {a.action}
                      </summary>
                      {a.snapshot && <CountTable current={a.snapshot.counts} />}
                    </details>
                  ))
                ) : (
                  <p>No corrections recorded.</p>
                )}
              </>
            )}
            {tab === "Historical progress" && (
              <>
                <label>
                  Compare
                  <select
                    value={trend}
                    onChange={(e) => setTrend(e.target.value)}
                  >
                    <option value="total">Whole school</option>
                    <option value="years">All year groups</option>
                    <option value="houses">All houses</option>
                    {YEARS.map((y) => (
                      <option key={y} value={"year:" + y}>
                        Year {y}
                      </option>
                    ))}
                    {HOUSES.map((h) => (
                      <option key={h} value={"house:" + h}>
                        {h}
                      </option>
                    ))}
                    {Object.keys(last?.counts.forms || {}).map((f) => (
                      <option key={f} value={"form:" + f}>
                        {f.replace("|", " / ")}
                      </option>
                    ))}
                  </select>
                </label>
                <Trend store={store} selection={trend} />
                <div className="summary-grid">
                  <div>
                    <small>BASELINE</small>
                    <b>{store.snapshots[0]?.counts.total ?? "—"}</b>
                  </div>
                  <div>
                    <small>LATEST</small>
                    <b>{last?.counts.total ?? "—"}</b>
                  </div>
                  <div>
                    <small>OVERALL REDUCTION</small>
                    <b>
                      {(store.snapshots[0]?.counts.total || 0) -
                        (last?.counts.total || 0)}
                    </b>
                  </div>
                  <div>
                    <small>UPLOADS</small>
                    <b>{store.snapshots.length}</b>
                  </div>
                </div>
              </>
            )}
            {tab === "Export HTML" && (
              <>
                <p>
                  Each download includes the complete app, artwork, settings and
                  all aggregate history. The export checks the snapshot count
                  and latest total before downloading.
                </p>
                <div className="export-card">
                  <ShieldCheck />
                  <h4>Administrator master</h4>
                  <p>
                    Keep privately. Includes importing, editing, password gate
                    and history tools.
                  </p>
                  <button className="primary" onClick={() => save(false)}>
                    <Download size={17} /> Export updated HTML
                  </button>
                </div>
                <div className="export-card">
                  <Play />
                  <h4>Staff presentation</h4>
                  <p>
                    Use this copy in Teams. Administration tools are
                    unavailable; no password verifier is included.
                  </p>
                  <button className="secondary" onClick={() => save(true)}>
                    <Download size={17} /> Export presentation HTML
                  </button>
                </div>
                <p className="muted">
                  Both files use attendance-animations.html. Save them in
                  separate folders. Teams may download the file: open the
                  downloaded file in a browser.
                </p>
                <button
                  className="secondary"
                  onClick={() =>
                    download(
                      safeJSON(
                        cleanStore({
                          ...store,
                          auth: undefined,
                          mascot: undefined,
                        }),
                      ),
                      "attendance-history.json",
                    )
                  }
                >
                  Download history backup too
                </button>
              </>
            )}
            {tab === "History backup" && (
              <>
                <p>
                  Backups contain campaign settings, aggregate snapshots and
                  correction history. Keep a backup beside every published HTML.
                </p>
                <button
                  className="primary"
                  onClick={() =>
                    download(
                      safeJSON(
                        cleanStore({
                          ...store,
                          auth: undefined,
                          mascot: undefined,
                        }),
                      ),
                      "attendance-history.json",
                    )
                  }
                >
                  <Download size={17} /> Download JSON backup
                </button>
                <label className="upload-zone">
                  Restore history backup
                  <input
                    type="file"
                    accept=".json"
                    onChange={async (e) => {
                      try {
                        const f = e.target.files?.[0];
                        if (f) {
                          setConfirmBackup(
                            cleanStore(JSON.parse(await f.text())),
                          );
                          setMessage(
                            "Backup validated. Review and confirm the replacement below.",
                          );
                        }
                      } catch (e) {
                        setMessage("Backup rejected: " + (e as Error).message);
                      }
                    }}
                  />
                </label>
                {confirmBackup && (
                  <div className="notice">
                    <p>
                      Replace active history with{" "}
                      {confirmBackup.snapshots.length} snapshots for{" "}
                      {confirmBackup.campaign.name}? Latest total:{" "}
                      {confirmBackup.snapshots.at(-1)?.counts.total ?? 0}.
                    </p>
                    <button
                      className="secondary"
                      onClick={() => setConfirmBackup(undefined)}
                    >
                      Cancel
                    </button>
                    <button
                      className="primary"
                      onClick={() => {
                        update({
                          ...confirmBackup,
                          auth: store.auth,
                          published: false,
                          mascot: store.mascot,
                        });
                        setConfirmBackup(undefined);
                        setMessage(
                          "History restored. Export an updated master to retain it.",
                        );
                      }}
                    >
                      Confirm restore
                    </button>
                  </div>
                )}
              </>
            )}
            {tab === "Campaign settings" && (
              <>
                <label>
                  Campaign name
                  <input
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </label>
                <label>
                  Campaign year
                  <input
                    type="number"
                    min="2020"
                    max="2100"
                    value={campaignYear}
                    onChange={(e) => setCampaignYear(Number(e.target.value))}
                  />
                </label>
                <button
                  className="primary"
                  onClick={() => {
                    if (
                      !campaignName.trim() ||
                      campaignYear < 2020 ||
                      campaignYear > 2100
                    )
                      return;
                    update({
                      ...store,
                      campaign: {
                        ...store.campaign,
                        name: campaignName.trim(),
                        year: campaignYear,
                      },
                    });
                    setMessage(
                      "Settings saved in memory. Export the updated master.",
                    );
                  }}
                >
                  Save campaign settings
                </button>
                <h4>House badges</h4>
                <p>Add the badge for each house. Badges appear above its results and are embedded in exports.</p>
                <div className="house-badge-settings">
                  {HOUSES.map(house => <label key={house}>{house}
                    <img className="house-badge" src={store.houseBadges?.[house] || houseBadges[house]} alt={`${house} house badge`} />
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => {
                      const file = e.target.files?.[0]; if (!file) return;
                      if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 5000000) { setMessage("Choose a PNG, JPEG or WebP smaller than 5 MB."); return; }
                      const reader = new FileReader();
                      reader.onload = () => { update({ ...store, houseBadges: { ...store.houseBadges, [house]: String(reader.result) } }); setMessage(`${house} badge saved. Export to retain it.`); };
                      reader.readAsDataURL(file);
                    }} />
                  </label>)}
                </div>
                <h4>Bar reveal sound</h4>
                <p>Preview either option, then select it for all Year, House and Form reveals. Previews play even while the show is muted.</p>
                {(["sweep", "steps"] as const).map(option => <div className="sound-option" key={option}>
                  <label><input type="radio" name="reveal-sound" checked={(store.revealSound || "sweep") === option} onChange={() => { previewSound.current?.(); update({ ...store, revealSound: option }); setMessage("Reveal sound selected. Export to retain it."); }} />
                    {option === "sweep" ? "Pitch sweep — continuous up and down" : "Rising steps — intermittent game-show notes"}
                  </label>
                  <button className="secondary" onClick={() => { previewSound.current?.(); previewSound.current = playRevealSound(option); }}>Preview {option === "sweep" ? "pitch sweep" : "rising steps"}</button>
                </div>)}
                <button className="secondary" onClick={() => previewSound.current?.()}>Stop sound preview</button>
                <h4>Background music</h4>
                <p>Upload an MP3, WAV or Ogg file to loop throughout the app. Use the sound button to start or mute audio. Export the master and presentation to keep your music available offline.</p>
                <label className="upload-zone">Choose background music
                  <input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!/\.(mp3|wav|ogg)$/i.test(file.name) || file.size > 20000000) { setMessage("Choose an MP3, WAV or Ogg file smaller than 20 MB."); return; }
                    const reader = new FileReader();
                    reader.onerror = () => setMessage("Music could not be read. Please try again.");
                    reader.onload = () => {
                      const mime = /\.mp3$/i.test(file.name) ? "audio/mpeg" : /\.wav$/i.test(file.name) ? "audio/wav" : "audio/ogg";
                      const data = String(reader.result).replace(/^data:[^;]*;/, `data:${mime};`);
                      const probe = new Audio(data);
                      probe.onloadedmetadata = () => { update({ ...store, music: { data, name: file.name, volume: 0.25 } }); setMessage("Music added. Export to retain it, then use Unmute sound to play."); };
                      probe.onerror = () => setMessage("This audio file cannot be played. Try another MP3, WAV or Ogg file.");
                    };
                    reader.readAsDataURL(file);
                  }} />
                </label>
                {store.music && <>
                  <p>Current music: {store.music.name}</p>
                  <label>Music volume ({Math.round(store.music.volume * 100)}%)
                    <input type="range" min="0" max="1" step="0.05" value={store.music.volume} onChange={(e) => update({ ...store, music: { ...store.music!, volume: Number(e.target.value) } })} />
                  </label>
                  <button className="secondary" onClick={() => update({ ...store, music: undefined })}>Remove music</button>
                </>}
                <h4>Timewell Spent artwork</h4>
                <p>
                  The built-in Timewell has animated arms, gloves, eyes and
                  bells. Uploading a still image replaces that animation with
                  your artwork.
                </p>
                <label className="upload-zone">
                  Choose official mascot (PNG, WebP or JPEG)
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (
                        !["image/png", "image/jpeg", "image/webp"].includes(
                          file.type,
                        ) ||
                        file.size > 5000000
                      ) {
                        setMessage(
                          "Choose a PNG, JPEG or WebP smaller than 5 MB.",
                        );
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        update({ ...store, mascot: String(reader.result) });
                        setMessage(
                          "Mascot replaced. Export to retain the artwork.",
                        );
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {store.mascot && (
                  <button
                    className="secondary"
                    onClick={() => {
                      update({ ...store, mascot: undefined });
                      setMessage(
                        "Animated Timewell restored. Export to retain this choice.",
                      );
                    }}
                  >
                    Use animated Timewell
                  </button>
                )}
                <h4>Start a new campaign</h4>
                <p>
                  Download your current backup first. Starting fresh clears the
                  active history but leaves your existing files intact.
                </p>
                <button
                  className="secondary"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Start a new campaign and clear in-memory history? Export a backup first.",
                      )
                    ) {
                      update({
                        ...emptyStore(),
                        auth: store.auth,
                        mascot: store.mascot,
                        campaign: {
                          name: campaignName,
                          year: campaignYear,
                          id: crypto.randomUUID(),
                        },
                      });
                      setMessage(
                        "New campaign created. Import the first baseline workbook.",
                      );
                    }
                  }}
                >
                  Start new campaign
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
function CountTable({
  current,
  previous,
}: {
  current: Counts;
  previous?: Counts;
}) {
  return (
    <div className="counts-table">
      <table>
        <thead>
          <tr>
            <th>Group</th>
            <th>Current</th>
            <th>Previous</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          {(["years", "houses", "forms"] as const).flatMap((g) =>
            Object.entries(current[g]).map(([k, n]) => (
              <tr key={g + k}>
                <td>
                  {g === "years" ? "Year " : ""}
                  {k.replace("|", " / ")}
                </td>
                <td>{n}</td>
                <td>{previous?.[g][k] ?? "—"}</td>
                <td
                  className={
                    previous && n > (previous[g][k] || 0) ? "error" : ""
                  }
                >
                  {previous ? (previous[g][k] || 0) - n : "Starting total"}
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}
function Trend({ store, selection }: { store: Store; selection: string }) {
  const snapshots = store.snapshots;
  if (!snapshots.length) return <p>No snapshots yet.</p>;
  let keys: string[] =
    selection === "years"
      ? YEARS
      : selection === "houses"
        ? HOUSES
        : [selection];
  function value(s: Store["snapshots"][number], k: string) {
    if (selection === "total") return s.counts.total;
    if (selection === "years") return s.counts.years[k] || 0;
    if (selection === "houses") return s.counts.houses[k] || 0;
    const [g, ...rest] = k.split(":");
    return (
      s.counts[g === "year" ? "years" : g === "house" ? "houses" : "forms"][
        rest.join(":")
      ] || 0
    );
  }
  const max = Math.max(
    1,
    ...snapshots.flatMap((s) => keys.map((k) => value(s, k))),
  );
  return (
    <div className="trend">
      <svg
        viewBox="0 0 720 320"
        role="img"
        aria-label="Attendance history line chart"
      >
        <g stroke="#d9e0e8">
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <line x1="50" x2="690" y1={20 + i * 60} y2={20 + i * 60} />
              <text
                x="42"
                y={25 + i * 60}
                textAnchor="end"
                fill="#53667a"
                stroke="none"
                fontSize="12"
              >
                {Math.round(max * (1 - i / 4))}
              </text>
            </g>
          ))}
        </g>
        {keys.map((k, i) => (
          <g
            key={k}
            stroke={
              [
                "#147f94",
                "#c38105",
                "#8e5bc1",
                "#d44c5a",
                "#397fca",
                "#438c52",
                "#b76339",
              ][i % 7]
            }
            fill="none"
            strokeWidth="3"
          >
            <polyline
              points={snapshots
                .map(
                  (s, j) =>
                    `${50 + (j / Math.max(1, snapshots.length - 1)) * 640},${260 - (value(s, k) / max) * 240}`,
                )
                .join(" ")}
            />
            {snapshots.map((s, j) => (
              <circle
                key={j}
                cx={50 + (j / Math.max(1, snapshots.length - 1)) * 640}
                cy={260 - (value(s, k) / max) * 240}
                r="5"
                fill="white"
                tabIndex={0}
              >
                <title>
                  {k.replace("|", " / ")} ·{" "}
                  {new Date(s.timestamp).toLocaleDateString("en-GB")}:{" "}
                  {value(s, k)}
                </title>
              </circle>
            ))}
          </g>
        ))}
        {snapshots.map((s, j) => (
          <text
            key={j}
            x={50 + (j / Math.max(1, snapshots.length - 1)) * 640}
            y={285 + (j % 2) * 17}
            textAnchor="middle"
            fill="#53667a"
            fontSize="11"
          >
            {new Date(s.timestamp).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </text>
        ))}
      </svg>
      <div className="legend">
        {keys.map((k, i) => (
          <span key={k}>
            <i
              style={{
                background: [
                  "#147f94",
                  "#c38105",
                  "#8e5bc1",
                  "#d44c5a",
                  "#397fca",
                  "#438c52",
                  "#b76339",
                ][i % 7],
              }}
            />
            {k
              .replace("|", " / ")
              .replace("year:", "Year ")
              .replace("house:", "")
              .replace("form:", "")}
          </span>
        ))}
      </div>
    </div>
  );
}
