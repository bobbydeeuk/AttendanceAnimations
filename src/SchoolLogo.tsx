import schoolLogo from "./assets/school-logo.png";

/** Official school artwork; clip away the surrounding social-card background. */
export function SchoolLogo() {
  return (
    <svg className="school-logo" viewBox="440 98 320 438" role="img" aria-label="Hedingham School crest">
      <defs>
        <clipPath id="official-crest-outline">
          <path d="M600 100 Q532 151 482 115 L442 157 Q488 207 459 291 Q420 400 482 450 Q525 484 583 516 L600 535 L608 510 Q687 467 722 432 Q769 388 746 296 Q717 206 758 157 L716 116 Q664 151 600 100Z" />
        </clipPath>
      </defs>
      <image href={schoolLogo} width="1200" height="630" clipPath="url(#official-crest-outline)" />
    </svg>
  );
}
