import { View, Text, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Controller, useForm } from 'react-hook-form';
import { OnboardingFormData, onboardingSchema } from '@/lib/schemas/onboarding';
import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import CurrencyPicker, { allCurrencies, Currency } from '@/components/CurrencyPicker';
import { useUser } from '@clerk/expo';
import { userStore } from '@/store/userStore';
import { useSupabase } from '@/hooks/useSupabase';
import { router } from 'expo-router';

export default function onboarding() {
  const [pickerOpen, setPickerOpen] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(allCurrencies.filter((c) => c.code === "USD")[0] ?? allCurrencies[0])

  const { user } = useUser();
  const setCurrency = userStore((state) => state.setCurrency)
  const setNeedsOnboarding = userStore((state) => state.setNeedsOnboarding)

  const supabaseClient = useSupabase();

  const { control, handleSubmit, formState: { errors: formErrors } } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: "onBlur",
    defaultValues: {
      startingBalance: "",
    }
  });

  const handleSave = async (data: OnboardingFormData) => {
    const parsed = parseFloat(data.startingBalance.replace(/,/g, ""));
    setSaving(true)
    setError('')

    const { error: updateuserError } = await supabaseClient
      .from("users")
      .update({ currency: selectedCurrency.code })
      .eq("clerk_id", user?.id)

    if (updateuserError) {
      setError("Something went wrong. Please try again.")
      setSaving(false)
      return
    }

    const { data: defaultAccount, error: defaultAccountError } = await supabaseClient
      .from("accounts")
      .select("id, balance")
      .eq("user_id", user?.id)
      .single();

    if (defaultAccountError || !defaultAccount) {
      setError("Something went wrong. Please try again.")
      setSaving(false)
      return
    }

    const { error: transactionError } = await supabaseClient
      .from("transactions")
      .insert({
        account_id: defaultAccount.id,
        user_id: user?.id,
        type: "INCOME",
        category: "other_income",
        amount: parsed,
        description: "Starting balance",
        date: new Date().toISOString(),
        input_method: "MANUAL",
      })

    if (transactionError) {
      setError("Something went wrong. Please try again.")
      setSaving(false)
      return
    }

    const { error: updateBalanceError } = await supabaseClient
      .from("accounts")
      .update({ balance: defaultAccount.balance + parsed })
      .eq("id", defaultAccount.id)

    setSaving(false)

    if (updateBalanceError) {
      setError("Something went wrong. Please try again.")
      return
    }

    setCurrency(selectedCurrency.code)
    setNeedsOnboarding(false)
    setError('')

    router.replace("/(root)/(tabs)")
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-brand-body"
      >
        <View className="flex-1 px-6 justify-center -mt-16">
          <Text className="text-5xl font-bold text-center text-blue-500 mb-2 leading-tight">
            Wealthly
          </Text>
          <Text className="text-3xl font-bold text-center text-[#1A1D26] mb-2 leading-tight">
            Let&apos;s get you set up
          </Text>
          <Text className="text-brand-text-muted text-center text-base mb-8">
            A couple of quick details of personalize your experience.
          </Text>

          <Text className="text-brand-bg text-xs font-medium mb-1.5">
            Starting balance
          </Text>
          <View className="flex-row items-center bg-white border border-[#E8E6DF] rounded-xl px-4 mb-1">
            <Text className="text-brand-text-secondary text-sm mr-2">
             {selectedCurrency.symbol}
            </Text>

            <Controller
              control={control}
              name="startingBalance"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={(v) => {
                    setError("");
                    onChange(v);
                  }}
                  placeholder="e.g. 50000"
                  placeholderTextColor="#8A8D96"
                  keyboardType="numeric"
                  returnKeyType="done"
                  className="flex-1 py-3.5 text-sm text-brand-bg"
                />
              )}
            />
          </View>
          {formErrors.startingBalance && (
            <Text className="text-red-500 text-sm mb-2">
              {formErrors.startingBalance.message}
            </Text>
          )}
          {error && <Text className="text-red-500 text-sm mb-2">{error}</Text>}
          <View className="mb-4" />

          {/* Currency picker */}
          <Text className="text-brand-bg text-xs font-medium mb-1.5">
            Currency
          </Text>
          <TouchableOpacity
            onPress={() => setPickerOpen(true)}
            className="flex-row items-center justify-between bg-white border border-[#E8E6DF] rounded-xl px-4 py-3.5 mb-6"
          >
            <Text className="text-sm text-brand-bg">
             {selectedCurrency.symbol} {selectedCurrency.code} —{" "}
              {selectedCurrency.name}
            </Text>
            <Feather name="chevron-down" size={16} color="#8A8D96" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit(handleSave)}
            disabled={saving}
            className="bg-brand-bg rounded-xl py-4 items-center"
            activeOpacity={0.85}
          >
            <Text className="text-white text-sm font-semibold">
              {saving ? "Saving..." : "Get Started"}
            </Text>
          </TouchableOpacity>
        </View>
        {pickerOpen &&
          <CurrencyPicker
            visible={pickerOpen}
            selectedCode={selectedCurrency.code}
            onClose={() => setPickerOpen(false)}
            onPick={(c) => {
              setSelectedCurrency(c)
              setPickerOpen(false)
            }}
          />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}