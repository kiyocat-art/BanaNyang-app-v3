import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  BodyPart, ClothingItem, SelectedView,
  ActionPose, ObjectItem, BoardImage
} from '../../types';
import { 
  CLOTHING_THEMES,
  OBJECT_THEMES,
  CLOTHING_TO_BODY_PARTS_MAP,
  APPLY_FULL_OUTFIT_BODY_PARTS,
  APPLY_TOP_BODY_PARTS,
  APPLY_BOTTOM_BODY_PARTS,
  CLOTHING_ITEM_TO_CATEGORY_MAP,
} from '../../constants';
import { t, getEnumText, Language, TranslationKey } from '../../localization';
import { Tooltip } from '../../components/Tooltip';
import { Section } from '../../components/Section';
import {
  CameraIcon, PaletteIcon, BodyIcon, LightIcon, ResetIcon, PaintBrushIcon
} from '../../components/icons';
import { useCanvasStore, REF_COLORS } from '../../store/canvasStore';
import { useGenerationStore } from '../../store/generationStore';
import { BodyPartSelector } from './components/BodyPartSelector';
import { ViewportControl } from './components/ViewportControl';
import { CameraViewSelector } from './components/CameraViewSelector';
import { LightingDirectionSelector } from './components/LightingDirectionSelector';
import { DrawingCanvas } from './components/DrawingCanvas';
import { ColorPalettePanel } from '../canvas/components/ColorPalettePanel';


type ConceptThemeKey = 'scifi' | 'modern' | 'fantasy';
type ConceptSubTabKey = 'clothing' | 'item';
type RightPanelTab = 'concept' | 'camera' | 'pose' | 'painting';

interface RightPanelProps {
    language: Language;
    onNotification: (message: string, type: 'success' | 'error') => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ language, onNotification }) => {
    const [activeRightPanelTab, setActiveRightPanelTab] = useState<RightPanelTab>('concept');
    const {
        cameraView, setCameraView, isCameraViewActive, setIsCameraViewActive,
        lightDirection, setLightDirection, lightIntensity, setLightIntensity,
        isLightDirectionActive, setIsLightDirectionActive, useAposeForViews, setUseAposeForViews,
        bodyPartReferenceMap, setBodyPartReferenceMap, selectedClothingConcept, setSelectedClothingConcept,
        selectedObjectItems, setSelectedObjectItems, poseControlImage, setPoseControlImage,
        selectedActionPose, setSelectedActionPose, isApplyingFullOutfit, isApplyingTop, isApplyingBottom,
        updateDerivedOutfitState,
    } = useGenerationStore();

    const { activeReferenceIndex, setSelectedImageIds } = useCanvasStore();
    const referenceImages = useCanvasStore(state => state.boardImages.filter(img => img.role === 'reference').sort((a, b) => (a.refIndex ?? Infinity) - (b.refIndex ?? Infinity)));

    const [activeConceptTheme, setActiveConceptTheme] = useState<ConceptThemeKey>('fantasy');
    const [activeConceptSubTab, setActiveConceptSubTab] = useState<ConceptSubTabKey>('clothing');
    const activeRefColor = activeReferenceIndex !== null ? REF_COLORS[activeReferenceIndex % REF_COLORS.length] : null;

    useEffect(() => {
        updateDerivedOutfitState(bodyPartReferenceMap, activeReferenceIndex);
    }, [bodyPartReferenceMap, activeReferenceIndex, updateDerivedOutfitState]);

    const activateConceptMode = useCallback(() => {
        if (selectedActionPose) setSelectedActionPose(null);
        if (poseControlImage) setPoseControlImage(null);
    }, [selectedActionPose, poseControlImage, setSelectedActionPose, setPoseControlImage]);

    const handleBodyPartAssign = (part: BodyPart) => {
      activateConceptMode();
      if (activeReferenceIndex === null) { onNotification(t('tooltip.uploadReferenceFirst', language), 'error'); return; }
      if (selectedClothingConcept) setSelectedClothingConcept(null);
      setBodyPartReferenceMap(prevMap => {
          const newMap = { ...prevMap };
          if (newMap[part] === activeReferenceIndex) delete newMap[part];
          else newMap[part] = activeReferenceIndex;
          return newMap;
      });
    };

    const handleClothingItemToggle = (itemToToggle: ClothingItem) => {
        activateConceptMode(); setSelectedObjectItems([]);
        const isCurrentlySelected = selectedClothingConcept === itemToToggle;
        const newConcept = isCurrentlySelected ? null : itemToToggle;
        setSelectedClothingConcept(newConcept);
        let refIndexToUse = activeReferenceIndex;
        if (newConcept && refIndexToUse === null) {
          if (referenceImages.length > 0) { refIndexToUse = 0; setSelectedImageIds(prev => new Set([referenceImages[0].id])); }
          else { onNotification(t('error.modificationRequiresReference', language), 'error'); setSelectedClothingConcept(null); return; }
        }
        if (refIndexToUse === null) return;
        const finalRefIndex = refIndexToUse;
        setBodyPartReferenceMap(prevMap => {
            const newMap = { ...prevMap };
            const categoryOfItemToToggle = CLOTHING_ITEM_TO_CATEGORY_MAP[itemToToggle];
            const conflictingItems: ClothingItem[] = [];
            Object.values(ClothingItem).forEach(item => { const category = CLOTHING_ITEM_TO_CATEGORY_MAP[item]; if (category === categoryOfItemToToggle || category === 'sets' || categoryOfItemToToggle === 'sets') conflictingItems.push(item); });
            conflictingItems.forEach(item => { const partsToClear = CLOTHING_TO_BODY_PARTS_MAP[item] || []; partsToClear.forEach(part => { if (newMap[part] === finalRefIndex) delete newMap[part]; }); });
            if (newConcept) { const partsForItem = CLOTHING_TO_BODY_PARTS_MAP[itemToToggle] || []; partsForItem.forEach(part => { newMap[part] = finalRefIndex!; }); }
            return newMap;
        });
    };

    const handleObjectItemToggle = (itemToToggle: ObjectItem) => {
        activateConceptMode(); setBodyPartReferenceMap({});
        setSelectedObjectItems(prev => {
            if (prev.includes(itemToToggle)) return [];
            setUseAposeForViews(false); return [itemToToggle];
        });
    };
    
    const handleApplyFullOutfitClick = () => {
        if (activeReferenceIndex === null) return;
        activateConceptMode();
        const shouldApply = !isApplyingFullOutfit;
        setBodyPartReferenceMap(prevMap => {
            const newMap = { ...prevMap };
            APPLY_FULL_OUTFIT_BODY_PARTS.forEach(part => {
                if (shouldApply) newMap[part] = activeReferenceIndex;
                else if (newMap[part] === activeReferenceIndex) delete newMap[part];
            });
            return newMap;
        });
        if (shouldApply) { setSelectedClothingConcept(null); setSelectedObjectItems([]); }
    };
    
    const handleApplyTopClick = () => {
        if (activeReferenceIndex === null) return;
        activateConceptMode();
        const shouldApply = !isApplyingTop;
        setBodyPartReferenceMap(prevMap => {
            const newMap = { ...prevMap };
            APPLY_TOP_BODY_PARTS.forEach(part => {
                if (shouldApply) newMap[part] = activeReferenceIndex;
                else if (newMap[part] === activeReferenceIndex) delete newMap[part];
            });
            if (shouldApply && isApplyingFullOutfit) APPLY_BOTTOM_BODY_PARTS.forEach(part => { if (newMap[part] === activeReferenceIndex) delete newMap[part]; });
            return newMap;
        });
        if (shouldApply) { setSelectedClothingConcept(null); setSelectedObjectItems([]); }
    };
    
    const handleApplyBottomClick = () => {
        if (activeReferenceIndex === null) return;
        activateConceptMode();
        const shouldApply = !isApplyingBottom;
        setBodyPartReferenceMap(prevMap => {
            const newMap = { ...prevMap };
            APPLY_BOTTOM_BODY_PARTS.forEach(part => {
                if (shouldApply) newMap[part] = activeReferenceIndex;
                else if (newMap[part] === activeReferenceIndex) delete newMap[part];
            });
            if (shouldApply && isApplyingFullOutfit) APPLY_TOP_BODY_PARTS.forEach(part => { if (newMap[part] === activeReferenceIndex) delete newMap[part]; });
            return newMap;
        });
        if (shouldApply) { setSelectedClothingConcept(null); setSelectedObjectItems([]); }
    };

    const handleCameraViewChange = useCallback((newView: Omit<SelectedView, 'size' | 'fov'>) => {
        setCameraView(prev => ({ ...prev, ...newView }));
        setIsCameraViewActive(true);
    }, [setCameraView, setIsCameraViewActive]);
  
    const handleCameraPresetChange = useCallback(({yaw, pitch}: { yaw: number, pitch: number }) => {
        const isCurrentlyActiveAndSelected = isCameraViewActive &&
            ((Math.round(cameraView.yaw) % 360 + 360) % 360 === (Math.round(yaw) % 360 + 360) % 360) &&
            Math.round(cameraView.pitch) === Math.round(pitch);
        if (isCurrentlyActiveAndSelected) setIsCameraViewActive(false);
        else { setCameraView(prev => ({...prev, yaw, pitch})); setIsCameraViewActive(true); }
    }, [cameraView, isCameraViewActive, setCameraView, setIsCameraViewActive]);
    
    const handleLightDirectionChange = useCallback((newDirection: { yaw: number, pitch: number }) => {
        setLightDirection(newDirection);
        setIsLightDirectionActive(true);
    }, [setLightDirection, setIsLightDirectionActive]);
  
    const handleLightPresetChange = useCallback(({yaw, pitch}: { yaw: number, pitch: number }) => {
        const isCurrentlyActiveAndSelected = isLightDirectionActive &&
            ((Math.round(lightDirection.yaw) % 360 + 360) % 360 === (Math.round(yaw) % 360 + 360) % 360) &&
            Math.round(lightDirection.pitch) === Math.round(pitch);
        if (isCurrentlyActiveAndSelected) setIsLightDirectionActive(false);
        else { setLightDirection({yaw, pitch}); setIsLightDirectionActive(true); }
    }, [isLightDirectionActive, lightDirection, setLightDirection, setIsLightDirectionActive]);

    const conceptSelectionIsEmpty = Object.keys(bodyPartReferenceMap).length === 0 && selectedObjectItems.length === 0 && selectedClothingConcept === null;
    const conceptDeselectButton = (<Tooltip tip={t('tooltip.clearConceptSelection', language)} position="left"><button onClick={() => { setSelectedObjectItems([]); setBodyPartReferenceMap({}); setSelectedClothingConcept(null); }} disabled={conceptSelectionIsEmpty} className="px-3 py-1.5 text-xs font-semibold text-zinc-200 bg-white/10 hover:bg-white/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('clearSelection', language)}</button></Tooltip>);
    const activeClothingThemeData = CLOTHING_THEMES.find(theme => theme.themeKey === activeConceptTheme);
    const activeObjectThemeData = OBJECT_THEMES.find(theme => theme.themeKey === activeConceptTheme);

    const conceptThemeTabs: { key: ConceptThemeKey; labelKey: TranslationKey }[] = [
        { key: 'scifi', labelKey: 'theme.scifi' }, { key: 'fantasy', labelKey: 'theme.fantasy' }, { key: 'modern', labelKey: 'theme.modern' },
    ];

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-2 bg-black/20 border-b border-white/10">
                <div className="flex items-center bg-black/20 rounded-lg p-1">
                    <Tooltip tip={t('tooltip.section.conceptDesign', language)} position="bottom" className="flex-1">
                        <button onClick={() => setActiveRightPanelTab('concept')} className={`w-full py-1 lg:py-1.5 rounded-md transition-colors flex flex-col justify-center items-center gap-1 ${activeRightPanelTab === 'concept' ? 'bg-white text-zinc-800' : 'text-zinc-300 hover:bg-white/10'}`}>
                            <PaletteIcon className="w-5 h-5" />
                            <span className="text-[11px] lg:text-xs font-semibold">{t('rightPanelTab.concept', language)}</span>
                        </button>
                    </Tooltip>
                    <Tooltip tip={t('rightPanelTab.camera', language)} position="bottom" className="flex-1">
                        <button onClick={() => setActiveRightPanelTab('camera')} className={`w-full py-1 lg:py-1.5 rounded-md transition-colors flex flex-col justify-center items-center gap-1 ${activeRightPanelTab === 'camera' ? 'bg-white text-zinc-800' : 'text-zinc-300 hover:bg-white/10'}`}>
                           <div className="flex items-center">
                                <CameraIcon className="w-5 h-5" />
                                <span className={`text-lg mx-0.5 ${activeRightPanelTab === 'camera' ? 'text-zinc-400' : 'text-zinc-500'}`}>/</span>
                                <LightIcon className="w-5 h-5" />
                           </div>
                           <span className="text-[11px] lg:text-xs font-semibold">{t('rightPanelTab.camera', language)}</span>
                        </button>
                    </Tooltip>
                    <Tooltip tip={t('tooltip.poseControl', language)} position="bottom" className="flex-1">
                        <button onClick={() => setActiveRightPanelTab('pose')} className={`w-full py-1 lg:py-1.5 rounded-md transition-colors flex flex-col justify-center items-center gap-1 ${activeRightPanelTab === 'pose' ? 'bg-white text-zinc-800' : 'text-zinc-300 hover:bg-white/10'}`}>
                            <BodyIcon className="w-5 h-5" />
                            <span className="text-[11px] lg:text-xs font-semibold">{t('rightPanelTab.pose', language)}</span>
                        </button>
                    </Tooltip>
                     <Tooltip tip={t('tooltip.painting', language)} position="bottom" className="flex-1">
                        <button onClick={() => setActiveRightPanelTab('painting')} className={`w-full py-1 lg:py-1.5 rounded-md transition-colors flex flex-col justify-center items-center gap-1 ${activeRightPanelTab === 'painting' ? 'bg-white text-zinc-800' : 'text-zinc-300 hover:bg-white/10'}`}>
                            <PaintBrushIcon className="w-5 h-5" />
                            <span className="text-[11px] lg:text-xs font-semibold">{t('tooltip.painting', language)}</span>
                        </button>
                    </Tooltip>
                </div>
            </div>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
              {activeRightPanelTab === 'concept' && (<>
                  <Section title={t('section.bodyPartSelection.title', language)} tooltipText={t('tooltip.bodyPartConcept', language)} icon={<BodyIcon/>} topRightAction={<div className="flex items-center gap-2"><Tooltip tip={t('tooltip.deselectAllBodyParts', language)} position="left"><button onClick={() => setBodyPartReferenceMap({})} disabled={Object.keys(bodyPartReferenceMap).length === 0} className="px-3 py-1.5 text-xs font-semibold text-zinc-200 bg-white/10 hover:bg-white/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('clearSelection', language)}</button></Tooltip></div>}>
                      <div className="flex items-start gap-4 h-[320px] lg:h-[350px]">
                          <div className="w-1/2 h-full flex items-center justify-center"><BodyPartSelector bodyPartReferenceMap={bodyPartReferenceMap} onAssign={handleBodyPartAssign} language={language}/></div>
                          <div className="w-px h-full bg-white/10"></div>
                          <div className="w-1/2 flex flex-col items-center gap-3">
                              <p className="text-xs text-zinc-400 text-center">선택한 참조 이미지의 의상을 특정 부위에 적용해보세요.</p>
                              <div className="w-full space-y-2">
                                  <Tooltip tip={t('tooltip.applyFullOutfit', language)} position="bottom" className="w-full"><button onClick={handleApplyFullOutfitClick} disabled={activeReferenceIndex === null} className={`w-full py-2 text-xs lg:py-2.5 lg:text-sm font-semibold rounded-md transition-colors ${isApplyingFullOutfit ? 'bg-white text-zinc-800' : 'bg-white/10 text-zinc-200 hover:bg-white/20'} disabled:opacity-50 disabled:cursor-not-allowed`}>{t('applyFullOutfit', language)}</button></Tooltip>
                                  <Tooltip tip={t('tooltip.applyTop', language)} position="bottom" className="w-full"><button onClick={handleApplyTopClick} disabled={activeReferenceIndex === null} className={`w-full py-2 text-xs lg:py-2.5 lg:text-sm font-semibold rounded-md transition-colors ${isApplyingTop ? 'bg-white text-zinc-800' : 'bg-white/10 text-zinc-200 hover:bg-white/20'} disabled:opacity-50 disabled:cursor-not-allowed`}>{t('applyTop', language)}</button></Tooltip>
                                  <Tooltip tip={t('tooltip.applyBottom', language)} position="bottom" className="w-full"><button onClick={handleApplyBottomClick} disabled={activeReferenceIndex === null} className={`w-full py-2 text-xs lg:py-2.5 lg:text-sm font-semibold rounded-md transition-colors ${isApplyingBottom ? 'bg-white text-zinc-800' : 'bg-white/10 text-zinc-200 hover:bg-white/20'} disabled:opacity-50 disabled:cursor-not-allowed`}>{t('applyBottom', language)}</button></Tooltip>
                              </div>
                              {activeReferenceIndex !== null && (<div className="flex items-center gap-2 p-2 rounded-md text-xs" style={{ backgroundColor: activeRefColor ? `${activeRefColor}30` : 'transparent', border: `1px solid ${activeRefColor || 'transparent'}`}}><div className="w-4 h-4 rounded-full" style={{backgroundColor: activeRefColor || '#FFF'}}></div><span className="font-semibold" style={{color: activeRefColor || '#FFF'}}>{activeReferenceIndex === 0 ? '참조' : `참조 ${activeReferenceIndex + 1}`}</span></div>)}
                          </div>
                      </div>
                  </Section>
                  <Section title={t('section.conceptDesign.title', language)} tooltipText={t('tooltip.section.conceptDesign', language)} icon={<PaletteIcon/>} topRightAction={conceptDeselectButton}>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-2">{conceptThemeTabs.map(tab => (<Tooltip key={tab.key} tip={t('tooltip.clothingTheme', language)} position="bottom" className="flex-1"><button onClick={() => setActiveConceptTheme(tab.key)} className={`w-full py-2 text-xs lg:py-2.5 lg:text-sm font-semibold transition-colors ${activeConceptTheme === tab.key ? 'bg-white text-zinc-800' : 'bg-white/10 hover:bg-white/20 text-zinc-200'}`}>{t(tab.labelKey, language)}</button></Tooltip>))}</div>
                      <div className="flex bg-black/20 rounded-md p-1">
                        <Tooltip tip={t('tooltip.subTabClothing', language)} position="bottom" className="flex-1"><button onClick={() => setActiveConceptSubTab('clothing')} className={`w-full py-2 rounded-md text-xs font-semibold ${activeConceptSubTab === 'clothing' ? 'bg-neutral-700 text-white' : 'text-zinc-400 hover:bg-neutral-700/50'}`}>{t('subTab.clothingConcept', language)}</button></Tooltip>
                        <Tooltip tip={t('tooltip.subTabItem', language)} position="bottom" className="flex-1"><button onClick={() => setActiveConceptSubTab('item')} className={`w-full py-2 rounded-md text-xs font-semibold ${activeConceptSubTab === 'item' ? 'bg-neutral-700 text-white' : 'text-zinc-400 hover:bg-neutral-700/50'}`}>{t('subTab.itemConcept', language)}</button></Tooltip>
                      </div>
                      {activeConceptSubTab === 'clothing' && activeClothingThemeData && (<div className="space-y-3 animate-category-fade-in">{activeClothingThemeData.categories.map(category => (<div key={category.categoryKey}><h3 className="text-xs lg:text-sm font-semibold mb-2 text-zinc-300">{t(`clothingCategory.${category.categoryKey}` as TranslationKey, language)}</h3><div className="flex flex-wrap gap-1 lg:gap-2">{category.items.map(item => (<Tooltip key={item} tip={getEnumText('clothing', item, language)} position="top" className="flex-grow"><button onClick={() => handleClothingItemToggle(item)} className={`px-2 py-1 text-[11px] lg:px-3 lg:py-1.5 lg:text-xs rounded-md w-full transition-colors ${(selectedClothingConcept === item) ? 'bg-white text-zinc-800 font-semibold' : 'bg-white/10 hover:bg-white/20 text-zinc-300'}`}>{getEnumText('clothing', item, language)}</button></Tooltip>))}</div></div>))}</div>)}
                      {activeConceptSubTab === 'item' && activeObjectThemeData && (<div className="space-y-3 animate-category-fade-in">{activeObjectThemeData.categories.map(category => (<div key={category.categoryKey}><h3 className="text-xs lg:text-sm font-semibold mb-2 text-zinc-300">{t(`objectCategory.${category.categoryKey}` as TranslationKey, language)}</h3><div className="flex flex-wrap gap-1 lg:gap-2">{category.items.map(item => (<Tooltip key={item} tip={getEnumText('object', item, language)} position="top" className="flex-grow"><button onClick={() => handleObjectItemToggle(item)} className={`px-2 py-1 text-[11px] lg:px-3 lg:py-1.5 lg:text-xs rounded-md w-full transition-colors ${selectedObjectItems.includes(item) ? 'bg-white text-zinc-800 font-semibold' : 'bg-white/10 hover:bg-white/20 text-zinc-300'}`}>{getEnumText('object', item, language)}</button></Tooltip>))}</div></div>))}</div>)}
                    </div>
                  </Section></>)}
              {activeRightPanelTab === 'camera' && (<>
                  <Section title={t('section.cameraView.title', language)} tooltipText={t('tooltip.section.cameraView', language)} icon={<CameraIcon/>}>
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex flex-col items-center gap-4">
                        <ViewportControl value={cameraView} onChange={handleCameraViewChange} language={language} isActive={isCameraViewActive} onActivate={() => setIsCameraViewActive(true)} onDeactivate={() => setIsCameraViewActive(false)} tooltipText={t('tooltip.viewportControl', language)} cubeFaceClassName="bg-sky-500/80 border border-sky-400/50"/>
                        <CameraViewSelector currentView={cameraView} onSetView={handleCameraPresetChange} language={language} isCameraViewActive={isCameraViewActive}/>
                      </div>
                      <div className="w-full flex items-center gap-2"><label htmlFor="fov-slider" className="text-xs lg:text-sm font-medium text-zinc-300">FOV</label><Tooltip tip={t('tooltip.fovSlider', language)} position="top" className="w-full"><input id="fov-slider" type="range" min="10" max="120" value={cameraView.fov} onChange={e => setCameraView(prev => ({ ...prev, fov: parseInt(e.target.value, 10) }))} className="w-full"/></Tooltip><span className="text-xs lg:text-sm font-mono text-zinc-400 w-10 text-right">{cameraView.fov}°</span><Tooltip tip={t('tooltip.resetFov', language)} position="top"><button onClick={() => setCameraView(prev => ({ ...prev, fov: 50 }))} className="p-1.5 rounded-full text-zinc-400 hover:bg-white/20 hover:text-white transition-colors"><ResetIcon/></button></Tooltip></div>
                      <div className="w-full"><Tooltip tip={t('tooltip.aPose', language)} position="bottom"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={useAposeForViews} onChange={e => setUseAposeForViews(e.target.checked)} className="h-4 w-4 rounded bg-neutral-700 border-neutral-600 text-sky-500 focus:ring-sky-500" /><span className="text-xs lg:text-sm text-zinc-300">{t('aPose', language)}</span></label></Tooltip></div>
                    </div>
                  </Section>
                  <Section title={t('section.lighting.title', language)} tooltipText={t('tooltip.lightingDirection', language)} icon={<LightIcon/>}>
                      <div className="flex flex-col items-center gap-4">
                          <div className="flex flex-col items-center gap-4">
                              <ViewportControl value={lightDirection} onChange={handleLightDirectionChange} language={language} isActive={isLightDirectionActive} onActivate={() => setIsLightDirectionActive(true)} onDeactivate={() => setIsLightDirectionActive(false)} tooltipText={t('tooltip.lightingDirection', language)} cubeFaceClassName="bg-amber-500/80 border border-amber-400/50"/>
                              <LightingDirectionSelector currentDirection={lightDirection} onSetDirection={handleLightPresetChange} language={language} isLightDirectionActive={isLightDirectionActive}/>
                          </div>
                          <div className="w-full flex items-center gap-2"><label htmlFor="light-intensity-slider" className="text-xs lg:text-sm font-medium text-zinc-300">{t('section.lighting.intensity', language)}</label><Tooltip tip={t('tooltip.lightingIntensity', language)} position="top" className="w-full"><input id="light-intensity-slider" type="range" min="0.1" max="2.0" step="0.1" value={lightIntensity} onChange={e => setLightIntensity(parseFloat(e.target.value))} className="w-full"/></Tooltip><span className="text-xs lg:text-sm font-mono text-zinc-400 w-12 text-right">{lightIntensity.toFixed(1)}</span><Tooltip tip={t('tooltip.resetLightIntensity', language)} position="top"><button onClick={() => setLightIntensity(1.0)} className="p-1.5 rounded-full text-zinc-400 hover:bg-white/20 hover:text-white transition-colors"><ResetIcon/></button></Tooltip></div>
                      </div>
                  </Section></>)}
              {activeRightPanelTab === 'pose' && (<div className="space-y-4 animate-category-fade-in"><Section title="포즈 그리기" tooltipText="스틱맨 형태로 포즈를 직접 그려보세요." icon={<PaletteIcon />}><DrawingCanvas onDrawEnd={setPoseControlImage} language={language} /></Section></div>)}
              {activeRightPanelTab === 'painting' && <ColorPalettePanel language={language} />}
            </div>
        </div>
    )
};