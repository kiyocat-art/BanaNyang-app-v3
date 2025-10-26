import { create } from 'zustand';
import {
  CameraSize, BodyPart, ClothingItem, SelectedView,
  ActionPose, ObjectItem, ColorPalette
} from '../types';
import { 
  APPLY_FULL_OUTFIT_BODY_PARTS,
  APPLY_TOP_BODY_PARTS,
  APPLY_BOTTOM_BODY_PARTS,
} from '../constants';

export interface GenerationOptions {
    cameraView: SelectedView;
    isCameraViewActive: boolean;
    lightDirection: { yaw: number, pitch: number };
    lightIntensity: number;
    isLightDirectionActive: boolean;
    useAposeForViews: boolean;
    bodyPartReferenceMap: Partial<Record<BodyPart, number>>;
    selectedClothingConcept: ClothingItem | null;
    selectedObjectItems: ObjectItem[];
    poseControlImage: File | null;
    selectedActionPose: ActionPose | null;
    isApplyingFullOutfit: boolean;
    isApplyingTop: boolean;
    isApplyingBottom: boolean;
    // FIX: Add missing properties for color palette features.
    selectedPalette: ColorPalette | null;
    numPaletteColors: number;
    isAutoColorizeSketch: boolean;
}

export interface GenerationActions {
    setCameraView: (view: SelectedView | ((prev: SelectedView) => SelectedView) ) => void;
    setIsCameraViewActive: (isActive: boolean) => void;
    setLightDirection: (direction: { yaw: number, pitch: number }) => void;
    setLightIntensity: (intensity: number) => void;
    setIsLightDirectionActive: (isActive: boolean) => void;
    setUseAposeForViews: (use: boolean) => void;
    setBodyPartReferenceMap: (map: Partial<Record<BodyPart, number>> | ((prev: Partial<Record<BodyPart, number>>) => Partial<Record<BodyPart, number>>)) => void;
    setSelectedClothingConcept: (concept: ClothingItem | null) => void;
    setSelectedObjectItems: (items: ObjectItem[] | ((prev: ObjectItem[]) => ObjectItem[])) => void;
    setPoseControlImage: (image: File | null) => void;
    setSelectedActionPose: (pose: ActionPose | null) => void;
    // FIX: Add missing actions for color palette features.
    setSelectedPalette: (palette: ColorPalette | null) => void;
    setNumPaletteColors: (num: number) => void;
    setIsAutoColorizeSketch: (isAuto: boolean) => void;
    loadPaintingParams: (params: { palette: ColorPalette | null; numColors: number; isAuto: boolean; }) => void;
    updateDerivedOutfitState: (bodyPartMap: Partial<Record<BodyPart, number>>, activeRef: number | null) => void;
    reset: () => void;
    resetPaintingParams: () => void;
}

const initialGenerationState: GenerationOptions = {
    cameraView: { yaw: 0, pitch: 0, fov: 50, size: CameraSize.Full },
    isCameraViewActive: false,
    lightDirection: { yaw: 0, pitch: 0 },
    lightIntensity: 1.0,
    isLightDirectionActive: false,
    useAposeForViews: false,
    bodyPartReferenceMap: {},
    selectedClothingConcept: null,
    selectedObjectItems: [],
    poseControlImage: null,
    selectedActionPose: null,
    isApplyingFullOutfit: false,
    isApplyingTop: false,
    isApplyingBottom: false,
    // FIX: Add missing initial state for color palette features.
    selectedPalette: null,
    numPaletteColors: 4,
    isAutoColorizeSketch: false,
};

export const useGenerationStore = create<GenerationOptions & GenerationActions>((set) => ({
    ...initialGenerationState,
    setCameraView: (updater) => set(state => ({ cameraView: typeof updater === 'function' ? updater(state.cameraView) : updater })),
    setIsCameraViewActive: (isCameraViewActive) => set({ isCameraViewActive }),
    setLightDirection: (lightDirection) => set({ lightDirection }),
    setLightIntensity: (lightIntensity) => set({ lightIntensity }),
    setIsLightDirectionActive: (isLightDirectionActive) => set({ isLightDirectionActive }),
    setUseAposeForViews: (useAposeForViews) => set({ useAposeForViews }),
    setBodyPartReferenceMap: (updater) => set(state => ({ bodyPartReferenceMap: typeof updater === 'function' ? updater(state.bodyPartReferenceMap) : updater })),
    setSelectedClothingConcept: (selectedClothingConcept) => set({ selectedClothingConcept }),
    setSelectedObjectItems: (updater) => set(state => ({ selectedObjectItems: typeof updater === 'function' ? updater(state.selectedObjectItems) : updater })),
    setPoseControlImage: (poseControlImage) => set({ poseControlImage }),
    setSelectedActionPose: (selectedActionPose) => set({ selectedActionPose }),
    // FIX: Add missing implementation for color palette actions.
    setSelectedPalette: (selectedPalette) => set({ selectedPalette }),
    setNumPaletteColors: (numPaletteColors) => set({ numPaletteColors }),
    setIsAutoColorizeSketch: (isAutoColorizeSketch) => set({ isAutoColorizeSketch }),
    loadPaintingParams: (params) => set({
        selectedPalette: params.palette,
        numPaletteColors: typeof params.numColors === 'number' ? params.numColors : 4,
        isAutoColorizeSketch: params.isAuto,
    }),
    updateDerivedOutfitState: (bodyPartMap, activeRef) => set(() => {
        if (activeRef === null) {
            return { isApplyingFullOutfit: false, isApplyingTop: false, isApplyingBottom: false };
        }
        const full = APPLY_FULL_OUTFIT_BODY_PARTS.every(p => bodyPartMap[p] === activeRef);
        const top = !full && APPLY_TOP_BODY_PARTS.every(p => bodyPartMap[p] === activeRef) && !APPLY_BOTTOM_BODY_PARTS.some(p => bodyPartMap[p] === activeRef);
        const bottom = !full && APPLY_BOTTOM_BODY_PARTS.every(p => bodyPartMap[p] === activeRef) && !APPLY_TOP_BODY_PARTS.some(p => bodyPartMap[p] === activeRef);
        return { isApplyingFullOutfit: full, isApplyingTop: top, isApplyingBottom: bottom };
    }),
    reset: () => set(initialGenerationState),
    resetPaintingParams: () => set({
        selectedPalette: null,
        numPaletteColors: 4,
        isAutoColorizeSketch: false,
    }),
}));
