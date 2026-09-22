import { useClerk } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native'

export default function profile() {
  const { signOut } = useClerk()
    const router = useRouter();
    const handleSignOut = async () => {
        try {
            await signOut();
            router.replace('/(auth)/sign-in')
        } catch (error) {
            console.error(JSON.stringify(error, null, 2))
        }
    }

  return (
    <View className="flex-1 items-center justify-center">
                <Text className="text-2xl text-center text-green-400 my-10 font-bold">Home</Text>
                <TouchableOpacity onPress={handleSignOut} className="w-1/2 bg-brand-blue py-4 rounded-xl items-center mb-4">
                    <Text>Sign Out</Text>
                </TouchableOpacity>
            </View>
  )
}