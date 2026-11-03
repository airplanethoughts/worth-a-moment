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
