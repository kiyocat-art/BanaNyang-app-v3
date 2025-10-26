import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GenerationTask, GeneratedMedia, GenerationBatch, MonthlyCredit, ModelName } from '../types';
import { analyzePoseImage, fileToBase64, processCharacterImage, translateToEnglish, getApiKey } from '../services/geminiService';
import { t, TranslationKey, Language } from '../localization';
import { useCanvasStore } from '../store/canvasStore';
// FIX: Import COST_PER_IMAGE constant from the correct file.
import { COST_PER_IMAGE } from '../constants';
import { useGenerationStore } from '../store/generationStore';

const LOCAL_CREDIT_KEY = 'bananang-monthly-credit-local';

interface UseImageGenerationProps {
    monthlyCredit: MonthlyCredit;
    setMonthlyCredit: React.Dispatch<React.SetStateAction<MonthlyCredit>>;
    userAcknowledgedPaidUsage: boolean;
    modelName: ModelName;
    saveDirectoryHandle: FileSystemDirectoryHandle | null;
    setGenerationBatches: React.Dispatch<React.SetStateAction<GenerationBatch[]>>;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    setShowUsagePlanModal: React.Dispatch<React.SetStateAction<boolean>>;
    setShowQuotaModal: React.Dispatch<React.SetStateAction<boolean>>;
    language: Language;
    mainPanelRef: React.RefObject<HTMLElement>;
    onNotification: (message: string, type: 'success' | 'error') => void;
}

export const useImageGeneration = ({
    monthlyCredit,
    setMonthlyCredit,
    userAcknowledgedPaidUsage,
    modelName,
    setGenerationBatches,
    setCurrentPage,
    setShowUsagePlanModal,
    setShowQuotaModal,
    language,
    mainPanelRef,
    onNotification,
}: UseImageGenerationProps) => {
    const [generationQueue, setGenerationQueue] = useState<GenerationTask[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<number | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const addImagesToCenter = useCanvasStore(state => state.addImagesToCenter);
    const { resetPaintingParams } = useGenerationStore();

    const queueGeneration = useCallback((task: GenerationTask) => {
        if (!getApiKey()) {
            setShowUsagePlanModal(true);
            onNotification(t('error.apiKeyMissing', language), 'error');
            return;
        }
        setGenerationQueue(prev => [...prev, task]);
    }, [language, setShowUsagePlanModal, onNotification]);

    const cancelAll = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setGenerationQueue([]);
        setIsProcessing(false);
        onNotification(t('error.cancelled', language), 'error');
    }, [language, onNotification]);

    const cancelSingleTask = useCallback((taskId: string) => {
        if (isProcessing && generationQueue.length > 0 && generationQueue[0].id === taskId) {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        } else {
            setGenerationQueue(prev => prev.filter(task => task.id !== taskId));
        }
    }, [isProcessing, generationQueue]);

    useEffect(() => {
        const processNextInQueue = async () => {
            if (isProcessing || generationQueue.length === 0) return;
            if (!getApiKey()) {
                setShowUsagePlanModal(true);
                onNotification(t('error.apiKeyMissing', language), 'error');
                return;
            }
            if (monthlyCredit.current <= 0 && !userAcknowledgedPaidUsage) {
                setShowQuotaModal(true);
                return;
            }

            setIsProcessing(true);
            setProgress(0);
            const task = generationQueue[0];
            abortControllerRef.current = new AbortController();
            const signal = abortControllerRef.current.signal;

            try {
                if (task.taskType === 'image') {
                    let poseDescription: string | null = null;
                    if (task.poseControlImage) {
                        onNotification(t('poseAnalysis.analyzing', language), 'success');
                        try {
                            const poseControl64Data = { data: await fileToBase64(task.poseControlImage), mimeType: task.poseControlImage.type };
                            poseDescription = await analyzePoseImage(poseControl64Data, signal);
                        } catch (poseError: any) {
                           throw poseError;
                        }
                    }
                    
                    const jobId = task.cameraView ? `${task.cameraView.yaw}-${task.cameraView.pitch}` : 'edit-original';
                    const base64Data = task.originalImage ? await fileToBase64(task.originalImage) : null;
                    const textureDataArray = await Promise.all(task.textureImages.map(async ({ file, maskFile }) => ({ 
                        data: await fileToBase64(file), 
                        mimeType: file.type,
                        maskData: maskFile ? await fileToBase64(maskFile) : null
                    })));

                    const background64Data = task.backgroundImage ? { data: await fileToBase64(task.backgroundImage), mimeType: task.backgroundImage.type } : null;
                    const mask64Data = task.maskImage ? { data: await fileToBase64(task.maskImage), mimeType: task.maskImage.type } : null;


                    if (signal.aborted) throw new Error('error.cancelled');
                    
                    // FIX: Added missing arguments for color palette features to the `processCharacterImage` call.
                    const resultSrcs = await processCharacterImage(
                        base64Data ? { data: base64Data, mimeType: task.originalImage!.type } : null,
                        task.cameraView, [], task.bodyPartReferenceMap,
                        task.selectedClothingItems, task.selectedObjectItems, task.customPrompt, poseDescription, textureDataArray, background64Data,
                        task.selectedActionPose, task.useAposeForViews, task.isApplyingFullOutfit, task.isApplyingTop, task.isApplyingBottom,
                        task.backgroundImageAspectRatio, modelName, signal, task.lightDirection, task.lightIntensity, mask64Data,
                        task.selectedPalette, task.numPaletteColors, task.isAutoColorizeSketch
                    );

                    const newImages: GeneratedMedia[] = resultSrcs.map((src, index) => ({ id: `${jobId}-${Date.now()}-${index}`, src: src, type: 'image', view: task.cameraView }));
                    
                    if (newImages.length > 0) {
                        const cost = COST_PER_IMAGE * newImages.length;
                        setMonthlyCredit(prev => {
                            const newCreditState = { ...prev, current: Math.max(0, prev.current - cost) };
                            localStorage.setItem(LOCAL_CREDIT_KEY, JSON.stringify(newCreditState));
                            return newCreditState;
                        });
                        const newBatch: GenerationBatch = { id: `batch-${Date.now()}`, timestamp: new Date(), media: newImages };
                        setGenerationBatches(prev => [newBatch, ...prev]);
                        
                        const canvasRect = mainPanelRef.current?.getBoundingClientRect();
                        if (canvasRect) {
                            addImagesToCenter(newImages, canvasRect);
                        }
                        setCurrentPage(1);
                        onNotification(t('generation.complete', language, { count: newImages.length }), 'success');
                    }
                }
                setGenerationQueue(prev => prev.slice(1));
            } catch (err: any) {
                const errorKey = err instanceof Error ? err.message : 'error.unknown';
                if (errorKey === 'error.apiKeyInvalid') setShowUsagePlanModal(true);
                if (errorKey === 'error.quotaExceeded' && !userAcknowledgedPaidUsage) {
                    setShowQuotaModal(true);
                    setIsProcessing(false);
                    setProgress(null);
                    return;
                }
                const errorMessage = t(errorKey as TranslationKey, language);
                if (errorKey !== 'error.cancelled') onNotification(errorMessage, 'error');
                setGenerationQueue(prev => prev.slice(1));
            } finally {
                setIsProcessing(false);
                setProgress(null);
                resetPaintingParams();
            }
        };

        processNextInQueue();
    }, [generationQueue, isProcessing, userAcknowledgedPaidUsage, monthlyCredit, language, modelName, addImagesToCenter, mainPanelRef, setMonthlyCredit, setGenerationBatches, setCurrentPage, onNotification, setShowQuotaModal, setShowUsagePlanModal, resetPaintingParams]);

    return {
        generationQueue,
        isProcessing,
        progress,
        queueGeneration,
        cancelAll,
        cancelSingleTask,
    };
};