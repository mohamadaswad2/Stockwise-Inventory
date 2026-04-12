import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    /**
     * IMPORTANT: class="dark" set here by default to prevent
     * flash of unstyled light content on first load.
     * ThemeContext will update this class after hydration.
     */
    <Html lang="en" className="dark">
      <Head>
        <meta charSet="utf-8" />
        {/* Favicon — inline SVG gradient logo */}
        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='32' y2='32' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0%25' stop-color='%236366f1'/%3E%3Cstop offset='100%25' stop-color='%23a855f7'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='32' height='32' rx='9' fill='url(%23g)'/%3E%3Crect x='6' y='18' width='5' height='8' rx='1.5' fill='white' opacity='.9'/%3E%3Crect x='13.5' y='12' width='5' height='14' rx='1.5' fill='white'/%3E%3Crect x='21' y='6' width='5' height='20' rx='1.5' fill='white' opacity='.7'/%3E%3C/svg%3E"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Prevent theme flash — runs before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('sw-theme') || 'dark';
              document.documentElement.className = theme;
            } catch(e) {
              document.documentElement.className = 'dark';
            }
          })();
        `}} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
