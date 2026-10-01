import { Account, AccountType } from '@/types'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import FormSheetModal from './FormSheetModal'
import { Controller, useForm } from 'react-hook-form'
import { AccountFormData, accountSchema } from '@/lib/schemas/account'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { COLORS } from '@/constants/theme'
import { useCreateAccountMutation, useDeleteAccountMutation, useSetDefaultAccountMutation, useUpdateAccountMutation } from '@/hooks/mutations/useAccountsMutation'

const ACCOUNT_TYPES: AccountType[] = ["CASH", "BANK", "CREDIT_CARD", "SAVINGS"];

const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
    CASH: "Cash",
    BANK: "Bank",
    CREDIT_CARD: "Credit card",
    SAVINGS: "Savings",
};

export default function AccountModal({
    visible,
    onClose,
    onSaved,
    account
}: {
    visible: boolean
    onClose: () => void
    onSaved: () => void
    account: Account | null
}) {
    const [error, setError] = useState("");
    const isEditing = !!account;

    const { mutateAsync: createAccount, isPending: createAccountPending } = useCreateAccountMutation();
    const { mutateAsync: updateAccount, isPending: updateAccountPending } = useUpdateAccountMutation();
    const { mutateAsync: setDefaultAccount } = useSetDefaultAccountMutation();
    const { mutateAsync: deleteAccount } = useDeleteAccountMutation();

    const saving = createAccountPending || updateAccountPending;

    useEffect(() => {
        if (visible){
             setError("");
             setValue("name", account?.name ?? "");
             setValue("type", account?.type ?? "CASH");
        }
    }, [visible, account]);

    const { control, handleSubmit, formState: { errors: formErrors }, setValue, watch } = useForm<AccountFormData>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            name: account?.name ?? "",
            type: account?.type ?? "CASH",
        }
    });

    const currentValOfType = watch("type");

    const handleSave = async (data: AccountFormData) => {
        try {
            if (isEditing) await updateAccount({ payload: data, accountId: account!.id });
            else await createAccount(data);
            onSaved();
        } catch (error) {
            setError("Something went wrong. Please try again.");
        }
    }

    const onMadeDefault = async () => {
        if (!isEditing) return;
        try {
            await setDefaultAccount(account!.id);
            onSaved();
        } catch (error) {
            setError("Something went wrong. Please try again.");
        }
    }

    const handleDelete = async () => {
        if (!isEditing) return;
        try {
            const result = await deleteAccount({ accountId: account!.id });
            if (result.isDeleted) {
                onSaved();
                return;
            }

            Alert.alert(
                "Delete account",
                `This will also delete ${result.transactionCount} transaction${result.transactionCount === 1 ? "" : "s"
                }. This can't be undone.`,
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                            try {
                                await deleteAccount({ accountId: account!.id, force: true });
                                onSaved();
                            } catch (error) {
                                Alert.alert("Error", "Couldn't delete this account.");
                            }
                        }
                    }
                ]
            )
        } catch (error) {
            setError("Something went wrong. Please try again.");
        }
    }

    return (
        <FormSheetModal
            visible={visible}
            title={isEditing ? "Edit account" : "Add account"}
            onClose={onClose}
        >
            <Text className="text-brand-bg text-xs font-medium mb-1.5">Name</Text>
            <Controller
                control={control}
                name="name"
                render={({ field: { value, onChange } }) => (
                    <TextInput
                        value={value}
                        onChangeText={(v) => {
                            setError("");
                            onChange(v);
                        }}
                        placeholder="e.g. HDFC Savings"
                        placeholderTextColor={COLORS.placeholder}
                        className="bg-white border border-[#E8E6DF] rounded-xl px-4 py-3.5 text-sm text-brand-bg mb-5"
                    />
                )}
            />
            {formErrors.name && <Text className="text-red-500 text-xs mb-2">{formErrors.name.message}</Text>}
            <Text className="text-brand-bg text-xs font-medium mb-1.5">Type</Text>
            <Controller
                control={control}
                name="type"
                render={() => (
                    <View className="flex-row flex-wrap gap-2 mb-5">
                        {ACCOUNT_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type}
                                onPress={() => setValue("type", type)}
                                className={`px-3.5 py-2 rounded-full border ${currentValOfType === type
                                    ? "bg-brand-bg border-brand-bg"
                                    : "bg-white border-[#E8E6DF]"
                                    }`}
                            >
                                <Text
                                    className={`text-xs font-medium ${currentValOfType === type ? "text-white" : "text-brand-bg"
                                        }`}
                                >
                                    {ACCOUNT_TYPE_LABEL[type]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            />
            {formErrors.type && <Text className="text-red-500 text-xs mb-2">{formErrors.type.message}</Text>}

            {error && <Text className="text-red-500 text-xs mb-2">{error}</Text>}

            <TouchableOpacity
                onPress={handleSubmit(handleSave)}
                disabled={saving}
                className="bg-brand-bg rounded-xl py-4 items-center mb-3"
                activeOpacity={0.85}
            >
                <Text className="text-white text-sm font-semibold">
                    {saving ? "Saving…" : isEditing ? "Save changes" : "Add account"}
                </Text>
            </TouchableOpacity>

            {isEditing && !account.is_default && (
                <TouchableOpacity onPress={onMadeDefault} className="py-3 items-center">
                    <Text className="text-brand-blue text-sm font-medium">
                        Make default
                    </Text>
                </TouchableOpacity>
            )}

            {isEditing && (
                <TouchableOpacity onPress={handleDelete} className="py-3 items-center">
                    <Text className="text-brand-coral text-sm font-medium">
                        Delete account
                    </Text>
                </TouchableOpacity>
            )}

        </FormSheetModal>
    )
}