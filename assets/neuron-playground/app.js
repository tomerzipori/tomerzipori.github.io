"use strict";

(() => {
  const $ = (id) => document.getElementById(id);
  const compact = new URLSearchParams(location.search).get("compact") === "1";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const state = {
    manifest: null,
    wordIndex: 0,
    layer: 12,
    unit: 646,
    wordBytes: null,
    detailBytes: null,
    detailLayer: null,
    pulseUnits: new Set(),
    pulseUntil: 0,
    wordCache: new Map(),
    detailCache: new Map(),
  };

  document.documentElement.classList.toggle("compact", compact);

  const assetUrl = (file) => new URL(file, document.baseURI).href;
  const wordRecord = (index) => state.manifest.words[index];
  const layerUnits = () => state.manifest.model.units_per_layer;
  const categoryCount = () => state.manifest.categories.length;
  const currentWord = () => wordRecord(state.wordIndex);
  const formatZ = (value) => `${value >= 0 ? "+" : ""}${value.toFixed(2)} SD`;
  const keyFor = (layer, unit) => `${layer}/${unit}`;

  async function fetchBytes(file) {
    const response = await fetch(assetUrl(file));
    if (!response.ok) throw new Error(`Asset request failed (${response.status}).`);
    return new Int8Array(await response.arrayBuffer());
  }

  async function loadWord(index) {
    if (!state.wordCache.has(index)) {
      const record = wordRecord(index);
      const bytes = await fetchBytes(record.file);
      const expected = state.manifest.model.layers * layerUnits();
      if (bytes.byteLength !== expected) throw new Error(`The ${record.word} asset has an unexpected shape.`);
      state.wordCache.set(index, bytes);
    }
    return state.wordCache.get(index);
  }

  async function loadLayerDetail(layer) {
    if (!state.detailCache.has(layer)) {
      const record = state.manifest.layer_details[layer];
      const bytes = await fetchBytes(record.file);
      const expected = layerUnits() * categoryCount();
      if (bytes.byteLength !== expected) throw new Error(`Layer ${layer} detail has an unexpected shape.`);
      state.detailCache.set(layer, bytes);
    }
    return state.detailCache.get(layer);
  }

  function decodeLayer(bytes, layer) {
    const start = layer * layerUnits();
    const encoded = bytes.subarray(start, start + layerUnits());
    const values = new Float32Array(encoded.length);
    for (let index = 0; index < encoded.length; index += 1) values[index] = encoded[index] / state.manifest.quantization.scale;
    return values;
  }

  function selectedUnitValue() {
    return decodeLayer(state.wordBytes, state.layer)[state.unit];
  }

  function writeUrl(replace) {
    const params = new URLSearchParams();
    params.set("word", currentWord().word);
    params.set("layer", String(state.layer));
    params.set("unit", String(state.unit));
    if (compact) params.set("compact", "1");
    const url = `${location.pathname}?${params}`;
    history[replace ? "replaceState" : "pushState"]({}, "", url);
  }

  function requestedState() {
    const params = new URLSearchParams(location.search);
    const requestedWord = (params.get("word") || params.get("a") || "").toLowerCase();
    const wordIndex = state.manifest.words.findIndex((item) => item.word.toLowerCase() === requestedWord);
    const layerValue = params.get("layer");
    const unitValue = params.get("unit");
    const layer = layerValue === null ? Number.NaN : Number(layerValue);
    const unit = unitValue === null ? Number.NaN : Number(unitValue);
    return {
      wordIndex: wordIndex >= 0 ? wordIndex : state.manifest.default.word_index,
      layer: Number.isInteger(layer) && layer >= 0 && layer < state.manifest.model.layers ? layer : state.manifest.default.layer,
      unit: Number.isInteger(unit) && unit >= 0 && unit < layerUnits() ? unit : state.manifest.default.unit,
    };
  }

  function architectureNode(label, value, extraClass = "") {
    const node = document.createElement("div");
    node.className = `architecture-node ${extraClass}`.trim();
    const labelElement = document.createElement("span");
    labelElement.textContent = label;
    const valueElement = document.createElement("strong");
    valueElement.textContent = value;
    node.append(labelElement, valueElement);
    return node;
  }

  function renderArchitecture() {
    const strip = $("architecture-strip");
    const existing = strip.querySelectorAll(".layer-block");
    if (!existing.length) {
      strip.append(architectureNode("input", currentWord().word, "input"), architectureNode("embedding", "token"));
      for (let layer = 0; layer < state.manifest.model.layers; layer += 1) {
        const button = document.createElement("button");
        button.className = "layer-block";
        button.type = "button";
        button.dataset.layer = String(layer);
        const number = document.createElement("span");
        number.className = "layer-number";
        number.textContent = `L${layer}`;
        const marker = document.createElement("i");
        marker.className = "global-marker";
        marker.setAttribute("aria-hidden", "true");
        const score = document.createElement("span");
        score.className = "layer-score";
        const scoreBar = document.createElement("i");
        scoreBar.setAttribute("aria-hidden", "true");
        score.append(scoreBar);
        const type = document.createElement("span");
        type.className = "layer-type";
        button.append(number, marker, score, type);
        button.addEventListener("click", () => selectLayer(layer, { push: true, scroll: true }));
        strip.append(button);
      }
      strip.append(architectureNode("output", "next token", "output"));
    }
    const input = strip.querySelector(".architecture-node.input strong");
    if (input) input.textContent = currentWord().word;
    const scores = state.manifest.layer_bars.scores[state.wordIndex];
    const fixedScale = state.manifest.layer_bars.scale;
    strip.querySelectorAll(".layer-block").forEach((button) => {
      const layer = Number(button.dataset.layer);
      const score = scores[layer];
      const global = state.manifest.architecture.global_attention_layers.includes(layer);
      button.setAttribute("aria-pressed", String(layer === state.layer));
      button.setAttribute("aria-label", `Layer ${layer}, ${global ? "global" : "local"} self-attention, measured score ${score.toFixed(2)}.`);
      button.querySelector(".layer-score i").style.setProperty("--bar-width", `${(score / fixedScale) * 100}%`);
      button.querySelector(".layer-type").textContent = global ? "global" : "local";
      button.querySelector(".global-marker").hidden = !global;
    });
  }

  function colorFor(value) {
    const base = [239, 228, 210];
    const target = value >= 0 ? [65, 105, 225] : [180, 91, 66];
    const amount = Math.min(Math.abs(value) / 4, 1) * 0.9;
    const rgb = base.map((channel, index) => Math.round(channel + (target[index] - channel) * amount));
    return `rgb(${rgb.join(",")})`;
  }

  function drawField(values) {
    const canvas = $("unit-field");
    const context = canvas.getContext("2d");
    const columns = state.manifest.field.columns;
    const rows = state.manifest.field.rows;
    const cellWidth = canvas.width / columns;
    const cellHeight = canvas.height / rows;
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let unit = 0; unit < values.length; unit += 1) {
      const row = Math.floor(unit / columns);
      const column = unit % columns;
      context.fillStyle = colorFor(values[unit]);
      context.fillRect(column * cellWidth, row * cellHeight, Math.ceil(cellWidth), Math.ceil(cellHeight));
      if (state.pulseUnits.has(unit) && state.pulseUntil > performance.now()) {
        context.fillStyle = "rgba(255,255,255,.58)";
        context.fillRect(column * cellWidth, row * cellHeight, Math.ceil(cellWidth), Math.ceil(cellHeight));
      }
      if (unit === state.unit) {
        context.strokeStyle = "#252936";
        context.lineWidth = 2;
        context.strokeRect(column * cellWidth + 1, row * cellHeight + 1, cellWidth - 2, cellHeight - 2);
      }
    }
    if (state.pulseUntil > performance.now()) requestAnimationFrame(() => drawField(values));
  }

  function renderInspector(values) {
    const value = values[state.unit];
    const detail = state.detailBytes;
    const rank = state.manifest.frozen_units.find((item) => item.layer === state.layer && item.unit === state.unit);
    $("unit-title").textContent = `Layer ${state.layer} / U${state.unit}`;
    $("unit-activation").textContent = formatZ(value);
    $("unit-rank").textContent = rank ? `Frozen winner #${rank.rank} of 20` : "Exploratory unit";
    $("unit-jump").value = String(state.unit);
    $("field-summary").textContent = `U${state.unit}: ${formatZ(value)}. Unit IDs increase numerically; spatial adjacency has no learned meaning.`;
    $("unit-compact-readout").textContent = `${formatZ(value)} · ${rank ? `frozen winner #${rank.rank}` : "exploratory unit"}`;
    const rows = $("category-profile-rows");
    rows.replaceChildren();
    const start = state.unit * categoryCount();
    state.manifest.categories.forEach((category, index) => {
      const row = document.createElement("div");
      row.className = "category-row";
      const label = document.createElement("span");
      label.textContent = category.label;
      const score = document.createElement("span");
      score.textContent = formatZ(detail[start + index] / state.manifest.quantization.scale).replace(" SD", "");
      row.append(label, score);
      rows.append(row);
    });
  }

  function renderFocus() {
    $("focus-section").hidden = false;
    $("focus-title").textContent = `Layer ${state.layer}`;
    const values = decodeLayer(state.wordBytes, state.layer);
    drawField(values);
    renderInspector(values);
  }

  function animateFocus() {
    const section = $("focus-section");
    section.classList.remove("is-entering");
    void section.offsetWidth;
    section.classList.add("is-entering");
  }

  async function selectWord(index, { push = true, announce = true } = {}) {
    if (index === state.wordIndex && state.wordBytes) return;
    const previousValues = state.wordBytes ? decodeLayer(state.wordBytes, state.layer) : null;
    const bytes = await loadWord(index);
    state.wordIndex = index;
    state.wordBytes = bytes;
    const nextValues = decodeLayer(bytes, state.layer);
    state.pulseUnits = new Set();
    if (previousValues && !reducedMotion) {
      for (let unit = 0; unit < nextValues.length; unit += 1) {
        if (Math.abs(nextValues[unit] - previousValues[unit]) >= 0.5) state.pulseUnits.add(unit);
      }
      state.pulseUntil = performance.now() + 500;
    }
    $("target-word").textContent = currentWord().word;
    $("quick-words").querySelectorAll("button").forEach((button) => {
      const indexForButton = state.manifest.words.findIndex((item) => item.word.toLowerCase() === button.dataset.word);
      button.setAttribute("aria-pressed", String(indexForButton === state.wordIndex));
    });
    renderArchitecture();
    renderFocus();
    if (push) writeUrl(false);
    if (announce) {
      $("search-status").dataset.state = "";
      $("search-status").textContent = `Selected recorded word: ${currentWord().word}.`;
    }
  }

  async function selectLayer(layer, { push = true, scroll = false } = {}) {
    if (layer === state.layer && state.detailBytes) {
      if (scroll) $("focus-section").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      return;
    }
    state.layer = layer;
    state.detailBytes = await loadLayerDetail(layer);
    state.detailLayer = layer;
    renderArchitecture();
    renderFocus();
    animateFocus();
    if (push) writeUrl(false);
    if (scroll) $("focus-section").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }

  function selectUnit(unit, { push = true, moveFocus = false } = {}) {
    if (!Number.isInteger(unit) || unit < 0 || unit >= layerUnits()) return;
    state.unit = unit;
    renderFocus();
    if (push) writeUrl(false);
    if (moveFocus) $("unit-field").focus({ preventScroll: true });
  }

  function renderQuickWords() {
    const visible = compact ? ["pigeon", "rose"] : state.manifest.featured_words;
    const container = $("quick-words");
    container.replaceChildren();
    visible.forEach((word) => {
      const index = state.manifest.words.findIndex((item) => item.word.toLowerCase() === word);
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = word;
      button.dataset.word = word;
      button.setAttribute("aria-pressed", String(index === state.wordIndex));
      button.addEventListener("click", () => selectWord(index));
      container.append(button);
    });
  }

  function searchMatches(query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return state.manifest.words.filter((item) => item.word.toLowerCase().includes(normalized));
  }

  function renderSearchResults() {
    if (compact) return;
    const query = $("word-search").value;
    const matches = searchMatches(query);
    const results = $("search-results");
    results.replaceChildren();
    matches.slice(0, 30).forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = item.word;
      button.addEventListener("click", () => {
        const index = state.manifest.words.indexOf(item);
        selectWord(index);
        $("word-search").value = item.word;
        renderSearchResults();
      });
      results.append(button);
    });
    const status = $("search-status");
    if (!query.trim()) {
      status.textContent = "";
      status.dataset.state = "";
    } else if (!matches.length) {
      status.textContent = `No recorded word matches “${query.trim()}”.`;
      status.dataset.state = "error";
    } else {
      status.textContent = `${matches.length} recorded word${matches.length === 1 ? "" : "s"} match.`;
      status.dataset.state = "";
    }
  }

  function wireControls() {
    $("search-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const matches = searchMatches($("word-search").value);
      const exact = state.manifest.words.findIndex((item) => item.word.toLowerCase() === $("word-search").value.trim().toLowerCase());
      if (exact >= 0) selectWord(exact);
      else if (matches.length === 1) selectWord(state.manifest.words.indexOf(matches[0]));
      else renderSearchResults();
    });
    $("word-search").addEventListener("input", renderSearchResults);
    $("unit-form").addEventListener("submit", (event) => {
      event.preventDefault();
      selectUnit(Number($("unit-jump").value), { moveFocus: true });
    });
    $("unit-field").addEventListener("click", (event) => {
      const canvas = $("unit-field");
      const bounds = canvas.getBoundingClientRect();
      const column = Math.min(state.manifest.field.columns - 1, Math.floor(((event.clientX - bounds.left) / bounds.width) * state.manifest.field.columns));
      const row = Math.min(state.manifest.field.rows - 1, Math.floor(((event.clientY - bounds.top) / bounds.height) * state.manifest.field.rows));
      selectUnit(row * state.manifest.field.columns + column, { moveFocus: true });
    });
    $("unit-field").addEventListener("keydown", (event) => {
      const direction = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -state.manifest.field.columns, ArrowDown: state.manifest.field.columns }[event.key];
      if (direction) {
        event.preventDefault();
        selectUnit(Math.max(0, Math.min(layerUnits() - 1, state.unit + direction)), { moveFocus: true });
      }
    });
  }

  async function applyUrlState() {
    const requested = requestedState();
    if (requested.wordIndex !== state.wordIndex) await selectWord(requested.wordIndex, { push: false, announce: false });
    if (requested.layer !== state.layer) await selectLayer(requested.layer, { push: false, scroll: false });
    if (requested.unit !== state.unit) selectUnit(requested.unit, { push: false });
    writeUrl(true);
  }

  async function init() {
    try {
      const response = await fetch(assetUrl("manifest.json"));
      if (!response.ok) throw new Error(`Manifest request failed (${response.status}).`);
      state.manifest = await response.json();
      const requested = requestedState();
      state.wordIndex = requested.wordIndex;
      state.layer = requested.layer;
      state.unit = requested.unit;
      state.wordBytes = await loadWord(state.wordIndex);
      state.detailBytes = await loadLayerDetail(state.layer);
      state.detailLayer = state.layer;
      renderQuickWords();
      wireControls();
      renderArchitecture();
      renderFocus();
      $("loading").hidden = true;
      $("workspace").hidden = false;
      writeUrl(true);
      if (window.frameElement && "ResizeObserver" in window) {
        new ResizeObserver(([entry]) => { window.frameElement.style.height = `${Math.ceil(entry.target.getBoundingClientRect().height)}px`; }).observe($("observatory"));
      }
      window.addEventListener("popstate", () => applyUrlState().catch(showError));
    } catch (error) {
      showError(error);
    }
  }

  function showError(error) {
    $("loading").hidden = false;
    $("loading").setAttribute("role", "alert");
    $("loading").textContent = `The recorded data could not load. Reload to retry. ${error.message}`;
  }

  init();
})();
