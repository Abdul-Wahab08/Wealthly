import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Controller, useForm } from "react-hook-form"
import { SignUpFormData, signUpSchema } from '@/lib/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth, useSignUp } from '@clerk/expo'
import { useState } from 'react'
import CodeVerification from '@/components/CodeVerification'
import { Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

const signUp = () => {
  const [email, setEmail] = useState("")

  const { isSignedIn } = useAuth();

  const { signUp, errors, fetchStatus } = useSignUp()
  const isLoading: boolean = fetchStatus === "fetching"

  const { control, handleSubmit, formState: { errors: formErrors } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    }
  })

  const onSignUpPress = async (data: SignUpFormData) => {
    setEmail(data.email)
    const { error } = await signUp.password({
      emailAddress: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName
    })

    if (error) {
      console.error("Error signing up", JSON.stringify(error, null, 2))
      return
    }

    const { error: sendEmailCode } = await signUp.verifications.sendEmailCode();

    if (sendEmailCode) {
      console.error("Error sending verification email", sendEmailCode)
      return
    }
  }

  if (signUp.status === "complete" || isSignedIn) {
    return null;
  }

  if (signUp.missingFields.length === 0 && signUp.status === "missing_requirements" && signUp.unverifiedFields.includes("email_address")) {
    return (
      <CodeVerification email={email} />
    )
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
          Create account
        </Text>
        <Text className="text-brand-text-muted text-center text-base mb-8">
          Track your money, powered by AI
        </Text>

        <View className="flex-row gap-3 mb-2">
          <Controller
            control={control}
            name="firstName"
            render={({ field: { value, onChange } }) => (
              <TextInput
                className="flex-1 border border-[#E8E6DF] bg-white rounded-xl px-4 py-3 text-[#1A1D26]"
                placeholder="First name"
                placeholderTextColor="#8A8D96"
                value={value}
                onChangeText={onChange}
                autoCapitalize="words"
              />)}
          />

          <Controller
            control={control}
            name="lastName"
            render={({ field: { value, onChange } }) => (
              <TextInput
                className="flex-1 border border-[#E8E6DF] bg-white rounded-xl px-4 py-3 text-[#1A1D26]"
                placeholder="Last name"
                placeholderTextColor="#8A8D96"
                value={value}
                onChangeText={onChange}
                autoCapitalize="words"
              />)}
          />

        </View>
        {(formErrors.firstName || formErrors.lastName) && (
          <Text className="text-red-500 text-sm mb-2">
            {formErrors.firstName?.message || formErrors.lastName?.message}
          </Text>
        )}

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
        {errors.fields.emailAddress && (
          <Text className="text-red-500 text-sm mb-2">
            {errors.fields.emailAddress.message}
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
          onPress={handleSubmit(onSignUpPress)}
          disabled={isLoading}
          className="w-full bg-brand-blue py-4 rounded-xl items-center mb-4"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">Sign up</Text>
          )

          }</TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-brand-text-muted">
            Already have an account?{" "}
          </Text>
          <Link href="/sign-in">
            <Text className="text-brand-blue font-semibold">Sign In</Text>
          </Link>
        </View>

        <View nativeID="clerk-captcha" />
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

export default signUp