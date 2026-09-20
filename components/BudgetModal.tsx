import { Budget } from '@/types'
import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import FormSheetModal from './FormSheetModal'
import { Controller, useForm } from 'react-hook-form'
import { MonthlyBudgetFormData, monthlyBudgetSchema } from '@/lib/schemas/budget'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { COLORS } from '@/constants/theme'
import { useBudgetsMutations } from '@/hooks/mutations/useBudgetsMutations'

export default function BudgetModal({
  visible,
  onClose,
  onSaved,
  budget
}: {
  visible: boolean
  onClose: () => void
  onSaved: () => void
  budget: Budget | null
}) {
  const [error, setError] = useState<string>('');

  const { mutateAsync: setBudget, isPending: saving, error: mutationError } = useBudgetsMutations();

  const { control, handleSubmit, formState: { errors: formErrors } } = useForm<MonthlyBudgetFormData>({
    resolver: zodResolver(monthlyBudgetSchema),
    mode: 'onBlur',
    defaultValues: {
      monthlyBudget: '',
    }
  });

  const handleSave = async (data: MonthlyBudgetFormData) => {
    const parsedAmount = parseFloat(data.monthlyBudget.replace(/,/g, ""));

    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter a valid monthly budget.");
      return;
    }

    setError("");

    try {
      await setBudget(parsedAmount);
      onSaved();
    } catch (error) {
      setError("Something went wrong. Please try again.");
      return
    }
  }
  return (
    <FormSheetModal
      visible={visible}
      onClose={onClose}
      title={budget ? 'Edit monthly budget' : 'New monthly budget'}
    >
      <Text className="text-brand-bg text-xs font-medium mb-1.5">
        Monthly budget
      </Text>
      <Controller
        control={control}
        name="monthlyBudget"
        render={({ field: { value, onChange } }) => (
          <TextInput
            value={value}
            onChangeText={(v) => {
              setError("");
              onChange(v);
            }}
            placeholder="e.g. 50000"
            placeholderTextColor={COLORS.placeholder}
            keyboardType="numeric"
            autoFocus
            className="bg-white border border-[#E8E6DF] rounded-xl px-4 py-3.5 mb-5 text-sm text-brand-bg"
          />
        )}
      />
      {formErrors.monthlyBudget && (
        <Text className="text-red-500 text-sm mb-2">
          {formErrors.monthlyBudget.message}
        </Text>
      )}
      {error && <Text className="text-red-500 text-sm mb-2">{error}</Text>}
      <View className="mb-4" />

      <TouchableOpacity
        onPress={handleSubmit(handleSave)}
        disabled={saving}
        className="bg-brand-bg rounded-xl py-4 items-center mb-3"
        activeOpacity={0.85}
      >
        <Text className="text-white text-sm font-semibold">
          {saving ? "Saving…" : "Save budget"}
        </Text>
      </TouchableOpacity>

    </FormSheetModal>
  )
}