(function () {
  var scripts = {};
  var providers = {
    facebook: { id: "oli-facebook-embed", url: "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v25.0" },
    instagram: { id: "oli-instagram-embed", url: "https://www.instagram.com/embed.js" },
    x: { id: "oli-twitter-embed", url: "https://platform.twitter.com/widgets.js" }
  };

  function loadPlatformScript(key) {
    if (scripts[key]) return scripts[key];
    var provider = providers[key];
    if (!provider) return Promise.resolve();
    if (key === "facebook" && !document.getElementById("fb-root")) {
      var root = document.createElement("div");
      root.id = "fb-root";
      document.body.appendChild(root);
    }
    scripts[key] = new Promise(function (resolve) {
      var script = document.getElementById(provider.id);
      if (script) { resolve(); return; }
      script = document.createElement("script");
      script.id = provider.id;
      script.src = provider.url;
      script.async = true;
      script.onload = resolve;
      script.onerror = resolve;
      document.body.appendChild(script);
    });
    return scripts[key];
  }

  function refreshPlatformEmbeds(panel) {
    var keys = {};
    panel.querySelectorAll("[data-oli-platform-embed]").forEach(function (element) {
      var key = element.dataset.oliPlatformEmbed;
      keys[key] = true;
      if (key === "facebook") {
        element.dataset.width = Math.floor(Math.min(500, panel.clientWidth));
      }
    });
    Object.keys(keys).forEach(function (key) {
      loadPlatformScript(key).then(function () {
        if (key === "facebook" && window.FB && window.FB.XFBML) window.FB.XFBML.parse(panel);
        if (key === "instagram" && window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process();
        if (key === "x" && window.twttr && window.twttr.widgets) window.twttr.widgets.load(panel);
      });
    });
  }

  function setupViewer(viewer) {
    if (viewer.dataset.oliVisualReady === "true") return;
    var tabs = Array.from(viewer.querySelectorAll("[data-oli-visual-tab]"));
    var panels = Array.from(viewer.querySelectorAll("[data-oli-visual-panel]"));
    var tabsContainer = viewer.querySelector(".oli-visual-tabs");
    var tabsRail = viewer.querySelector(".oli-visual-tabs__rail");
    if (!tabs.length || !panels.length) return;

    function updateTabRailMetrics() {
      if (!tabsContainer || !tabsRail) return;
      var viewportWidth = document.documentElement.clientWidth || window.innerWidth || 0;
      var railRect = tabsRail.getBoundingClientRect();
      var leftFadeWidth = Math.max(0, railRect.left / 2);
      var rightFadeWidth = Math.max(0, (viewportWidth - railRect.right) / 2);
      tabsContainer.style.setProperty("--oli-visual-tabs-left-fade-width", leftFadeWidth + "px");
      tabsContainer.style.setProperty("--oli-visual-tabs-right-fade-width", rightFadeWidth + "px");
    }

    function activateTab(tab, shouldFocus) {
      var key = tab.dataset.oliVisualTabKey;
      tabs.forEach(function (candidate) {
        var active = candidate === tab;
        candidate.classList.toggle("is-active", active);
        candidate.setAttribute("aria-selected", active ? "true" : "false");
        candidate.tabIndex = active ? 0 : -1;
      });
      panels.forEach(function (panel) {
        var active = panel.dataset.oliVisualPanelKey === key;
        panel.classList.toggle("is-active", active);
        panel.hidden = !active;
        panel.setAttribute("aria-hidden", active ? "false" : "true");
        if (active) refreshPlatformEmbeds(panel);
      });
      if (shouldFocus) tab.focus();
      window.requestAnimationFrame(updateTabRailMetrics);
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () { activateTab(tab, false); });
      tab.addEventListener("keydown", function (event) {
        var next = index;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        activateTab(tabs[next], true);
      });
    });

    var requested = new URLSearchParams(window.location.search).get("view") || "";
    requested = requested.toLowerCase().trim();
    if (requested === "twitter") requested = "x";
    var initial = tabs.find(function (tab) { return tab.dataset.oliVisualTabKey === requested; }) ||
      tabs.find(function (tab) { return tab.getAttribute("aria-selected") === "true"; }) || tabs[0];
    viewer.dataset.oliVisualReady = "true";
    activateTab(initial, false);
    updateTabRailMetrics();
    window.addEventListener("resize", updateTabRailMetrics);
    window.addEventListener("load", updateTabRailMetrics);
  }

  function init() {
    document.querySelectorAll("[data-oli-visual-viewer]").forEach(setupViewer);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
