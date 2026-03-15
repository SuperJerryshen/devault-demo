import { FC, useState, useEffect } from "react";
import { Switch } from "@heroui/react";

import { useTheme } from "@/hooks/useTheme";

export interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const [isMounted, setIsMounted] = useState(false);

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent Hydration Mismatch
  if (!isMounted) return <div className="w-6 h-6" />;

  return (
    <Switch
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className={className}
      isSelected={theme === "light"}
      onChange={() => setTheme(theme === "light" ? "dark" : "light")}
    />
  );
};
