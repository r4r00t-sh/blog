"use client";

import { useEffect } from "react";

export function useCodeCopyButtons(contentKey: string) {
  useEffect(() => {
    const figures = document.querySelectorAll(
      ".article-content [data-rehype-pretty-code-figure]"
    );

    const buttons: HTMLButtonElement[] = [];

    figures.forEach((figure) => {
      if (figure.querySelector(".code-copy-btn")) return;

      const pre = figure.querySelector("pre");
      if (!pre) return;

      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";
      pre.parentNode!.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy-btn";
      btn.setAttribute("aria-label", "Copy code");
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;
      wrapper.appendChild(btn);

      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code");
        const text = code?.textContent ?? pre.textContent ?? "";
        try {
          await navigator.clipboard.writeText(text);
          btn.classList.add("copied");
          btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>`;
          setTimeout(() => {
            btn.classList.remove("copied");
            btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;
          }, 2000);
        } catch {
          /* clipboard unavailable */
        }
      });

      buttons.push(btn);
    });

    return () => {
      buttons.forEach((btn) => btn.remove());
    };
  }, [contentKey]);
}
