"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { useSession } from "@/lib/store";

const noopSubscribe = () => () => {};

/**
 * Sends signed-out visitors to /login so the app has a front door.
 *
 * This is presentation, not security — there is no authentication and the API
 * is wide open. It exists so the sign-in screen is part of the flow rather than
 * a page nobody reaches.
 *
 * The client check matters: the server renders with an empty store, and zustand
 * rehydrates from localStorage during the first client render. Deciding before
 * that would bounce an already-signed-in user straight back to /login.
 * `useSyncExternalStore` gives us that check without setting state in an effect.
 */
export function SessionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const signedIn = useSession((s) => s.signedIn);
  const onClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (onClient && !signedIn) router.replace("/login");
  }, [onClient, signedIn, router]);

  if (!onClient || !signedIn) return null;
  return <>{children}</>;
}
