import type { Metadata, Viewport } from "next";
import { Space_Mono } from "next/font/google";
import { NavBar } from "@/components/nav-bar";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const description =
    "Personal blog on system internals, malware research, and kernel work — markdown, Next.js, and a terminal aesthetic.";
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "r4r00t blog",
      template: "%s",
    },
    description,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "/",
      siteName: "R4R00T",
      title: "r4r00t blog",
      description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "R4R00T" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "r4r00t blog",
      description,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title="r4r00t blog" href="/feed.xml" />
      </head>
      <body className="min-h-full bg-background font-mono text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='site-ui-theme',t=localStorage.getItem(k),v={gruvbox-light:1,'gruvbox-dark':1};if(v[t]){document.documentElement.setAttribute('data-site-theme',t);document.cookie=k+'='+encodeURIComponent(t)+'; Path=/; Max-Age=31536000; SameSite=Lax';}}catch(e){}})();`,
          }}
        />
        <NavBar />
        <main className="mx-auto w-full max-w-[100vw] px-4 pt-[var(--nav-stack)] sm:px-6 md:px-10 lg:px-16">
          {children}
        </main>
      </body>
    </html>
  );
}
