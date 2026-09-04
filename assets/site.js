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

  const oddLinks = document.querySelectorAll("[data-odd-link]");
  const setOddDestinations = () => {
    oddLinks.forEach((link) => {
      const candidates = (link.dataset.oddCandidates || "").split(",").map((item) => item.trim()).filter(Boolean);
      if (candidates.length < 2) return;

      let previous = "";
      try { previous = window.sessionStorage.getItem("lastOddDestination") || ""; } catch (_) { /* Storage can be unavailable. */ }
      const available = candidates.filter((candidate) => candidate !== previous);
      const target = available[Math.floor(Math.random() * available.length)];
      link.href = target;
      link.addEventListener("click", () => {
        try { window.sessionStorage.setItem("lastOddDestination", target); } catch (_) { /* Navigation still works. */ }
      }, { once: true });
    });
  };

  setOddDestinations();
  window.addEventListener("pageshow", (event) => { if (event.persisted) setOddDestinations(); });
})();
