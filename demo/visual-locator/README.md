# Visual Locator demo kit

Test inputs and captured results for the **Visual locator** tab on `/diagnose`.

The locator labels the parts it can see in an image, then ranks them **Inspect first** / **Check second**
from the case evidence (uploaded documents, chat, report). The ranking comes from the evidence, not the image,
so each test pairs a scan report with an image.

All scan reports are **synthetic test data** taken from `knowledge/tesla-model-3/03-diagnostic-logs.md`.
Test images are frames and crops of the site's own exploded-view render (`frontend/public/media/sequence`).

## How to run a test

1. Open `/diagnose`. Click **New case** if one is already open.
2. Upload the scenario's scan report under **Case documents** and wait until it shows as ready.
3. Open the **Visual locator** tab, add the image, click **Locate parts**.

## Scenarios

| Scenario | Upload this report | Then this image | Expected result |
|---|---|---|---|
| A · Weak cell group in module 3 (P0B3C) | `scenarios/A-weak-module-3-scan-report.txt` | `04-battery-pack-closeup.jpg` or `01-exploded-full-vehicle.jpg` | Battery pack / module **Inspect first**; sense connector / HV harness **Check second** |
| B · HV interlock open over rough road (P0A0D) | `scenarios/B-hv-interlock-open-scan-report.txt` | `03-powertrain-and-pack.jpg` or `05-rear-drive-unit-closeup.jpg` | Pack junction box or drive-unit inverter connectors **Inspect first** |
| C · Coolant pump not turning, module 4 hot (P0A81, P0A9C) | `scenarios/C-coolant-pump-overheat-scan-report.txt` | `01-exploded-full-vehicle.jpg` or `02-battery-reveal.jpg` | Battery pack **Inspect first**; a note says the coolant pump itself is not visible in this view |
| No evidence (control) | nothing | `01-exploded-full-vehicle.jpg` | Parts labelled only, no priorities, and a "No case evidence yet" note |

Show the control first, then scenario A on the same image: the judges see the same picture go from plain labels
to ranked priorities once evidence exists.

## Captured results

`results/*.png` are screenshots from the running app, one per scenario. `results/json/` holds the raw API
responses (`POST /api/cases/:id/visual`).

Results come from a language model, so labels and box positions change a little between runs.

## Known limitation

When the suspected part is hidden (for example a side view with the doors open, where the pack sits under the floor),
the model sometimes still marks it. Use exploded or underbody views like the ones here.
