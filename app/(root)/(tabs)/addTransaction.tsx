import { useCreateTransaction } from '@/hooks/mutations/useTransactionsMutation'
import { AddTransactionFormData } from '@/lib/schemas/addTransaction'
import { Account, InputMethod } from '@/types';
import { useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View, Text, KeyboardAvoidingView, Platform, ActivityIndicator, TouchableOpacity } from 'react-native'
import { addTransactionSchema } from '@/lib/schemas/addTransaction';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAccountsQuery } from '@/hooks/queries/useAccountsQuery';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';
import CapsuleGroup from '@/components/CapsuleGroup';
import { format } from 'date-fns';
import DatePicker from '@/components/DatePicker';

const TYPE_OPTIONS = [
  { key: "EXPENSE" as const, label: "Expense" },
  { key: "INCOME" as const, label: "Income" },
];

const DEFAULT_VALUES = (accounts: Account[]): AddTransactionFormData => ({
  type: "EXPENSE",
  amount: "",
  category: "food",
  account: accounts[0]?.id ?? "",
  description: "",
  date: new Date(),
});

export default function addTransaction() {
  const [inputMethod, setInputMethod] = useState<InputMethod>("MANUAL");
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { user } = useUser();
  const router = useRouter();

  const { mutateAsync: createTransaction, isPending: saving } = useCreateTransaction()
  const { data: accounts = [], isLoading: isLoadingAccounts, error: accountsError } = useAccountsQuery()

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue
  } = useForm<AddTransactionFormData>({
    resolver: zodResolver(addTransactionSchema),
    mode: "onBlur",
    defaultValues: DEFAULT_VALUES([])
  })

  const type = watch("type");
  const category = watch("category");
  const accountId = watch("account");
  const date = watch("date");

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const onSubmit = async (data: AddTransactionFormData) => {
    if (!user) return
    setError('');

    const parsedAmount = parseFloat(data.amount.replace(/,/g, ""));
    try {
      await createTransaction({
        user_id: user.id,
        account_id: data.account,
        type: data.type,
        amount: parsedAmount,
        category: data.category,
        description: data.description,
        date: data.date.toISOString(),
        input_method: inputMethod,
        voice_transcript: inputMethod === "VOICE" ? voiceTranscript : null
      })

      reset();

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(root)/(tabs)/transactions");
      }
    } catch (error) {
      console.log("Error creating transaction ", error)
      setError("Something went wrong. Please try again.")
    }
  }
  return (
    <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
      <View className="px-5 pt-3 pb-2">
        <Text className="text-brand-bg text-xl font-semibold">
          Add transaction
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {isLoadingAccounts ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#4A9EFF" />
          </View>
        ) : accountsError ? (
          <View className="flex-1 items-center justify-center px-10">
            <Feather name="alert-circle" size={32} color="#FF6B4A" />
            <Text className="text-brand-text-muted text-sm mt-3 text-center">
              Couldn&apos;t load your accounts.
            </Text>
          </View>
        ) : accounts.length === 0 ? (
          <View className="flex-1 items-center justify-center px-10">
            <Feather name="alert-circle" size={32} color="#FF6B4A" />
            <Text className="text-brand-text-muted text-sm mt-3 text-center">
              You need an account before adding a transaction.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 100,
            }}
          >
            {/* <View className="flex-row gap-2.5 mb-4">
              <AIActionCard
                icon="camera"
                title="Scan receipt"
                subtitle="Snap a photo"
                colors={AI_GRADIENT}
                onPress={() => setScannerOpen(true)}
              />
              <AIActionCard
                icon="mic"
                title="Voice log"
                subtitle="Just say it"
                colors={AI_GRADIENT_REVERSE}
                onPress={() => setVoiceModalOpen(true)}
              />
            </View> */}

            {/* Type toggle */}
            <View className="flex-row bg-white rounded-xl border border-[#E8E6DF] p-1 mb-4">
              {TYPE_OPTIONS.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => {
                    setValue("type", t.key);
                    setValue(
                      "category",
                      t.key === "INCOME"
                        ? INCOME_CATEGORIES[0].key
                        : EXPENSE_CATEGORIES[0].key
                    );
                  }}
                  className={`flex-1 py-2 rounded-lg items-center ${type === t.key ? "bg-brand-bg" : ""
                    }`}
                >
                  <Text
                    className={`text-xs font-medium ${type === t.key
                        ? "text-white"
                        : "text-brand-text-secondary"
                      }`}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount */}
            <Text className="text-brand-bg text-xs font-medium mb-1.5">
              Amount
            </Text>
            <Controller
              control={control}
              name="amount"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  value={value}
                  onChangeText={(v) => {
                    setError("");
                    onChange(v);
                  }}
                  onBlur={onBlur}
                  placeholder="0"
                  placeholderTextColor="#8A8D96"
                  keyboardType="numeric"
                  className="bg-white border border-[#E8E6DF] rounded-xl px-4 py-3.5 text-sm text-brand-bg"
                />
              )}
            />
            {errors.amount && (
              <Text className="text-brand-coral text-xs mt-1.5">
                {errors.amount.message}
              </Text>
            )}
            <View className="mb-4" />

            {/* Category */}
            <Text className="text-brand-bg text-xs font-medium mb-1.5">
              Category
            </Text>
            <View className="mb-4">
              <CapsuleGroup
                options={categories.map((c) => ({
                  key: c.key,
                  label: c.label,
                  icon: c.icon,
                }))}
                value={category}
                onChange={(key) => setValue("category", key)}
              />
            </View>

            {/* Account */}
            <Text className="text-brand-bg text-xs font-medium mb-1.5">
              Account
            </Text>
            <View className="mb-1">
              <CapsuleGroup
                options={accounts.map((a) => ({ key: a.id, label: a.name }))}
                value={accountId}
                onChange={(key) => setValue("account", key)}
              />
            </View>
            {errors.account && (
              <Text className="text-brand-coral text-xs mb-3">
                {errors.account.message}
              </Text>
            )}
            <View className="mb-3" />

            {/* Date */}
            <Text className="text-brand-bg text-xs font-medium mb-1.5">
              Date
            </Text>
            <TouchableOpacity
              onPress={() => setDatePickerOpen((v) => !v)}
              className="flex-row items-center justify-between bg-white border border-[#E8E6DF] rounded-xl px-4 py-3.5 mb-1"
            >
              <Text className="text-sm text-brand-bg">
                {format(date, "d MMM yyyy")}
              </Text>
              <Feather name="calendar" size={16} color="#5C5F68" />
            </TouchableOpacity>

            {datePickerOpen && (
              <DatePicker
                selected={selectedDate}
                onChange={(selectedDate) => {
                  setValue("date", selectedDate)
                  setDatePickerOpen(false)
                }}
                maxDate={new Date()}
              />
            )}

            {!datePickerOpen && <View className="mb-4" />}

            {/* Description */}
            <Text className="text-brand-bg text-xs font-medium mb-1.5">
              Description (optional)
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g. Food Panda order"
                  placeholderTextColor="#8A8D96"
                  className="bg-white border border-[#E8E6DF] rounded-xl px-4 py-3.5 mb-4 text-sm text-brand-bg"
                />
              )}
            />

            {error ? (
              <Text className="text-brand-coral text-xs mb-4">{error}</Text>
            ) : null}

            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={saving}
              className="bg-brand-blue py-4 rounded-xl items-center mb-4"
            >
              <Text className="text-white text-base font-medium">
                {saving ? "Saving..." : "Save Transaction"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}