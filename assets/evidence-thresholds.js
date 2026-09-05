(() => {
  const NS = "http://www.w3.org/2000/svg";
  const plot = { left: 45, right: 605, top: 28, bottom: 232 };
  const domain = { min: -3.2, max: 4.2 };
  const defaults = { separation: 1.55, thresholds: [-1.15, -0.55, 0, 0.55, 1.15] };

  const erf = (value) => {
    const sign = value < 0 ? -1 : 1;
    const x = Math.abs(value);
    const a1 = .254829592, a2 = -.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
    const p = .3275911;
    const t = 1 / (1 + p * x);
    return sign * (1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
  };
  const cdf = (value, mean) => 0.5 * (1 + erf((value - mean) / Math.SQRT2));
  const normal = (value, mean) => Math.exp(-0.5 * (value - mean) ** 2) / Math.sqrt(2 * Math.PI);

  document.querySelectorAll("[data-evidence-component]").forEach((root) => {
    if (root.dataset.enhanced) return;
    root.dataset.enhanced = "true";
    const svg = root.querySelector("[data-threshold-svg]");
    const separationInput = root.querySelector("[data-separation-control]");
    const separationOutput = root.querySelector("[data-separation-output]");
    const readout = root.querySelector("[data-evidence-readout]");
    const reset = root.querySelector("[data-threshold-reset]");
    const state = { separation: defaults.separation, thresholds: [...defaults.thresholds] };
    let activeThreshold = null;

    const x = (value) => plot.left + ((value - domain.min) / (domain.max - domain.min)) * (plot.right - plot.left);
    const y = (value) => plot.bottom - value * (plot.bottom - plot.top);
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
    const valueFromEvent = (event) => {
      const rect = svg.getBoundingClientRect();
      const coordinate = ((event.clientX - rect.left) / rect.width) * 640;
      return domain.min + ((coordinate - plot.left) / (plot.right - plot.left)) * (domain.max - domain.min);
    };
    const updateThreshold = (index, value) => {
      const lower = index === 0 ? domain.min : state.thresholds[index - 1] + .05;
      const upper = index === state.thresholds.length - 1 ? domain.max : state.thresholds[index + 1] - .05;
      state.thresholds[index] = Math.max(lower, Math.min(upper, value));
      render();
    };
    const probabilityBins = (mean) => {
      const bounds = [domain.min, ...state.thresholds, domain.max];
      const probabilities = bounds.slice(0, -1).map((lowerBound, index) => {
        const upperBound = bounds[index + 1];
        const lower = index === 0 ? 0 : cdf(lowerBound, mean);
        const upper = index === bounds.length - 2 ? 1 : cdf(upperBound, mean);
        return Math.max(0, upper - lower);
      });
      const total = probabilities.reduce((sum, probability) => sum + probability, 0);
      return probabilities.map((probability) => probability / total);
    };

    svg.querySelectorAll(".threshold-fallback-noise, .threshold-fallback-signal").forEach((path) => path.remove());
    const curveLayer = make("g", { "aria-hidden": "true" });
    const noiseCurve = make("path", { class: "curve-noise" }, curveLayer);
    const signalCurve = make("path", { class: "curve-signal" }, curveLayer);
    const thresholdLayer = make("g", { "aria-label": "Five ordered response thresholds" });
    const handles = state.thresholds.map((_, index) => {
      const group = make("g", { role: "slider", tabindex: "0", "aria-label": `Threshold ${index + 1}`, "aria-valuemin": domain.min, "aria-valuemax": domain.max }, thresholdLayer);
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

    separationInput?.addEventListener("input", () => {
      state.separation = Number(separationInput.value);
      render();
    });
    reset?.addEventListener("click", () => {
      state.separation = defaults.separation;
      state.thresholds = [...defaults.thresholds];
      if (separationInput) separationInput.value = String(defaults.separation);
      render();
    });

    function render() {
      noiseCurve.setAttribute("d", pathFor(0));
      signalCurve.setAttribute("d", pathFor(state.separation));
      handles.forEach(({ group, line, dot }, index) => {
        const position = x(state.thresholds[index]);
        line.setAttribute("x1", position); line.setAttribute("x2", position);
        dot.setAttribute("cx", position);
        group.setAttribute("aria-valuenow", state.thresholds[index].toFixed(2));
      });
      if (separationOutput) separationOutput.textContent = state.separation.toFixed(2);
      if (readout) readout.textContent = `d′ = ${state.separation.toFixed(2)} · criteria shift responses, not discriminability`;
      [probabilityBins(0), probabilityBins(state.separation)].forEach((values, barIndex) => {
        const bar = root.querySelectorAll("[data-probability-bar]")[barIndex];
        if (!bar) return;
        bar.replaceChildren();
        values.forEach((probability, index) => {
          const segment = document.createElement("span");
          segment.style.width = `${probability * 100}%`;
          segment.style.backgroundColor = ["#3158c9", "#5474d4", "#8ea4e5", "#d1daf5", "#282826", "#ebe8df"][index];
          segment.title = `Category ${index + 1}: ${(probability * 100).toFixed(1)}%`;
          segment.setAttribute("aria-label", `Category ${index + 1}, ${(probability * 100).toFixed(1)} percent`);
          bar.appendChild(segment);
        });
        bar.dataset.total = values.reduce((sum, value) => sum + value, 0).toFixed(5);
      });
    }

    render();
  });
})();
