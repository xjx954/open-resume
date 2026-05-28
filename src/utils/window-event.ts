export function setupResizeHandler(): () => void {
  const handler = () => {
    const windowWidth = document.body.clientWidth;
    const el = document.querySelector(".rs-view-inner") as HTMLElement;
    if (!el) return;
    if (document.querySelector(".rs-view-zoom-shell")) {
      el.style.marginLeft = "0";
      return;
    }
    if (windowWidth < 1250 && windowWidth > 1000) {
      const resetWidth = windowWidth - 450;
      const marginWidth = resetWidth * 0.2;
      const radio = Math.round((resetWidth * 0.8) / 794 * 100);
      el.style.transform = `scale(${radio / 100})`;
      el.style.marginLeft = `${marginWidth / 2}px`;
    } else if (windowWidth >= 1250) {
      el.style.transform = "scale(1)";
      el.style.marginLeft = "auto";
    }
  };

  window.addEventListener("resize", handler);
  handler();

  return () => window.removeEventListener("resize", handler);
}
