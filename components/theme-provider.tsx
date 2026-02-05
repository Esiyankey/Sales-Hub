"use client";

import * as React from "react";

// ThemeProvider retained as a simple light-mode passthrough.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
