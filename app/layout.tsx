"use client";

import "./globals.css";
import { ReactNode } from "react";

const fontFamily = `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Cricket 26 2D</title>
        <meta
          name="description"
          content="Cricket 26 2D — a top-down cricket simulation with deep management tools."
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body style={{ fontFamily }}>{children}</body>
    </html>
  );
}
