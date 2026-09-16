import "../global.css"
import { Slot } from "expo-router";
import { ClerkProvider } from '@clerk/expo'
import { tokenCache } from '@clerk/expo/token-cache'
import { View, Text } from 'react-native'

export default function RootLayout() {

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

  if (!publishableKey) throw new Error('Add your Clerk Publishable Key to the .env file')

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <Slot />
      <View>
        <Text>Footer</Text>
      </View>
    </ClerkProvider>
  )
}
