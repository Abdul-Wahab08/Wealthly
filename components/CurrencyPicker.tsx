import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import cc from "currency-codes"
import getSymbolFromCurrency from 'currency-symbol-map'

interface Props {
    visible: boolean,
    onClose: () => void,
    onPick: (code: Currency) => void,
    selectedCode: string
}

export type Currency = {
    code: string,
    name: string,
    symbol: string
}

export const allCurrencies: Currency[] = cc.codes().map((code) => ({
    code,
    name: cc.code(code)?.currency ?? code,
    symbol: getSymbolFromCurrency(code) ?? code
}))
    .filter((c) => c.code !== c.symbol)

export default function CurrencyPicker({ visible, onClose, onPick, selectedCode }: Props) {
    const [search, setSearch] = useState<string>('');

    const filteredCurrencies = useMemo(() => {
        const query = search.toLowerCase();
        if (!query) return allCurrencies
        return allCurrencies.filter((c) => c.code.toLowerCase().includes(query));
    }, [search])

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
                <View className="flex-row items-center px-5 pt-3 pb-2 gap-3">
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search currency…"
                        placeholderTextColor="#8A8D96"
                        autoFocus
                        className="flex-1 bg-white border border-[#E8E6DF] rounded-full px-4 py-2.5 text-sm text-brand-bg"
                    />
                    <TouchableOpacity
                        onPress={() => {
                            setSearch("");
                            onClose();
                        }}
                    >
                        <Text className="text-brand-text-secondary text-sm">Cancel</Text>
                    </TouchableOpacity>
                    </View>

                    <FlatList
                        data={filteredCurrencies}
                        keyExtractor={(item) => item.code}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => {
                                    onPick(item);
                                    setSearch("");
                                }}
                                className="flex-row items-center px-5 py-3.5 border-b border-[#F0EDE6]"
                            >
                                <Text className="text-brand-text-secondary w-8 text-sm">
                                    {item.symbol}
                                </Text>
                                <Text className="text-brand-bg text-sm font-medium w-12">
                                    {item.code}
                                </Text>
                                <Text
                                    className="text-brand-text-secondary text-sm flex-1"
                                    numberOfLines={1}
                                >
                                    {item.name}
                                </Text>
                                {item.code === selectedCode && (
                                    <Feather name="check" size={16} color="#4A9EFF" />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                    {filteredCurrencies.length === 0 && (
                        <View className="flex-1 items-center justify-center">
                            <Text className="text-brand-text-secondary text-sm">
                                No currencies found
                            </Text>
                        </View>
                    )}
            </SafeAreaView>
        </Modal >
    )
}