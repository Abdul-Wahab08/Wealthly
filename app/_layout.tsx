import "../global.css"
import { Slot } from "expo-router";
import { ClerkProvider } from '@clerk/expo'
import { tokenCache } from '@clerk/expo/token-cache'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from "@/lib/query/client";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

  if (!publishableKey) throw new Error('Add your Clerk Publishable Key to the .env file')

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <Slot />
      </ClerkProvider>
    </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
