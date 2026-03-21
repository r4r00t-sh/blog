import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import { NavBar } from "@/components/nav-bar";
import "./globals.css";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "r4r00t blog",
  description: "Personal blog powered by markdown and Next.js 14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceMono.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-background font-mono text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='site-ui-theme',t=localStorage.getItem(k),v={gruvbox-light:1,'gruvbox-dark':1};if(v[t]){document.documentElement.setAttribute('data-site-theme',t);document.cookie=k+'='+encodeURIComponent(t)+'; Path=/; Max-Age=31536000; SameSite=Lax';}}catch(e){}})();`,
          }}
        />
        <NavBar />
        <main className="w-full px-16 pt-[var(--nav-stack)]">{children}</main>
      </body>
    </html>
  );
}
