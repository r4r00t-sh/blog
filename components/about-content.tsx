"use client";

import { useEffect } from "react";
import { getAnime } from "@/lib/anime";

export function AboutContent() {
  useEffect(() => {
    let mounted = true;
    async function animate() {
      const anime = await getAnime();
      if (!anime || !mounted) {
        return;
      }

      const nodes = document.querySelectorAll(".about-animate");
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }
            anime.animate(entry.target, {
              opacity: [0, 1],
              translateY: [18, 0],
              duration: 500,
              ease: "outExpo",
            });
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.2 },
      );

      nodes.forEach((node) => {
        (node as HTMLElement).style.opacity = "0";
        observer.observe(node);
      });
    }
    void animate();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="space-y-5">
      <p className="about-animate text-xs text-muted">/Info</p>
      <h1 className="about-animate text-2xl uppercase">About</h1>
      <div className="about-animate space-y-4 border border-border p-4 text-sm leading-relaxed text-muted sm:p-5">
        <p className="text-foreground">
          I&apos;m a cybersecurity researcher and malware developer — conjuring exploits from thin air and
          bending Windows internals to my will since before most people knew what a syscall was.
        </p>
        <p>
          My days are spent dissecting malware, poking at system trust boundaries, and occasionally summoning
          cursed code from the depths of kernel space. If it runs on a processor and does something it
          probably shouldn&apos;t, I&apos;m interested.
        </p>
        <p>
          This blog is the spellbook. Expect internals, analysis notes, and research write-ups — written from
          a security perspective, not a product one. No tutorials, no hand-holding. Just dark arts,
          documented.
        </p>
      </div>
    </section>
  );
}
