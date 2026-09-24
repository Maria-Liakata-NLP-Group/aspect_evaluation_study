# Chest X-Ray Report Annotation App — Design

Date: 2026-09-24
Status: Draft, awaiting review

## Goal

Replace the legacy claim-annotation flow with the annotation interface for the pilot study
"Aspect-Based Evaluation of Chest X-Ray Report Generation". A rater enters their ID, reads the
instructions, then rates each case (clinical indication, frontal and lateral X-ray, Maira-2 report)
against 7 statements on a 5-point Likert scale. Each case is saved on submit, together with the time
spent on it, so a rater can stop and resume at any point.

## Decisions

| Topic | Decision |
|---|---|
| Scale | 5-point agreement scale: 1 Completely disagree … 5 Completely agree. No "Not applicable" option. All 7 items required. |
| Item order / grouping | Items shown in study-plan order, **without** aspect headings (avoid priming). Same scale direction for all items. |
| Duplicate sample | Handled entirely in `add_participant` (notebook) by inserting a repeated case ID into `case_ids`. The app is unaware of duplicates. |
| Response keying | By position in `case_ids` (index), never by case ID, so the duplicate does not overwrite the original. |
| Case content | Bundled `src/data/xray_cases.json`, looked up client-side by `case_id`. Redis stores participants and responses only. |
| Image viewing | Frontal and lateral side by side; click opens full-screen modal (native browser zoom). No windowing/pan tools. |
| Navigation | Forward only. No Back button; a submitted response is final. |
| Layout | Desktop-first; stacks on narrow screens. Existing Bulma styling. |
| Analysis | Reverse scoring and all analysis stay out of the app. |

## Redis data model

Created by the notebook (`data_prep/handle_vercel_kv.ipynb`, `add_participant`):

- `permitted_ids` — set of participant IDs.
- `participant:{id}` — hash:
  - `case_ids`: JSON list of case IDs in randomised order (30 entries, or 31 with the duplicate).
  - `progress`: integer, number of cases submitted = index of the current case.

Written by the app:

- `response:{id}:{index}` — hash:
  - `case_id`: string
  - `item_1` … `item_7`: integer 1–5
  - `comment`: string (may be empty)
  - `duration_ms`: integer, from case render to Next click
  - `submitted_at`: ISO timestamp (server time)

Derived values: total cases = `case_ids.length`; current case number = `progress + 1`;
completed when `progress >= case_ids.length`.

## API

Both routes use the existing `@upstash/redis` client with `KV_REST_API_URL` / `KV_REST_API_TOKEN`,
accept `POST` only (405 otherwise).

### `POST /api/getData`

Body: `{ participant }`

- 400 if `participant` missing.
- 404 if `participant` is not in `permitted_ids` or `participant:{id}` does not exist.
- 200 `{ caseIds, progress, completed }` where `completed = progress >= caseIds.length`.

Replaces the legacy 204-with-body response (browsers discard 204 bodies).

### `POST /api/saveResponses`

Body: `{ participant, index, caseId, ratings, comment, durationMs }`
where `ratings` is an array of 7 integers.

Validation, in order:
1. 400 if any required field is missing, `ratings` is not 7 integers in 1–5, or `durationMs` is not a
   non-negative number.
2. 404 if the participant is not permitted.
3. 409 if `index !== progress` or `caseIds[index] !== caseId` (double submit, stale tab).

On success: write `response:{id}:{index}`, set `progress = index + 1`, return
200 `{ progress, completed }`.

The write is two commands (hset response, hset progress). A crash between them leaves a response
without an advanced progress; the retry then overwrites the same key, so this is safe.

### Removed

`src/pages/api/addToQueue.js`, `src/pages/api/hello.js` (unused).

## UI

Single-page stage machine in `src/pages/index.js`: `id → loading → intro → annotation → finish`.

1. **ID page** (`EnterID`) — unchanged behaviour including `?ID=` prefill. Unknown ID →
   "ID not recognised. Please check your ID." Completed ID → finish page.
2. **Instructions page** (`Intro`) — rater instructions from the study plan (text below) and a
   **Start** button. Shown on every login. Same text available in the navbar **Help** modal
   (`Guidelines`), replacing the legacy guidelines.
3. **Annotation page** (`AnnotationPanel`), one case per page:
   - Header: "Case {progress+1} / {caseIds.length}" and a progress bar.
   - Clinical indication (highlighted box).
   - Frontal and lateral images side by side on a dark background, labelled; click → full-screen
     modal, closed by ×, Esc or background click.
   - AI-generated report (box, preserves line breaks).
   - 7 statements, each a row of 5 radio buttons labelled Completely disagree / Disagree /
     Neither agree nor disagree / Agree / Completely agree (left → right).
   - Optional comment textarea.
   - **Next** button: disabled until all 7 items answered and while saving; shows loading state.
   - Save failure → red notification, inputs preserved. 409 → reload participant state and show the
     correct case. Scroll to top on each new case. State (answers, comment, timer) resets per case.
   - Unknown `case_id` (not in `xray_cases.json`) → error message instead of the case.
4. **Finish page** — "Thank you, you have rated all cases. You can close this window."

### Likert items (displayed wording)

1. The report is clinically correct.
2. The report does not omit clinically relevant findings visible on the X-ray.
3. The report addresses the clinical question raised in the indication.
4. The report clearly communicates the severity of the case.
5. The report is concise.
6. The report does not include information that is not relevant to the clinical question.
7. This report would save time interpreting the X-rays and writing the report.

Stored as `item_1` … `item_7` in this order.

### Instructions text

The study-plan rater instructions, with these edits for the no-N/A decision:
- "rate your agreement with seven statements on a 5-point Likert scale from Completely disagree (1)
  to Completely agree (5)" — kept.
- Removed: "If an item genuinely does not apply to a case, select Not applicable rather than forcing
  a rating."

## File changes

- **Move** components out of `src/pages/` into `src/components/` (`annotation`, `enterID`, `intro`,
  `navbar`, `guidelines`). Files under `pages/` become public routes in Next.js and are
  prerendered without props, which can break `next build`.
- **Rewrite:** `src/pages/index.js`, `src/pages/api/getData.js`, `src/pages/api/saveResponses.js`,
  `AnnotationPanel`, `Intro`, `Guidelines`.
- **New:** `src/components/imageModal.js` (full-screen viewer), `src/components/likertItem.js`,
  `src/data/likertItems.js` (item wording, single source for UI and Help).
- **Delete:** `countDown.js`, `explanationInput.js`, `successfulAssessment.js`,
  `api/addToQueue.js`, `api/hello.js`, `public/images/guidelines_flowchart.png`.
- **Notebook:** add one `export_responses(participant_id)` cell that reads
  `response:{id}:0 … n-1` into a DataFrame (index, case_id, item_1–7, comment, duration_ms,
  submitted_at) and writes `{id}_responses.csv`. Existing cells untouched. Duplicate insertion in
  `add_participant` is done by the researcher.
- `firebase` dependency is unused but left alone (out of scope).

## Testing

No test framework in the repo; not adding one for two small routes.

- `npm run lint` and `npm run build` pass.
- Manual run (`npm run dev`) with `test_participant`: unknown ID, fresh start, resume mid-way,
  Next disabled until complete, failed save (e.g. offline) keeps inputs, image modal, finish page,
  re-login after completion goes to finish page.
- Verify Redis contents and CSV export via the notebook (researcher, needs `.env.local`).

## Open points for the study plan (not app changes)

- Items 2 and 6 are listed as negatively phrased / reverse-scored, but their current wording is
  positive ("does not omit…", "does not include…"). Reverse-scoring them as worded would invert
  their meaning. Resolve the wording or the scoring note before analysis.
- The instructions refer to the final item as "would save the referring clinician time", while
  item 7 reads "would save time interpreting the X-rays and writing the report" (the radiologist's
  time). Align the two.
- The study plan still mentions a Not applicable option in several places.
