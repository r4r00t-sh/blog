"use client";

import { useEffect } from "react";
import { getAnime } from "@/lib/anime";

export function HomeAnimations() {
  useEffect(() => {
    let mounted = true;
    const observers: IntersectionObserver[] = [];

    async function run() {
      const anime = await getAnime();
      if (!anime || !mounted) {
        return;
      }

      anime.set(".hero-title-word", { opacity: [0, 1], translateY: 40 });
      anime.set(".hero-tagline-word", { opacity: 0, translateY: 14, translateX: 10 });
      anime.set(".hero-marker", { opacity: [0, 1], scale: 0, transformOrigin: "center center" });

      anime.animate(".hero-title-word", {
        opacity: [0, 1],
        translateY: [40, 0],
        delay: anime.stagger(100),
        duration: 700,
        ease: "outExpo",
      });

      anime.animate(".hero-tagline-word", {
        opacity: [0, 1],
        translateY: [14, 0],
        translateX: [10, 0],
        delay: anime.stagger(72, { start: 520 }),
        duration: 820,
        ease: "outExpo",
      });

      anime.animate(".hero-marker", {
        opacity: [0, 1],
        scale: [0, 1],
        delay: anime.stagger(90),
        duration: 500,
        ease: "outExpo",
      });

      const latestSection = document.querySelector("#latest-posts-section");
      if (latestSection) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) {
                return;
              }
              anime.set(".latest-post-row", { opacity: 0, translateX: -12 });
              anime.animate(".latest-post-row", {
                opacity: [0, 1],
                translateX: [-12, 0],
                delay: anime.stagger(55),
                duration: 420,
                ease: "outExpo",
              });
              observer.disconnect();
            });
          },
          { threshold: 0.2 },
        );
        observers.push(observer);
        observer.observe(latestSection);
      }

      const featuredSection = document.querySelector("#featured-post-card");
      if (featuredSection) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) {
                return;
              }
              anime.set("#featured-post-card", { opacity: 0, translateY: 16 });
              anime.animate("#featured-post-card", {
                opacity: [0, 1],
                translateY: [16, 0],
                duration: 450,
                ease: "outExpo",
              });
              observer.disconnect();
            });
          },
          { threshold: 0.25 },
        );
        observers.push(observer);
        observer.observe(featuredSection);
      }
    }

    void run();
    return () => {
      mounted = false;
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return null;
}
