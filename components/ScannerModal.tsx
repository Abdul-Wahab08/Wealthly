import { useEffect, useRef, useState } from 'react'
import { View, Text, Modal, TouchableOpacity, Alert } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { AI_GRADIENT, COLORS } from '@/constants/theme'
import GradientIconButton from './GradientIconButton'
import * as ImagePicker from 'expo-image-picker';

export default function ScannerModal({
    visible,
    onClose,
    onCaptured,
}: {
    visible: boolean
    onClose: () => void
    onCaptured: (base64Image: string, mimiType: string) => void
}) {
    const cameraRef = useRef<CameraView>(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [capturing, setCapturing] = useState(false);

    useEffect(() => {
        if (visible && !permission?.granted) requestPermission();
    }, [visible])

    const handlePickFromLibrary = async () => {
        const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!mediaPermission.granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 1,
            base64: true
        });

        if (result.canceled) return;
        const image = result.assets[0];

        if (image?.base64) onCaptured(image.base64, "image/jpeg");
    }

    const handleCapture = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission required', 'Permission to access the camera is required.');
            return;
        }

        let result = await cameraRef.current?.takePictureAsync({
            quality: 1,
            base64: true
        });

        const image = result?.base64;

        if (image) onCaptured(image, "image/jpeg");
    }

    return (

        <Modal visible={visible} animationType="slide">
            <View className="flex-1 bg-black">
                {permission?.granted && (
                    <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
                )}

                <View className="absolute inset-0 items-center justify-center px-10">
                    <View
                        className="w-full aspect-[3/4] rounded-2xl border-2 border-white/70"
                        style={{ borderStyle: "dashed" }}
                    />
                </View>

                <SafeAreaView className="absolute inset-0" edges={["top", "bottom"]}>
                    <View className="flex-row items-center justify-between px-5 pt-3">
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
                        >
                            <Feather name="x" size={18} color="#fff" />
                        </TouchableOpacity>
                        <View className="flex-row items-center gap-1.5 bg-black/40 rounded-full px-3 py-1.5">
                            <MaterialCommunityIcons
                                name="robot-outline"
                                size={12}
                                color={COLORS.teal}
                            />
                            <Text className="text-white text-[11px] font-medium">
                                Align the receipt
                            </Text>
                        </View>
                        <View className="w-10 h-10" />
                    </View>

                    <View className="flex-1" />

                    <View className="flex-row items-center justify-between px-10 pb-6">
                        <TouchableOpacity
                            onPress={handlePickFromLibrary}
                            disabled={capturing}
                            className="w-12 h-12 rounded-full bg-black/40 items-center justify-center"
                        >
                            <Feather name="image" size={18} color="#fff" />
                        </TouchableOpacity>

                        <GradientIconButton
                            icon="camera"
                            colors={[AI_GRADIENT[1], AI_GRADIENT[0]]}
                            size={72}
                            iconSize={26}
                            loading={capturing}
                            disabled={!permission?.granted}
                            borderColor="rgba(255,255,255,0.85)"
                            onPress={handleCapture}
                        />

                        <View className="w-12 h-12" />
                    </View>
                </SafeAreaView>

                {!permission?.granted && permission?.canAskAgain === false && (
                    <View className="absolute inset-0 items-center justify-center bg-black/80 px-10">
                        <Feather name="camera-off" size={32} color="#8A8D96" />
                        <Text className="text-white/70 text-sm mt-3 text-center">
                            Camera access is off. Enable it in Settings to scan receipts.
                        </Text>
                        <TouchableOpacity onPress={onClose} className="mt-6">
                            <Text className="text-white text-sm font-medium">Close</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    )
}