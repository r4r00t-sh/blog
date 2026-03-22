"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

type SharePostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareUrl: string;
  slug: string;
};

/** Three-node “share” network (distinct from the tray-style download icon). */
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8.7 10.3 15.3 6.7M8.7 13.7 15.3 17.3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3v10.5m0 0 3.5-3.5M12 13.5 8.5 10M5 21h14a2 2 0 002-2v-1H3v1a2 2 0 002 2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SharePostModal({ isOpen, onClose, title, shareUrl, slug }: SharePostModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "error">("idle");

  const ogImageUrl = `${shareUrl.replace(/\/$/, "")}/opengraph-image`;
  const safeFileSlug = slug.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "post";

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    document.addEventListener("keydown", handleEscape);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    setCopyState("idle");
    setDownloadState("idle");
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = prev;
    };
  }, [isOpen, handleEscape]);

  const downloadOgImage = async () => {
    setDownloadState("loading");
    const filename = `r4r00t-${safeFileSlug}-og.png`;
    try {
      const res = await fetch(ogImageUrl);
      if (!res.ok) {
        throw new Error(String(res.status));
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      setDownloadState("idle");
    } catch {
      setDownloadState("error");
      window.open(ogImageUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => setDownloadState("idle"), 2000);
    }
  };

  const twitterHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  const shareInstagram = async () => {
    setCopyState("idle");
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url: shareUrl });
        return;
      }
    } catch {
      /* user cancelled share sheet */
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2500);
    } catch {
      setCopyState("idle");
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4 sm:pb-4 sm:pt-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Close share dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[201] mx-auto w-full max-w-lg border border-[var(--page-border)] bg-[var(--page-surface)] shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-[var(--page-border)] px-4 py-3">
          <h2 id={titleId} className="text-sm font-semibold uppercase tracking-wide text-[var(--page-text-strong)]">
            Share preview
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="border border-[var(--page-chip-border)] px-2 py-1 text-xs text-[var(--page-muted)] transition-colors hover:border-[var(--page-hover-border)] hover:text-[var(--page-text)]"
          >
            Close
          </button>
        </div>

        <div className="max-h-[min(78dvh,640px)] overflow-y-auto p-3 sm:max-h-[min(78vh,640px)] sm:p-4">
          <div className="overflow-hidden border border-[var(--page-border-soft)] bg-[var(--article-code-bg)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic OG route; no build-time src */}
            <img src={ogImageUrl} alt="" className="h-auto w-full object-cover" width={1200} height={630} />
          </div>
          <p className="mt-2 text-center text-[11px] text-[var(--page-label)]">How social apps may show this link</p>

          <button
            type="button"
            onClick={() => void downloadOgImage()}
            disabled={downloadState === "loading"}
            className="mt-3 flex w-full items-center justify-center gap-2 border border-[var(--page-chip-border)] py-2.5 text-xs font-medium text-[var(--page-text)] transition-colors hover:border-[var(--page-hover-border)] hover:text-[var(--page-text-strong)] disabled:opacity-60"
          >
            <DownloadIcon className="shrink-0" />
            {downloadState === "loading" ? "Preparing download…" : "Download preview image"}
          </button>
          {downloadState === "error" ? (
            <p className="mt-1 text-center text-[11px] text-[var(--page-muted)]">Opened image in a new tab — use Save as there.</p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-stretch justify-center gap-6 border-t border-[var(--page-border-soft)] pt-6">
            <a
              href={twitterHref}
              target="_blank"
              rel="noreferrer"
              className="flex w-[4.5rem] flex-col items-center gap-2 text-[var(--page-text)]"
            >
              <span className="flex h-12 w-12 items-center justify-center border border-[var(--page-chip-border)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
                <TwitterIcon />
              </span>
              <span className="text-[10px] uppercase tracking-wide text-[var(--page-muted)]">X</span>
            </a>
            <a
              href={linkedInHref}
              target="_blank"
              rel="noreferrer"
              className="flex w-[4.5rem] flex-col items-center gap-2 text-[var(--page-text)]"
            >
              <span className="flex h-12 w-12 items-center justify-center border border-[var(--page-chip-border)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
                <LinkedInIcon />
              </span>
              <span className="text-[10px] uppercase tracking-wide text-[var(--page-muted)]">LinkedIn</span>
            </a>
            <button
              type="button"
              onClick={() => void shareInstagram()}
              aria-label="Share or copy link for Instagram"
              className="flex w-[4.5rem] flex-col items-center gap-2 text-[var(--page-text)]"
            >
              <span className="flex h-12 w-12 items-center justify-center border border-[var(--page-chip-border)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
                <InstagramIcon />
              </span>
              <span className="text-[10px] uppercase tracking-wide text-[var(--page-muted)]">Instagram</span>
            </button>
          </div>
          <p className="mt-3 text-center text-[11px] text-[var(--page-muted)]" role="status">
            {copyState === "copied"
              ? "Link copied — paste it in Instagram or your story."
              : "Instagram: use share sheet on mobile, or copy link to paste in the app."}
          </p>
        </div>
      </div>
    </div>
  );
}

function CopyUrlIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const tooltipClass =
  "pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded border border-[var(--page-border)] bg-[var(--page-surface)] px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-[var(--page-muted)] opacity-0 shadow-sm ring-1 ring-black/[0.04] transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100";

function IconHoverTip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className={tooltipClass} role="tooltip">
        {text}
      </span>
    </span>
  );
}

export function SharePostTrigger({ onClick, expanded }: { onClick: () => void; expanded: boolean }) {
  return (
    <IconHoverTip text="Share post">
      <button
        type="button"
        onClick={onClick}
        aria-label="Share article"
        className="inline-flex h-10 w-10 items-center justify-center rounded text-[var(--page-muted)] transition-colors hover:text-[var(--page-text-strong)]"
        aria-haspopup="dialog"
        aria-expanded={expanded}
      >
        <ShareIcon className="shrink-0" />
      </button>
    </IconHoverTip>
  );
}

const copyBtnClass =
  "inline-flex h-10 w-10 items-center justify-center rounded text-[var(--page-muted)] transition-colors hover:text-[var(--page-text-strong)]";

export function CopyPostUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard denied or unavailable */
    }
  };

  return (
    <IconHoverTip text={copied ? "Copied!" : "Copy URL"}>
      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label={copied ? "Post URL copied" : "Copy post URL"}
        className={`${copyBtnClass} ${copied ? "text-[var(--accent)]" : ""}`}
      >
        {copied ? <CheckIcon className="shrink-0" /> : <CopyUrlIcon className="shrink-0" />}
      </button>
    </IconHoverTip>
  );
}
