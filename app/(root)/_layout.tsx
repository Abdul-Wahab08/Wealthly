import { useUserSync } from "@/hooks/useUserSync";
import { userStore } from "@/store/userStore";
import { useAuth } from "@clerk/expo";
import { Redirect, Slot, usePathname } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function _layout() {
    const { isSignedIn, isLoaded } = useAuth();
    const needsOnboarding = userStore((state) => state.needsOnboarding);
    const pathname = usePathname();

    useUserSync();

    if (!isLoaded) return null;
    if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />

    if (needsOnboarding === null) return (
        <View className="flex-1 bg-brand-body items-center justify-center">
            <ActivityIndicator size="large" color="#1A1D26" />
        </View>
    )

    if (needsOnboarding && pathname !== '/onboarding') return <Redirect href="/(root)/onboarding" />

    if (!needsOnboarding && pathname === '/onboarding') return <Redirect href="/(root)/(tabs)" />

    return <Slot />
}