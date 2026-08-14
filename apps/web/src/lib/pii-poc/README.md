# Travel Guard PII masking PoC

This directory is an isolated comparison PoC. It is not imported by the case
creation, STT, or Live Assistance production paths.

## Scope and candidates

| Candidate | Version | License | Runtime | External API | PoC decision |
| --- | --- | --- | --- | --- | --- |
| OpenRedaction | 1.1.2 | MIT | Node.js 20+, local | No | Tested |
| OpenRedaction + Korean contextual patterns | 1.1.2 | MIT + project code | Node.js, local | No | Tested and recommended |
| redact-pii-light | 1.0.0 | MIT | Node.js, local | No for built-ins | Tested as an English/US baseline |
| Microsoft Presidio | Not installed | MIT | Python/service | Self-hosted | Not tested: adds a Python/service boundary |
| Google Sensitive Data Protection | Not installed | Managed service | External API | Yes | Not tested: outside local-first scope |
| Philter/Phileas and DataFog | Not installed | Varies by product/package | Separate integration | Varies | Researched only; no clearer low-complexity Node baseline than the tested candidates |

Sources used for version/API checks:

- https://www.npmjs.com/package/openredaction
- https://github.com/sam247/openredaction
- https://www.npmjs.com/package/redact-pii-light

The installed package type definitions are the source of truth for adapters.

## Dataset and scoring

The development dataset contains 50 synthetic Korean fixtures. A separate
45-fixture hold-out set was written before changing the original patterns.

- explicit PII
- non-PII incident facts
- mixed incident statements
- likely STT output, including Korean spoken digits

There are 37 expected PII entities across name, phone, email, passport,
resident registration number, card number, and bank account categories.
Fourteen non-PII fixtures cover time, date, money, quantity, station exit,
product, distance, case number, flight number, and hotel reservation number.

An expected entity is counted only when both its exact source span and category
match. A detection outside expected spans is a false positive. Placeholder text
differences between libraries do not affect the score.

## Measured result

Run `corepack pnpm --filter web pii:poc` to reproduce the current-machine
numbers. Processing time varies by machine and warm-up state.

| Candidate | Detection | FN | Non-PII preservation | FP fixtures | Observed average |
| --- | ---: | ---: | ---: | ---: | ---: |
| OpenRedaction default | 11/37 | 26 | 12/14 | 7 | about 2.1 ms |
| OpenRedaction + Korean contextual patterns | 37/37 | 0 | 14/14 | 0 | about 0.2 ms |
| redact-pii-light baseline | 9/37 | 28 | 14/14 | 6 | about 0.6 ms |

Recommended category result on the development dataset:

| Category | Detected / expected |
| --- | ---: |
| NAME | 8/8 |
| PHONE_NUMBER | 7/7 |
| EMAIL | 4/4 |
| PASSPORT | 6/6 |
| RRN | 5/5 |
| CARD_NUMBER | 4/4 |
| BANK_ACCOUNT | 3/3 |

## Hold-out validation

The first untouched-pattern run was recorded before any pattern change:

| Metric | Initial unseen result |
| --- | ---: |
| Fixtures | 45 |
| Expected entities | 28 |
| Detection | 16/28 |
| False negatives | 12 |
| Non-PII preservation | 7/15 |
| False-positive fixtures | 8 |

This disproved the original 37/37 result as sufficient evidence. Failures were
grouped into unseen Korean labels, punctuation/spoken-number variants, and
format-only false positives on reservation, case, locker, and serial numbers.

The policy was then changed once at the category level: structured identifiers
require a matching PII label, punctuation variants are normalized by patterns,
and overlapping matches are resolved by priority. One hold-out expectation was
corrected: a phone-shaped value explicitly labelled `계좌번호` is a bank-account
entity, not a non-PII value.

Final results remain separate:

| Dataset | Detection | FN | Non-PII preservation | FP fixtures |
| --- | ---: | ---: | ---: | ---: |
| Development (50 fixtures) | 37/37 | 0 | 14/14 | 0 |
| Hold-out (45 fixtures, 29 entities) | 29/29 | 0 | 14/14 | 0 |

Final hold-out categories: NAME 7/7, PHONE 6/6, EMAIL 3/3, PASSPORT
5/5, RRN 3/3, CARD 2/2, and BANK_ACCOUNT 3/3. Incident Intake mixed
fixtures scored 6/6 with no FP; short Live Assistance fixtures scored 3/3
with no FP. Observed warmed subset latency was about 0.2 ms for Intake and
0.1 ms for Live Assistance. Full-run averages include first-use warm-up; use
the command output for current-machine average and maximum values.

Overlap regression tests prove that identical shapes are classified by labels:

- `전화번호는 010-...` -> PHONE_NUMBER
- `계좌번호는 010-...` -> BANK_ACCOUNT
- `사건번호는 010-...` -> unchanged
- passport vs hotel reservation, RRN vs locker/case number, and card vs hotel
  reservation follow the same contextual rule

No duplicate span may be emitted.

OpenRedaction default detected common phones/cards but missed Korean names,
RRNs, passport numbers, and bank accounts. It also treated bank-account
fragments and a hotel reservation number as phone numbers. redact-pii-light is
an older English/US-oriented baseline and similarly misclassified RRN/account
fragments as phones.

## Why the hybrid is recommended

Use OpenRedaction as the maintained Node integration and add a narrow Travel
Guard Korean layer. The Korean layer owns evaluated Korean identifiers and
keeps only safe, non-overlapping OpenRedaction email/card fallbacks. This avoids
the overlapping detections observed when custom patterns were naively appended
to every built-in pattern.

Patterns for phone, RRN, passport, card, email, and account formats are local
and deterministic. Korean name matching is intentionally context-restricted
(`이름은`, `신고자 성명은`, etc.). Regex cannot reliably distinguish arbitrary
Korean names from places, brands, and ordinary nouns. Do not broaden it to all
2–4 syllable Korean words without a larger labelled dataset or a Korean NER
model.

STT word-number patterns also require labels such as `전화번호는` or
`주민번호는`. A global Korean-number regex would destroy incident times,
amounts, dates, quantities, and model numbers.

## OpenAI preservation check

`corepack pnpm --filter web pii:poc:openai` loads the existing local OpenAI
configuration and compares five synthetic statements before and after masking:
three Incident Intake statements and two short Live Assistance-shaped inputs.
The semantic result is 5/5 preserved for incident type, normalized time/place,
item category/name meaning, color, brand, model, quantity, and identifying
feature. The comparison normalizes harmless Korean/English station translations
and `파란`/`파란색` variants.

OpenAI sometimes returned `신주쿠역` as `Shinjuku Station` and changed the item
display name while preserving the structured incident facts. The PoC therefore
compares the fields needed by case analysis, not byte-identical model output.

## Production promotion

The reusable sanitizer now lives in `packages/ai/src/pii-sanitizer.ts`; Korean
patterns live in `packages/ai/src/korean-pii-patterns.ts`. Production OpenAI
operations invoke it immediately before constructing provider input:

```text
audio -> STT -> transient original transcript -> PII sanitizer
      -> masked transcript -> OpenAI
```

The original transcript should live only in request memory. Do not write it to
the database, filesystem, console, request/error logs, analytics, traces, or
exception metadata. Only masked text should cross the OpenAI boundary. This PoC
The Incident Intake and Live Assistance API contracts remain unchanged.
`analyzeCaseWithOpenAI` sanitizes the initial statement and string answers;
`answerWithLiveIncidentContext` sanitizes current and recent transcript text.
The raw-input preparation helpers are kept in a non-exported internal module,
while high-level operations and the safe sanitizer API are exported.

Case creation also sanitizes the initial statement and AI summary before DB
persistence, preventing the raw transcript from being reintroduced later in the
confirmation flow. No database schema or migration was added.

The proposed public contract is:

```ts
sanitizeTextForAI(text: string): Promise<{
  text: string;
  detections: Array<{ type: PiiType }>;
}>
```

It returns neither the original text nor PII values/spans. Placeholders are
stable type-only tokens such as `[NAME]` and `[PHONE_NUMBER]`. A test verifies
that serialized metadata cannot contain the input values.

The recommended production home is `packages/ai`, not `apps/web`, and the safe
boundary is an exported high-level OpenAI operation that sanitizes internally.
If every route must call `sanitizeTextForAI` itself, a future caller can bypass
it with `analyzeCaseWithOpenAI(rawTranscript)`. Keep raw-input OpenAI adapters
private or accept a branded/masked input type so the unsafe path is difficult to
call accidentally. Incident Intake and Live Assistance can share the sanitizer,
while keeping separate datasets and quality thresholds because their language
shapes differ.

## Logging and error-path review

- `/api/cases/analyze` logs only an error class name; it does not log the body.
- the STT route does not log audio or transcript and stores neither.
- the Live Assistance Context route returns fixed error codes and logs no statement.
- `analyzeCaseWithOpenAIFallback` maps provider errors without logging the input.
- `POST /api/cases` also logs only an error type.
- `/api/cases/auth` and several generic case/document routes call
  `console.error(..., error)` with the entire error object. They do not currently
  pass transcript text into errors, but this is a future leakage risk if causes,
  provider request data, or validation payloads are attached. Replace these with
  allow-listed error metadata before production sanitizer rollout.
- framework request logging, reverse-proxy logs, APM, analytics, and traces were
  not configured in the inspected code. Deployment configuration must still
  ensure request bodies and OpenAI payloads are not captured.

## Known limitations

- The 50 fixtures are synthetic and smaller than a production evaluation set.
- Contextual Korean names outside the tested phrases can be missed.
- Passport/account formats vary by country and institution.
- Spoken-digit recognition depends on the exact STT spelling and spacing.
- Regex is best-effort security reduction, not a proof that a prompt contains no PII.
- Label-dependent safety deliberately misses unlabeled identifiers more often
  than an aggressive global regex; this tradeoff protects incident facts.
- Before release, add anonymized real-shape STT fixtures and adversarial tests.

## Commands

```powershell
corepack pnpm --filter web pii:poc
corepack pnpm --filter web pii:poc:holdout
corepack pnpm --filter web pii:poc:test
corepack pnpm --filter web pii:poc:openai
corepack pnpm --filter web typecheck
```
