import { Html, Head, Main, NextScript } from "next/document";
import { inter, tajawal } from "@/lib/fonts";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://utfs.io" />
      </Head>
      <body className={`${inter.variable} ${tajawal.variable}`}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
