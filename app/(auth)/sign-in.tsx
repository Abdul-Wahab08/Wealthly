import CodeVerification from '@/components/CodeVerification'
import { SignInFormData, signInSchema } from '@/lib/schemas/auth'
import { useAuth, useSignIn } from '@clerk/expo'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useRouter } from 'expo-router'
import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const signIn = () => {
  const { isSignedIn } = useAuth();
  const { signIn, errors, fetchStatus } = useSignIn()

  const isLoading: boolean = fetchStatus === "fetching";

  const router = useRouter()

  const { control, handleSubmit, formState: { errors: formErrors } } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    }
  });

  const onSignInPress = async (data: SignInFormData) => {
    const { error } = await signIn.password({
      identifier: data.email,
      password: data.password
    })

    if (error) {
      console.error(JSON.stringify(error, null, 2))
      return
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session.currentTask) return
          const url = decorateUrl('/')
          router.replace(url as any)
        }
      })
    } else if (signIn.status === 'needs_client_trust') {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === 'email_code',
      )

      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode()
      }
    } else {
      console.error('Sign-in attempt not complete:', signIn)
    }

  }

  if (signIn.status === "needs_client_trust") {
    return <CodeVerification />
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-brand-body"
    >
      <SafeAreaView className="flex-1 justify-center px-6 -mt-16">
        <Text className="text-5xl font-bold text-center text-blue-500 mb-2 leading-tight">
          Wealthly
        </Text>
        <Text className="text-3xl font-bold text-center text-[#1A1D26] mb-2 leading-tight">
          Welcome back
        </Text>
        <Text className="text-brand-text-muted text-center text-base mb-8">
          Sign in to your account
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange } }) => (
            <TextInput
              className="border border-[#E8E6DF] bg-white rounded-xl px-4 py-3 mb-2 text-[#1A1D26]"
              placeholder="Enter your email"
              placeholderTextColor="#8A8D96"
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
            />)}
        />
        {formErrors.email && (
          <Text className="text-red-500 text-sm mb-2">
            {formErrors.email?.message}
          </Text>
        )}
        {errors.fields.identifier && (
          <Text className="text-red-500 text-sm mb-2">
            {errors.fields.identifier.message}
          </Text>
        )}

        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange } }) => (
            <TextInput
              className="border border-[#E8E6DF] bg-white rounded-xl px-4 py-3 mb-2 text-[#1A1D26]"
              placeholder="Password"
              placeholderTextColor="#8A8D96"
              value={value}
              onChangeText={onChange}
              secureTextEntry
            />)}
        />

        {formErrors.password && (
          <Text className="text-red-500 text-sm mb-2">
            {formErrors.password?.message}
          </Text>
        )}
        {errors.fields.password && (
          <Text className="text-red-500 text-sm mb-2">
            {errors.fields.password.message}
          </Text>
        )}

        <TouchableOpacity
          onPress={handleSubmit(onSignInPress)}
          disabled={isLoading}
          className="w-full bg-brand-blue py-4 rounded-xl items-center mb-4"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">Sign In</Text>
          )

          }</TouchableOpacity>

       <View className="flex-row justify-center">
          <Text className="text-brand-text-muted">
            Don't have an account{" "}
          </Text>
          <Link href="/sign-up">
            <Text className="text-brand-blue font-semibold">Sign Up</Text>
          </Link>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

export default signIn