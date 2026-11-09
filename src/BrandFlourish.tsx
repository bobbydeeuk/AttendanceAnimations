/** Original vector brush ribbons inspired by the school's attendance posters. */
export function BrandFlourish() {
  return (
    <svg
      className="brand-flourish"
      viewBox="0 0 1600 1000"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="brand-gold" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ffed94" />
          <stop offset=".35" stopColor="#f9d35c" />
          <stop offset=".7" stopColor="#dba830" />
          <stop offset="1" stopColor="#ffdd6d" />
        </linearGradient>
        <linearGradient id="brand-blue">
          <stop stopColor="#15629a" stopOpacity=".7" />
          <stop offset="1" stopColor="#07335c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 0H350L0 16Z" fill="url(#brand-gold)" />
      <path
        d="M0 12 320 0M0 17 180 6M14 10 206 2"
        fill="none"
        stroke="#07345b"
        strokeWidth="3"
        opacity=".5"
      />
      <path
        d="M-80 530Q280 840 860 755T1690 990"
        fill="none"
        stroke="url(#brand-blue)"
        strokeWidth="100"
      />
      <g fill="none" stroke="url(#brand-gold)">
        <path d="M-70 970Q350 765 905 920T1675 991" strokeWidth="19" />
        <path d="M-70 988Q350 783 905 938T1675 1009" strokeWidth="4" />
        <path
          d="M-70 1000Q350 805 905 956T1675 1028"
          strokeWidth="2"
          opacity=".65"
        />
        <path d="M1130 325Q1410 304 1640 180" strokeWidth="9" opacity=".8" />
        <path d="M1180 335Q1430 309 1640 194" strokeWidth="2" opacity=".8" />
      </g>
      <path
        d="M-70 971Q350 766 905 921T1675 992"
        fill="none"
        stroke="#143f60"
        strokeWidth="2"
        strokeDasharray="55 3 27 5 95 3 21 7"
        opacity=".35"
      />
      <path
        d="M1130 325Q1410 304 1640 180"
        fill="none"
        stroke="#164570"
        strokeWidth="2"
        strokeDasharray="72 4 23 3 46 2"
        opacity=".3"
      />
      <g fill="none" stroke="#f9d15b" strokeWidth="3" opacity=".55">
        <path d="m1482 484 8 19 21 2-16 14 4 21-18-11-18 10 4-21-15-14 21-2Z" />
        <path d="m57 620 8 16 18 3-13 13 3 18-16-9-16 9 3-18-13-13 18-3Z" />
      </g>
      <g stroke="#ffdb70" strokeLinecap="round" strokeWidth="4" opacity=".7">
        <path d="m1515 440 14-19m-5 45 26-7m-86-44 2-23M38 552l-12-16m33 5-3-21" />
      </g>
    </svg>
  );
}
