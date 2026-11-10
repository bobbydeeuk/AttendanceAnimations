import { useId } from "react";
import refinedRig from "./assets/timewell-rig.svg?raw";

export type TimewellGesture = "thumbs-up" | "wave" | "ready" | "celebrate";

/** A small SVG character rig: arms, gloves, eyes and bells move independently.
 * Keep the clock, face and costume consistent with the supplied school posters.
 */
export function Timewell({
  asset,
  gesture = "thumbs-up",
  compact = false,
}: {
  asset?: string;
  gesture?: TimewellGesture;
  compact?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const paint = (name: string) => `url(#${id}-${name})`;
  const label =
    gesture === "wave"
      ? "waving hello"
      : gesture === "ready"
        ? "getting ready for the results"
        : gesture === "celebrate"
          ? "celebrating with a thumbs-up"
          : "giving you a thumbs-up";
  if (asset)
    return (
      <img
        className="timewell timewell-custom"
        src={asset}
        alt="Timewell Spent, our school attendance host"
      />
    );
  const thumbs = gesture === "thumbs-up" || gesture === "celebrate";
  return (
    <svg
      className={`timewell timewell-${gesture}`}
      data-gesture={gesture}
      viewBox={compact ? "0 0 460 390" : "0 0 460 500"}
      role="img"
      aria-label={`Timewell Spent, ${label}`}
    >
      <defs>
        <radialGradient id={`${id}-face`} cx="38%" cy="28%" r="80%">
          <stop stopColor="#fffce3" />
          <stop offset=".62" stopColor="#ffefb5" />
          <stop offset="1" stopColor="#e8bd55" />
        </radialGradient>
        <linearGradient id={`${id}-blue`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#498dc4" />
          <stop offset=".28" stopColor="#195b92" />
          <stop offset=".66" stopColor="#0b3b68" />
          <stop offset="1" stopColor="#032343" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#9bcbe7" />
          <stop offset=".16" stopColor="#256da5" />
          <stop offset=".48" stopColor="#08375e" />
          <stop offset=".82" stopColor="#15598d" />
          <stop offset="1" stopColor="#031b32" />
        </linearGradient>
        <linearGradient id={`${id}-sole`} x2="0" y2="1">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#dbe5ed" />
        </linearGradient>
        <radialGradient id={`${id}-glove`} cx="35%" cy="25%">
          <stop offset=".4" stopColor="#ffffff" />
          <stop offset="1" stopColor="#cbdde8" />
        </radialGradient>
        <radialGradient id={`${id}-glow`}>
          <stop stopColor="#ffe077" stopOpacity=".38" />
          <stop offset=".7" stopColor="#f8c742" stopOpacity=".12" />
          <stop offset="1" stopColor="#ffd464" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="220" cy="263" rx="214" ry="215" fill={paint("glow")} />
      <g
        stroke="#031a31"
        strokeWidth="6"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <g
          className={`timewell-right-arm ${gesture === "wave" ? "timewell-wave-arm" : thumbs ? "timewell-thumb-arm" : ""}`}
        >
          {gesture === "wave" ? (
            <g>
              <path d="M333 261Q385 231 394 173" fill="none" strokeWidth="29" />
              <path
                d="M333 261Q385 231 394 173"
                fill="none"
                stroke={paint("blue")}
                strokeWidth="18"
              />
              <path
                d="m379 169 29 4-1 19-31-4Z"
                fill={paint("sole")}
                strokeWidth="4"
              />
              <g className="timewell-open-hand">
                <path
                  d="M381 174Q359 164 360 147L348 121Q344 110 352 106Q361 102 370 122L365 92Q363 81 373 80Q383 79 387 110L390 82Q391 71 401 75Q410 78 406 111L417 89Q423 80 430 86Q437 92 421 125L431 114Q440 109 445 117Q449 126 430 149Q424 177 402 180Z"
                  fill={paint("glove")}
                  strokeWidth="4"
                />
                <path
                  d="M379 148q12-18 29-17m-25 31q-5-14-4-23m14-25 3 15m15-14-4 15"
                  fill="none"
                  strokeWidth="3.5"
                />
              </g>
            </g>
          ) : thumbs ? (
            <g>
              <path d="M333 264Q372 298 390 240" fill="none" strokeWidth="29" />
              <path
                d="M333 264Q372 298 390 240"
                fill="none"
                stroke={paint("blue")}
                strokeWidth="18"
              />
              <path
                d="m376 233 28 7-4 18-29-8Z"
                fill={paint("sole")}
                strokeWidth="4"
              />
              <g className="timewell-thumb-hand">
                <path d="M376 241 C366 232 364 218 370 207 L382 190 C387 182 389 171 387 159 C385 146 390 140 398 141 C409 142 413 153 412 166 L409 185 C417 181 428 184 431 191 C440 193 443 201 439 208 C445 215 441 224 435 227 C437 237 428 244 417 245 L393 248Z" fill={paint("glove")} strokeWidth="4" />
                <path d="M409 187 C400 185 395 190 397 196 C399 203 414 203 431 202 C440 201 439 191 431 189" fill={paint("glove")} strokeWidth="3" />
                <path d="M405 202 C395 201 393 207 396 212 C400 217 418 217 433 214 C441 212 442 204 436 201" fill={paint("glove")} strokeWidth="3" />
                <path d="M404 216 C395 216 394 222 399 227 C405 231 419 230 431 227 C437 225 439 219 436 215" fill={paint("glove")} strokeWidth="3" />
                <path d="M403 230 C397 231 400 239 408 240 C419 242 429 237 430 230" fill={paint("glove")} strokeWidth="3" />
                <path d="M379 207 C388 201 397 206 398 215 C400 224 395 231 389 234" fill="none" strokeWidth="3" />
                <path d="M394 151 Q400 148 402 161" fill="none" stroke="#fff" strokeWidth="5" />
              </g>
            </g>
          ) : (
            <g>
              <path d="M334 268Q376 289 359 317" fill="none" strokeWidth="29" />
              <path
                d="M334 268Q376 289 359 317"
                fill="none"
                stroke={paint("blue")}
                strokeWidth="18"
              />
              <path
                d="m348 307 28 9-8 19-28-11Z"
                fill={paint("sole")}
                strokeWidth="4"
              />
              <path
                d="M352 326q14-8 23 3 15-1 17 15 8 12-3 23-3 16-19 14-13 9-22-4-17-3-13-19-4-19 17-32Z"
                fill={paint("glove")}
                strokeWidth="4"
              />
            </g>
          )}
        </g>
        <g className="timewell-refined" transform="translate(9 40) scale(.34)" dangerouslySetInnerHTML={{ __html: refinedRig.replace(/<\?xml[^>]*>/g, "").replace(/<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/id="([^"]+)"/g, (_, name) => `id="${id}-refined-${name}"`).replace(/url\(#([^)]+)\)/g, (_, name) => `url(#${id}-refined-${name})`) }} />
      </g>
      <g
        className="timewell-approval-spark"
        fill="#ffdd69"
        stroke="#f4b928"
        strokeWidth="1"
      >
        <path d="m430 139 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" />
        <path d="m361 147 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" />
      </g>
    </svg>
  );
}
