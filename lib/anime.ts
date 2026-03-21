export async function getAnime() {
  if (typeof window === "undefined") {
    return null;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return null;
  }

  const mod = await import("animejs");
  return {
    animate: mod.animate,
    stagger: mod.stagger,
    set: mod.set,
  };
}

export function canAnimate() {
  return typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
