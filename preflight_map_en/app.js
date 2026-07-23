"use strict";

// ============================================================
// Configuration
// ============================================================

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

// ============================================================
// Common pre-flight checks
// Basic pre-flight checks shown at every location
// ============================================================

const COMMON_CHECKS = [
  {
    id: "wind-condition",
    scope: "COMMON",
    category: "WEATHER",
    className: "wind",
    title: "Weather & Wind",
    faaSeverity: "MAJOR",
    consequenceClass: "GENERAL",
    classificationReason: "Weather and wind are treated as a general safety check by default because weather conditions alone do not map directly to a specific MLIT accident or serious-incident reporting criterion. If mapped buildings or power infrastructure are nearby, the prototype can raise the displayed outcome class because wind-driven drift may lead to third-party property damage.",
    mlitReference: "Default: no direct MLIT accident/serious-incident category assigned.",
    actionCost: "MEDIUM",
    effortReason: "Checking weather and wind is usually quick, but poor visibility, warnings, unstable wind, or rapidly changing conditions may require waiting, changing the route, or postponing the flight.",
    scenario: "Poor weather, reduced visibility, strong winds, or sudden gusts may make the drone difficult to control or increase the chance of obstacle contact.",
    summary: "Check current weather, visibility, wind conditions, and relevant weather warnings before flight.",
    why:
      "Poor visibility, strong winds, sudden gusts, or rapidly changing weather can reduce your ability to operate the drone safely and maintain the intended position.",
    action:
      "Check the current weather, visibility, local wind strength and direction, and any relevant weather warnings or advisories before takeoff.",
    safetyTip:
      "If conditions are unstable or visibility is poor, delay the flight or revise the plan. Keep sufficient clearance from buildings, trees, power lines, and other obstacles when wind may cause drift.",
  },
  {
    id: "aircraft-condition",
    scope: "COMMON",
    category: "AIRCRAFT",
    className: "aircraft",
    title: "Aircraft & Propellers",
    faaSeverity: "HAZARDOUS",
    consequenceClass: "SERIOUS_INCIDENT",
    classificationReason: "A malfunction of the aircraft or propulsion system can lead to loss of control. MLIT lists loss of control caused by an aircraft malfunction as a serious incident; the FAA Hazardous category is used here only as a severity reference for the possible effect.",
    mlitReference: "Serious-incident reference: loss of control caused by an aircraft malfunction.",
    actionCost: "LOW",
    effortReason: "A basic visual and physical inspection is usually quick. If damage is found, the flight should be delayed until the issue is resolved.",
    scenario: "Problems with the aircraft or propellers may reduce control performance and could lead to a crash.",
    summary: "Check the aircraft and propellers for abnormalities before flight.",
    why:
      "Damaged propellers or aircraft components may prevent the drone from flying normally.",
    action:
      "Check the propellers for chips or cracks, and inspect the aircraft and arms for damage, deformation, or looseness.",
    safetyTip:
      "If you find any abnormality, do not fly until the cause has been identified and resolved.",
  },
  {
    id: "communication-positioning",
    scope: "COMMON",
    category: "SYSTEM",
    className: "system",
    title: "Communication & Positioning",
    faaSeverity: "HAZARDOUS",
    consequenceClass: "SERIOUS_INCIDENT",
    classificationReason: "A communication or system malfunction can lead to loss of control. MLIT explicitly gives communication failure between the unmanned aircraft and controller as an example of a malfunction that can produce a reportable loss-of-control serious incident.",
    mlitReference: "Serious-incident reference: loss of control caused by aircraft malfunction, including certain communication failures.",
    actionCost: "LOW",
    effortReason: "Connection and positioning status can usually be checked quickly before takeoff. Warnings may require troubleshooting before flight.",
    scenario: "Communication or positioning problems may prevent intended control or stable position keeping, making the drone difficult to control.",
    summary: "Check the controller connection and positioning status before flight.",
    why:
      "Unstable communication or positioning may make it difficult to control the drone correctly or maintain its position.",
    action:
      "Check the controller connection and confirm that communication and positioning information such as GNSS show no warnings or abnormalities.",
    safetyTip:
      "If a warning or abnormal status is displayed, identify the cause and wait until the system returns to normal before flying.",
  },
  {
    id: "people-traffic-aircraft",
    scope: "COMMON",
    category: "THIRD PARTIES",
    className: "general",
    title: "People, Traffic & Other Aircraft",
    faaSeverity: "HAZARDOUS",
    consequenceClass: "ACCIDENT",
    classificationReason: "A collision with people, vehicles, or other aircraft can lead to injury, damage to third-party property, or contact with an aircraft. These outcomes can correspond to MLIT accident criteria. FAA Hazardous is retained only as a supporting severity reference for the possible consequence.",
    mlitReference: "Accident reference: serious injury or death, damage to third-party artificial property, or collision/contact with an aircraft, depending on the actual outcome.",
    actionCost: "MEDIUM",
    effortReason: "Checking the operating area is usually straightforward, but the flight may need to be delayed, relocated, or replanned if people, traffic, or other aircraft are present or likely to enter the area.",
    scenario: "A person, vehicle, or other aircraft may enter the operating area unexpectedly, creating a risk of collision or requiring the flight to be stopped immediately.",
    summary: "Check for people, vehicles, and other aircraft that are present or may enter the planned flight area.",
    why:
      "People, vehicles, and other aircraft can move into the flight area unexpectedly, so a route that looked clear during planning may no longer be safe at takeoff time.",
    action:
      "Check whether people, vehicles, or other aircraft are present or likely to enter the planned flight area, including takeoff, landing, and emergency routes.",
    safetyTip:
      "Keep the route away from people and traffic, maintain active awareness of the surroundings, and stop or delay the flight if the situation changes.",
  },
  {
    id: "route-emergency",
    scope: "COMMON",
    category: "ROUTE",
    className: "route",
    title: "Flight Route & Emergency Plan",
    faaSeverity: "MAJOR",
    consequenceClass: "GENERAL",
    classificationReason: "Route and emergency planning are important preventive checks, but this check itself is not mapped directly to one specific MLIT accident or serious-incident criterion in this prototype.",
    mlitReference: "General safety check: no single direct MLIT reportable-event category assigned.",
    actionCost: "MEDIUM",
    effortReason: "Reviewing the route and emergency landing options may require additional planning or minor route changes before flight.",
    scenario: "If the drone cannot be safely diverted or landed during an abnormal situation, it may be damaged or cause harm to the surrounding area.",
    summary: "Review the planned route and what you will do if a problem occurs.",
    why:
      "If a problem occurs during flight and you cannot safely stop the flight or land, the situation may lead to an accident.",
    action:
      "Review the planned flight route and identify a safe place to land in an emergency.",
    safetyTip:
      "Before takeoff, decide where and how you can safely terminate the flight while avoiding people, buildings, and other hazards.",
  },
];

// ============================================================
// Application state
// ============================================================

const state = {
  selectedLat: null,
  selectedLon: null,
  marker: null,
  analysisCircle: null,
  didMap: null,
  didMapMarker: null,
  context: null,
  legal: null,
  checks: [],
  completedCount: 0,
  completedCheckIds: new Set(),
  safetyStarted: false,
  activeCheckId: null,
  bubbleBodies: [],
  animationFrameId: null,

  // Prefetch environment data in parallel with the Legal Gate.
  environmentStatus: "IDLE", // IDLE | LOADING | READY | ERROR
  environmentError: null,
  environmentPromise: null,
  environmentAttempt: 0,
  locationVersion: 0,
};

// ============================================================
// DOM references
// ============================================================

const selectedLocationEl = document.getElementById("selectedLocation");
const analyzeButton = document.getElementById("analyzeButton");
const backButton = document.getElementById("backButton");
const restartButton = document.getElementById("restartButton");
const locationPanel = document.getElementById("locationPanel");
const legalPanel = document.getElementById("legalPanel");
const resultPanel = document.getElementById("resultPanel");
const legalBackButton = document.getElementById("legalBackButton");
const proceedToSafetyButton = document.getElementById("proceedToSafetyButton");
const airportLegalStatus = document.getElementById("airportLegalStatus");
const airportLegalText = document.getElementById("airportLegalText");
const airportLegalDetail = document.getElementById("airportLegalDetail");
const didLegalStatus = document.getElementById("didLegalStatus");
const didLegalText = document.getElementById("didLegalText");
const didLegalDetail = document.getElementById("didLegalDetail");
const legalChecklist = document.getElementById("legalChecklist");
const contextSummary = document.getElementById("contextSummary");
const checkStatus = document.getElementById("checkStatus");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const bubbleField = document.getElementById("bubbleField");
const completePanel = document.getElementById("completePanel");
const completeTitle = document.getElementById("completeTitle");
const completeText = document.getElementById("completeText");
const completeMark = document.querySelector("#completePanel .complete-mark");
const completeRetryEnvironmentButton = document.getElementById("completeRetryEnvironmentButton");
const loadingOverlay = document.getElementById("loadingOverlay");
const analysisErrorPanel = document.getElementById("analysisErrorPanel");
const analysisErrorCode = document.getElementById("analysisErrorCode");
const analysisErrorTitle = document.getElementById("analysisErrorTitle");
const analysisErrorReason = document.getElementById("analysisErrorReason");
const analysisErrorAction = document.getElementById("analysisErrorAction");
const analysisErrorTechnical = document.getElementById("analysisErrorTechnical");

const environmentPrefetchPanel = document.getElementById("environmentPrefetchPanel");
const environmentPrefetchIcon = document.getElementById("environmentPrefetchIcon");
const environmentPrefetchTitle = document.getElementById("environmentPrefetchTitle");
const environmentPrefetchText = document.getElementById("environmentPrefetchText");
const retryEnvironmentButton = document.getElementById("retryEnvironmentButton");
const resultEnvironmentNotice = document.getElementById("resultEnvironmentNotice");
const resultEnvironmentTitle = document.getElementById("resultEnvironmentTitle");
const resultEnvironmentText = document.getElementById("resultEnvironmentText");
const resultRetryEnvironmentButton = document.getElementById("resultRetryEnvironmentButton");

const checkModal = document.getElementById("checkModal");
const modalCloseButton = document.getElementById("modalCloseButton");
const confirmCheckButton = document.getElementById("confirmCheckButton");
const modalCategory = document.getElementById("modalCategory");
const modalTitle = document.getElementById("modalTitle");
const modalSummary = document.getElementById("modalSummary");
const modalOutcomeClass = document.getElementById("modalOutcomeClass");
const modalFaaSeverity = document.getElementById("modalFaaSeverity");
const modalMlitReference = document.getElementById("modalMlitReference");
const modalClassificationReason = document.getElementById("modalClassificationReason");
const modalActionCost = document.getElementById("modalActionCost");
const modalEffortReason = document.getElementById("modalEffortReason");
const modalScenario = document.getElementById("modalScenario");
const modalWhy = document.getElementById("modalWhy");
const modalAction = document.getElementById("modalAction");
const modalSafetyTip = document.getElementById("modalSafetyTip");

// ============================================================
// Leaflet map
// ============================================================

const map = L.map("map").setView(CONFIG.initialCenter, CONFIG.initialZoom);

L.tileLayer(
  "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
  {
    maxZoom: 18,
    attribution: "GSI Tiles",
  }
 ).addTo(map);

// Reference layer for visually checking Densely Inhabited Districts (DID) from the 2020 Census.
// This PNG layer is only a visual reference and is not used to make a legal determination.
const didLayer = L.tileLayer(
  "https://maps.gsi.go.jp/xyz/did2020/{z}/{x}/{y}.png",
  {
    minZoom: 8,
    maxZoom: 18,
    opacity: 0.38,
    attribution: "Densely Inhabited Districts (2020 Census, Statistics Bureau of Japan)",
  }
);

L.control.layers(
  {},
  {
    "Densely Inhabited Districts (Reference)": didLayer,
  },
  { collapsed: false }
).addTo(map);

map.on("click", (event) => {
  selectLocation(event.latlng.lat, event.latlng.lng);
});

function selectLocation(lat, lon) {
  state.selectedLat = lat;
  state.selectedLon = lon;
  state.locationVersion += 1;
  resetEnvironmentState();
  state.legal = null;
  state.checks = [];
  state.completedCount = 0;
  state.completedCheckIds.clear();
  state.safetyStarted = false;

  if (state.marker) {
    map.removeLayer(state.marker);
  }
  if (state.analysisCircle) {
    map.removeLayer(state.analysisCircle);
  }

  state.marker = L.marker([lat, lon]).addTo(map);

  state.analysisCircle = L.circle([lat, lon], {
    radius: CONFIG.analysisRadiusMeters,
    color: "#1f5964",
    weight: 2,
    opacity: 0.8,
    fillColor: "#1f5964",
    fillOpacity: 0.08,
  }).addTo(map);

  selectedLocationEl.textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  analyzeButton.disabled = false;
  clearAnalysisError();
}

// ============================================================
// Main flow
// ============================================================

analyzeButton.addEventListener("click", async () => {
  if (state.selectedLat === null || state.selectedLon === null) {
    return;
  }

  const lat = state.selectedLat;
  const lon = state.selectedLon;
  const version = state.locationVersion;

  // Use the time spent reviewing the Legal Gate to prefetch surrounding environment data.
  startEnvironmentPrefetch(lat, lon, version, { force: false });

  setLoading(
    true,
    "Checking legal and airspace conditions",
    "Preparing surrounding environment data in the background at the same time..."
  );
  analyzeButton.disabled = true;
  clearAnalysisError();

  try {
    const legal = await runLegalScreening(lat, lon);

    // Ignore stale responses if the user selects another location.
    if (version !== state.locationVersion) return;

    state.legal = legal;
    renderLegalScreening(legal);
    renderDidReferenceMap(lat, lon);
    updateEnvironmentStatusUI();

    locationPanel.classList.add("hidden");
    legalPanel.classList.remove("hidden");
    resultPanel.classList.add("hidden");

    window.scrollTo({
      top: legalPanel.offsetTop - 20,
      behavior: "smooth",
    });
  } catch (error) {
    console.error(error);
    showAnalysisError({
      code: "LEGAL",
      title: "Legal and airspace pre-screening could not be completed",
      reason:
        "The official geographic data used to pre-screen airspace around airports could not be retrieved.",
      action:
        "Check your network connection and try again. If the automatic check is unavailable, verify the area manually using official sources such as DIPS2.0 and GSI Maps.",
      technical: error.message || String(error),
    });
  } finally {
    setLoading(false);
    analyzeButton.disabled = false;
  }
});

legalBackButton.addEventListener("click", () => {
  legalPanel.classList.add("hidden");
  locationPanel.classList.remove("hidden");
  setTimeout(() => map.invalidateSize(), 60);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

legalChecklist.addEventListener("change", updateLegalProceedState);

proceedToSafetyButton.addEventListener("click", () => {
  if (!allLegalAcknowledgementsChecked()) {
    return;
  }

  // Allow COMMON CHECKS even while OSM data is loading or unavailable.
  openSafetyChecks();
});

retryEnvironmentButton.addEventListener("click", () => {
  retryEnvironmentAnalysis();
});

resultRetryEnvironmentButton.addEventListener("click", () => {
  retryEnvironmentAnalysis();
});

completeRetryEnvironmentButton?.addEventListener("click", () => {
  retryEnvironmentAnalysis();
});

backButton.addEventListener("click", () => {
  stopBubbleAnimation();
  closeModal();
  resultPanel.classList.add("hidden");
  legalPanel.classList.remove("hidden");
  completePanel.classList.add("hidden");
  bubbleField.classList.remove("hidden");
  updateEnvironmentStatusUI();
  window.scrollTo({ top: legalPanel.offsetTop - 20, behavior: "smooth" });
});

restartButton.addEventListener("click", returnToMap);

function openSafetyChecks() {
  // Reset progress only when entering the safety screen for the first time.
  // Preserve completed bubbles when returning to the Legal Gate.
  if (!state.safetyStarted) {
    state.completedCheckIds.clear();
    state.completedCount = 0;
    state.safetyStarted = true;
  }

  const usableContext = state.environmentStatus === "READY" ? state.context : null;
  state.checks = generateSafetyChecks(usableContext);

  renderContextSummaryForCurrentStatus();
  renderBubbles(state.checks);
  updateProgress();
  updateResultEnvironmentNotice();

  legalPanel.classList.add("hidden");
  locationPanel.classList.add("hidden");
  resultPanel.classList.remove("hidden");
  completePanel.classList.add("hidden");
  bubbleField.classList.remove("hidden");

  window.scrollTo({
    top: resultPanel.offsetTop - 20,
    behavior: "smooth",
  });
}

function returnToMap() {
  // Invalidate stale background requests.
  state.locationVersion += 1;
  stopBubbleAnimation();
  closeModal();

  resultPanel.classList.add("hidden");
  legalPanel.classList.add("hidden");
  locationPanel.classList.remove("hidden");
  completePanel.classList.add("hidden");
  bubbleField.classList.remove("hidden");

  state.legal = null;
  state.context = null;
  state.checks = [];
  state.completedCount = 0;
  state.completedCheckIds.clear();
  state.safetyStarted = false;
  state.activeCheckId = null;
  state.bubbleBodies = [];
  resetEnvironmentState();
  bubbleField.innerHTML = "";

  setTimeout(() => {
    map.invalidateSize();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 60);
}

function setLoading(isLoading, title = null, detail = null) {
  loadingOverlay.classList.toggle("hidden", !isLoading);

  if (title) {
    document.getElementById("loadingTitle").textContent = title;
  }
  if (detail) {
    document.getElementById("loadingDetail").textContent = detail;
  }
}

// ============================================================
// Legal / airspace pre-screening
// ============================================================

async function runLegalScreening(lat, lon) {
  // At this stage, only the GSI GeoJSON for
  // “Airspace Around Airports” is automatically pre-screened by location. DID, Emergency Operations Airspace, and important facilities
  // remain manual confirmation gates using official information.
  let airport;

  try {
    airport = await checkAirportAirspace(lat, lon);
  } catch (error) {
    console.warn("Airport airspace auto-check failed:", error);
    airport = {
      status: "UNKNOWN",
      matched: false,
      title: "Automatic check unavailable",
      detail:
        "The official GeoJSON for airspace around airports could not be retrieved. Please verify manually using DIPS2.0, GSI Maps, or other official sources.",
      technical: error.message || String(error),
    };
  }

  return {
    airport,
    did: {
      status: "VERIFY",
      title: "Densely Inhabited District (DID) reference layer",
      detail: "The 2020 Census DID layer is displayed around the selected location. Verify boundary areas and legal applicability using official sources such as DIPS2.0.",
    },
  };
}

function renderDidReferenceMap(lat, lon) {
  // Treat DID as a legal screening item, separate from FAA-based safety severity.
  // The GSI DID layer is shown only as a visual reference; no automatic legal determination is made.
  if (!state.didMap) {
    state.didMap = L.map("didReferenceMap", {
      zoomControl: true,
      attributionControl: true,
    }).setView([lat, lon], 15);

    L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "GSI Tiles",
    }).addTo(state.didMap);

    L.tileLayer("https://maps.gsi.go.jp/xyz/did2020/{z}/{x}/{y}.png", {
      minZoom: 8,
      maxZoom: 18,
      opacity: 0.48,
      attribution: "Densely Inhabited Districts (2020 Census, Statistics Bureau of Japan)",
    }).addTo(state.didMap);
  } else {
    state.didMap.setView([lat, lon], 15);
  }

  if (state.didMapMarker) {
    state.didMap.removeLayer(state.didMapMarker);
  }
  state.didMapMarker = L.marker([lat, lon]).addTo(state.didMap);

  setTimeout(() => state.didMap.invalidateSize(), 120);
}


async function checkAirportAirspace(lat, lon) {
  const z = CONFIG.gsiAirportAirspaceZoom;
  const { x, y } = latLonToTile(lat, lon, z);
  const url = `https://maps.gsi.go.jp/xyz/kokuarea/${z}/${x}/${y}.geojson`;

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    // Treat an empty 404 tile as no match; other errors are treated as failures.
    if (response.status === 404) {
      return {
        status: "CLEAR",
        matched: false,
        title: "No match in this automatic pre-screening",
        detail:
          "The selected location is not included in the retrieved GSI “Airspace Around Airports” data. Reconfirm boundary areas and the latest status using official information.",
      };
    }

    throw new Error(`GSI kokuarea returned HTTP ${response.status}`);
  }

  const geojson = await response.json();
  const matchedFeatures = (geojson.features || []).filter((feature) =>
    pointInGeoJSONFeature([lon, lat], feature)
  );

  if (matchedFeatures.length > 0) {
    return {
      status: "ATTENTION",
      matched: true,
      title: "The location may fall within airspace around an airport",
      detail:
        "The selected location falls within the GSI “Airspace Around Airports” GeoJSON. Before proceeding, verify the exact boundary and any required permissions or coordination using official information.",
      features: matchedFeatures.length,
    };
  }

  return {
    status: "CLEAR",
    matched: false,
    title: "No match in this automatic pre-screening",
    detail:
      "The selected location is not included in the retrieved GSI “Airspace Around Airports” data. However, this alone does not mean the flight is legally permitted.",
  };
}

function latLonToTile(lat, lon, zoom) {
  const n = 2 ** zoom;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

function pointInGeoJSONFeature(point, feature) {
  if (!feature || !feature.geometry) return false;
  const geometry = feature.geometry;

  if (geometry.type === "Polygon") {
    return pointInPolygonCoordinates(point, geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) =>
      pointInPolygonCoordinates(point, polygon)
    );
  }

  return false;
}

function pointInPolygonCoordinates(point, polygon) {
  if (!polygon || polygon.length === 0) return false;

  // Outer ring must contain point; holes must not contain point.
  if (!pointInRing(point, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i += 1) {
    if (pointInRing(point, polygon[i])) return false;
  }
  return true;
}

function pointInRing([x, y], ring) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

function renderLegalScreening(legal) {
  const airport = legal.airport;
  airportLegalStatus.className = `legal-status ${airport.status.toLowerCase()}`;
  airportLegalStatus.textContent =
    airport.status === "ATTENTION"
      ? "Attention Required"
      : airport.status === "CLEAR"
      ? "Reference: No Match"
      : "Manual Check";
  airportLegalText.textContent = airport.title;
  airportLegalDetail.textContent = airport.detail;
  updateLegalCostIndicator(
    "airportLegalCost",
    airport.status === "ATTENTION" ? "VERY_HIGH" : airport.status === "CLEAR" ? "LOW" : "HIGH",
    airport.status === "ATTENTION"
      ? "Potentially high time/effort if official permission, coordination, or a location change is required before flight."
      : airport.status === "CLEAR"
      ? "No match was found in this reference screening, so only routine official confirmation remains."
      : "Automatic screening was unavailable, so manual official confirmation may require additional time."
  );

  const did = legal.did;
  didLegalStatus.className = "legal-status unknown";
  didLegalStatus.textContent = "Official Check Required";
  didLegalText.textContent = did.title;
  didLegalDetail.textContent = did.detail;
  updateLegalCostIndicator(
    "didLegalCost",
    "VERY_HIGH",
    "Official confirmation is required. If permission, approval, or another procedure is needed, the lead time before flight can become substantial."
  );
  updateLegalCostIndicator(
    "emergencyLegalCost",
    "VERY_HIGH",
    "If the area is currently designated, proceeding with the planned flight may not be possible and replanning may be required."
  );
  updateLegalCostIndicator(
    "importantFacilityLegalCost",
    "VERY_HIGH",
    "If the location falls within a restricted area, consent, notification, or replanning may be required before flight."
  );

  for (const checkbox of legalChecklist.querySelectorAll('input[type="checkbox"]')) {
    checkbox.checked = false;
  }
  updateLegalProceedState();
}

function updateLegalCostIndicator(elementId, cost, reason) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const label = actionCostLabel(cost);
  el.className = `legal-cost-indicator effort-${actionCostClass(cost)}`;
  el.innerHTML = `<span class="legal-cost-circle" aria-hidden="true"></span><span><b>${escapeHtml(label)} effort / time cost</b><small>${escapeHtml(reason)}</small></span>`;
}

function allLegalAcknowledgementsChecked() {
  const checks = [...legalChecklist.querySelectorAll('input[type="checkbox"]')];
  return checks.length > 0 && checks.every((checkbox) => checkbox.checked);
}

function updateLegalProceedState() {
  const legalReady = allLegalAcknowledgementsChecked();
  proceedToSafetyButton.disabled = !legalReady;

  if (state.environmentStatus === "READY") {
    proceedToSafetyButton.textContent = "Proceed to Pre-flight Safety Checks";
  } else if (state.environmentStatus === "LOADING") {
    proceedToSafetyButton.textContent = "Proceed to Basic Checks (Environment Data Loading)";
  } else if (state.environmentStatus === "ERROR") {
    proceedToSafetyButton.textContent = "Proceed to Basic Pre-flight Checks";
  } else {
    proceedToSafetyButton.textContent = "Proceed to Pre-flight Safety Checks";
  }
}

function showLegalEnvironmentError(info) {
  // Show environment data errors clearly inside the Legal Gate while preserving legal acknowledgements.
  const existing = legalPanel.querySelector(".legal-inline-error");
  if (existing) existing.remove();

  const box = document.createElement("div");
  box.className = "legal-inline-error";
  box.innerHTML = `
    <strong>${escapeHtml(info.title)}</strong>
    <p>${escapeHtml(info.reason)}</p>
    <p><b>Action:</b>${escapeHtml(info.action)}</p>
    <details><summary>Technical details</summary><code>${escapeHtml(info.technical)}</code></details>
  `;
  proceedToSafetyButton.parentElement.before(box);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ============================================================
// Environment prefetch / retry / cache
// Prefetch OpenStreetMap independently from the Legal Gate
// ============================================================

function resetEnvironmentState() {
  state.context = null;
  state.environmentStatus = "IDLE";
  state.environmentError = null;
  state.environmentPromise = null;
  state.environmentAttempt = 0;
  updateEnvironmentStatusUI();
  updateResultEnvironmentNotice();
}

function getEnvironmentCacheKey(lat, lon, radius) {
  // Round coordinates to avoid repeated API calls for nearly identical locations.
  return `preflight-env:${lat.toFixed(5)},${lon.toFixed(5)},${radius}`;
}

function readEnvironmentCache(lat, lon, radius) {
  try {
    const raw = sessionStorage.getItem(getEnvironmentCacheKey(lat, lon, radius));
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (!cached || !cached.savedAt || !cached.context) return null;

    const age = Date.now() - cached.savedAt;
    if (age > CONFIG.environmentCacheTtlMs) {
      sessionStorage.removeItem(getEnvironmentCacheKey(lat, lon, radius));
      return null;
    }

    return cached.context;
  } catch (error) {
    console.warn("Environment cache read failed:", error);
    return null;
  }
}

function writeEnvironmentCache(lat, lon, radius, context) {
  try {
    sessionStorage.setItem(
      getEnvironmentCacheKey(lat, lon, radius),
      JSON.stringify({ savedAt: Date.now(), context })
    );
  } catch (error) {
    console.warn("Environment cache write failed:", error);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableEnvironmentError(error) {
  if (!error) return false;
  if (["TIMEOUT", "NETWORK", "OFFLINE"].includes(error.code)) return true;
  if (error.status === 429) return true;
  return Number.isInteger(error.status) && error.status >= 500 && error.status <= 599;
}

async function analyzeEnvironmentWithRetry(lat, lon, radius, version) {
  let lastError = null;

  for (let attempt = 1; attempt <= CONFIG.overpassMaxRetries; attempt += 1) {
    if (version !== state.locationVersion) {
      return null;
    }

    state.environmentAttempt = attempt;
    updateEnvironmentStatusUI();
    updateResultEnvironmentNotice();

    try {
      return await analyzeEnvironment(lat, lon, radius);
    } catch (error) {
      lastError = error;

      if (!isRetryableEnvironmentError(error) || attempt >= CONFIG.overpassMaxRetries) {
        throw error;
      }

      const delay =
        CONFIG.overpassRetryDelaysMs[attempt - 1] ??
        CONFIG.overpassRetryDelaysMs.at(-1) ??
        1500;
      await sleep(delay);
    }
  }

  throw lastError ?? new Error("Environment analysis failed");
}

function startEnvironmentPrefetch(lat, lon, version, { force = false } = {}) {
  if (!force) {
    const cached = readEnvironmentCache(lat, lon, CONFIG.analysisRadiusMeters);
    if (cached) {
      state.context = cached;
      state.environmentStatus = "READY";
      state.environmentError = null;
      state.environmentAttempt = 0;
      state.environmentPromise = Promise.resolve(cached);
      handleEnvironmentStateChange();
      return state.environmentPromise;
    }

    if (state.environmentStatus === "LOADING" && state.environmentPromise) {
      return state.environmentPromise;
    }
  }

  state.context = null;
  state.environmentStatus = "LOADING";
  state.environmentError = null;
  state.environmentAttempt = 1;
  handleEnvironmentStateChange();

  const promise = analyzeEnvironmentWithRetry(
    lat,
    lon,
    CONFIG.analysisRadiusMeters,
    version
  )
    .then((context) => {
      if (!context || version !== state.locationVersion) return null;

      state.context = context;
      state.environmentStatus = "READY";
      state.environmentError = null;
      writeEnvironmentCache(lat, lon, CONFIG.analysisRadiusMeters, context);
      handleEnvironmentStateChange();
      return context;
    })
    .catch((error) => {
      if (version !== state.locationVersion) return null;

      console.error("Environment prefetch failed:", error);
      state.context = null;
      state.environmentStatus = "ERROR";
      state.environmentError = error;
      handleEnvironmentStateChange();
      return null;
    });

  state.environmentPromise = promise;
  return promise;
}

function retryEnvironmentAnalysis() {
  if (state.selectedLat === null || state.selectedLon === null) return;

  startEnvironmentPrefetch(
    state.selectedLat,
    state.selectedLon,
    state.locationVersion,
    { force: true }
  );
}

function handleEnvironmentStateChange() {
  updateEnvironmentStatusUI();
  updateLegalProceedState();
  updateResultEnvironmentNotice();

  if (!resultPanel.classList.contains("hidden") && state.environmentStatus === "READY") {
    refreshSafetyChecksAfterEnvironmentUpdate();
    return;
  }

  // If the user has already reviewed all currently available COMMON checks,
  // keep the final completion gate pending until location data is READY.
  if (!resultPanel.classList.contains("hidden") && state.safetyStarted) {
    const remaining = state.checks.filter(
      (check) => !state.completedCheckIds.has(check.id)
    ).length;

    if (remaining === 0) {
      evaluateCompletionState();
    }
  }
}

function updateEnvironmentStatusUI() {
  if (!environmentPrefetchPanel) return;

  environmentPrefetchPanel.classList.remove(
    "status-idle",
    "status-loading",
    "status-ready",
    "status-error"
  );

  const status = state.environmentStatus;
  environmentPrefetchPanel.classList.add(`status-${status.toLowerCase()}`);

  if (status === "LOADING") {
    environmentPrefetchIcon.textContent = "↻";
    environmentPrefetchTitle.textContent = "Preparing environment data in the background";
    environmentPrefetchText.textContent =
      `Fetching OpenStreetMap data (${state.environmentAttempt}/${CONFIG.overpassMaxRetries}). You can continue reviewing the legal items.`;
    retryEnvironmentButton.classList.add("hidden");
    return;
  }

  if (status === "READY") {
    environmentPrefetchIcon.textContent = "✓";
    environmentPrefetchTitle.textContent = "Environment data is ready";
    environmentPrefetchText.textContent =
      "Once the legal checks are complete, you can proceed immediately to the safety checks, including location-specific items.";
    retryEnvironmentButton.classList.add("hidden");
    return;
  }

  if (status === "ERROR") {
    const info = explainAnalysisError(state.environmentError ?? new Error("Unknown error"));
    environmentPrefetchIcon.textContent = "!";
    environmentPrefetchTitle.textContent = "Environment data could not be retrieved";
    environmentPrefetchText.textContent =
      `${info.title}. Your legal-check acknowledgements are preserved. You can still proceed with the basic pre-flight checks.`;
    retryEnvironmentButton.classList.remove("hidden");
    return;
  }

  environmentPrefetchIcon.textContent = "…";
  environmentPrefetchTitle.textContent = "Environment data has not been fetched yet";
  environmentPrefetchText.textContent =
    "When location analysis starts, OpenStreetMap data will be fetched in parallel with legal screening.";
  retryEnvironmentButton.classList.add("hidden");
}

function updateResultEnvironmentNotice() {
  if (!resultEnvironmentNotice) return;

  resultEnvironmentNotice.classList.remove(
    "hidden",
    "notice-loading",
    "notice-ready",
    "notice-error"
  );
  resultRetryEnvironmentButton.classList.add("hidden");

  if (state.environmentStatus === "LOADING") {
    resultEnvironmentNotice.classList.add("notice-loading");
    resultEnvironmentTitle.textContent = "Fetching location-specific data in the background";
    resultEnvironmentText.textContent =
      "You can start with the basic checks. If data retrieval succeeds, bubbles for buildings, vegetation, and power infrastructure will be added automatically.";
    return;
  }

  if (state.environmentStatus === "ERROR") {
    const info = explainAnalysisError(state.environmentError ?? new Error("Unknown error"));
    resultEnvironmentNotice.classList.add("notice-error");
    resultEnvironmentTitle.textContent = "Location-specific check data is currently unavailable";
    resultEnvironmentText.textContent =
      `${info.title}. The basic checks remain available, and you do not need to repeat the legal screening.`;
    resultRetryEnvironmentButton.classList.remove("hidden");
    return;
  }

  if (state.environmentStatus === "READY") {
    resultEnvironmentNotice.classList.add("notice-ready");
    resultEnvironmentTitle.textContent = "Location-specific data has been applied";
    resultEnvironmentText.textContent =
      "Relevant location-specific checks have been added based on the surrounding OpenStreetMap features that were retrieved.";
    return;
  }

  resultEnvironmentNotice.classList.add("hidden");
}

function renderContextSummaryForCurrentStatus() {
  if (state.environmentStatus === "READY" && state.context) {
    renderContextSummary(state.context);
    return;
  }

  const statusText =
    state.environmentStatus === "LOADING"
      ? "Loading"
      : state.environmentStatus === "ERROR"
      ? "Unavailable"
      : "Not Analyzed";

  contextSummary.innerHTML = "";
  const cards = [
    ["▦", "Buildings", statusText],
    ["♧", "Trees / Forest", statusText],
    ["ϟ", "Power Infrastructure", statusText],
    ["◎", "Analysis Radius", `${CONFIG.analysisRadiusMeters} m radius`],
  ];

  for (const [iconText, titleText, valueText] of cards) {
    const el = document.createElement("div");
    el.className = "context-card";

    const icon = document.createElement("span");
    icon.className = "context-icon";
    icon.textContent = iconText;

    const title = document.createElement("strong");
    title.textContent = titleText;

    const value = document.createElement("span");
    value.textContent = valueText;

    el.append(icon, title, value);
    contextSummary.appendChild(el);
  }
}

function refreshSafetyChecksAfterEnvironmentUpdate() {
  if (!state.context) return;

  const previousById = new Map(
    state.checks.map((check) => [check.id, check])
  );
  const previousIds = new Set(previousById.keys());
  const nextChecks = generateSafetyChecks(state.context);

  // If newly retrieved location context changes the displayed outcome class, FAA reference, or effort/time cost,
  // require the item to be checked again using the updated context.
  for (const check of nextChecks) {
    const previous = previousById.get(check.id);
    if (
      previous &&
      (previous.consequenceClass !== check.consequenceClass ||
        previous.faaSeverity !== check.faaSeverity ||
        previous.actionCost !== check.actionCost) &&
      state.completedCheckIds.has(check.id)
    ) {
      state.completedCheckIds.delete(check.id);
    }
  }

  state.checks = nextChecks;
  renderContextSummary(state.context);

  const newlyAdded = state.checks.filter(
    (check) => !previousIds.has(check.id) && !state.completedCheckIds.has(check.id)
  );

  // Redraw incomplete bubbles because wind outcome class and effort/time cost can change with location context.
  renderBubbles(state.checks);
  updateProgress();
  updateResultEnvironmentNotice();

  if (newlyAdded.length > 0) {
    checkStatus.textContent =
      `Environment data was retrieved and ${newlyAdded.length} location-specific check(s) were added.`;
  }

  completePanel.classList.add("hidden");
  bubbleField.classList.remove("hidden");

  const remaining = state.checks.filter(
    (check) => !state.completedCheckIds.has(check.id)
  ).length;
  if (remaining === 0) {
    finishAllChecks();
  }
}

// ============================================================
// OpenStreetMap / Overpass analysis
// ============================================================

async function analyzeEnvironment(lat, lon, radius) {
  const query = `
[out:json][timeout:25];
(
  nwr["building"](around:${radius},${lat},${lon});
  nwr["natural"="tree"](around:${radius},${lat},${lon});
  nwr["natural"="wood"](around:${radius},${lat},${lon});
  nwr["landuse"="forest"](around:${radius},${lat},${lon});
  nwr["power"="line"](around:${radius},${lat},${lon});
  nwr["power"="minor_line"](around:${radius},${lat},${lon});
  nwr["power"="tower"](around:${radius},${lat},${lon});
  nwr["power"="pole"](around:${radius},${lat},${lon});
);
out tags;
`;

  const body = new URLSearchParams();
  body.set("data", query);

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    CONFIG.overpassTimeoutMs
  );

  let response;

  try {
    response = await fetch(CONFIG.overpassEndpoint, {
      method: "POST",
      body,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error(
        `Overpass request timed out after ${CONFIG.overpassTimeoutMs / 1000} seconds`
      );
      timeoutError.code = "TIMEOUT";
      throw timeoutError;
    }

    const networkError = new Error(error.message || "Network request failed");
    networkError.code = navigator.onLine ? "NETWORK" : "OFFLINE";
    throw networkError;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const httpError = new Error(
      `Overpass API returned HTTP ${response.status} ${response.statusText}`
    );
    httpError.code = "HTTP";
    httpError.status = response.status;
    throw httpError;
  }

  try {
    const data = await response.json();
    return classifyEnvironment(data.elements ?? []);
  } catch (error) {
    const parseError = new Error("Overpass API response could not be parsed as JSON");
    parseError.code = "PARSE";
    throw parseError;
  }
}

function explainAnalysisError(error) {
  const status = error.status;

  if (error.code === "OFFLINE") {
    return {
      code: "OFFLINE",
      title: "No internet connection",
      reason:
        "OpenStreetMap data is required for surrounding-environment analysis, but no network connection was detected.",
      action:
        "Check your Wi-Fi or network connection, then try analyzing the location again.",
      technical: error.message,
    };
  }

  if (error.code === "TIMEOUT" || status === 504) {
    return {
      code: status === 504 ? "HTTP 504" : "TIMEOUT",
      title: "The surrounding-data search took too long",
      reason:
        "The analysis did not finish within the time limit because the selected area may contain many mapped features or the Overpass API may be busy.",
      action:
        "Wait briefly and try again. If the problem continues, slightly change the location or reduce the analysis radius.",
      technical: error.message,
    };
  }

  if (status === 429) {
    return {
      code: "HTTP 429",
      title: "Too many requests in a short period",
      reason:
        "The OpenStreetMap query service has temporarily rate-limited requests.",
      action:
        "Wait 30 seconds to a few minutes before retrying, and avoid repeatedly pressing the analysis button.",
      technical: error.message,
    };
  }

  if (status >= 500 && status <= 599) {
    return {
      code: `HTTP ${status}`,
      title: "The map data service encountered a temporary error",
      reason:
        "The Overpass API server used for analysis is temporarily unable to process the request. This does not necessarily mean the selected location or your operation was incorrect.",
      action:
        "Wait briefly and try again.",
      technical: error.message,
    };
  }

  if (status === 400) {
    return {
      code: "HTTP 400",
      title: "There is a problem with the surrounding-data query",
      reason:
        "The map data service could not process the query sent by the app. This is primarily an application-side query issue.",
      action:
        "If this repeatedly occurs at the same location, review the technical details for troubleshooting.",
      technical: error.message,
    };
  }

  if (error.code === "PARSE") {
    return {
      code: "DATA",
      title: "The retrieved map data could not be read",
      reason:
        "The map data service returned an unexpected response format, so the app could not interpret it as analysis data.",
      action:
        "Wait briefly and try again. If the problem persists, the application logic may need to be checked.",
      technical: error.message,
    };
  }

  if (error.code === "NETWORK" || error instanceof TypeError) {
    return {
      code: "NETWORK",
      title: "Could not connect to the map data service",
      reason:
        "Possible causes include an internet connection issue, browser network restrictions, or a service connection failure.",
      action:
        "Check your network connection, reload the page, and try again.",
      technical: error.message,
    };
  }

  return {
    code: "UNKNOWN",
    title: "An unexpected error occurred during analysis",
    reason:
      "A problem occurred that was not one of the known network or timeout errors.",
    action:
      "Reload the page and try again. If the problem persists, review the technical details.",
    technical: error.message || String(error),
  };
}

function showAnalysisError(info) {
  analysisErrorCode.textContent = info.code;
  analysisErrorTitle.textContent = info.title;
  analysisErrorReason.textContent = info.reason;
  analysisErrorAction.textContent = info.action;
  analysisErrorTechnical.textContent = info.technical;
  analysisErrorPanel.classList.remove("hidden");
}

function clearAnalysisError() {
  analysisErrorPanel.classList.add("hidden");
  analysisErrorCode.textContent = "";
  analysisErrorTitle.textContent = "";
  analysisErrorReason.textContent = "";
  analysisErrorAction.textContent = "";
  analysisErrorTechnical.textContent = "";
}

function classifyEnvironment(elements) {
  const unique = {
    building: new Set(),
    tree: new Set(),
    forest: new Set(),
    powerLine: new Set(),
    powerSupport: new Set(),
  };

  for (const element of elements) {
    const tags = element.tags ?? {};
    const key = `${element.type}:${element.id}`;

    if (tags.building) {
      unique.building.add(key);
    }

    if (tags.natural === "tree") {
      unique.tree.add(key);
    }

    if (tags.natural === "wood" || tags.landuse === "forest") {
      unique.forest.add(key);
    }

    if (tags.power === "line" || tags.power === "minor_line") {
      unique.powerLine.add(key);
    }

    if (tags.power === "tower" || tags.power === "pole") {
      unique.powerSupport.add(key);
    }
  }

  const context = {
    buildingCount: unique.building.size,
    treeCount: unique.tree.size,
    forestCount: unique.forest.size,
    powerLineCount: unique.powerLine.size,
    powerSupportCount: unique.powerSupport.size,
  };

  context.hasBuildings = context.buildingCount > 0;
  context.hasVegetation = context.treeCount > 0 || context.forestCount > 0;
  context.hasPowerInfrastructure =
    context.powerLineCount > 0 || context.powerSupportCount > 0;
  context.hasMappedObstacles =
    context.hasBuildings ||
    context.hasVegetation ||
    context.hasPowerInfrastructure;

  return context;
}

// ============================================================
// Rule engine: Location context -> Actionable pre-flight checks
// ============================================================

function generateSafetyChecks(context = null) {
  // 1. Basic checks shown at every location
  // These COMMON CHECKS remain available before OSM loads or if retrieval fails.
  const checks = COMMON_CHECKS.map((check) => ({ ...check }));

  // Weather & Wind remains a GENERAL outcome class by default. Location context can increase the
  // effort/time cost. If mapped buildings or power infrastructure are nearby, this research
  // prototype displays an ACCIDENT-level consequence because drift could plausibly lead to
  // damage to third-party artificial property, which is an MLIT accident criterion.
  // This is a prototype mapping, not an official legal determination.
  const windCheck = checks.find((check) => check.id === "wind-condition");
  if (windCheck && context?.hasMappedObstacles) {
    windCheck.faaSeverity = "HAZARDOUS";
    windCheck.actionCost = "HIGH";
    windCheck.effortReason = "Because mapped obstacles are nearby, unstable weather or wind may require a larger route adjustment, a different takeoff point, or waiting for better conditions before flight.";
    windCheck.scenario =
      "If poor weather or wind causes the drone to drift or reduces visibility, it may contact nearby detected buildings, vegetation, or power infrastructure, potentially leading to loss of control or a crash.";
  }
  if (windCheck && (context?.hasBuildings || context?.hasPowerInfrastructure)) {
    windCheck.consequenceClass = "ACCIDENT";
    windCheck.classificationReason = "Mapped buildings or power infrastructure are nearby. In this prototype, a weather- or wind-related contact scenario is therefore treated as Accident-level because damage to third-party artificial property is included in the MLIT accident criteria. The FAA Hazardous category remains a supporting severity reference, not the color category itself.";
    windCheck.mlitReference = "Accident reference: damage to third-party artificial property if contact occurs.";
  }

  // 2. Additional checks generated from the selected location context
  if (context?.hasBuildings) {
    checks.push({
      id: "building-clearance",
      scope: "LOCATION",
      category: "OBSTACLE",
      className: "obstacle",
      title: "Clearance from Buildings",
      faaSeverity: "MAJOR",
      consequenceClass: "ACCIDENT",
      classificationReason: "A building is third-party artificial property in the scenario used by this prototype. If contact causes damage, even relatively minor damage to third-party artificial property is included in the MLIT accident reporting criteria. FAA Major is retained as a supporting severity reference.",
      mlitReference: "Accident reference: damage to third-party artificial property.",
      actionCost: "MEDIUM",
      effortReason: "This may require an on-site clearance check and a moderate route or takeoff/landing adjustment before flight.",
      scenario: "Contact with a building may damage the drone, make continued flight difficult, or lead to a crash.",
      summary: `Mapped building data exists within ${CONFIG.analysisRadiusMeters} m of the selected location.`,
      why:
        "Wind or control deviations may move the drone away from its intended position and cause contact with a building.",
      action:
        "Check on site whether the flight route and takeoff/landing area are too close to buildings.",
      safetyTip:
        "Plan a route with enough clearance from buildings so that minor drift does not result in contact.",
    });
  }

  if (context?.hasVegetation) {
    checks.push({
      id: "vegetation-clearance",
      scope: "LOCATION",
      category: "OBSTACLE",
      className: "environment",
      title: "Clearance from Trees & Branches",
      faaSeverity: "MAJOR",
      consequenceClass: "GENERAL",
      classificationReason: "Tree or branch contact can cause a crash, but the check is not mapped directly to a single MLIT accident or serious-incident criterion unless the event also produces a defined consequence such as injury or damage to third-party artificial property. It is therefore shown as a General safety check in this prototype.",
      mlitReference: "General safety check: classification would depend on the actual resulting injury, property damage, or other reportable event.",
      actionCost: "MEDIUM",
      effortReason: "This usually requires an on-site check and may require a moderate route adjustment to maintain clearance.",
      scenario: "Contact with branches or the tree canopy may damage the propellers or aircraft and lead to a crash.",
      summary: `Mapped trees, forest, or wooded areas exist within ${CONFIG.analysisRadiusMeters} m of the selected location.`,
      why:
        "Thin branches can be hard to see and may move in the wind, creating a risk of contact with the propellers or aircraft.",
      action:
        "Check the site for overhanging branches along the flight route, not just the overall height of the trees.",
      safetyTip:
        "Keep sufficient clearance from trees and branches, accounting for possible branch movement in the wind.",
    });
  }

  if (context?.hasPowerInfrastructure) {
    checks.push({
      id: "power-clearance",
      scope: "LOCATION",
      category: "OBSTACLE",
      className: "obstacle",
      title: "Power Lines & Electrical Infrastructure",
      faaSeverity: "HAZARDOUS",
      consequenceClass: "ACCIDENT",
      classificationReason: "Contact with power infrastructure can damage third-party artificial property and may also lead to severe secondary consequences. Damage to third-party artificial property is included in the MLIT accident criteria. FAA Hazardous is retained as a supporting severity reference.",
      mlitReference: "Accident reference: damage to third-party artificial property; additional consequences may increase severity.",
      actionCost: "HIGH",
      effortReason: "Power infrastructure may require careful on-site verification and a substantial route or takeoff-location change before the flight can proceed.",
      scenario: "Contact with a power line may cause loss of control, a crash, and potentially serious property damage or injury.",
      summary: `Mapped power lines, poles, towers, or related infrastructure exist within ${CONFIG.analysisRadiusMeters} m of the selected location.`,
      why:
        "Power lines are thin and may be difficult to notice, especially when relying only on the drone camera view.",
      action:
        "Visually inspect the flight route on site for power lines, cables, or wires.",
      safetyTip:
        "Avoid flying close to power lines or electrical infrastructure and maintain sufficient clearance.",
    });
  }

  // Always show an on-site verification item because public maps may omit hazards.
  checks.push({
    id: "on-site-verification",
    scope: "COMMON",
    category: "GENERAL",
    className: "general",
    title: "On-site Surroundings Check",
    faaSeverity: "MAJOR",
    consequenceClass: "GENERAL",
    classificationReason: "This is a broad preventive check rather than a single failure condition or reportable event, so it is not assigned directly to the MLIT Accident or Serious Incident outcome classes.",
    mlitReference: "General safety check: no single direct MLIT reportable-event category assigned.",
    actionCost: "LOW",
    effortReason: "A final visual scan of the actual flight area is normally quick and should be completed immediately before takeoff.",
    scenario: "Missing unmapped obstacles or third parties may lead to contact, a crash, or harm to the surrounding area.",
    summary:
      "Perform a final on-site check for obstacles, people, vehicles, or other hazards that may not appear on the map.",
    why:
      "Maps may not include thin wires, newly built structures, temporary objects, or moving people and vehicles.",
    action:
      "Before takeoff, visually inspect the actual flight area for unmapped obstacles and third parties.",
    safetyTip:
      "Do not assume the area is safe based only on map data. Confirm the actual conditions before flying.",
  });

  return checks;
}

// ============================================================
// Context summary
// ============================================================

function renderContextSummary(context) {
  const cards = [
    {
      icon: "▦",
      title: "Buildings",
      value: context.hasBuildings ? "Detected in map data" : "Not detected",
    },
    {
      icon: "♧",
      title: "Trees / Forest",
      value: context.hasVegetation ? "Detected in map data" : "Not detected",
    },
    {
      icon: "ϟ",
      title: "Power Infrastructure",
      value: context.hasPowerInfrastructure ? "Detected in map data" : "Not detected",
    },
    {
      icon: "◎",
      title: "Analysis Radius",
      value: `${CONFIG.analysisRadiusMeters} m radius`,
    },
  ];

  contextSummary.innerHTML = "";

  for (const card of cards) {
    const el = document.createElement("div");
    el.className = "context-card";

    const icon = document.createElement("span");
    icon.className = "context-icon";
    icon.textContent = card.icon;

    const title = document.createElement("strong");
    title.textContent = card.title;

    const value = document.createElement("span");
    value.textContent = card.value;

    el.append(icon, title, value);
    contextSummary.appendChild(el);
  }
}

// ============================================================
// Bubble UI
// ============================================================

function renderBubbles(checks) {
  stopBubbleAnimation();
  bubbleField.innerHTML = "";
  state.bubbleBodies = [];

  const visibleChecks = checks.filter(
    (check) => !state.completedCheckIds.has(check.id)
  );
  state.completedCount = checks.filter((check) =>
    state.completedCheckIds.has(check.id)
  ).length;

  if (state.environmentStatus === "LOADING") {
    checkStatus.textContent = `${checks.length} basic check(s) are displayed. Location-specific items may be added when environment data becomes available.`;
  } else if (state.environmentStatus === "ERROR") {
    checkStatus.textContent = `${checks.length} basic check(s) are displayed. Location-specific items will be added after environment data is retrieved.`;
  } else {
    checkStatus.textContent = `${checks.length} check item(s) were generated. Bubble color represents the potential outcome class and bubble size represents the relative effort / time cost before flight. To avoid duplicating the legend, each bubble shows only its COMMON / LOCATION source label and check-item title.`;
  }

  if (visibleChecks.length === 0) {
    requestAnimationFrame(() => evaluateCompletionState());
    return;
  }

  requestAnimationFrame(() => {
    const rect = bubbleField.getBoundingClientRect();

    visibleChecks.forEach((check, index) => {
      const diameter = getActionCostBubbleDiameter(check.actionCost);
      const radius = diameter / 2;
      const bubble = document.createElement("button");
      bubble.type = "button";
      bubble.className = `bubble ${check.className} scope-${check.scope.toLowerCase()} outcome-${outcomeClassClass(check.consequenceClass)} effort-${actionCostClass(check.actionCost)}`;
      bubble.dataset.checkId = check.id;
      bubble.setAttribute("aria-label", `Check ${check.title}. ${scopeLabel(check.scope)}. Potential outcome class: ${outcomeClassLabel(check.consequenceClass)}. Action effort and time cost: ${actionCostLabel(check.actionCost)}`);
      bubble.style.width = `${diameter}px`;
      bubble.style.height = `${diameter}px`;

      const category = document.createElement("span");
      category.className = "bubble-category";
      category.textContent = check.scope;

      const title = document.createElement("span");
      title.className = "bubble-title";
      title.textContent = check.title;

      bubble.append(category, title);
      bubble.addEventListener("click", () => openCheckModal(check.id));
      bubbleField.appendChild(bubble);

      const position = findInitialBubblePosition(
        state.bubbleBodies,
        rect.width,
        rect.height,
        radius,
        index
      );

      const angle = Math.random() * Math.PI * 2;
      const speed = CONFIG.bubbleSpeed * (0.72 + Math.random() * 0.55);

      state.bubbleBodies.push({
        id: check.id,
        element: bubble,
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius,
        diameter,
      });
    });

    updateBubbleTransforms();
    startBubbleAnimation();
  });
}

function getActionCostBubbleDiameter(actionCost) {
  const base = CONFIG.actionCostDiameters[actionCost] ?? CONFIG.bubbleDiameter;
  return window.innerWidth <= 480 ? Math.round(base * 0.82) : base;
}

function actionCostClass(actionCost) {
  return String(actionCost || "MEDIUM").toLowerCase().replaceAll("_", "-");
}

function actionCostLabel(actionCost) {
  const labels = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    VERY_HIGH: "Very High",
  };
  return labels[actionCost] ?? "Medium";
}

function outcomeClassClass(value) {
  return String(value || "GENERAL").toLowerCase().replaceAll("_", "-");
}

function outcomeClassLabel(value) {
  const labels = {
    GENERAL: "General",
    SERIOUS_INCIDENT: "Serious Incident-level",
    ACCIDENT: "Accident-level",
  };
  return labels[value] ?? "General";
}

function faaSeverityLabel(severity) {
  const labels = {
    NO_SAFETY_EFFECT: "No Safety Effect",
    MINOR: "Minor",
    MAJOR: "Major",
    HAZARDOUS: "Hazardous",
    CATASTROPHIC: "Catastrophic",
  };
  return labels[severity] ?? "Major";
}

function scopeLabel(scope) {
  return scope === "LOCATION"
    ? "Location-specific check"
    : "Basic check required at every location";
}

function findInitialBubblePosition(bodies, width, height, radius, index) {
  const margin = radius + 12;
  const maxAttempts = 120;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const x = margin + Math.random() * Math.max(1, width - margin * 2);
    const y = margin + Math.random() * Math.max(1, height - margin * 2);

    const overlaps = bodies.some((body) => {
      const dx = body.x - x;
      const dy = body.y - y;
      const minDistance = body.radius + radius + 8;
      return dx * dx + dy * dy < minDistance * minDistance;
    });

    if (!overlaps) {
      return { x, y };
    }
  }

  // Fallback: grid-like placement if random placement cannot find space.
  const columns = Math.max(1, Math.floor(width / (radius * 2 + 12)));
  const col = index % columns;
  const row = Math.floor(index / columns);

  return {
    x: Math.min(width - margin, margin + col * (radius * 2 + 12)),
    y: Math.min(height - margin, margin + row * (radius * 2 + 12)),
  };
}

function startBubbleAnimation() {
  let previous = performance.now();

  const frame = (now) => {
    const delta = Math.min(34, now - previous);
    previous = now;

    updateBubblePhysics(delta);
    updateBubbleTransforms();

    state.animationFrameId = requestAnimationFrame(frame);
  };

  state.animationFrameId = requestAnimationFrame(frame);
}

function stopBubbleAnimation() {
  if (state.animationFrameId !== null) {
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }
}

function updateBubblePhysics(deltaMs) {
  const width = bubbleField.clientWidth;
  const height = bubbleField.clientHeight;

  for (const body of state.bubbleBodies) {
    body.x += body.vx * deltaMs;
    body.y += body.vy * deltaMs;

    if (body.x - body.radius < 0) {
      body.x = body.radius;
      body.vx = Math.abs(body.vx);
    } else if (body.x + body.radius > width) {
      body.x = width - body.radius;
      body.vx = -Math.abs(body.vx);
    }

    if (body.y - body.radius < 0) {
      body.y = body.radius;
      body.vy = Math.abs(body.vy);
    } else if (body.y + body.radius > height) {
      body.y = height - body.radius;
      body.vy = -Math.abs(body.vy);
    }
  }

  resolveBubbleCollisions();
}

function resolveBubbleCollisions() {
  const bodies = state.bubbleBodies;

  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const a = bodies[i];
      const b = bodies[j];

      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let distance = Math.hypot(dx, dy);

      if (distance === 0) {
        dx = 0.01;
        dy = 0;
        distance = 0.01;
      }

      const minimumDistance =
        a.radius + b.radius + CONFIG.bubbleCollisionPadding;

      if (distance >= minimumDistance) {
        continue;
      }

      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = minimumDistance - distance;

      // Separate overlapping circles.
      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;

      // Equal-mass elastic collision along the collision normal.
      const relativeVx = b.vx - a.vx;
      const relativeVy = b.vy - a.vy;
      const velocityAlongNormal = relativeVx * nx + relativeVy * ny;

      if (velocityAlongNormal >= 0) {
        continue;
      }

      const impulse = -velocityAlongNormal;
      a.vx -= impulse * nx;
      a.vy -= impulse * ny;
      b.vx += impulse * nx;
      b.vy += impulse * ny;
    }
  }
}

function updateBubbleTransforms() {
  for (const body of state.bubbleBodies) {
    body.element.style.left = `${body.x - body.radius}px`;
    body.element.style.top = `${body.y - body.radius}px`;
  }
}

// ============================================================
// Modal / completion
// ============================================================

function openCheckModal(checkId) {
  const check = state.checks.find((item) => item.id === checkId);
  if (!check) {
    return;
  }

  state.activeCheckId = checkId;
  modalCategory.textContent = `${check.scope} · ${check.category}`;
  modalCategory.className = `modal-category modal-category-${check.scope.toLowerCase()}`;
  modalTitle.textContent = check.title;
  modalSummary.textContent = check.summary;
  modalOutcomeClass.textContent = outcomeClassLabel(check.consequenceClass);
  modalOutcomeClass.className = `outcome-chip outcome-${outcomeClassClass(check.consequenceClass)}`;
  modalFaaSeverity.textContent = faaSeverityLabel(check.faaSeverity);
  modalMlitReference.textContent = check.mlitReference || "No direct MLIT outcome reference assigned.";
  modalClassificationReason.textContent = check.classificationReason || "This is a research-prototype classification, not an official event determination.";
  modalActionCost.textContent = actionCostLabel(check.actionCost);
  modalActionCost.className = `effort-chip effort-${actionCostClass(check.actionCost)}`;
  modalEffortReason.textContent = check.effortReason || "This is a relative estimate of the effort and time needed before the flight can proceed.";
  modalScenario.textContent = check.scenario || "No accident scenario has been defined.";
  modalWhy.textContent = check.why;
  modalAction.textContent = check.action;
  modalSafetyTip.textContent = check.safetyTip;

  checkModal.classList.remove("hidden");
  confirmCheckButton.focus();
}

function closeModal() {
  checkModal.classList.add("hidden");
  state.activeCheckId = null;
}

modalCloseButton.addEventListener("click", closeModal);

checkModal.addEventListener("click", (event) => {
  if (event.target.dataset.closeModal === "true") {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !checkModal.classList.contains("hidden")) {
    closeModal();
  }
});

confirmCheckButton.addEventListener("click", () => {
  if (!state.activeCheckId) {
    return;
  }

  completeCheck(state.activeCheckId);
  closeModal();
});

function completeCheck(checkId) {
  const body = state.bubbleBodies.find((item) => item.id === checkId);
  if (!body) {
    return;
  }

  body.element.classList.add("popping");
  state.completedCheckIds.add(checkId);
  state.completedCount = state.checks.filter((check) =>
    state.completedCheckIds.has(check.id)
  ).length;
  updateProgress();

  setTimeout(() => {
    body.element.remove();
    state.bubbleBodies = state.bubbleBodies.filter((item) => item.id !== checkId);

    if (state.completedCount >= state.checks.length) {
      evaluateCompletionState();
    }
  }, 260);
}

function updateProgress() {
  const total = state.checks.length;
  const completed = state.checks.filter((check) =>
    state.completedCheckIds.has(check.id)
  ).length;
  state.completedCount = completed;
  const percent = total === 0 ? 0 : (completed / total) * 100;

  progressText.textContent = `${completed} / ${total}`;
  progressBar.style.width = `${percent}%`;
}

function evaluateCompletionState() {
  const remaining = state.checks.filter(
    (check) => !state.completedCheckIds.has(check.id)
  ).length;

  if (remaining > 0) {
    completePanel.classList.add("hidden");
    bubbleField.classList.remove("hidden");
    return;
  }

  // Final completion is intentionally blocked until location-specific
  // environment data has finished loading successfully.
  if (state.environmentStatus !== "READY") {
    showPendingCompletion();
    return;
  }

  finishAllChecks();
}

function showPendingCompletion() {
  stopBubbleAnimation();
  bubbleField.classList.add("hidden");
  completePanel.classList.remove("hidden");
  restartButton.classList.add("hidden");

  if (completeMark) {
    completeMark.textContent = state.environmentStatus === "ERROR" ? "!" : "…";
  }

  if (state.environmentStatus === "ERROR") {
    completeTitle.textContent = "FINAL CHECK PENDING";
    completeText.textContent =
      "All currently available basic checks have been reviewed, but the location-specific environment data could not be retrieved. Final completion is locked until the location data is successfully loaded. Your completed checks are preserved; retrying will not make you repeat them.";
    checkStatus.textContent =
      "Basic checks reviewed. Final completion is waiting for location-specific data.";
    completeRetryEnvironmentButton?.classList.remove("hidden");
    return;
  }

  completeTitle.textContent = "WAITING FOR LOCATION CHECKS";
  completeText.textContent =
    "All currently available basic checks have been reviewed. Location-specific environment data is still loading. Final completion will unlock only after the location data is ready and any added LOCATION checks have also been reviewed.";
  checkStatus.textContent =
    "Basic checks reviewed. Waiting for location-specific data before final completion.";
  completeRetryEnvironmentButton?.classList.add("hidden");
}

function finishAllChecks() {
  // Safety guard: never show the final COMPLETE state before location data is ready.
  if (state.environmentStatus !== "READY") {
    showPendingCompletion();
    return;
  }

  stopBubbleAnimation();
  bubbleField.classList.add("hidden");
  completePanel.classList.remove("hidden");
  restartButton.classList.remove("hidden");
  completeRetryEnvironmentButton?.classList.add("hidden");

  if (completeMark) {
    completeMark.textContent = "✓";
  }

  completeTitle.textContent = "PRE-FLIGHT CHECK COMPLETE";
  completeText.textContent =
    "The basic and location-specific checks on this screen are complete. This system does not guarantee safety or legal flight eligibility.";
  checkStatus.textContent = "All available basic and location-specific check items have been reviewed.";
}

// ============================================================
// Resize handling
// ============================================================

window.addEventListener("resize", () => {
  if (resultPanel.classList.contains("hidden")) {
    return;
  }

  const width = bubbleField.clientWidth;
  const height = bubbleField.clientHeight;

  for (const body of state.bubbleBodies) {
    body.x = Math.min(Math.max(body.radius, body.x), width - body.radius);
    body.y = Math.min(Math.max(body.radius, body.y), height - body.radius);
  }

  updateBubbleTransforms();
});
