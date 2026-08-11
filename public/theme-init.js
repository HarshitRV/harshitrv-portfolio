(function () {
  var match = document.cookie.match(/(?:^|;\s*)theme=(light|dark)(?:;|$)/);
  var theme = match
    ? match[1]
    : window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
})();
