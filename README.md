# Attendance Animations

A portable, offline attendance game show for Hedingham School & Sixth Form. The first campaign is **Non-Stop November 2026**, hosted by Timewell Spent in the poster’s navy and gold palette.

## Open the application

Download **[dist/attendance-animations.html](dist/attendance-animations.html)** and open it in a modern desktop browser. It contains the complete administrator application, bundled fonts, artwork, Excel parser and aggregate history. No installation, server, sign-in or internet connection is needed. The repository ships clearly labelled fictional demo totals; your first accepted workbook replaces them.

A separate **[dist/presentation/attendance-animations.html](dist/presentation/attendance-animations.html)** is the presentation-only build. Its JavaScript excludes the administration component and Excel importer. Both versions use the required filename; keep them in separate folders.

## Administrator workflow and publishing in Teams

1. Open your **administrator master** locally and select the discreet settings cog at the top right.
2. On first use, choose a password of at least 10 characters. No project-owner password is embedded or committed. The exported master stores only a random salt and a PBKDF2-SHA256 verifier (210,000 iterations).
3. Select **Import data**, choose an `.xlsx` or `.xls` workbook, and select its worksheet. The first row must contain unique column headings. The remaining rows should contain only pupils who still have 100% attendance.
4. Check the detected columns for student name, year, form and house. Map alternative headings manually. A stable student ID can optionally be mapped to check identifier uniqueness within the upload.
5. Select **Validate & preview**. Review valid/questionable counts, totals and every year/house/form comparison. Invalid rows, duplicate rows/IDs, an already accepted workbook, and unexpected increases block acceptance. Repeated names in distinct rows require explicit acknowledgement that they represent different pupils. Fix rejected records in the source workbook and re-import; none are silently dropped.
6. Select **Accept snapshot**. All year, house and form counts derive from the same validated rows. Names and individual records are discarded from the accepted snapshot. Changes are in memory until exported: **closing or reloading before export loses them**.
7. Select **Export HTML → Export updated HTML**. Save the verified `attendance-animations.html` in your private administrator-master folder. Keep this version for the next upload; reopening it retains the entire aggregate history and password verifier.
8. Also download a **JSON history backup** and keep it with the master.
9. Select **Export presentation HTML** and save that `attendance-animations.html` in your staff-presentation folder. Replace the previously published file in Teams with this copy. It contains all aggregate history but no administrator interface, importing/editing implementation or password verifier.
10. Tutors download the published HTML and open it in Chrome, Edge, Firefox or Safari. **Teams/SharePoint may download HTML instead of executing it in place**; use the downloaded file in the browser. Do not rename it as a text file.

Repeat steps 3–10 for every upload. Every export verifies its embedded snapshot count and current total before download. Snapshots live in the identifiable `attendance-data` JSON block, independent of browser storage. History survives copying the file to another device. No pupil records are written to localStorage, sessionStorage or IndexedDB, or transmitted over a network.

### Corrections and recovery

An accepted snapshot is immutable. For a mistaken most recent upload, select **Correct the latest mistaken upload**, enter an explanation, and upload the corrected workbook. Validation compares against the preceding accepted snapshot. The removed snapshot and reason remain in **Upload history → Correction audit trail**, in HTML exports and in backups. Correcting the first upload establishes the corrected baseline. A failed/cancelled upload never changes history.

**History backup** validates a selected JSON backup and displays its campaign, snapshot count and latest total before an explicit replacement confirmation. Backup fields are whitelisted and group counts must reconcile. Starting a new campaign requires confirmation; export your old campaign first.

### Identity limitations

Exact rows and optional IDs are checked within the workbook; repeated names are reviewed rather than silently merged. Only aggregates are retained across exports. It is therefore impossible to reliably detect an individual re-entering or changing group after reopening the file. The import screen explains this limitation and administrators must reconcile the source data themselves. Group increases always block normal acceptance, even when the whole-school count falls. Use the documented correction flow for genuine classification/upload corrections; counts are never clipped.

### Password limitation

The offline password is a UI restriction against accidental access, **not genuine security**. Someone who can edit the HTML can bypass it. Keep the administrator master privately and distribute only presentation exports. Pupil-level Excel workbooks should be held according to the school’s usual access controls. A forgotten password can be recovered by the repository maintainer editing the master’s embedded verification configuration; staff copies contain no verifier.

## Presenting

Choose one of seven year groups. Year 13 and Year 14 always form the single administrative year **13/14**. Then present exactly three manually controlled rounds:

1. Year Group Showdown — the same whole-school figures for every selected year.
2. House Showdown — Hawkwood (red / hawk), Symonds (light blue / shark), Moynes (yellow / minotaur), Thomason (purple / tiger).
3. The selected year’s Form Showdown — forms discovered from uploaded data, with shared 13/14 forms aggregated.

Press **Reveal** once to run all counters. Results remain visible. Replay repeats the animation without changing data. Rankings use current absolute counts with competition ranking for ties; all joint leaders celebrate. Historical forms remain visible at zero. Fullscreen and optional original synthesised sound are available; sound defaults to muted. Reduced-motion system preferences are honoured.

Shortcuts when focus is outside interactive controls: **Space/Enter** reveal, **R** replay, **←/→** previous/next round, **F** fullscreen. **Escape** exits browser fullscreen. Native buttons retain their normal keyboard behaviour.

## Artwork

`src/Timewell.tsx` contains a replaceable reference-based SVG host: the smiling navy alarm-clock character, gold face, white gloves and navy shoes. This is a vector interpretation of the supplied poster, not the extracted official artwork. Replace it with the official PNG/WebP/JPEG (preferably transparent) in **Campaign settings → Timewell Spent artwork**; the image is embedded in subsequent exports. The original poster file was not present among the downloadable workspace attachments. House animal names are explicit artwork placeholders pending official assets. The Hedingham wordmark is typographic, not a reproduction of the school crest.

Plus Jakarta Sans is bundled locally through Fontsource (SIL Open Font License); no Google Fonts requests occur. The home screen and round dialogue use the campaign configuration and a configurable introduction pool in `src/main.tsx`.

## Development

Requires Node.js 22+ and npm.

```sh
npm ci
npm run dev
npm run build
npm test
npm run test:browser
```

`npm run build` typechecks TypeScript and builds the presentation first, then embeds its complete template into the administrator HTML for offline publishing. Production has no runtime module imports or external asset requests. The application captures its pristine document before React mounts, then replaces only its JSON block on export; repeated exports do not nest application state or templates.

Install the test browser with `npx playwright install chromium`. Browser tests use Playwright Chromium by default; set `CHROMIUM_PATH` to use a different local Chromium executable. They open the built HTML over `file://` with network disabled, perform three Excel import/accept/export/download/reopen cycles, check that pupil names never enter exported files, test presentation-only code exclusion, verify the three rounds and selected-year scope, and capture desktop/mobile screenshots. Run the build before browser tests.

`src/data.ts` provides the validation, normalization, counting, ranking, immutable snapshot and robust serialization functions. `src/Admin.tsx` provides the publisher workflow and interactive SVG trend charts. `src/main.tsx` provides the presentation state machine. `demoStore()` is the development/demo aggregate generator; all tests use fictional pupil names. `docs/brief.txt` preserves the supplied brief.

No deployment service, database, external authentication or SharePoint integration is required. The production build is the deliverable.
