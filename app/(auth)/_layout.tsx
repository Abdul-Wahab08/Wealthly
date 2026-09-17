import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";

const _layout = () => {

    const { isSignedIn, isLoaded } = useAuth();

    if (!isLoaded) return null;

    if (isSignedIn) <Redirect href="/(root)/(tabs)" />

    return (
        <Stack screenOptions={{ headerShown: false }} />
    )
}

export default _layout
