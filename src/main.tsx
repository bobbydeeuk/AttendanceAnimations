import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Settings,
  Volume2,
  VolumeX,
  Maximize,
  Home,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Play,
  ChevronRight,
  X,
  ShieldCheck,
  Trophy,
  Clock3,
} from "lucide-react";
import { Admin } from "./Admin";
const PRESENTATION = import.meta.env.MODE === "presentation";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "./style.css";
import { Timewell } from "./Timewell";
import { BrandFlourish } from "./BrandFlourish";
import {
  YEARS,
  HOUSES,
  Store,
  demoStore,
  cleanStore,
  ranked,
  comparison,
} from "./data";
const initialSource = "<!doctype html>\n" + document.documentElement.outerHTML;
const embedded = JSON.parse(
  document.getElementById("attendance-data")?.textContent || "null",
);
const initial: Store = embedded ? cleanStore(embedded) : demoStore();
const houseColors = ["#ef6970", "#68c6eb", "#f4cd4d", "#b394ec"];
const intros = [
  [
    "Let’s find out which year group is leading!",
    "Who’s still going strong across the school?",
  ],
  [
    "It’s time for the House Showdown!",
    "Four houses. One incredible school. Let’s see those totals!",
  ],
  [
    "Now, let’s find out how your form is doing!",
    "Your year. Your forms. Every day counts!",
  ],
];
async function passwordHash(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 210000,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
}
function App() {
  const [store, setStore] = useState(initial),
    [selected, setSelected] = useState("7"),
    [round, setRound] = useState(-1),
    [phase, setPhase] = useState<"hidden" | "running" | "done">("hidden"),
    [tick, setTick] = useState(0),
    [muted, setMuted] = useState(true),
    [gate, setGate] = useState(false),
    [admin, setAdmin] = useState(false),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [intro, setIntro] = useState(0);
  const run = useRef(0);
  const positions = useRef(new Map<string, DOMRect>());
  useLayoutEffect(() => {
    if (
      phase !== "done" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    document.querySelectorAll<HTMLElement>("[data-result]").forEach((el) => {
      const before = positions.current.get(el.dataset.result!);
      if (!before) return;
      const after = el.getBoundingClientRect();
      if (before.x !== after.x || before.y !== after.y)
        el.animate(
          [
            {
              transform: `translate(${before.x - after.x}px,${before.y - after.y}px)`,
            },
            { transform: "translate(0,0)" },
          ],
          { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
    });
    positions.current.clear();
  }, [phase]);
  const latest = store.snapshots.at(-1),
    counts = latest?.counts;
  const group = round === 0 ? "years" : round === 1 ? "houses" : "forms";
  const entries = counts
    ? Object.entries(counts[group]).filter(
        ([k]) => round !== 2 || k.startsWith(selected + "|"),
      )
    : [];
  const ranking = ranked(entries),
    max = Math.max(1, ...entries.map((e) => e[1]));
  const displayRanking =
    phase === "done"
      ? ranking
      : entries.map(([key, value]) => ({
          key,
          value,
          rank: ranking.find((r) => r.key === key)!.rank,
        }));
  const navigate = (n: number) => {
    run.current++;
    setRound(n);
    setPhase("hidden");
    setIntro(Math.floor(Math.random() * 2));
  };
  function tone(final = false) {
    if (muted) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(final ? 523 : 220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        final ? 1046 : 440,
        ctx.currentTime + 0.15,
      );
      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      osc.onended = () => {
        void ctx.close();
      };
    } catch {}
  }
  function reveal() {
    if (phase === "running" || !counts || round < 0) return;
    const id = ++run.current;
    setPhase("running");
    tone();
    const start = performance.now(),
      duration = matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 50
        : 3300;
    function frame(now: number) {
      if (run.current !== id) return;
      const t = Math.min(1, (now - start) / duration);
      setTick(t);
      if (t < 1) requestAnimationFrame(frame);
      else {
        positions.current.clear();
        document
          .querySelectorAll<HTMLElement>("[data-result]")
          .forEach((el) =>
            positions.current.set(
              el.dataset.result!,
              el.getBoundingClientRect(),
            ),
          );
        setPhase("done");
        tone(true);
      }
    }
    requestAnimationFrame(frame);
  }
  function fullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (
        gate ||
        admin ||
        (e.target as HTMLElement)?.closest("input,select,textarea,button")
      )
        return;
      const k = e.key.toLowerCase();
      if ([" ", "enter", "arrowright", "arrowleft", "r", "f"].includes(k))
        e.preventDefault();
      if (k === "f") fullscreen();
      if (round < 0) return;
      if (k === " " || k === "enter") reveal();
      if (k === "r" && phase !== "running") reveal();
      if (k === "arrowright" && round < 2) navigate(round + 1);
      if (k === "arrowleft" && round > 0) navigate(round - 1);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (store.auth) {
        if ((await passwordHash(password, store.auth.salt)) !== store.auth.hash)
          throw Error("That password wasn’t recognised.");
      } else {
        if (password.length < 10)
          throw Error("Choose a password with at least 10 characters.");
        const salt = crypto.randomUUID();
        setStore({
          ...store,
          auth: { salt, hash: await passwordHash(password, salt) },
        });
      }
      setPassword("");
      setGate(false);
      setAdmin(true);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className={"app " + (round < 0 ? "welcome-view" : "show-view")}>
      <div className="ambient a1" />
      <div className="ambient a2" />
      <BrandFlourish />
      <header>
        <button className="brand" onClick={() => navigate(-1)}>
          <span className="brand-mark">
            <Clock3 size={24} />
          </span>
          <span>
            HEDINGHAM<small>SCHOOL & SIXTH FORM</small>
          </span>
        </button>
        <div className="header-right">
          <span className="campaign-tag">
            ATTENDANCE ANIMATIONS <i /> {store.campaign.year}
          </span>
          <button
            className="icon"
            title={muted ? "Unmute sound" : "Mute sound"}
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            onClick={() => setMuted(!muted)}
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button
            className="icon"
            title="Toggle fullscreen (F)"
            aria-label="Toggle fullscreen"
            onClick={fullscreen}
          >
            <Maximize size={20} />
          </button>
          {!PRESENTATION && !store.published && (
            <button
              className="icon"
              title="Administration"
              aria-label="Administration"
              onClick={() => setGate(true)}
            >
              <Settings size={20} />
            </button>
          )}
        </div>
      </header>
      {round < 0 ? (
        <main className="home">
          <div className="home-copy">
            <div className="eyebrow">
              <span /> EVERY DAY. EVERY OPPORTUNITY.
            </div>
            <h1>
              {store.campaign.name.split(" ").slice(0, -1).join(" ") ||
                store.campaign.name}
              <br />
              <span>
                {store.campaign.name.includes(" ")
                  ? store.campaign.name.split(" ").at(-1)
                  : ""}
              </span>
              <svg viewBox="0 0 510 20" aria-hidden="true">
                <path d="M5 13Q230-6 502 9M80 19Q300 3 460 14" />
              </svg>
            </h1>
            <p className="hero-sub">
              Small steps. Strong habits. <b>Brighter futures.</b>
            </p>
            <div className="choose-label">
              LET’S HEAR IT FOR YOUR YEAR <ArrowRight size={16} />
            </div>
            <div className="year-grid">
              {YEARS.map((y, i) => (
                <button
                  key={y}
                  className={"year-button y" + i}
                  disabled={!counts}
                  onClick={() => {
                    setSelected(y);
                    navigate(0);
                  }}
                >
                  <span>YEAR</span>
                  <strong>{y}</strong>
                  <ChevronRight size={20} />
                </button>
              ))}
            </div>
            <p className="helper">
              <Play size={13} /> Choose your year group to start the show
            </p>
            {!counts && (
              <p>
                Open administration to import the campaign’s first workbook.
              </p>
            )}
          </div>
          <div className="host-scene">
            <div className="orbit orbit1" />
            <div className="orbit orbit2" />
            <span className="spark s1">✦</span>
            <span className="spark s2">✧</span>
            <span className="spark s3">✦</span>
            <div className="speech">
              <span>TIMEWELL SPENT SAYS…</span>
              <strong>
                Who’s still
                <br />
                going strong?
              </strong>
              <span className="speech-star">✦</span>
            </div>
            <Timewell asset={store.mascot} gesture="thumbs-up" />
            <div className="host-shadow" />
            <div className="host-caption">
              <span className="live-dot" /> YOUR HOST, TIMEWELL SPENT
            </div>
          </div>
        </main>
      ) : (
        <main className="show">
          <div className="round-kicker">
            THE {store.campaign.name.toUpperCase()} SHOW{" "}
            <span>ROUND 0{round + 1} / 03</span>
          </div>
          <div className="show-heading">
            <div>
              <h1>
                {round === 0
                  ? "Year Group"
                  : round === 1
                    ? "House"
                    : `Year ${selected} Form`}{" "}
                <em>Showdown</em>
              </h1>
              <p>
                {round === 0
                  ? "Seven year groups. One shared goal."
                  : round === 1
                    ? "Different colours. The same determination."
                    : "Every form has something to celebrate."}
              </p>
            </div>
            <div className="school-total">
              <span>WHOLE SCHOOL STILL GOING</span>
              <b>
                {phase === "hidden"
                  ? "—"
                  : phase === "done"
                    ? counts?.total
                    : Math.round((counts?.total || 0) * tick).toLocaleString()}
              </b>
              <small>students · 100% attendance</small>
            </div>
          </div>
          <div className="host-strip">
            <div className="mini-host">
              <Timewell
                asset={store.mascot}
                compact
                gesture={
                  phase === "done"
                    ? "celebrate"
                    : phase === "running"
                      ? "ready"
                      : "wave"
                }
              />
            </div>
            <p>
              {phase === "done" && round === 2
                ? `Fantastic effort, Year ${selected}! Keep showing up, keep going strong. Every day counts!`
                : phase === "done"
                  ? `A big cheer for ${ranking
                      .filter((r) => r.rank === 1)
                      .map((r) =>
                        round === 0
                          ? "Year " + r.key
                          : r.key.replace(selected + "|", ""),
                      )
                      .join(" and ")}! Keep it going — every day counts!`
                  : intros[round][intro]}
            </p>
            <span>TIMEWELL SPENT</span>
          </div>
          <div
            className={"leaderboard " + (round === 1 ? "houses" : "")}
            aria-busy={phase === "running"}
          >
            {displayRanking.map((r, i) => {
              const key = r.key,
                label = round === 0 ? "Year " + key : key.split("|").at(-1);
              const prev = latest?.previous?.[group][key],
                base = latest?.baseline[group][key] || 0;
              const cmp = comparison(r.value, prev, base);
              const settle = tick > 0.55 + i * 0.045;
              const val =
                phase === "done" || (phase === "running" && settle)
                  ? r.value
                  : Math.floor((Math.sin(tick * 105 + i * 7) + 1) * max * 0.65);
              const color =
                round === 1
                  ? houseColors[HOUSES.indexOf(key)]
                  : round === 0 && key === selected
                    ? "#f6cf55"
                    : "#76c9d6";
              return (
                <div
                  key={key}
                  data-result={key}
                  className={
                    "result-card " +
                    (phase === "done" && r.rank === 1 ? "winner " : "") +
                    (round === 0 && key === selected ? "selected" : "")
                  }
                  style={
                    {
                      "--accent": color,
                    } as React.CSSProperties
                  }
                >
                  <div className="result-top">
                    <span>
                      {phase === "done" ? (
                        r.rank === 1 ? (
                          <Trophy size={17} />
                        ) : (
                          String(r.rank).padStart(2, "0")
                        )
                      ) : (
                        "✦"
                      )}
                    </span>
                    <h2>{label}</h2>
                    {round === 1 && (
                      <small>
                        {
                          ["HAWK", "SHARK", "MINOTAUR", "TIGER"][
                            HOUSES.indexOf(key)
                          ]
                        }
                      </small>
                    )}
                  </div>
                  <div
                    className="counter"
                    aria-label={
                      phase === "done"
                        ? `${label}: ${r.value}`
                        : `${label}: hidden`
                    }
                  >
                    {phase === "hidden" ? (
                      <span className="waiting">?</span>
                    ) : (
                      val
                    )}
                  </div>
                  <span className="still">STILL GOING STRONG</span>
                  <div className="bar-track">
                    <div
                      style={{
                        height:
                          phase === "done"
                            ? `${(r.value / max) * 100}%`
                            : phase === "running"
                              ? `${(val / (max * 1.3)) * 100}%`
                              : "0%",
                      }}
                    />
                  </div>
                  <div className="comparisons">
                    {phase === "done" ? (
                      <>
                        <span>{cmp.previous}</span>
                        <small>{cmp.baseline}</small>
                      </>
                    ) : (
                      <span>
                        {phase === "running"
                          ? "Here come the results…"
                          : "Ready when you are…"}
                      </span>
                    )}
                  </div>
                  {phase === "done" && r.rank === 1 && (
                    <div className="winner-badge">
                      ★{" "}
                      {ranking.filter((x) => x.rank === 1).length > 1
                        ? "JOINT LEADER"
                        : "LEADING THE WAY"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!entries.length && (
            <p>No forms have been recorded for this year yet.</p>
          )}
          <nav className="present-controls">
            <button className="secondary" onClick={() => navigate(-1)}>
              <Home size={17} /> Home
            </button>
            <div className="round-dots">
              {[0, 1, 2].map((n) => (
                <span key={n} className={n === round ? "active" : ""} />
              ))}
              <small>{["YEAR GROUPS", "HOUSES", "YOUR FORMS"][round]}</small>
            </div>
            <button
              className="secondary"
              disabled={round === 0}
              onClick={() => navigate(round - 1)}
            >
              <ArrowLeft size={17} /> Previous
            </button>
            <button
              className="secondary"
              disabled={phase === "running"}
              onClick={reveal}
            >
              <RotateCcw size={17} /> Replay
            </button>
            <button
              className="primary"
              disabled={phase !== "hidden" || !counts}
              onClick={reveal}
            >
              <Play size={17} fill="currentColor" />{" "}
              {phase === "running"
                ? "Revealing…"
                : phase === "done"
                  ? "Revealed"
                  : "Reveal results"}
            </button>
            <button
              className="secondary"
              onClick={() => navigate(round === 2 ? -1 : round + 1)}
            >
              {round === 2 ? "Finish" : "Next round"} <ArrowRight size={17} />
            </button>
          </nav>
          {phase === "done" && (
            <div className="confetti" aria-hidden="true">
              {Array.from({ length: 24 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    left: `${i * 4.3}%`,
                    animationDelay: `${(i % 5) * 0.1}s`,
                    background: houseColors[i % 4],
                  }}
                />
              ))}
            </div>
          )}
        </main>
      )}
      <footer>
        <span>
          <span className="live-dot" />{" "}
          {store.demo
            ? "DEMO DATA · FICTIONAL TOTALS"
            : latest
              ? "LATEST PUBLISHED SNAPSHOT"
              : "AWAITING FIRST SNAPSHOT"}{" "}
          {latest && (
            <b>
              {new Date(latest.timestamp).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </b>
          )}
        </span>
        <span>
          Belong. Achieve. Succeed. <i /> <em>Time Well Spent.</em>
        </span>
      </footer>
      {!PRESENTATION && gate && (
        <div className="overlay">
          <form className="modal gate" onSubmit={unlock}>
            <button
              type="button"
              className="close icon"
              aria-label="Close"
              onClick={() => {
                setGate(false);
                setPassword("");
                setError("");
              }}
            >
              <X />
            </button>
            <ShieldCheck size={32} />
            <h2>
              {store.auth
                ? "Administrator access"
                : "Set your administrator password"}
            </h2>
            <p>
              {store.auth
                ? "Enter your password to manage attendance."
                : "Choose a password, then export your administrator master to retain it."}
            </p>
            <label>
              Password
              <input
                autoFocus
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={store.auth ? 1 : 10}
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button className="primary">
              {store.auth ? "Unlock administration" : "Set password & continue"}{" "}
              <ArrowRight size={16} />
            </button>
            <small>
              This offline password is an accidental-access deterrent. Keep your
              administrator master private.
            </small>
          </form>
        </div>
      )}
      {!PRESENTATION && admin && (
        <Admin
          store={store}
          update={setStore}
          close={() => setAdmin(false)}
          source={initialSource}
        />
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
