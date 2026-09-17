import { create } from "zustand";

interface UserStore {
    currency: string;
    setCurrency: (value: string) => void;
    needsOnboarding: boolean | null;
    setNeedsOnboarding: (value: boolean | null) => void;
}

export const userStore = create<UserStore>((set) => ({
    currency: "USD",
    setCurrency: (value) => set({ currency: value }),
    needsOnboarding: null,
    setNeedsOnboarding: (value) => set({ needsOnboarding: value })
}))