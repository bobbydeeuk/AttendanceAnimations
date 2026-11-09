export function Timewell({ asset }: { asset?: string }) {
  return asset ? (
    <img
      className="timewell"
      src={asset}
      alt="Timewell Spent, our smiling alarm-clock host"
    />
  ) : (
    <svg
      className="timewell"
      viewBox="0 0 360 430"
      role="img"
      aria-label="Timewell Spent, a smiling navy and gold alarm clock"
    >
      <defs>
        <radialGradient id="face">
          <stop stopColor="#fff7d6" />
          <stop offset="1" stopColor="#ffe99e" />
        </radialGradient>
        <linearGradient id="blue" x2="1" y2="1">
          <stop stopColor="#2976af" />
          <stop offset="1" stopColor="#062c52" />
        </linearGradient>
      </defs>
      <g stroke="#03182d" strokeWidth="7" strokeLinejoin="round">
        <path
          fill="url(#blue)"
          d="M91 262L48 297 69 321 109 295M268 260l45 34-23 30-38-30"
        />
        <path
          fill="url(#blue)"
          d="m128 298-20 71-34 13 52 14 33-91m64-7 19 71 33 10-52 16-31-90"
        />
        <path
          fill="url(#blue)"
          d="M110 363c-50-8-73 11-72 36 21 19 76 14 99 0l-4-29zM240 363c51-8 75 11 73 36-21 19-75 14-98 0l4-29z"
        />
        <path
          fill="white"
          d="M38 399q45 21 99 0v12q-57 22-99 0zM215 399q50 20 98 0v12q-45 22-98 0z"
        />
        <path
          fill="#f8cc45"
          d="m105 356 32 8-4 13-32-7zm114 6 32-8 5 14-35 9z"
        />
        <path
          fill="url(#blue)"
          d="m90 87-17-27 24-17 21 29m126 9 19-30 22 16-19 32"
        />
        <circle cx="79" cy="30" r="13" fill="url(#blue)" />
        <circle cx="278" cy="30" r="13" fill="url(#blue)" />
        <path
          fill="url(#blue)"
          d="M32 100C18 37 98 6 139 63zM220 64c36-60 116-26 109 37z"
        />
        <circle cx="180" cy="195" r="135" fill="url(#blue)" />
        <circle cx="180" cy="195" r="113" fill="url(#face)" />
        <g
          fill="#071e37"
          stroke="none"
          fontFamily="Arial,sans-serif"
          fontWeight="900"
          fontSize="34"
          textAnchor="middle"
        >
          <text x="180" y="119">
            12
          </text>
          <text x="180" y="295">
            6
          </text>
          <text x="88" y="207">
            9
          </text>
          <text x="272" y="207">
            3
          </text>
        </g>
        <g strokeWidth="6" strokeLinecap="round">
          <path d="m127 112 6 11m94-11-6 11M99 147l11 6m140-5-10 6M102 242l12-5m135 6-11-6m-112 36 7-11m94 11-7-11" />
        </g>
        <ellipse cx="147" cy="175" rx="20" ry="29" fill="white" />
        <ellipse cx="211" cy="175" rx="20" ry="29" fill="white" />
        <ellipse
          cx="152"
          cy="179"
          rx="9"
          ry="16"
          fill="#071e37"
          stroke="none"
        />
        <ellipse
          cx="208"
          cy="179"
          rx="9"
          ry="16"
          fill="#071e37"
          stroke="none"
        />
        <circle cx="155" cy="173" r="4" fill="white" stroke="none" />
        <circle cx="211" cy="173" r="4" fill="white" stroke="none" />
        <path
          d="M128 137q18-18 34-2m32 0q16-20 33 1"
          fill="none"
          strokeLinecap="round"
          strokeWidth="5"
        />
        <ellipse
          cx="180"
          cy="202"
          rx="14"
          ry="12"
          fill="#ffeaa3"
          strokeWidth="4"
        />
        <path
          d="M128 217q52 31 104-1-13 60-52 50-35-5-52-49"
          fill="#071e37"
          strokeWidth="4"
        />
        <path d="M140 226q40 19 79 0-34 30-79 0" fill="white" stroke="none" />
        <path d="M166 257q19-22 37 0-17 15-37 0" fill="#ef6769" stroke="none" />
        <path
          fill="white"
          strokeWidth="5"
          d="M67 303q-16-13-24 0-7 13 3 23-5 16 9 17 9 10 17 1 18 2 18-15 3-17-9-21-2-15-14-5zM287 304q16-13 24 0 7 13-3 23 5 16-9 17-9 10-17 1-18 2-18-15-3-17 9-21 2-15 14-5z"
        />
      </g>
      <g fill="none" stroke="#86bde2" strokeWidth="5" strokeLinecap="round">
        <path d="M48 67q14-22 35-24M246 52q22-6 38 9M75 151q13-36 43-52M55 387q11-12 30-11" />
      </g>
    </svg>
  );
}
