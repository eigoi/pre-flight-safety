# Pre-Flight Safety Support v12 (English)

This version simplifies the color encoding while preserving the v8/v9 workflow.

## Visual encoding

### Bubble color = potential outcome class

The app uses three visible color classes:

- **Gray — General safety check**
  - The check is important, but the prototype does not map it directly to one specific MLIT UAV Accident / Serious Incident reporting criterion.
- **Orange — Serious Incident-level**
  - The plausible outcome is associated with an MLIT serious-incident criterion, such as loss of control caused by an aircraft malfunction.
- **Red — Accident-level**
  - The plausible outcome is associated with an MLIT accident criterion, such as damage to third-party artificial property, serious injury or worse, or collision/contact with a manned aircraft.

This is a **research-prototype mapping**, not an official legal determination that an accident or serious incident has occurred or will occur.

### FAA is retained as a supporting severity reference

Each check also stores an FAA AC 25.1309-1B severity reference:

- No Safety Effect
- Minor
- Major
- Hazardous
- Catastrophic

The FAA five-level classification is shown in the detail modal as background justification. It no longer directly determines the bubble color.

### Bubble size = effort / time cost before flight

- Low
- Medium
- High
- Very High

A larger bubble means the item may require more time, replanning, troubleshooting, coordination, waiting, or procedural work before the planned flight can proceed. It does **not** mean that the item is more dangerous.

### COMMON / LOCATION

The source of the check is shown as a text label:

- **COMMON** — shown at every location
- **LOCATION** — generated from the selected location context


## Bubble interior text

To avoid duplicating information already explained in the legend:

- Outcome-class labels such as **General safety check / Serious Incident-level / Accident-level** are **not written inside the bubble**. They are represented by **color**.
- Effort/time labels such as **Low / Medium / High / Very High** are **not written inside the bubble**. They are represented by **bubble size**.
- **COMMON / LOCATION remains visible as a text label on every bubble.**
- The check-item title also remains visible.

So each bubble contains only:

```text
COMMON or LOCATION
Check item title
```

The full outcome class, effort/time cost, FAA reference, and explanation remain available in the detail modal after clicking a bubble.

## Current prototype mapping examples

- **Aircraft & Propellers** → Serious Incident-level
  - Rationale: an aircraft malfunction can lead to loss of control.
- **Communication & Positioning** → Serious Incident-level
  - Rationale: certain communication failures can be part of an aircraft-malfunction loss-of-control event.
- **Buildings** → Accident-level
  - Rationale: contact may damage third-party artificial property.
- **Power Lines & Electrical Infrastructure** → Accident-level
  - Rationale: contact may damage third-party artificial property and can create severe secondary consequences.
- **Trees & Branches** → General
  - Rationale: the final MLIT classification depends on the actual resulting injury, third-party property damage, or other reportable outcome.
- **Weather & Wind** → General by default
  - Covers current weather, visibility, wind conditions, and relevant warnings/advisories.
  - If mapped buildings or power infrastructure are nearby, the prototype raises the visible class to Accident-level because weather- or wind-related drift/contact could result in third-party property damage.
- **People, Traffic & Other Aircraft** → Accident-level
  - Rationale: if the operating area is not kept clear, plausible outcomes can include serious injury, damage to third-party artificial property, or collision/contact with an aircraft. The displayed class represents a potential outcome, not a declaration that an accident will occur.

## MLIT reporting criteria used as the primary visible outcome reference

The prototype is based on the MLIT framework for UAV accidents and serious incidents.

Examples of **Accident** criteria include:
- death or serious injury caused by an unmanned aircraft,
- damage to third-party artificial property,
- collision/contact with a manned aircraft.

Examples of **Serious Incident** criteria include:
- risk of collision/contact with a manned aircraft,
- non-serious injury caused by an unmanned aircraft,
- loss of control caused by an aircraft malfunction,
- in-flight fire.

Important nuance: MLIT's loss-of-control serious-incident criterion is tied to aircraft malfunction; the official guidance excludes some cases caused by pilot error or insufficient weather checking. The app therefore does not automatically label every wind-related or operational-control problem as a Serious Incident-level outcome.

Official reference:
- MLIT: https://www.mlit.go.jp/koku/accident_report.html
- FAA AC 25.1309-1B: https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC_25.1309-1B.pdf

## Legal Gate

Legal and airspace screening remains separate from the safety-outcome color classes. Legal cards use their own effort/time-cost indicators because permission, approval, coordination, or replanning can require substantial lead time.

## Location data loading

OpenStreetMap environment data is prefetched while the Legal Gate is reviewed, retried automatically, and cached. Final pre-flight completion remains locked until location-specific environment loading has successfully completed.

## Default configuration

```javascript
const CONFIG = {
  initialCenter: [37.4948, 139.9298], // Near Aizuwakamatsu
  initialZoom: 14,
  analysisRadiusMeters: 10,
  overpassEndpoint: "https://overpass-api.de/api/interpreter",
  overpassTimeoutMs: 20000,
  overpassMaxRetries: 3,
  overpassRetryDelaysMs: [1000, 2500],
  environmentCacheTtlMs: 30 * 60 * 1000,
  gsiAirportAirspaceZoom: 8,
  bubbleDiameter: 138,
  actionCostDiameters: {
    LOW: 150,
    MEDIUM: 200,
    HIGH: 300,
    VERY_HIGH: 400,
  },
  bubbleSpeed: 0.01,
  bubbleCollisionPadding: 4,
};
```
