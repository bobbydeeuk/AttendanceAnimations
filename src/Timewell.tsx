import { useId } from "react";

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
        <g className="timewell-left-arm">
          {gesture === "celebrate" ? (
            <g>
              <path d="M109 265Q63 230 55 171" fill="none" strokeWidth="29" />
              <path
                d="M109 265Q63 230 55 171"
                fill="none"
                stroke={paint("blue")}
                strokeWidth="18"
              />
              <path
                d="M40 177 68 165 75 183 47 194Z"
                fill={paint("sole")}
                strokeWidth="4"
              />
              <path
                d="M43 173Q17 163 25 141Q19 128 31 118Q29 103 43 103Q49 89 62 98Q79 96 82 112Q99 123 86 141Q87 162 65 173Z"
                fill={paint("glove")}
                strokeWidth="4"
              />
              <path
                d="M39 117q15-2 17 15m6-28q13 7 9 19m-44 17q12-10 24 2"
                fill="none"
                strokeWidth="3"
              />
            </g>
          ) : (
            <g>
              <path d="M105 264Q63 285 81 313" fill="none" strokeWidth="29" />
              <path
                d="M105 264Q63 285 81 313"
                fill="none"
                stroke={paint("blue")}
                strokeWidth="18"
              />
              <path
                d="m67 308 27-9 8 18-28 9Z"
                fill={paint("sole")}
                strokeWidth="4"
              />
              <path
                d="M72 317q-14-4-21 7-9 14 2 26-1 15 13 17 13 13 24 1 16 1 17-17 6-17-6-26-3-14-15-10-7-8-14 2Z"
                fill={paint("glove")}
                strokeWidth="4"
              />
              <path
                d="m66 338 6 11m19-15-1 12"
                fill="none"
                stroke="#9cb1c3"
                strokeWidth="3"
              />
            </g>
          )}
        </g>
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
                <path
                  d="M377 237Q360 232 364 216Q361 204 376 195Q386 185 388 178Q390 169 386 160Q383 146 395 143Q408 140 412 155Q416 169 409 181Q421 177 432 184Q444 187 440 200Q444 211 436 218Q438 231 426 236Q423 247 408 245Q389 248 377 237Z"
                  fill={paint("glove")}
                  strokeWidth="4.5"
                />
                <path
                  d="M410 196q14-5 25 4m-27 8q13-4 27 4m-28 8q13-3 24 3m-49-22q13 1 15 15q2 10-3 19"
                  fill="none"
                  strokeWidth="3.3"
                />
                <path d="m396 158 1 15" stroke="#fff" strokeWidth="5" />
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
        <g className="timewell-legs">
          <path
            d="M170 352Q172 390 138 428Q145 442 169 436Q200 398 204 360ZM252 352Q245 392 283 428Q278 443 252 436Q221 397 217 360Z"
            fill={paint("blue")}
          />
          <path
            d="m131 420 38 10-4 15-38-10zm123 10 37-12 5 16-37 12Z"
            fill="#f4c843"
            strokeWidth="4"
          />
          <path
            d="M136 433C112 416 76 431 71 452Q63 469 78 476Q119 494 170 475Q186 469 179 450Q173 433 157 432Z"
            fill={paint("blue")}
          />
          <path
            d="M71 463q43 21 103-4l-2 17q-65 25-101-3Z"
            fill={paint("sole")}
            strokeWidth="4"
          />
          <path
            d="M282 433C306 416 342 431 347 452Q355 469 340 476Q299 494 248 475Q232 469 239 450Q245 433 261 432Z"
            fill={paint("blue")}
          />
          <path
            d="M347 463q-43 21-103-4l2 17q65 25 101-3Z"
            fill={paint("sole")}
            strokeWidth="4"
          />
          <path
            d="M90 446q14-14 31-7m174 0q17-7 31 7"
            fill="none"
            stroke="#6ca8d2"
            strokeWidth="5"
          />
        </g>
        <g className="timewell-bells">
          <path
            d="m125 111-17-27 25-14 19 29m137 1 20-27 23 15-20 29"
            fill={paint("blue")}
          />
          <circle
            cx="122"
            cy="42"
            r="12"
            fill={paint("blue")}
            strokeWidth="5"
          />
          <circle
            cx="315"
            cy="42"
            r="12"
            fill={paint("blue")}
            strokeWidth="5"
          />
          <path d="M69 117Q52 55 119 41Q165 34 188 78Z" fill={paint("blue")} />
          <path
            d="M254 79Q274 30 321 43Q383 57 370 117Z"
            fill={paint("blue")}
          />
          <path
            d="M69 117 188 78m66 1 116 38"
            stroke="#031629"
            strokeWidth="9"
          />
          <path
            d="M87 82q13-22 39-24m155 2q22-7 42 8"
            fill="none"
            stroke="#8dbce0"
            strokeWidth="6"
          />
          <path d="m143 58 10 5m182 13 7 9" stroke="#d4e8f4" strokeWidth="4" />
        </g>
        <circle
          cx="220"
          cy="235"
          r="144"
          fill="#e4b94a"
          stroke="#03213a"
          strokeWidth="8"
        />
        <circle cx="220" cy="233" r="140" fill={paint("rim")} strokeWidth="5" />
        <circle
          cx="220"
          cy="233"
          r="123"
          fill={paint("face")}
          strokeWidth="6"
        />
        <path
          d="M96 202q8-55 56-80m-57 97-1 12"
          fill="none"
          stroke="#91bfe1"
          strokeWidth="5"
        />
        <path
          d="M267 115q35 13 55 43"
          fill="none"
          stroke="#fff8d6"
          strokeWidth="4"
          opacity=".6"
        />
        <g
          fill="#071c32"
          stroke="none"
          fontFamily="Plus Jakarta Sans, sans-serif"
          fontWeight="900"
          fontSize="36"
          textAnchor="middle"
        >
          <text x="220" y="150">
            12
          </text>
          <text x="220" y="349">
            6
          </text>
          <text x="121" y="246">
            9
          </text>
          <text x="319" y="246">
            3
          </text>
        </g>
        <g strokeWidth="6">
          <path d="m165 140 7 12m102-12-7 12M132 181l13 7m163-7-13 7M133 282l13-7m162 7-13-7m-129 41 8-12m99 12-8-12" />
        </g>
        <g className="timewell-eyebrows" fill="none" strokeWidth="5">
          <path d="M164 181q17-19 35-1m43 0q19-20 36 1" />
        </g>
        <g className="timewell-eyes">
          <ellipse
            cx="180"
            cy="215"
            rx="20"
            ry="29"
            fill="white"
            strokeWidth="4.5"
          />
          <ellipse
            cx="259"
            cy="215"
            rx="20"
            ry="29"
            fill="white"
            strokeWidth="4.5"
          />
          <g className="timewell-pupils" stroke="none">
            <ellipse cx="185" cy="218" rx="10" ry="18" fill="#061b31" />
            <ellipse cx="254" cy="218" rx="10" ry="18" fill="#061b31" />
            <ellipse cx="188" cy="211" rx="4" ry="6" fill="white" />
            <ellipse cx="257" cy="211" rx="4" ry="6" fill="white" />
            <circle cx="182" cy="225" r="2" fill="#b9d5e8" />
            <circle cx="251" cy="225" r="2" fill="#b9d5e8" />
          </g>
        </g>
        <ellipse
          cx="220"
          cy="244"
          rx="17"
          ry="13"
          fill="#fff0bd"
          strokeWidth="4"
        />
        <path
          d="M161 263q58 32 117-2-15 65-58 59-42-3-59-57Z"
          fill="#03182b"
          strokeWidth="4"
        />
        <path
          d="M170 270q49 23 99-1-12 23-49 23-33-1-50-22Z"
          fill="white"
          stroke="none"
        />
        <path d="M200 309q21-28 44 0-21 17-44 0" fill="#f16b6a" stroke="none" />
        <path
          d="M151 270q3-12 15-11m107 0q12-9 16 4"
          fill="none"
          strokeWidth="4"
        />
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
