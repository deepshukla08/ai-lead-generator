import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Client-side session stand-in.
 *
 * There is no authentication in this build — `signedIn` gates the UI only, and
 * `activeCompanyId` is what a real session's workspace claim will carry. Both
 * live here so that swapping in real auth means replacing one file, not
 * threading a session through every screen.
 */
interface SessionState {
  signedIn: boolean;
  activeCompanyId: string | null;
  signIn: () => void;
  signOut: () => void;
  setActiveCompany: (id: string | null) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      signedIn: false,
      activeCompanyId: null,
      signIn: () => set({ signedIn: true }),
      signOut: () => set({ signedIn: false, activeCompanyId: null }),
      setActiveCompany: (activeCompanyId) => set({ activeCompanyId }),
    }),
    { name: "agentsdr-session" },
  ),
);
