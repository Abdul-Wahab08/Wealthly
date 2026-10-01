import { useClerk, useUser } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from "expo-image";
import { useState } from 'react';
import * as ImagePicker from "expo-image-picker";
import ProfileRow from '@/components/ProfileRow';
import { userStore } from '@/store/userStore';
import CurrencyPicker, { Currency } from '@/components/CurrencyPicker';
import { useUpdateCurrency } from '@/hooks/mutations/useUpdateCurrencyMutation';
import AccountModal from '@/components/AccountModal';
import { useAccountsQuery } from '@/hooks/queries/useAccountsQuery';
import { Account, AccountType } from '@/types';
import { formatPrice } from '@/lib/formatPrice';

const ACCOUNT_ICON: Record<AccountType, keyof typeof Feather.glyphMap> = {
    CASH: "dollar-sign",
    BANK: "home",
    CREDIT_CARD: "credit-card",
    SAVINGS: "shield",
};

function SectionLabel({ children }: { children: string }) {
    return (
        <Text className="text-brand-text-muted text-[11px] uppercase tracking-wide mb-2 mt-6 mx-5">{children}
        </Text>
    )
}

export default function profile() {
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [currencyPickerVisible, setCurrencyPickerVisible] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const { signOut } = useClerk()
    const { user } = useUser();
    const router = useRouter();
    const currency = userStore((state) => state.currency)
    const setCurrency = userStore((state) => state.setCurrency)

    const { mutateAsync: updateCurrency, error: updateCurrencyError } = useUpdateCurrency();
    const { data: accounts = [], isLoading: isLoadingAccounts, isError: isErrorAccounts } = useAccountsQuery();

    const closeModal = () => {
        setModalVisible(false);
        setEditingAccount(null);
    }

    const handleSignOut = async () => {
        Alert.alert("Sign out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Sign out",
                style: "destructive",
                onPress: async () => {
                    await signOut();
                    router.replace("/sign-in");
                },
            },
        ]);
    }

    const handlePickAvatar = async () => {
        if (!user) return;
        const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!mediaPermission.granted) {
            Alert.alert("Permission needed",
                "Allow photo library access to set a profile picture.")
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 1,
            allowsEditing: true,
            aspect: [1, 1],
            base64: true
        });

        if (result.canceled) return;
        const asset = result.assets[0];

        setUploadingAvatar(true);
        try {
            const fileName = asset.uri.split("/").pop() || "avatar.jpg";
            const match = /\.(\w+)$/.exec(fileName);
            const mimeType = match ? `image/${match[1]}` : "image/jpeg";
            const dataUrl = `data:${mimeType};base64,${asset.base64}`;
            await user.setProfileImage({
                file: dataUrl,
            })
        } catch (error) {
            Alert.alert("Error", "Couldn't upload your photo. Please try again.");
        } finally {
            setUploadingAvatar(false);
        }
    }

    const handleCurrencyPick = async (currency: Currency) => {
        setCurrencyPickerVisible(false);
        try {
            await updateCurrency(currency.code)
            if (updateCurrencyError) throw updateCurrencyError
            setCurrency(currency.code)
        } catch (error) {
            Alert.alert("Error", "Couldn't update your currency. Please try again.")
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <View className="px-5 pt-3 pb-2">
                    <Text className="text-brand-bg text-xl font-semibold">Profile</Text>
                </View>

                {/* User card */}
                <View className="mx-5 mt-2 bg-brand-bg rounded-2xl px-5 py-6 items-center">
                    <TouchableOpacity
                        onPress={handlePickAvatar}
                        disabled={uploadingAvatar}
                        activeOpacity={0.8}
                        className="w-20 h-20 rounded-full bg-[#1A1D26] items-center justify-center overflow-hidden border-2 border-[#2A2E3A]"
                    >
                        {uploadingAvatar ? (
                            <ActivityIndicator color="#8A8D96" />
                        ) : user?.imageUrl && user.hasImage ? (
                            <Image
                                source={{ uri: user.imageUrl }}
                                style={{ width: 80, height: 80 }}
                                contentFit="cover"
                            />
                        ) : (
                            <Feather name="user" size={30} color="#8A8D96" />
                        )}
                        <View className="absolute bottom-0 inset-x-0 h-6 bg-black/50 items-center justify-center">
                            <Feather name="camera" size={13} color="#F2EFE9" />
                        </View>
                    </TouchableOpacity>

                    <Text className="text-white text-2xl font-bold mt-3.5">
                        {user?.firstName} {user?.lastName}
                    </Text>

                    <View className="flex-row items-center gap-1.5 mt-1">
                        <Feather name="mail" size={11} color="#8A8D96" />
                        <Text
                            className="text-brand-text-secondary text-xs"
                            numberOfLines={1}
                        >
                            {user?.emailAddresses?.[0]?.emailAddress}
                        </Text>
                    </View>
                </View>

                {/* Accounts */}
                <SectionLabel>Accounts</SectionLabel>
                <View className="mx-5 rounded-2xl overflow-hidden border border-[#E8E6DF]">
                    {isLoadingAccounts ? (
                        <View className="bg-white px-4 py-5 items-center">
                            <ActivityIndicator color="#5C5F68" />
                        </View>
                    ) : isErrorAccounts ? (
                        <View className="bg-white px-4 py-5 items-center">
                            <Text className="text-brand-text-muted text-xs">
                                Couldn&apos;t load your accounts.
                            </Text>
                        </View>
                    ) : (
                        accounts.map((account: Account) => (
                            <ProfileRow
                                key={account.id}
                                value={formatPrice(account.balance, currency)}
                                label={account.name + (account.is_default ? " (default)" : "")}
                                icon={ACCOUNT_ICON[account.type]}
                                onPress={() => {
                                    setModalVisible(true)
                                    setEditingAccount(account)
                                }}
                            />
                        ))
                    )}

                    <ProfileRow
                        icon="plus"
                        label="Add account"
                        onPress={() => {
                            setEditingAccount(null)
                            setModalVisible(true)
                        }}
                    />
                </View>

                {/* Preferences */}
                <SectionLabel>Preferences</SectionLabel>
                <View className="mx-5 rounded-2xl overflow-hidden border border-[#E8E6DF]">
                    <ProfileRow
                        icon='dollar-sign'
                        label='Currency'
                        value={currency}
                        onPress={() => setCurrencyPickerVisible(true)}
                    />
                </View>

                <SectionLabel>User Actions</SectionLabel>
                <View className="mx-5 rounded-2xl overflow-hidden border border-[#E8E6DF]">
                    <ProfileRow
                        icon="log-out"
                        label="Sign out"
                        onPress={handleSignOut}
                        danger
                        showChevron={false}
                    />
                </View>
            </ScrollView>

            {user && <AccountModal
                visible={modalVisible}
                onClose={closeModal}
                account={editingAccount}
                onSaved={closeModal}
            />}

            <CurrencyPicker
                visible={currencyPickerVisible}
                onClose={() => setCurrencyPickerVisible(false)}
                onPick={handleCurrencyPick}
                selectedCode={currency}
            />
        </SafeAreaView>
    )
}