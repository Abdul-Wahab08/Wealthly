import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native'

export default function ProfileRow({
    icon,
    label,
    value,
    onPress,
    showChevron = true,
    danger = false,
}: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    danger?: boolean;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={!onPress}
            className="flex-row items-center bg-white px-4 py-3.5 border-b border-[#F0EEE7] last:border-b-0"
        >
            <View className="w-8 h-8 rounded-full bg-[#F5F4F0] items-center justify-center mr-3">
                <Feather name={icon} size={15} color={danger ? "#FF6B4A" : "#5C5F68"} />
            </View>
            <Text
                className={`flex-1 text-sm ${danger ? "text-brand-coral" : "text-brand-bg"
                    }`}
            >
                {label}
            </Text>
            {value && (
                <Text className="text-brand-text-secondary text-xs mr-2">{value}</Text>
            )}
            {showChevron && onPress && (
                <Feather name="chevron-right" size={16} color="#BDC3C7" />
            )}
        </TouchableOpacity>
    )
}