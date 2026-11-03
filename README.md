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
