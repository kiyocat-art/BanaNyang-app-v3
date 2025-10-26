import React, { useState, useRef, useEffect } from 'react';
import { BoardImage, GenerationTask, ModelName, PromptFolder } from '../../../types';
import { t, Language, TranslationKey } from '../../../localization';
import { Tooltip } from '../../../components/Tooltip';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { getApiKey, translateToEnglish } from '../../../services/geminiService';
import { useGenerationStore } from '../../../store/generationStore';
import { useCanvasStore } from '../../../store/canvasStore';
import { PromptPresets } from './PromptPresets';
import { TranslateIcon } from '../../../components/icons';
import { PresetManagerModal } from '../../../components/PresetManagerModal';
import { SavePresetModal } from '../../../components/SavePresetModal';

const PRESET_STORAGE_KEY = 'bananang-prompt-presets';

interface PromptPanelProps {
    customPrompt: string;
    onCustomPromptChange: (prompt: string) => void;
    onQueueGeneration: (task: GenerationTask) => void;
    isProcessing: boolean;
    generationQueue: GenerationTask[];
    originalImage: BoardImage | undefined;
    modelName: ModelName;
    language: Language;
    mainPanelRef: React.RefObject<HTMLElement>;
    setNotification: (notification: { id: number; message: string; type: 'success' | 'error' } | null) => void;
    // FIX: Add missing props to the interface.
    folders: PromptFolder[];
    onSavePreset: () => void;
    saveFolders: (folders: PromptFolder[]) => void;
}

export const PromptPanel: React.FC<PromptPanelProps> = ({
    customPrompt, onCustomPromptChange, onQueueGeneration, isProcessing, generationQueue,
    originalImage, modelName, language, mainPanelRef, setNotification,
    // FIX: Destructure new props.
    folders, onSavePreset, saveFolders
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [isPresetManagerOpen, setIsPresetManagerOpen] = useState(false);

     useEffect(() => {
        if (folders.length > 0 && !folders.some(f => f.id === selectedFolderId)) {
            setSelectedFolderId(folders[0].id);
        } else if (folders.length === 0) {
            setSelectedFolderId(null);
        }
    }, [folders, selectedFolderId]);

    const {
        cameraView, isCameraViewActive, lightDirection, lightIntensity, isLightDirectionActive,
        useAposeForViews, bodyPartReferenceMap, selectedClothingConcept, selectedObjectItems,
        poseControlImage, selectedActionPose, isApplyingFullOutfit, isApplyingTop, isApplyingBottom,
        selectedPalette, numPaletteColors, isAutoColorizeSketch
    } = useGenerationStore();
    const { boardImages } = useCanvasStore();

    const hasImageTask = true; 
    const canGenerate = originalImage && hasImageTask && !!getApiKey() && !!modelName.trim();

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height to recalculate
            const scrollHeight = textarea.scrollHeight;
            const maxHeight = 200; // Max height of 200px
            textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        }
    }, [customPrompt]);


    const handleDoQueue = (maskImage: File | null = null) => {
        if (!canGenerate || (isProcessing && generationQueue.length === 0)) return;
        if (!originalImage) {
            setNotification({ id: Date.now(), message: t('error.noOriginalImage', language), type: 'error' });
            return;
        };

        const textureImages = boardImages
            .filter(img => img.role === 'reference')
            .sort((a, b) => (a.refIndex ?? 0) - (b.refIndex ?? 0))
            .map(img => ({ file: img.file, maskFile: img.maskFile || null }));

        const backgroundImage = boardImages.find(img => img.role === 'background');
        
        const taskToQueue: GenerationTask = {
            id: `task-img-${Date.now()}`, taskType: 'image', originalImage: originalImage.file, customPrompt,
            textureImages, 
            backgroundImage: backgroundImage ? backgroundImage.file : null, 
            backgroundImageAspectRatio: backgroundImage ? (backgroundImage.width / backgroundImage.height).toFixed(2) : null,
            poseControlImage, cameraView: isCameraViewActive ? cameraView : null, bodyPartReferenceMap,
            selectedClothingItems: selectedClothingConcept ? [selectedClothingConcept] : [],
            selectedObjectItems, selectedActionPose, useAposeForViews, isApplyingFullOutfit,
            isApplyingTop, isApplyingBottom,
            lightDirection: isLightDirectionActive ? lightDirection : null,
            lightIntensity: isLightDirectionActive ? lightIntensity : null,
            maskImage: maskImage || originalImage.maskFile || null,
            selectedPalette,
            numPaletteColors,
            isAutoColorizeSketch,
        };
        onQueueGeneration(taskToQueue);
    };
    
    const handleTranslate = async () => {
        if (!customPrompt.trim() || isTranslating) return;

        setIsTranslating(true);
        setNotification({ id: Date.now(), message: t('translation.inProgress', language), type: 'success' });
        try {
            const translatedText = await translateToEnglish(customPrompt);
            onCustomPromptChange(translatedText);
            setNotification({ id: Date.now(), message: t('translation.success', language), type: 'success' });
        } catch (err: any) {
            const errorKey = err instanceof Error ? err.message as TranslationKey : 'translation.error';
            setNotification({ id: Date.now(), message: t(errorKey, language), type: 'error' });
        } finally {
            setIsTranslating(false);
        }
    };

    const getGenerationTooltip = () => {
        if (!getApiKey()) return t('error.apiKeyMissing', language);
        if (!modelName.trim()) return t('error.modelNameMissing', language);
        if (!originalImage) return t('error.noOriginalImage', language);
        if (!hasImageTask) return t('error.noOptionsSelected', language);
        return `${t('generateButton', language)} (Ctrl + ↵)`;
    };

    const handlePromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { 
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { 
            e.preventDefault(); 
            handleDoQueue();
        } 
    };

    return (
        <>
            <div className="absolute w-[95%] max-w-4xl z-50 left-1/2 -translate-x-1/2 bottom-4 flex flex-col gap-2">
                <div className="flex items-end gap-2 p-2 bg-neutral-800/50 backdrop-blur-lg border border-white/10 rounded-full shadow-lg">
                    <div className="relative flex-grow">
                        <textarea
                            ref={textareaRef}
                            value={customPrompt}
                            onChange={(e) => onCustomPromptChange(e.target.value)}
                            onKeyDown={handlePromptKeyDown}
                            placeholder={t('section.prompt.placeholder', language)}
                            className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm text-zinc-200 placeholder-zinc-500 py-2 pl-4 pr-10 max-h-[200px] overflow-y-auto leading-6"
                            rows={1}
                        />
                         <Tooltip 
                            tip={t('tooltip.translatePrompt', language)} 
                            position="top"
                            className="absolute top-1/2 right-3 -translate-y-1/2"
                        >
                            <button 
                                onClick={handleTranslate} 
                                disabled={isTranslating || !customPrompt.trim()}
                                className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isTranslating ? <LoadingSpinner className="h-5 w-5" /> : <TranslateIcon className="w-5 w-5" />}
                            </button>
                        </Tooltip>
                    </div>
                    <Tooltip tip={getGenerationTooltip()} position="top">
                        <button 
                            onClick={() => handleDoQueue()} 
                            disabled={!canGenerate || (isProcessing && generationQueue.length === 0)}
                            className="flex-shrink-0 flex items-center justify-center gap-2 px-4 h-10 rounded-full font-semibold text-black bg-yellow-400 hover:bg-yellow-300 disabled:bg-neutral-600 disabled:text-zinc-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isProcessing && generationQueue.length === 0 ? (
                                <LoadingSpinner className="h-5 w-5 border-black/50" />
                            ) : (
                                <>
                                    <span className="text-sm">{generationQueue.length > 0 ? t('queue.addToQueue', language) : t('generateButton', language)}</span>
                                    <div className="text-xs text-black/60 flex items-center gap-1 font-mono">
                                        <span>Ctrl</span>
                                        <span>&#x21B5;</span>
                                    </div>
                                </>
                            )}
                        </button>
                    </Tooltip>
                </div>
                <PromptPresets
                    folders={folders}
                    currentPrompt={customPrompt}
                    onLoadPrompt={onCustomPromptChange}
                    language={language}
                    onManageClick={() => setIsPresetManagerOpen(true)}
                    onSaveClick={onSavePreset}
                    selectedFolderId={selectedFolderId}
                    setSelectedFolderId={setSelectedFolderId}
                />
            </div>
            <PresetManagerModal
                isOpen={isPresetManagerOpen}
                onClose={() => setIsPresetManagerOpen(false)}
                currentPrompt={customPrompt}
                onLoadPrompt={onCustomPromptChange}
                onNotification={(message, type) => setNotification({ id: Date.now(), message, type })}
                language={language}
                folders={folders}
                saveFolders={saveFolders}
            />
        </>
    );
};