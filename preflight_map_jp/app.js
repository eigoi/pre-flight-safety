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
    category: "天候",
    className: "wind",
    title: "天候・風",
    faaSeverity: "MAJOR",
    consequenceClass: "GENERAL",
    classificationReason: "天候や風だけでは国土交通省の特定の事故・重大インシデント基準に直接対応しないため、通常は一般的な安全確認として扱います。周辺に建物や電力設備がある場合は、風による流されから第三者物件の損壊につながる可能性を考慮し、表示区分を引き上げることがあります。",
    mlitReference: "通常時：国土交通省の事故・重大インシデント区分には直接割り当てません。",
    actionCost: "MEDIUM",
    effortReason: "天候や風の確認自体は短時間でできますが、視界不良、警報、不安定な風、急な天候変化がある場合は、待機、ルート変更、飛行延期が必要になることがあります。",
    scenario: "悪天候、視界不良、強風、突風によりドローンの制御が難しくなり、障害物への接触リスクが高まる可能性があります。",
    summary: "飛行前に現在の天候、視界、風の状態、気象警報・注意報等を確認してください。",
    why:
      "視界不良、強風、突風、急な天候変化により、安全な操作や予定位置の維持が難しくなることがあります。",
    action:
      "離陸前に、現在の天候、視界、現地の風の強さ・風向、関連する警報・注意報を確認してください。",
    safetyTip:
      "天候が不安定、または視界が悪い場合は、飛行を延期するか計画を見直してください。風で機体が流される可能性を考え、建物・樹木・電線などから十分な余裕を確保してください。",
  },
  {
    id: "aircraft-condition",
    scope: "COMMON",
    category: "機体",
    className: "aircraft",
    title: "機体・プロペラ",
    faaSeverity: "HAZARDOUS",
    consequenceClass: "SERIOUS_INCIDENT",
    classificationReason: "機体や推進系の不具合は制御不能につながる可能性があります。国土交通省では機体不具合による制御不能を重大インシデントの対象としており、FAAのHazardousは想定結果の重大度を考えるための補助的な参考として使用しています。",
    mlitReference: "重大インシデント参考：機体不具合による制御不能。",
    actionCost: "LOW",
    effortReason: "基本的な目視・触診点検は短時間で行えます。異常が見つかった場合は、解決するまで飛行を延期する必要があります。",
    scenario: "機体やプロペラの異常により制御性能が低下し、墜落につながる可能性があります。",
    summary: "飛行前に機体とプロペラに異常がないか確認してください。",
    why:
      "プロペラや機体部品に損傷があると、正常に飛行できない可能性があります。",
    action:
      "プロペラの欠け・ひび割れ、機体やアームの損傷・変形・緩みがないか確認してください。",
    safetyTip:
      "異常が見つかった場合は、原因を確認して解決するまで飛行しないでください。",
  },
  {
    id: "communication-positioning",
    scope: "COMMON",
    category: "通信・測位",
    className: "system",
    title: "通信・測位",
    faaSeverity: "HAZARDOUS",
    consequenceClass: "SERIOUS_INCIDENT",
    classificationReason: "通信やシステムの不具合は制御不能につながる可能性があります。国土交通省は、無人航空機と操縦装置間の一定の通信障害を、制御不能につながる不具合の例として示しています。",
    mlitReference: "重大インシデント参考：一定の通信障害を含む機体不具合による制御不能。",
    actionCost: "LOW",
    effortReason: "接続や測位状態は通常、離陸前に短時間で確認できます。警告がある場合は原因確認や復旧作業が必要です。",
    scenario: "通信や測位の異常により、意図した操作や安定した位置保持ができず、制御が難しくなる可能性があります。",
    summary: "飛行前に送信機との接続と測位状態を確認してください。",
    why:
      "通信や測位が不安定だと、正しく操縦したり位置を維持したりすることが難しくなる場合があります。",
    action:
      "送信機との接続を確認し、通信状態やGNSSなどの測位情報に警告・異常がないか確認してください。",
    safetyTip:
      "警告や異常が表示されている場合は原因を確認し、正常な状態に戻ってから飛行してください。",
  },
  {
    id: "people-traffic-aircraft",
    scope: "COMMON",
    category: "第三者",
    className: "general",
    title: "人・車両・他の航空機",
    faaSeverity: "HAZARDOUS",
    consequenceClass: "ACCIDENT",
    classificationReason: "人、車両、他の航空機との衝突は、負傷、第三者物件の損壊、航空機との接触につながる可能性があります。これらは国土交通省の事故基準に該当し得る結果であり、FAA Hazardousは想定結果の重大度を考える補助的な参考として使用しています。",
    mlitReference: "事故参考：実際の結果に応じて、重傷・死亡、第三者の人工物の損壊、航空機との衝突・接触など。",
    actionCost: "MEDIUM",
    effortReason: "周囲の確認自体は比較的簡単ですが、人や車両、他の航空機が存在する、または進入する可能性がある場合は、待機、場所変更、飛行計画の見直しが必要になることがあります。",
    scenario: "人、車両、他の航空機が予期せず飛行範囲に入ると、衝突の危険や即時の飛行中止が必要になる可能性があります。",
    summary: "飛行予定範囲に人、車両、他の航空機がいないか、また進入する可能性がないか確認してください。",
    why:
      "人、車両、他の航空機は予期せず飛行範囲に入る可能性があるため、計画時には問題がなかったルートでも離陸時には安全でない場合があります。",
    action:
      "離陸・着陸・緊急時の経路を含め、飛行予定範囲に人、車両、他の航空機が存在する、または進入する可能性がないか確認してください。",
    safetyTip:
      "人や交通から離れたルートを取り、周囲を継続的に確認し、状況が変化した場合は飛行を中止または延期してください。",
  },
  {
    id: "route-emergency",
    scope: "COMMON",
    category: "飛行ルート",
    className: "route",
    title: "飛行ルート・緊急時対応",
    faaSeverity: "MAJOR",
    consequenceClass: "GENERAL",
    classificationReason: "飛行ルートや緊急時の計画は重要な予防的確認ですが、この確認項目自体を国土交通省の特定の事故・重大インシデント基準には直接割り当てていません。",
    mlitReference: "一般安全確認：国土交通省の単一の報告対象区分には直接割り当てません。",
    actionCost: "MEDIUM",
    effortReason: "飛行ルートや緊急着陸場所の確認には、追加の計画や軽微なルート変更が必要になる場合があります。",
    scenario: "異常時に安全に進路変更や着陸ができないと、機体損傷や周囲への被害につながる可能性があります。",
    summary: "予定している飛行ルートと、問題が起きた場合の対応を確認してください。",
    why:
      "飛行中に問題が起きた際、安全に飛行を中止・着陸できないと事故につながる可能性があります。",
    action:
      "予定飛行ルートを確認し、緊急時に安全に着陸できる場所を確認してください。",
    safetyTip:
      "離陸前に、人・建物・その他の危険要因を避けながら、どこでどのように安全に飛行を終了できるか決めておいてください。",
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
    attribution: "国土地理院タイル",
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
    attribution: "人口集中地区（令和2年国勢調査・総務省統計局）",
  }
);

L.control.layers(
  {},
  {
    "人口集中地区（参考表示）": didLayer,
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
    "法規・空域条件を確認中",
    "同時に周辺環境データをバックグラウンドで準備しています…"
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
      title: "法規・空域の事前確認を完了できませんでした",
      reason:
        "空港等の周辺空域を事前確認するための公式地理データを取得できませんでした。",
      action:
        "ネットワーク接続を確認して再試行してください。自動確認が利用できない場合は、DIPS2.0や地理院地図などの公式情報で手動確認してください。",
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
      title: "自動確認を利用できません",
      detail:
        "空港等の周辺空域の公式GeoJSONを取得できませんでした。DIPS2.0、地理院地図などの公式情報で手動確認してください。",
      technical: error.message || String(error),
    };
  }

  return {
    airport,
    did: {
      status: "VERIFY",
      title: "人口集中地区（DID）参考レイヤー",
      detail: "選択地点周辺に令和2年国勢調査のDIDレイヤーを表示しています。境界付近や法的な該当性はDIPS2.0などの公式情報で確認してください。",
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
      attribution: "国土地理院タイル",
    }).addTo(state.didMap);

    L.tileLayer("https://maps.gsi.go.jp/xyz/did2020/{z}/{x}/{y}.png", {
      minZoom: 8,
      maxZoom: 18,
      opacity: 0.48,
      attribution: "人口集中地区（令和2年国勢調査・総務省統計局）",
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
        title: "この自動事前確認では該当なし",
        detail:
          "選択地点は取得した国土地理院「空港等の周辺空域」データには含まれていません。境界付近や最新状況は公式情報で再確認してください。",
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
      title: "空港等の周辺空域に該当する可能性があります",
      detail:
        "選択地点は国土地理院「空港等の周辺空域」GeoJSON内に含まれています。飛行を進める前に、正確な境界や必要な許可・調整を公式情報で確認してください。",
      features: matchedFeatures.length,
    };
  }

  return {
    status: "CLEAR",
    matched: false,
    title: "この自動事前確認では該当なし",
    detail:
      "選択地点は取得した国土地理院「空港等の周辺空域」データには含まれていません。ただし、これだけで法的に飛行可能と判断することはできません。",
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
      ? "要確認"
      : airport.status === "CLEAR"
      ? "参考：該当なし"
      : "手動確認";
  airportLegalText.textContent = airport.title;
  airportLegalDetail.textContent = airport.detail;
  updateLegalCostIndicator(
    "airportLegalCost",
    airport.status === "ATTENTION" ? "VERY_HIGH" : airport.status === "CLEAR" ? "LOW" : "HIGH",
    airport.status === "ATTENTION"
      ? "飛行前に公式な許可、調整、地点変更などが必要な場合、大きな時間・労力がかかる可能性があります。"
      : airport.status === "CLEAR"
      ? "この参考確認では該当が見つからなかったため、通常の公式情報確認が残ります。"
      : "自動確認を利用できなかったため、公式情報による手動確認に追加の時間が必要になる可能性があります。"
  );

  const did = legal.did;
  didLegalStatus.className = "legal-status unknown";
  didLegalStatus.textContent = "公式情報で確認が必要";
  didLegalText.textContent = did.title;
  didLegalDetail.textContent = did.detail;
  updateLegalCostIndicator(
    "didLegalCost",
    "VERY_HIGH",
    "公式情報での確認が必要です。許可・承認などの手続きが必要な場合、飛行までに相当な時間がかかる可能性があります。"
  );
  updateLegalCostIndicator(
    "emergencyLegalCost",
    "VERY_HIGH",
    "現在指定されている場合、予定どおりの飛行ができず、計画変更が必要になる可能性があります。"
  );
  updateLegalCostIndicator(
    "importantFacilityLegalCost",
    "VERY_HIGH",
    "規制区域に該当する場合、飛行前に同意・通報・計画変更などが必要になる可能性があります。"
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
    proceedToSafetyButton.textContent = "飛行前安全確認へ進む";
  } else if (state.environmentStatus === "LOADING") {
    proceedToSafetyButton.textContent = "基本確認へ進む（周辺データ取得中）";
  } else if (state.environmentStatus === "ERROR") {
    proceedToSafetyButton.textContent = "基本的な飛行前確認へ進む";
  } else {
    proceedToSafetyButton.textContent = "飛行前安全確認へ進む";
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
    <p><b>対処方法：</b>${escapeHtml(info.action)}</p>
    <details><summary>技術情報</summary><code>${escapeHtml(info.technical)}</code></details>
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
    environmentPrefetchTitle.textContent = "周辺環境データをバックグラウンドで準備中";
    environmentPrefetchText.textContent =
      `OpenStreetMapデータを取得中（${state.environmentAttempt}/${CONFIG.overpassMaxRetries}）。その間も法規項目の確認を続けられます。`;
    retryEnvironmentButton.classList.add("hidden");
    return;
  }

  if (status === "READY") {
    environmentPrefetchIcon.textContent = "✓";
    environmentPrefetchTitle.textContent = "周辺環境データの準備ができました";
    environmentPrefetchText.textContent =
      "法規確認が完了したら、地点依存の項目を含む安全確認へすぐに進めます。";
    retryEnvironmentButton.classList.add("hidden");
    return;
  }

  if (status === "ERROR") {
    const info = explainAnalysisError(state.environmentError ?? new Error("Unknown error"));
    environmentPrefetchIcon.textContent = "!";
    environmentPrefetchTitle.textContent = "周辺環境データを取得できませんでした";
    environmentPrefetchText.textContent =
      `${info.title}。法規確認のチェック状態は保持されます。基本的な飛行前確認にはそのまま進めます。`;
    retryEnvironmentButton.classList.remove("hidden");
    return;
  }

  environmentPrefetchIcon.textContent = "…";
  environmentPrefetchTitle.textContent = "周辺環境データはまだ取得されていません";
  environmentPrefetchText.textContent =
    "地点分析を開始すると、法規確認と並行してOpenStreetMapデータを取得します。";
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
    resultEnvironmentTitle.textContent = "地点依存データをバックグラウンドで取得中";
    resultEnvironmentText.textContent =
      "基本確認から先に開始できます。取得に成功すると、建物・植生・電力設備のバブルが自動で追加されます。";
    return;
  }

  if (state.environmentStatus === "ERROR") {
    const info = explainAnalysisError(state.environmentError ?? new Error("Unknown error"));
    resultEnvironmentNotice.classList.add("notice-error");
    resultEnvironmentTitle.textContent = "地点依存の確認データを現在取得できません";
    resultEnvironmentText.textContent =
      `${info.title}。基本確認は引き続き利用でき、法規確認をやり直す必要はありません。`;
    resultRetryEnvironmentButton.classList.remove("hidden");
    return;
  }

  if (state.environmentStatus === "READY") {
    resultEnvironmentNotice.classList.add("notice-ready");
    resultEnvironmentTitle.textContent = "地点依存データを反映しました";
    resultEnvironmentText.textContent =
      "取得したOpenStreetMapの周辺要素に基づき、該当する地点依存の確認項目を追加しました。";
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
      ? "取得中"
      : state.environmentStatus === "ERROR"
      ? "取得不可"
      : "未分析";

  contextSummary.innerHTML = "";
  const cards = [
    ["▦", "建物", statusText],
    ["♧", "樹木・森林", statusText],
    ["ϟ", "電力設備", statusText],
    ["◎", "分析範囲", `半径 ${CONFIG.analysisRadiusMeters} m`],
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
      `周辺環境データを取得し、${newlyAdded.length}件の地点依存確認を追加しました。`;
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
      title: "インターネットに接続されていません",
      reason:
        "周辺環境分析にはOpenStreetMapデータが必要ですが、ネットワーク接続を確認できませんでした。",
      action:
        "Wi-Fiやネットワーク接続を確認してから、もう一度地点を分析してください。",
      technical: error.message,
    };
  }

  if (error.code === "TIMEOUT" || status === 504) {
    return {
      code: status === 504 ? "HTTP 504" : "TIMEOUT",
      title: "周辺データの検索に時間がかかりすぎました",
      reason:
        "選択地点に地図データが多い、またはOverpass APIが混雑しているため、制限時間内に分析が完了しませんでした。",
      action:
        "少し時間を置いて再試行してください。繰り返す場合は地点を少し変更するか、分析範囲を小さくしてください。",
      technical: error.message,
    };
  }

  if (status === 429) {
    return {
      code: "HTTP 429",
      title: "短時間にアクセスが集中しています",
      reason:
        "OpenStreetMapの検索サービス側で一時的にアクセスが制限されています。",
      action:
        "30秒〜数分待ってから再試行し、分析ボタンを連続して押さないようにしてください。",
      technical: error.message,
    };
  }

  if (status >= 500 && status <= 599) {
    return {
      code: `HTTP ${status}`,
      title: "地図データサービスで一時的なエラーが発生しました",
      reason:
        "分析に使用するOverpass APIサーバーが一時的に処理できない状態です。選択地点や操作が誤っているとは限りません。",
      action:
        "少し時間を置いて再試行してください。",
      technical: error.message,
    };
  }

  if (status === 400) {
    return {
      code: "HTTP 400",
      title: "周辺データの検索条件に問題があります",
      reason:
        "アプリから送信した検索条件を地図データサービスが処理できませんでした。主にアプリ側の検索処理の問題です。",
      action:
        "同じ地点で繰り返す場合は、技術情報を確認して原因を調査してください。",
      technical: error.message,
    };
  }

  if (error.code === "PARSE") {
    return {
      code: "DATA",
      title: "取得した地図データを読み取れませんでした",
      reason:
        "地図データサービスから想定外の形式が返されたため、分析データとして読み取れませんでした。",
      action:
        "少し時間を置いて再試行してください。改善しない場合はアプリ側の処理を確認する必要があります。",
      technical: error.message,
    };
  }

  if (error.code === "NETWORK" || error instanceof TypeError) {
    return {
      code: "NETWORK",
      title: "地図データサービスに接続できませんでした",
      reason:
        "インターネット接続、ブラウザの通信制限、サービス側の接続障害などが考えられます。",
      action:
        "ネットワーク接続を確認し、ページを再読み込みしてから再試行してください。",
      technical: error.message,
    };
  }

  return {
    code: "UNKNOWN",
    title: "分析中に予期しないエラーが発生しました",
    reason:
      "既知のネットワークエラーやタイムアウト以外の問題が発生しました。",
    action:
      "ページを再読み込みして再試行してください。繰り返す場合は技術情報を確認してください。",
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
    windCheck.effortReason = "周辺に地図上の障害物があるため、不安定な天候や風に応じて、大きなルート変更、離陸地点の変更、天候回復までの待機が必要になる可能性があります。";
    windCheck.scenario =
      "悪天候や風で機体が流されたり視界が低下したりすると、周辺で検出された建物・植生・電力設備に接触し、制御不能や墜落につながる可能性があります。";
  }
  if (windCheck && (context?.hasBuildings || context?.hasPowerInfrastructure)) {
    windCheck.consequenceClass = "ACCIDENT";
    windCheck.classificationReason = "周辺に地図上の建物または電力設備があります。本プロトタイプでは、天候・風による接触から第三者の人工物の損壊につながる可能性を考慮し、事故相当として表示します。FAA Hazardousは色区分そのものではなく、重大度を考える補助的な参考です。";
    windCheck.mlitReference = "事故参考：接触によって第三者の人工物が損壊した場合。";
  }

  // 2. Additional checks generated from the selected location context
  if (context?.hasBuildings) {
    checks.push({
      id: "building-clearance",
      scope: "LOCATION",
      category: "障害物",
      className: "obstacle",
      title: "建物との離隔",
      faaSeverity: "MAJOR",
      consequenceClass: "ACCIDENT",
      classificationReason: "本プロトタイプでは建物を第三者の人工物として扱います。接触により損壊が生じた場合、第三者の人工物の損壊は国土交通省の事故報告基準に含まれます。FAA Majorは想定結果の重大度を考える補助的な参考として残しています。",
      mlitReference: "事故参考：第三者の人工物の損壊。",
      actionCost: "MEDIUM",
      effortReason: "現地で離隔を確認し、飛行ルートや離着陸地点をある程度調整する必要がある場合があります。",
      scenario: "建物への接触により機体が損傷し、飛行継続が困難になったり墜落したりする可能性があります。",
      summary: `選択地点から${CONFIG.analysisRadiusMeters} m以内に地図上の建物データがあります。`,
      why:
        "風や操作のずれにより機体が予定位置から外れ、建物に接触する可能性があります。",
      action:
        "飛行ルートや離着陸場所が建物に近すぎないか現地で確認してください。",
      safetyTip:
        "多少機体が流されても接触しないよう、建物から十分な余裕を持ったルートを計画してください。",
    });
  }

  if (context?.hasVegetation) {
    checks.push({
      id: "vegetation-clearance",
      scope: "LOCATION",
      category: "障害物",
      className: "environment",
      title: "樹木・枝との離隔",
      faaSeverity: "MAJOR",
      consequenceClass: "GENERAL",
      classificationReason: "樹木や枝への接触は墜落につながる可能性がありますが、負傷や第三者の人工物の損壊など明確な結果が生じない限り、国土交通省の単一の事故・重大インシデント基準には直接対応しません。そのため本プロトタイプでは一般安全確認として表示します。",
      mlitReference: "一般安全確認：実際に生じた負傷、物件損壊、その他の報告対象事象によって区分が変わります。",
      actionCost: "MEDIUM",
      effortReason: "通常は現地確認が必要で、十分な離隔を確保するためにルートをある程度変更する場合があります。",
      scenario: "枝や樹冠への接触によりプロペラや機体が損傷し、墜落につながる可能性があります。",
      summary: `選択地点から${CONFIG.analysisRadiusMeters} m以内に地図上の樹木・森林・樹林データがあります。`,
      why:
        "細い枝は見えにくく、風で動くこともあるため、プロペラや機体が接触する危険があります。",
      action:
        "木の高さだけでなく、飛行ルート上に張り出した枝がないか現地で確認してください。",
      safetyTip:
        "風による枝の動きも考慮し、樹木や枝から十分な距離を確保してください。",
    });
  }

  if (context?.hasPowerInfrastructure) {
    checks.push({
      id: "power-clearance",
      scope: "LOCATION",
      category: "障害物",
      className: "obstacle",
      title: "電線・電力設備",
      faaSeverity: "HAZARDOUS",
      consequenceClass: "ACCIDENT",
      classificationReason: "電力設備への接触は第三者の人工物の損壊につながるほか、重大な二次被害を引き起こす可能性があります。第三者の人工物の損壊は国土交通省の事故基準に含まれ、FAA Hazardousは想定結果の重大度を考える補助的な参考として残しています。",
      mlitReference: "事故参考：第三者の人工物の損壊。二次的な結果によって重大性がさらに高まる場合があります。",
      actionCost: "HIGH",
      effortReason: "電力設備は慎重な現地確認が必要で、飛行前に大きなルート変更や離陸地点変更が必要になる場合があります。",
      scenario: "電線への接触により制御不能や墜落が起こり、重大な物的・人的被害につながる可能性があります。",
      summary: `選択地点から${CONFIG.analysisRadiusMeters} m以内に地図上の電線・電柱・鉄塔などの電力設備データがあります。`,
      why:
        "電線は細く、特にドローンのカメラ映像だけでは気づきにくい場合があります。",
      action:
        "飛行ルート周辺に電線、ケーブル、ワイヤーがないか現地で目視確認してください。",
      safetyTip:
        "電線や電力設備の近くを避け、十分な離隔を確保してください。",
    });
  }

  // Always show an on-site verification item because public maps may omit hazards.
  checks.push({
    id: "on-site-verification",
    scope: "COMMON",
    category: "一般",
    className: "general",
    title: "現地の周辺確認",
    faaSeverity: "MAJOR",
    consequenceClass: "GENERAL",
    classificationReason: "これは単一の故障状態や報告対象事象ではなく、広い範囲を対象とする予防的確認のため、国土交通省の事故・重大インシデント区分には直接割り当てません。",
    mlitReference: "一般安全確認：国土交通省の単一の報告対象区分には直接割り当てません。",
    actionCost: "LOW",
    effortReason: "実際の飛行場所を最終的に目視確認する作業は通常短時間で行え、離陸直前に実施する必要があります。",
    scenario: "地図にない障害物や第三者を見落とすと、接触、墜落、周囲への被害につながる可能性があります。",
    summary:
      "地図に表示されない障害物、人、車両、その他の危険要因がないか現地で最終確認してください。",
    why:
      "地図には細い電線、新しくできた構造物、仮設物、移動する人や車両などが含まれていない場合があります。",
    action:
      "離陸前に、実際の飛行場所を目視し、地図にない障害物や第三者がいないか確認してください。",
    safetyTip:
      "地図データだけで安全と判断せず、飛行前に実際の状況を確認してください。",
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
      title: "建物",
      value: context.hasBuildings ? "地図データで検出" : "検出なし",
    },
    {
      icon: "♧",
      title: "樹木・森林",
      value: context.hasVegetation ? "地図データで検出" : "検出なし",
    },
    {
      icon: "ϟ",
      title: "電力設備",
      value: context.hasPowerInfrastructure ? "地図データで検出" : "検出なし",
    },
    {
      icon: "◎",
      title: "分析範囲",
      value: `半径 ${CONFIG.analysisRadiusMeters} m`,
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
    checkStatus.textContent = `${checks.length}件の基本確認を表示しています。周辺環境データの取得後、地点依存の確認項目が追加される場合があります。`;
  } else if (state.environmentStatus === "ERROR") {
    checkStatus.textContent = `${checks.length}件の基本確認を表示しています。周辺環境データの取得後、地点依存の確認項目が追加されます。`;
  } else {
    checkStatus.textContent = `${checks.length}件の確認項目を生成しました。バブルの色は想定される結果の区分、大きさは飛行前に必要な相対的な労力・時間を表します。凡例との重複を避けるため、各バブル内にはCOMMON / LOCATIONラベルと確認項目名のみ表示します。`;
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
      bubble.setAttribute("aria-label", `${check.title}。${scopeLabel(check.scope)}。想定される結果の区分：${outcomeClassLabel(check.consequenceClass)}。対応に必要な労力・時間：${actionCostLabel(check.actionCost)}`);
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
    LOW: "低",
    MEDIUM: "中",
    HIGH: "高",
    VERY_HIGH: "非常に高",
  };
  return labels[actionCost] ?? "中";
}

function outcomeClassClass(value) {
  return String(value || "GENERAL").toLowerCase().replaceAll("_", "-");
}

function outcomeClassLabel(value) {
  const labels = {
    GENERAL: "一般安全確認",
    SERIOUS_INCIDENT: "重大インシデント相当",
    ACCIDENT: "事故相当",
  };
  return labels[value] ?? "一般安全確認";
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
    ? "選択地点に応じた確認"
    : "すべての地点で必要な基本確認";
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
  modalMlitReference.textContent = check.mlitReference || "国土交通省の結果区分には直接割り当てていません。";
  modalClassificationReason.textContent = check.classificationReason || "これは研究プロトタイプ上の分類であり、公式な事象判定ではありません。";
  modalActionCost.textContent = actionCostLabel(check.actionCost);
  modalActionCost.className = `effort-chip effort-${actionCostClass(check.actionCost)}`;
  modalEffortReason.textContent = check.effortReason || "飛行を実行できる状態にするまでに必要な労力・時間の相対的な目安です。";
  modalScenario.textContent = check.scenario || "想定事故シナリオは設定されていません。";
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
    completeTitle.textContent = "最終確認 保留中";
    completeText.textContent =
      "現在利用できる基本確認はすべて完了しましたが、地点依存の周辺環境データを取得できていません。地点データの取得に成功するまで最終完了にはできません。すでに確認した項目は保持されるため、再取得後にやり直す必要はありません。";
    checkStatus.textContent =
      "基本確認は完了しています。地点依存データの取得を待っています。";
    completeRetryEnvironmentButton?.classList.remove("hidden");
    return;
  }

  completeTitle.textContent = "地点依存の確認項目を待機中";
  completeText.textContent =
    "現在利用できる基本確認はすべて完了しました。地点依存の周辺環境データはまだ取得中です。地点データの準備ができ、追加されたLOCATION項目も確認すると最終完了になります。";
  checkStatus.textContent =
    "基本確認は完了しています。最終完了のため地点依存データを待っています。";
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

  completeTitle.textContent = "飛行前確認 完了";
  completeText.textContent =
    "この画面の基本確認と地点依存の確認項目はすべて完了しました。本システムは飛行の安全性や法的な飛行可否を保証するものではありません。";
  checkStatus.textContent = "利用可能な基本確認と地点依存の確認項目をすべて確認しました。";
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
