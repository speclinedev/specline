export function setupNavigation() {
  const menu = document.getElementById("menuBtn");
  const toc = document.getElementById("toc");
  if (!menu || !toc) return;
  const mobile = matchMedia("(max-width: 1080px)");
  const setOpen = (open: boolean, restoreFocus = false) => {
    const expanded = mobile.matches && open;
    document.body.classList.toggle("toc-open", expanded);
    menu.setAttribute("aria-expanded", String(expanded));
    menu.setAttribute("aria-label", expanded ? "Close navigation" : "Open navigation");
    toc.inert = mobile.matches && !expanded;
    toc.setAttribute("aria-hidden", String(toc.inert));
    if (expanded) toc.querySelector<HTMLAnchorElement>("a")?.focus();
    else if (restoreFocus) menu.focus();
  };
  menu.addEventListener("click", () => setOpen(menu.getAttribute("aria-expanded") !== "true"));
  document.getElementById("tocBackdrop")?.addEventListener("click", () => setOpen(false, true));
  toc.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false, true)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") setOpen(false, true);
  });
  document.addEventListener("focusin", (event) => {
    if (mobile.matches && event.target instanceof Node && !toc.contains(event.target) && event.target !== menu) setOpen(false);
  });
  mobile.addEventListener("change", () => setOpen(false, toc.contains(document.activeElement) && mobile.matches));
  setOpen(false);
}
