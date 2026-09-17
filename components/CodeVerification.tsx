import { CodeFormData, codeSchema } from '@/lib/auth';
import { useSignIn, useSignUp } from '@clerk/expo';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native'

type CodeVerificationProps = {
  email?: string;
};

const CodeVerification = ({ email }: CodeVerificationProps) => {

  const router = useRouter();

  const { signUp, errors, fetchStatus } = useSignUp();
  const { signIn, errors: signInErrors, fetchStatus: signInFetchStatus } = useSignIn();
  const isLoading = fetchStatus === "fetching" || signInFetchStatus === "fetching";

  const { control, handleSubmit, formState: { errors: formErrors } } = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    mode: "onBlur",
    defaultValues: {
      code: "",
    }
  });

  const onVerifyCodePress = async (data: CodeFormData) => {
    if (email) {
      const { error } = await signUp.verifications.verifyEmailCode({
        code: data.code
      })

      if (error) {
        console.error(error)
        return
      }

      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session.currentTask) return
            const url = decorateUrl('/')
            router.replace(url as any)
          }
        })
      } else {
        console.error('Sign-up attempt not complete:', signUp)
      }
    } else {
      const { error } = await signIn.mfa.verifyEmailCode({
        code: data.code
      })

      if (error) {
        console.error(error)
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
      } else {
        console.error('Sign-in attempt not complete:', signIn)
      }
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-brand-body"
    >
      <View className="flex-1 justify-center px-6 -mt-16">
        <Text className="text-3xl font-bold text-center text-[#1A1D26] mb-2 leading-tight">
          Verify your account
        </Text>
        <Text className="text-brand-text-muted text-center text-base mb-8">
          We sent a code to {email}
        </Text>

        <Controller
          control={control}
          name="code"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="border border-[#E8E6DF] bg-white rounded-xl px-4 py-3 mb-2 text-[#1A1D26]"
              placeholder="Enter verification code"
              placeholderTextColor="#8A8D96"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {formErrors.code && (
          <Text className="text-red-500 mb-2 text-sm">{formErrors.code.message}</Text>
        )}
        {errors.fields.code && (
          <Text className="text-red-500 mb-2 text-sm">{errors.fields.code.message}</Text>
        )}
        {signInErrors.fields.code && (
          <Text className="text-red-500 mb-2 text-sm">{signInErrors.fields.code.message}</Text>
        )}
        <TouchableOpacity
          onPress={handleSubmit(onVerifyCodePress)}
          disabled={isLoading}
          className="w-full bg-brand-blue py-4 rounded-xl items-center mb-4"
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-white font-semibold text-base">Verify</Text>
          )
          }
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => signUp.verifications.sendEmailCode()}
          className="py-2"
        >
          <Text className="text-brand-blue text-sm">Resend code</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => signUp.reset()} className="py-2">
          <Text className="text-brand-blue text-sm">Start over</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

export default CodeVerification

