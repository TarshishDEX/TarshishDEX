/**
 * Toast provider — re-exports the ToastViewport for clarity.
 * The actual toast state is managed via zustand in toast.tsx.
 * This file exists as a clear import target for app-level toast setup.
 */
export { ToastViewport as ToastProvider } from "@/components/ui/toast";
