(() => {
  const svg = document.querySelector("#evidence-chart");
  if (!svg) return;

  const NS = "http://www.w3.org/2000/svg";
  const plot = { left: 45, right: 605, top: 28, bottom: 232 };
  const domain = { min: -3.2, max: 4.2 };
  const state = { separation: 1.55, thresholds: [-1.15, -.55, 0, .55, 1.15] };
  let activeThreshold = null;

  const x = (value) => plot.left + ((value - domain.min) / (domain.max - domain.min)) * (plot.right - plot.left);
  const y = (value) => plot.bottom - value * (plot.bottom - plot.top);
  const normal = (value, mean) => Math.exp(-0.5 * (value - mean) ** 2) / Math.sqrt(2 * Math.PI);
  const cdf = (value, mean) => 0.5 * (1 + erf((value - mean) / Math.SQRT2));
  const erf = (value) => {
    const sign = value < 0 ? -1 : 1;
    const x = Math.abs(value);
    const a1 = .254829592, a2 = -.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
    const p = .3275911;
    const t = 1 / (1 + p * x);
    return sign * (1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
  };
  const make = (tag, attrs, parent = svg) => {
    const element = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    parent.appendChild(element);
    return element;
  };
  const pathFor = (mean) => {
    let path = "";
    for (let i = 0; i <= 100; i += 1) {
      const value = domain.min + (domain.max - domain.min) * (i / 100);
      path += `${i ? "L" : "M"}${x(value).toFixed(2)} ${y(normal(value, mean) * 2.2).toFixed(2)} `;
    }
    return path;
  };

  const curveLayer = make("g", { "aria-hidden": "true" });
  const noiseCurve = make("path", { class: "curve-noise", d: pathFor(0) }, curveLayer);
  const signalCurve = make("path", { class: "curve-signal", d: pathFor(state.separation) }, curveLayer);
  make("line", { class: "axis", x1: plot.left, x2: plot.right, y1: plot.bottom, y2: plot.bottom }, svg);
  make("text", { x: plot.left, y: 260, class: "threshold-index", "text-anchor": "start" }).textContent = "low rating";
  make("text", { x: plot.right, y: 260, class: "threshold-index", "text-anchor": "end" }).textContent = "high rating";
  const thresholdLayer = make("g", { "aria-label": "Five ordered response thresholds" });
  const handles = state.thresholds.map((_, index) => {
    const group = make("g", { role: "slider", tabindex: "0", "aria-label": `Threshold ${index + 1}`, "aria-valuemin": "-3.2", "aria-valuemax": "4.2" }, thresholdLayer);
    const line = make("line", { class: "threshold-line", y1: plot.top, y2: plot.bottom }, group);
    const dot = make("circle", { class: "threshold-dot", cy: plot.top, r: 6 }, group);
    make("text", { class: "threshold-index", y: plot.top - 10 }, group).textContent = String(index + 1);
    group.addEventListener("pointerdown", (event) => { activeThreshold = index; group.setPointerCapture(event.pointerId); });
    group.addEventListener("pointermove", (event) => { if (activeThreshold === index) updateThreshold(index, valueFromEvent(event)); });
    group.addEventListener("pointerup", () => { activeThreshold = null; });
    group.addEventListener("pointercancel", () => { activeThreshold = null; });
    group.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") updateThreshold(index, domain.min);
      else if (event.key === "End") updateThreshold(index, domain.max);
      else updateThreshold(index, state.thresholds[index] + (event.key === "ArrowRight" ? .1 : -.1));
    });
    return { group, line, dot };
  });

  const readout = document.querySelector("[data-evidence-readout]");
  const separationInput = document.querySelector("#separation-control");
  separationInput?.addEventListener("input", () => {
    state.separation = Number(separationInput.value);
    signalCurve.setAttribute("d", pathFor(state.separation));
    render();
  });

  function valueFromEvent(event) {
    const rect = svg.getBoundingClientRect();
    const coordinate = ((event.clientX - rect.left) / rect.width) * 640;
    return domain.min + ((coordinate - plot.left) / (plot.right - plot.left)) * (domain.max - domain.min);
  }

  function updateThreshold(index, value) {
    const lower = index === 0 ? domain.min : state.thresholds[index - 1] + .05;
    const upper = index === state.thresholds.length - 1 ? domain.max : state.thresholds[index + 1] - .05;
    state.thresholds[index] = Math.max(lower, Math.min(upper, value));
    render();
  }

  function probabilityBins(mean) {
    const bounds = [domain.min, ...state.thresholds, domain.max];
    const probabilities = [];
    for (let i = 0; i < bounds.length - 1; i += 1) {
      const lower = i === 0 ? 0 : cdf(bounds[i], mean);
      const upper = i === bounds.length - 2 ? 1 : cdf(bounds[i + 1], mean);
      probabilities.push(Math.max(0, upper - lower));
    }
    const total = probabilities.reduce((sum, probability) => sum + probability, 0);
    return probabilities.map((probability) => probability / total);
  }

  function render() {
    handles.forEach(({ group, line, dot }, index) => {
      const position = x(state.thresholds[index]);
      line.setAttribute("x1", position); line.setAttribute("x2", position);
      dot.setAttribute("cx", position);
      group.setAttribute("aria-valuenow", state.thresholds[index].toFixed(2));
    });
    const dPrime = state.separation.toFixed(2);
    const noise = probabilityBins(0);
    const signal = probabilityBins(state.separation);
    if (readout) readout.textContent = `d′ = ${dPrime} · criteria shift responses, not discriminability`;
    const bars = document.querySelectorAll("[data-probability-bar]");
    bars.forEach((bar, barIndex) => {
      bar.replaceChildren();
      const values = barIndex === 0 ? noise : signal;
      let offset = 0;
      values.forEach((probability, index) => {
        const segment = document.createElement("span");
        segment.style.width = `${probability * 100}%`;
        segment.style.backgroundColor = ["#18876f", "#4668db", "#f2bb22", "#e94268", "#20205c", "#f9e8b1"][index];
        segment.setAttribute("title", `Category ${index + 1}: ${(probability * 100).toFixed(1)}%`);
        segment.setAttribute("aria-label", `Category ${index + 1}, ${(probability * 100).toFixed(1)} percent`);
        bar.appendChild(segment);
        offset += probability;
      });
      bar.dataset.total = offset.toFixed(5);
    });
  }

  render();
})();
