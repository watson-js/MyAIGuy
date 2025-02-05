import ThemedButton from '@components/buttons/ThemedButton'
import ThemedSlider from '@components/input/ThemedSlider'
import ThemedSwitch from '@components/input/ThemedSwitch'
import SectionTitle from '@components/text/SectionTitle'
import Alert from '@components/views/Alert'
import { Llama, LlamaPreset, readableFileSize } from '@lib/engine/LlamaLocal'
import { Theme } from '@lib/theme/ThemeManager'
import { AppSettings, Global, Logger, Style } from '@lib/utils/Global'
import { useFocusEffect } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { BackHandler, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useMMKVBoolean, useMMKVObject } from 'react-native-mmkv'
import Animated, { Easing, SlideInRight, SlideOutRight } from 'react-native-reanimated'

type ModelSettingsProp = {
    modelImporting: boolean
    modelLoading: boolean
    exit: () => void
}

type CPUFeatures = {
    armv8: boolean
    dotprod: boolean
    i8mm: boolean
}

const ModelSettings: React.FC<ModelSettingsProp> = ({ modelImporting, modelLoading, exit }) => {
    const [preset, setPreset] = useMMKVObject<LlamaPreset>(Global.LocalPreset)
    const [cpuFeatures, setCpuFeatures] = useMMKVObject<CPUFeatures>(Global.CpuFeatures)

    const [saveKV, setSaveKV] = useMMKVBoolean(AppSettings.SaveLocalKV)
    const [autoloadLocal, setAutoloadLocal] = useMMKVBoolean(AppSettings.AutoLoadLocal)

    const [kvSize, setKVSize] = useState(0)

    const getKVSize = async () => {
        const size = await Llama.getKVSize()
        setKVSize(size)
    }

    useEffect(() => {
        getKVSize()
    }, [])

    const backAction = () => {
        exit()
        return true
    }

    useFocusEffect(() => {
        const handler = BackHandler.addEventListener('hardwareBackPress', backAction)
        return () => handler.remove()
    })

    const handleDeleteKV = () => {
        Alert.alert({
            title: 'Delete KV Cache',
            description: `Are you sure you want to delete the KV Cache? This cannot be undone. \n\n This will clear up ${readableFileSize(kvSize)} of space.`,
            buttons: [
                { label: 'Cancel' },
                {
                    label: 'Delete KV Cache',
                    onPress: async () => {
                        await Llama.deleteKV()
                        Logger.log('KV Cache deleted!', true)
                        getKVSize()
                    },
                    type: 'warning',
                },
            ],
        })
    }

    return (
        <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            entering={SlideInRight.easing(Easing.inOut(Easing.cubic))}
            exiting={SlideOutRight.easing(Easing.inOut(Easing.cubic))}>
            <SectionTitle>CPU Settings</SectionTitle>
            <View style={{ marginTop: 16 }} />
            {preset && (
                <View>
                    <ThemedSlider
                        label="Max Context"
                        value={preset.context_length}
                        onValueChange={(value) => setPreset({ ...preset, context_length: value })}
                        min={1024}
                        max={32768}
                        step={1024}
                        disabled={modelImporting || modelLoading}
                    />
                    <ThemedSlider
                        label="Threads"
                        value={preset.threads}
                        onValueChange={(value) => setPreset({ ...preset, threads: value })}
                        min={1}
                        max={8}
                        step={1}
                        disabled={modelImporting || modelLoading}
                    />

                    <ThemedSlider
                        label="Batch"
                        value={preset.batch}
                        onValueChange={(value) => setPreset({ ...preset, batch: value })}
                        min={16}
                        max={512}
                        step={16}
                        disabled={modelImporting || modelLoading}
                    />
                    {/* Note: llama.rn does not have any Android gpu acceleration */}
                    {Platform.OS === 'ios' && (
                        <ThemedSlider
                            label="GPU Layers"
                            value={preset.gpu_layers}
                            onValueChange={(value) => setPreset({ ...preset, gpu_layers: value })}
                            min={0}
                            max={100}
                            step={1}
                        />
                    )}
                </View>
            )}
            <SectionTitle>Advanced Settings</SectionTitle>
            <ThemedSwitch
                label="Automatically Load Model on Chat"
                value={autoloadLocal}
                onChangeValue={setAutoloadLocal}
            />
            <ThemedSwitch
                label="Save Local KV"
                value={saveKV}
                onChangeValue={setSaveKV}
                description={
                    saveKV
                        ? ''
                        : 'Saves the KV cache on generations, allowing you to continue sessions after closing the app. Must use the same model for this to function properly. Saving the KV cache file may be very big and negatively impact battery life!'
                }
            />
            {saveKV && (
                <ThemedButton
                    buttonStyle={{ marginTop: 8 }}
                    label={'Purge KV Cache (' + readableFileSize(kvSize) + ')'}
                    onPress={handleDeleteKV}
                    variant={kvSize === 0 ? 'disabled' : 'critical'}
                />
            )}
        </Animated.ScrollView>
    )
}

export default ModelSettings
