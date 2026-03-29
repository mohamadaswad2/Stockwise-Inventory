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
        <link rel="icon" href="/favicon.ico" />
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
