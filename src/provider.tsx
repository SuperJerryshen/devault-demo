import { RouterProvider, I18nProvider } from "@heroui/react";
import { ToastProvider, toastQueue } from "@heroui/react";
import { useHref, useNavigate } from "react-router-dom";

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <I18nProvider>
      <RouterProvider navigate={navigate} useHref={useHref}>
        <ToastProvider placement="top" queue={toastQueue} />
        {children}
      </RouterProvider>
    </I18nProvider>
  );
}
