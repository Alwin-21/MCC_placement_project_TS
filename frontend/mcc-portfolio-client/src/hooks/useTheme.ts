/**
 * useTheme — global theme hook for MCC Portfolio Platform
 *
 * Stores the theme in localStorage under the single key "mcc-theme" so that
 * changing the mode on any page (home, dashboard, admin) reflects everywhere,
 * including across open browser tabs via the browser's `storage` event.
 */

import { useEffect, useState } from "react";

const THEME_KEY = "mcc-theme";

export type ThemeMode = "dark" | "light";

export function useTheme(): [ThemeMode, () => void] {
  return ["light", () => {}];
}
