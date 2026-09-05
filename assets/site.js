(() => {
  const menuButton = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("#primary-navigation");
  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.textContent = isOpen ? "Close" : "Menu";
    });
  }

  document.querySelectorAll("[data-odd-link]").forEach((link) => {
    const candidates = (link.dataset.oddCandidates || "").split(",").map((item) => item.trim()).filter(Boolean);
    if (candidates.length < 2) return;
    let previous = "";
    try { previous = window.sessionStorage.getItem("lastOddDestination") || ""; } catch (_) { /* Navigation still works. */ }
    const available = candidates.filter((candidate) => candidate !== previous);
    const target = available[Math.floor(Math.random() * available.length)];
    link.href = target;
    link.addEventListener("click", () => {
      try { window.sessionStorage.setItem("lastOddDestination", target); } catch (_) { /* Navigation still works. */ }
    }, { once: true });
  });

  const writingToolbar = document.querySelector("[data-writing-toolbar]");
  if (writingToolbar) {
    const filterButtons = [...writingToolbar.querySelectorAll("[data-writing-filter]")];
    const search = writingToolbar.querySelector("[data-writing-search]");
    const reset = writingToolbar.querySelector("[data-writing-reset]");
    const rows = [...document.querySelectorAll("[data-writing-list] [data-archive-item]")];
    const empty = document.querySelector("[data-writing-empty]");
    let activeFilter = "all";
    const applyWritingFilter = () => {
      const query = (search?.value || "").trim().toLowerCase();
      let visible = 0;
      rows.forEach((row) => {
        const matchesKind = activeFilter === "all" || row.dataset.kind === activeFilter;
        const matchesSearch = !query || (row.dataset.title || "").toLowerCase().includes(query);
        const show = matchesKind && matchesSearch;
        row.hidden = !show;
        if (show) visible += 1;
      });
      if (empty) empty.hidden = visible !== 0;
      if (reset) reset.hidden = activeFilter === "all" && !query;
    };
    filterButtons.forEach((button) => button.addEventListener("click", () => {
      activeFilter = button.dataset.writingFilter || "all";
      filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      applyWritingFilter();
    }));
    search?.addEventListener("input", applyWritingFilter);
    reset?.addEventListener("click", () => {
      activeFilter = "all";
      if (search) search.value = "";
      filterButtons.forEach((item) => item.classList.toggle("is-active", item.dataset.writingFilter === "all"));
      applyWritingFilter();
      search?.focus();
    });
    applyWritingFilter();
  }

  const gardenShell = document.querySelector("[data-garden-shell]");
  if (gardenShell) {
    gardenShell.classList.add("js-enabled");
    const map = gardenShell.querySelector("[data-garden-map-canvas]");
    const svg = gardenShell.querySelector("[data-garden-connections]");
    const nodes = [...gardenShell.querySelectorAll(".garden-node")];
    const listItems = [...gardenShell.querySelectorAll("[data-garden-list-item]")];
    const regions = [...gardenShell.querySelectorAll("[data-garden-region]")];
    const search = gardenShell.querySelector("[data-garden-search]");
    const filterButtons = [...gardenShell.querySelectorAll("[data-garden-filter]")];
    const reset = gardenShell.querySelector("[data-garden-reset]");
    const empty = gardenShell.querySelector("[data-garden-empty]");
    const mapButton = gardenShell.querySelector("[data-garden-view='map']");
    const listButton = gardenShell.querySelector("[data-garden-view='list']");
    let activeFilter = "all";
    let activeNode = null;

    const setView = (view) => {
      gardenShell.dataset.view = view;
      [mapButton, listButton].forEach((button) => {
        if (!button) return;
        const active = button.dataset.gardenView === view;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      drawConnections();
    };

    const position = (element) => {
      const box = element.getBoundingClientRect();
      const parent = map.getBoundingClientRect();
      return { x: box.left - parent.left + box.width / 2, y: box.top - parent.top + box.height / 2 };
    };

    const line = (from, to, className) => {
      const element = document.createElementNS("http://www.w3.org/2000/svg", "line");
      element.setAttribute("x1", from.x); element.setAttribute("y1", from.y);
      element.setAttribute("x2", to.x); element.setAttribute("y2", to.y);
      element.setAttribute("class", className);
      svg.appendChild(element);
    };

    function drawConnections() {
      if (!map || !svg) return;
      svg.replaceChildren();
      const mapBox = map.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${Math.max(1, mapBox.width)} ${Math.max(1, mapBox.height)}`);
      gardenShell.querySelectorAll(".garden-edge-data").forEach((edge) => {
        const source = nodes.find((node) => node.dataset.gardenUrl === edge.dataset.from);
        const target = gardenShell.querySelector(`[data-garden-region="${edge.dataset.toTheme}"] .garden-region-label`);
        if (source && target && !source.hidden) line(position(source), position(target), "garden-edge garden-edge-theme");
      });
      if (!activeNode || activeNode.hidden) return;
      const source = position(activeNode);
      (activeNode.dataset.gardenRelated || "").split(" ").filter(Boolean).forEach((url) => {
        const target = nodes.find((node) => node.dataset.gardenUrl === url);
        if (target && !target.hidden) line(source, position(target), "garden-edge garden-edge-related");
      });
    }

    const applyGardenFilter = () => {
      const query = (search?.value || "").trim().toLowerCase();
      const visibleUrls = new Set();
      const visible = (item) => {
        const themes = (item.dataset.gardenThemes || "").split(" ");
        const kind = item.dataset.gardenKind;
        const title = (item.dataset.gardenTitle || "").toLowerCase();
        return (activeFilter === "all" || kind === activeFilter) && (!query || title.includes(query)) && themes.length > 0;
      };
      nodes.forEach((node) => {
        const show = visible(node);
        node.hidden = !show;
        if (show) visibleUrls.add(node.dataset.gardenUrl);
      });
      listItems.forEach((item) => { item.hidden = !visible(item); });
      regions.forEach((region) => { region.hidden = !region.querySelector(".garden-node:not([hidden])"); });
      if (activeNode?.hidden) activeNode = null;
      if (empty) empty.hidden = visibleUrls.size !== 0;
      if (reset) reset.hidden = activeFilter === "all" && !query;
      drawConnections();
    };

    nodes.forEach((node) => {
      const activate = () => {
        activeNode = node;
        nodes.forEach((item) => item.classList.toggle("is-selected", item === node));
        drawConnections();
      };
      node.addEventListener("mouseenter", activate);
      node.addEventListener("focus", activate);
    });
    filterButtons.forEach((button) => button.addEventListener("click", () => {
      activeFilter = button.dataset.gardenFilter || "all";
      filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      applyGardenFilter();
    }));
    search?.addEventListener("input", applyGardenFilter);
    reset?.addEventListener("click", () => {
      activeFilter = "all";
      if (search) search.value = "";
      filterButtons.forEach((item) => item.classList.toggle("is-active", item.dataset.gardenFilter === "all"));
      applyGardenFilter();
      search?.focus();
    });
    mapButton?.addEventListener("click", () => setView("map"));
    listButton?.addEventListener("click", () => setView("list"));
    window.addEventListener("resize", drawConnections);
    setView(window.matchMedia("(max-width: 767px)").matches ? "list" : "map");
    applyGardenFilter();
  }
})();
