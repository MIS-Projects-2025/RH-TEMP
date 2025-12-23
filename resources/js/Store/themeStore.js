import { DARK_THEME_NAME, LIGHT_THEME_NAME } from "@/Constants/colors";
import { create } from "zustand";

export const useThemeStore = create((set) => {
  const localStorageName = "theme";

  return {
    theme: localStorage.getItem(localStorageName) || LIGHT_THEME_NAME,

    setTheme: (newTheme) => {
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem(localStorageName, newTheme);
      set({ theme: newTheme });
    },

    toggleTheme: () =>
      set((state) => {
        const newTheme =
          state.theme === LIGHT_THEME_NAME ? DARK_THEME_NAME : LIGHT_THEME_NAME;
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem(localStorageName, newTheme);
        return { theme: newTheme };
      }),
  };
});