# Worth a moment

A browser-local decision comparison app for everyday tasks, purchases versus saving, and time or feelings invested in a relationship.

## Run locally

No build step or dependencies are required. Serve the `dist` folder:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000 in a browser.

## What it calculates

- Cost and time differences, including entered recovery time.
- Cost per expected use and savings-goal replacement time under stated assumptions.
- A weighted index of your own happiness forecasts now and later.
- An optional personal-fit index: sum of (dimension rating × importance), divided by total importance. Zero-weight dimensions are omitted; missing required ratings produce no score.
- Forecast-versus-reported-outcome differences on the scale saved with a decision.

## Personal scales

Define what happiness means to you and provide your own reference experiences for 0, 5, and 10. Choose the importance of enjoyment, connection, security, and meaning. Preferences can be saved on the current device; decisions snapshot their definitions and priorities so later changes do not rewrite old records.

Weighted averages are decision aids and assume that spacing between your ratings is useful for comparison. They are not validated psychological measurements, population comparisons, or predictions of how happy you will actually become. An 8 is not twice as much happiness as a 4. Fit and expected feelings are separate outputs.

Effort is self-reported. Sleep and meals provide context but are not converted into biological energy, calories, or a daily battery percentage. The app does not assign rejection odds or put a price on feelings. Gifts do not create obligations.

## Data and privacy

Definitions, saved decisions, and follow-ups use browser localStorage. They do not sync across devices and may be lost when browser storage is cleared. Do not put sensitive personal details into a shared device. The static app has no backend, analytics, AI requests, or external JavaScript dependencies. Research links lead to external sources when opened.

## Files

- `dist/index.html`: interface and linked research notes.
- `dist/app.js`: base comparison and saved reflections.
- `dist/planning.js`: task, purchase, relationship, and time scenarios.
- `dist/numbers.js`: numerical dashboard and forecast weighting.
- `dist/personal.js`: personal scales, priorities, and actual-outcome follow-ups.

The `.openai/hosting.json` file in the Sites checkout identifies the existing private deployment. It is not required for local use. A GitHub copy by itself does not enable automatic deployment or publish a GitHub Pages site.

## Experimental learned estimates

The Learning section implements the decayed reward equation from Rutledge et al. (2014), DOI: 10.1073/pnas.1407535111, adapted to self-rated everyday rewards. This is not a validated everyday-life implementation of the original reward-task findings.

Record expected reward before an event, then actual reward and current happiness afterward. For certain events, the known reward is fixed from the prior entry. For uncertain events, reward prediction error equals actual minus expected reward. Each scale definition and its three anchors has a separate observation history; logs remain in localStorage under `worth-learning-v1`.

The engine fits intercept + discounted CR, EV, and RPE features using ridge regression (penalty 1, no intercept penalty). It chooses a decay factor from `[0, .25, .5, .75, .9]` via forward validation within the oldest 70% of records. It evaluates against the newest 30%, using a fixed training-average baseline. The final coefficients are then refit to all matching observations. Predictions are withheld unless the model beats that baseline, has at least 24 records, and has seen the proposed event type. The minimum is a product heuristic, not a statistically sufficient sample size. At most 200 recent matching-scale records are used. Predictions are bounded to 0–10; clipping and reward extrapolation are disclosed.

The model estimates the next event's immediate reported happiness under specified reward outcomes. It does not predict long-term satisfaction, estimate causal treatment effects, or infer rejection probabilities. Mean absolute test error is shown, not a confidence interval. Gamma decays per event, so observations should be recorded promptly in event order. Context and elapsed time are not modeled. Synthetic demonstration data is isolated and never added to the user's observations.

- `dist/momentary-model.js`: pure computation engine, also loadable in Node.
- `dist/learning.js`: expectation/outcome logging, evidence, and scenario UI.
- `test-model.cjs`: checks for event coding, decay, cold start, baseline gating, chronological holdout isolation, and output bounds.

Run the model checks with `node test-model.cjs`.


### Income versus time calculator
`dist/income-tradeoff.js` compares household gross income using 100 × ln(B/A), alongside annual additional work/commute/recovery time and self-rated effort load. The income index borrows the log-income functional form from Killingsworth (2021), without fitting or claiming a happiness coefficient. Optional personal willingness to trade hours for a 20% raise determines a local break-even income; this exchange rate is user supplied. No universal satiation cutoff or biological energy estimate is imposed. Tests: `node test-income.cjs`.

### Personalized combined score
The income calculator now combines normalized log-income growth, time savings, self-rated effort-load reductions, and optional 0–10 ratings for financial security, flexibility, meaning, relationships, sustainable stress and an additional factor. Users explicitly choose importance weights and major-change anchors. The weighted score is centered at 50; 45–55 is a product-defined close-call band. Individual factors are capped. Optional time/effort hard limits override the score. A deterministic sensitivity scenario perturbs normalized factor changes by ±0.1; it is not a confidence interval. Financial-security ratings can include taxes, benefits and extra costs that gross income excludes. The composite is a preference model, not an empirically validated happiness forecast. Tests include normalization, contribution arithmetic, priority reversal and hard limits.

### Scores for everyday, purchase and relationship decisions
`dist/decision-score.js` applies the same 50-centered weighted comparison to money kept, time including recovery, subjective effort, expected feelings now/later, connection, meaning and security. Users select importance and resource-change anchors; optional benefit factors reuse the existing personal-fit ratings. Costs use linear savings relative to a personal anchor, not the population income curve (which is not evidence about individual purchase utility). Hard limits and an explicitly declined relationship override the numerical preference. Inputs and results are attached to the decision snapshot and reflection summary. Smaller third options remain separate. `node test-decisions.cjs` verifies direction, contributions, missing data, limits and boundaries.

### Remembered scoring priorities
Save or clear priorities independently for everyday, purchase, relationship and income comparisons. Only weights, major-change anchors and hard limits are stored under `worth-scoring-priorities-v1`; outcome ratings are excluded. Examples preserve existing chosen priorities. General decisions refresh after input edits; income edits replace stale results with a recalculation prompt. Browser QA verified save/reload, example preservation, cost updates and stale-result handling.

### Guided comparisons and portable decisions
The main comparison is organized into four steps: choices, resources, benefits, then priorities. Validation opens the step and detail section containing a missing input. Examples still populate complete comparisons; zero-weight criteria do not require ratings. The combined personal score leads the result, with separate forecast indices and the raw table behind a detail control.

The journal can download and restore versioned JSON decision backups. Restore validates size, record identifiers, dates and reflection text, rejects unsafe object keys, adds new IDs, and preserves existing IDs. Scoring preferences and learned-model observations are deliberately excluded. Run `node test-backups.cjs` for import validation and non-overwriting merge checks.

After changing browser scripts, run `node scripts/stamp-assets.cjs` so the HTML references their current content hashes. This avoids cached code surviving a release. Live edits synchronize the score, comparison text, resource table and new-save state; old saved snapshots keep their values.

## Personalized scores across decision types

Everyday tasks (including class, work and rest), purchases, relationships, and income changes share `dist/tradeoff-core.js` for capped weighted contributions, the 50-centered score, sensitivity scenarios and verdict rules. Everyday decisions can include health, flexibility and another personal factor alongside resources, feelings, connection, meaning and security. Only selected factors need ratings; unknown factors can have zero importance. Income retains its log-income transformation and weekly effort units before entering that shared arithmetic.

Hard limits apply to both options, even when the related resource has zero score weight. If both options exceed a limit, the app recommends revising the plan. A relationship refusal overrides the score, and the optional relationship spending comfort limit is enforced. Numerical preference scores remain visible for transparency; they never overrule these boundaries. The optional smaller third option is explicitly outside this combined score; enter it as a main option to score it fully.

Invalid or incomplete edits disable saving until a new valid personalized comparison is available. Saved reflections retain their original criteria, score and scale. Cross-decision scores are not comparable when criteria or weights differ.

## Learning from real decision outcomes

The saved-decision loop is implemented in `dist/feeling-calibration.js` and `dist/decision-learning.js`. Save forecasts before deciding, choose the option actually taken, and record numeric soon-after and/or later feelings on the saved scale. Timing confirmation and timestamps are required. Existing free-text notes and untimed scores are not silently converted to training data. Income decisions can now include optional soon-after/later feeling criteria and can be saved to the same reflection history.

The calibration is `h = clip(f + beta0 + beta1 * (f - 5) / 5, 0, 10)`, with `beta = (X'X + 5I)^-1 X'(actual - original forecast)`. This is a Bayesian/ridge residual calibration with a zero-correction prior, not a universal biological or psychological equation for emotions. [Penn State's regression shrinkage notes](https://online.stat.psu.edu/stat508/Lesson06.html) describe the statistical basis; [Wilson and Gilbert](https://dash.harvard.edu/entities/publication/d57b7409-6195-4481-9259-0bc1cf2aaea3) review affective forecasting. The separate Rutledge reward/expectation model remains available as a distinct experimental tool.

Models are isolated by personal scale definition/anchors, decision type and horizon. There must be at least 10 eligible outcomes, including four chronological prediction checks with at least six outcomes already recorded before each checked decision. A correction is used only if its mean absolute error beats the original forecasts by more than 0.05 points. At most the latest 200 eligible outcomes per group are used. Predictions beyond the observed forecast range plus/minus one point remain unchanged. These thresholds and ridge strength are transparent product choices, not validated psychological constants.

The feelings calibration adjusts only selected feeling criteria before the shared tradeoff score. Separate resource calibration can update time and effort estimates. User priorities, original input snapshots and safety/boundary overrides are preserved; before/after scores and validation errors are shown. No outcomes are inferred for unchosen options, weights are not learned from happiness ratings, and correlations do not establish causal benefits of a decision. Saved snapshots keep their original raw forecasts and scores. Outcome updates change future draft calculations, not historical snapshots. Learning can be turned off without deleting the history. Decision backups include recorded feeling outcomes.

Run `node test-feeling-calibration.cjs` for cold start, no-gain fallback, chronological leakage prevention, chosen-option labels, scale/context/horizon separation, bounded estimates and a real change in the combined tradeoff score.

## Learning time, recovery and effort

`dist/resource-calibration.js` and `dist/resource-learning.js` extend outcome learning to activity/work duration, additional recovery and self-rated workload. Each is fitted separately by decision type and unit, using the chosen option only. An explicit `outcomeChoice` makes feelings and resources refer to the same choice; feedback for an older, different choice is retained but excluded. Changing a choice clears entry fields and requires new confirmation. No happiness anchors are required to learn resources.

Time uses a ridge correction to `log(1 + forecast)` and transforms back with `exp(value) - 1`, bounded to nonnegative, supported input ranges. Effort uses a ridge residual correction on its original 1–5 decision scale or 0–10 income intensity scale, with bounded predictions. Activity and recovery predictions are summed once for total time. Income work intensity is multiplied by learned work hours / 10 to recompute weekly effort load; recovery stays in time, avoiding double counting.

The same six-prior-outcome/four-chronological-check/10-total-outcome gate is used. Resource MAE must improve by more than 1 minute, 0.1 weekly hours or 0.05 effort points, respectively. Model settings are product conventions. Unsupported forecasts and non-improving fits retain raw inputs. Both learned weekly time components revert to raw forecasts if their sum exceeds 168 hours. Original forecasts and score snapshots remain immutable; future scores use checked resource estimates and still enforce user hard limits. Costs used in scoring and their before/after values are shown. Resource learning has a separate off switch and survives decision backup/restore.

Run `node test-resource-calibration.cjs` for chronology, units, cold start, no-gain and out-of-range fallbacks, nonnegative time, bounded effort, chosen-option consistency, hard-limit crossings and income effort-load recomputation.


### Preparation and chance

The Preparation & chance section compares lighter and more prepared plans across class/tasks, purchases, relationships and income. It uses user-entered probability ranges, personal outcome values and explicit time, spending and effort costs in the shared weighted preference score. It reports expected outcome values, a sensitivity range and break-even success odds. No universal hours-to-success curve or measured luck score is claimed. Limits and refusals override the preference score.

Saved forecasts preserve the evidence, success definition and if–then plan. Chosen-plan outcomes and actual preparation minutes are included in decision backups. Matched histories show observed rates, a labeled Beta(1,1) estimate and Brier error; observational differences never imply causation. The checked probability model below can supply learned odds. Preparation records are excluded from the separate activity-resource calibration.

Research: Gollwitzer & Sheeran (2006), DOI 10.1016/S0065-2601(06)38002-1; Macnamara et al. (2014), DOI 10.1177/0956797614535810; Scott Schmidler, Duke Stat 340 Lecture 9, Value of Information. Product arithmetic, prior and decision thresholds are identified separately from these findings.

Run `node test-preparation.cjs` for expected-utility, probability-bound, cost, hard-limit, refusal, break-even and chosen-outcome evidence checks.


### Learning preparation probabilities and main-score integration

`preparation-probability.js` models matching decision type and exact reusable success definition using Beta(1,1) updates in three actual-preparation-time bands (0–15, >15–60, >60 minutes, recovery included). Predictive mean `(successes+1)/(attempts+2)` is gated on 12 outcomes, two bands with at least three outcomes, four chronological Brier checks (six earlier known outcomes, two in the target band), and improvement >0.005 against pooled success-rate predictions. Supported future estimates need three band outcomes and log(1+minutes) within observed support ±log(2). It keeps at most 200 matching records. Thresholds, bands and prior are product conventions. Mean ±2 posterior standard deviations is labeled approximate; observational predictive gain is not a causal preparation effect.

Preparation forecasts can be saved with null probabilities during cold start, so users can collect outcomes without inventing odds. Existing guessed forecasts remain intact. Main task, purchase, relationship and income forms provide an optional Expected outcome criterion: personal expected outcome value is calculated using learned chances, then included in the shared score at the user’s chosen weight. Preparation costs belong in existing resource inputs and are never added twice. Unavailable probabilities prevent a selected outcome criterion from generating a recommendation; setting importance to zero leaves it out. Snapshots preserve model counts, chronological errors and probabilities. Main and income decisions collect chosen-plan preparation outcomes alongside feeling/resource follow-ups and are included in backups; choice conflicts are excluded from learning.

Run `node test-preparation-probability.cjs`. Sources: [Beta–Binomial model](https://bookdown.org/kevin_davisross/stat415-handouts/beta-binomial.html), [rolling-origin evaluation](https://otexts.com/fpp3/tscv.html).


### Quick entry

Preparation now starts with a decision, an observable outcome and preparation minutes (plus decision category). A saved-setup picker reuses prior outcome definitions and available settings, then recalculates probabilities from current history. Extra costs, values, manual odds, priorities and notes remain editable in a collapsed section. The disclosed starting comparison is no preparation versus the entered minutes; goal attainment values are 100/0, outcome/time weights 5/1, a 60-minute time swing, and spending/effort weights zero. These are planning conventions, not inferred happiness. Main comparison explanations are optional; a user-selected time-and-effort shortcut configures the existing scoring engine. No learning thresholds or saved records are changed.


### Effects across a time window

Optional short-run/long-run settings are integrated into the shared scoring engine and the existing main, income and preparation forms. For one included benefit criterion, choose a fading, lasting or bounded growing difference, a half-life/doubling time, a window and whether the headline uses the average across the window or its endpoint. The output shows all three immediate/average/endpoint scores and accumulated normalized effect-days. Existing costs, explicit later forecasts, constraints, refusal overrides and learned probabilities are unchanged; curves model the selected value difference rather than changing success odds. Settings and results are retained in saved score snapshots and backups. Saved preparation setups restore their time assumptions. No new required fields or separate calculator is added.

Fading uses d(t)=d0*2^(-t/h); lasting uses d0; growth uses clip(d0*2^(t/h),-1,1). Exact analytic integrals preserve experience along the way even if endpoint differences approach zero. The original score is unchanged when the optional scenario is off. Rates, windows and curve forms are user assumptions, not learned causal parameters. The law of large numbers does not eliminate differences in expectations; 10,000 independent 55% versus 50% opportunities differ by 500 expected successes. No simulated life histories or universal convergence are claimed.

Sources: Grinstead & Snell, Introduction to Probability (law of large numbers); OpenStax Calculus Vol. 1 §6.8 (growth/decay); Luhmann et al. (2012), DOI 10.1037/a0025948 (adaptation differs by life event). Run `node test-time-effects.cjs` for the temporal arithmetic and integration checks.
