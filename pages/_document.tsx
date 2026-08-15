import { Html, Head, Main, NextScript } from "next/document";
import { inter, tajawal } from "@/lib/fonts";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className={`${inter.variable} ${tajawal.variable}`}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
