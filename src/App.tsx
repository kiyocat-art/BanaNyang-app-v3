import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  GeneratedMedia, GenerationTask, MonthlyCredit, BoardImage, ModelName, GenerationBatch, PromptFolder, GenerationParams
} from './types';
import { BANANANG_MEDIA_MIME_TYPE, IMAGES_PER_PAGE, DEFAULT_PROMPT_FOLDERS, TOTAL_MONTHLY_CREDIT } from './constants';
// FIX: Import `fileToBase64` to resolve reference error when saving workspace.
import { setApiKey, getApiKey, fileToBase64 } from './services/geminiService';
import { t, Language, TranslationKey } from './localization';
import { IElectronAPI } from './electron';
import { ImageViewerModal } from './components/ImageViewerModal';
import { UnifiedEditorModal, EditResult } from './features/canvas/components/UnifiedEditorModal';
import { AppSettingsModal } from './components/AppSettingsModal';
import { SavePresetModal } from './components/SavePresetModal';
import { useCanvasStore } from './store/canvasStore';
import { useImageGeneration } from './hooks/useImageGeneration';
import { Header } from './features/header/Header';
import { LeftPanel } from './features/left-panel/LeftPanel';
import { RightPanel } from './features/right-panel';
import { MinusIcon } from './components/icons';
import { useShortcutStore } from './hooks/useShortcuts';
import { useGenerationStore } from './store/generationStore';
import { GroupQuickBar } from './features/canvas/components/GroupQuickBar';
import { Canvas } from './features/canvas';
import { useDraggablePanel } from './hooks/useDraggablePanel';
import { RoleThumbnails } from './features/canvas/components/RoleThumbnails';

// --- Global Type Declarations ---
declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    showSaveFilePicker?: (options?: any) => Promise<FileSystemFileHandle>;
    showOpenFilePicker?: (options?: any) => Promise<FileSystemFileHandle[]>;
    electronAPI: IElectronAPI;
  }
  interface FileSystemDirectoryHandle {
    name: string;
    queryPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
    requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
    removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  }
  interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>;
    getFile(): Promise<File>;
  }
  interface FileSystemWritableFileStream extends WritableStream {
    write(data: any): Promise<void>;
    close(): Promise<void>;
  }
  interface ClipboardItem {
    new (data: { [mimeType: string]: Blob }): ClipboardItem;
  }
}

// --- Helper function for drag-and-drop ---
const dataURLtoFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
};


// --- Main Application Component ---
const LOCAL_CREDIT_KEY = 'bananang-monthly-credit-local';
const PRESET_STORAGE_KEY = 'bananang-prompt-presets';
type NotificationType = 'success' | 'error';

const HEADER_HEIGHT = 64;
const PADDING = 16;

const LEFT_PANEL_STATE_KEY = 'bananang-left-panel-state';
const RIGHT_PANEL_STATE_KEY = 'bananang-right-panel-state';

const isLgScreen = window.innerWidth >= 1024;

const initialLeftPanelState = { x: PADDING, y: HEADER_HEIGHT + PADDING, width: isLgScreen ? 400 : 340, height: isLgScreen ? 700 : 600, isCollapsed: false };
const getInitialRightPanelState = () => ({ x: window.innerWidth - (isLgScreen ? 450 : 360) - PADDING, y: HEADER_HEIGHT + PADDING, width: isLgScreen ? 450 : 360, height: isLgScreen ? 800 : 650, isCollapsed: false });

const getInitialPanelState = (key: string, defaultValue: any) => {
    try {
        const savedState = localStorage.getItem(key);
        if (savedState) {
            const parsed = JSON.parse(savedState);
            if (typeof parsed === 'object' && parsed !== null && 'x' in parsed && 'width' in parsed) {
                return parsed;
            }
        }
    } catch (e) {
        console.error(`Failed to load panel state for ${key} from localStorage`, e);
    }
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
};


export default function App() {
  const language: Language = 'ko';
  
  const [modelName] = useState<ModelName>('gemini-2.5-flash-image');
  const [showAppSettingsModal, setShowAppSettingsModal] = useState<boolean>(!getApiKey());
  const [showQuotaModal, setShowQuotaModal] = useState<boolean>(false);
  
  const [generationBatches, setGenerationBatches] = useState<GenerationBatch[]>([]);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [zoomedImageSrc, setZoomedImageSrc] = useState<string | null>(null);
  const [unifiedEditingImage, setUnifiedEditingImage] = useState<BoardImage | null>(null);

  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const [saveDirectoryHandle, setSaveDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  
  const [monthlyCredit, setMonthlyCredit] = useState<MonthlyCredit>({ current: TOTAL_MONTHLY_CREDIT, total: TOTAL_MONTHLY_CREDIT, month: new Date().toISOString().slice(0, 7) });
  const [userAcknowledgedPaidUsage, setUserAcknowledgedPaidUsage] = useState<boolean>(false);
  
  const [downloadStatus, setDownloadStatus] = useState<Record<string, 'downloading' | 'success'>>({});
  const [downloadedImageIds, setDownloadedImageIds] = useState<Set<string>>(new Set());
  
  const [manualUsedCredit, setManualUsedCredit] = useState<number | ''>('');
  const [notification, setNotification] = useState<{ id: number; message: string; type: NotificationType } | null>(null);
  
  const { panelState: leftPanelState, setPanelState: setLeftPanelState, handleDragStart: handleLeftPanelDragStart, handleResizeStart: handleLeftPanelResizeStart, toggleCollapse: toggleLeftPanelCollapse } = useDraggablePanel(getInitialPanelState(LEFT_PANEL_STATE_KEY, initialLeftPanelState));
  const { panelState: rightPanelState, setPanelState: setRightPanelState, handleDragStart: handleRightPanelDragStart, handleResizeStart: handleRightPanelResizeStart, toggleCollapse: toggleRightPanelCollapse } = useDraggablePanel(getInitialPanelState(RIGHT_PANEL_STATE_KEY, getInitialRightPanelState));
  
  const [isDirty, setIsDirty] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const quitAfterSave = useRef(false);

  const [folders, setFolders] = useState<PromptFolder[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const isModalOpen = !!zoomedImageSrc || !!unifiedEditingImage || showAppSettingsModal || showQuotaModal || showExitConfirmModal || isSaveModalOpen;

  const mainPanelRef = useRef<HTMLElement>(null);
  
  const [workspaceFilePath, setWorkspaceFilePath] = useState<string | null>(null);

  const isInitialLoad = useRef(true);

  useEffect(() => {
    useShortcutStore.getState();
  }, []);

   useEffect(() => {
        try {
            const storedPresets = localStorage.getItem(PRESET_STORAGE_KEY);
            if (storedPresets) {
                setFolders(JSON.parse(storedPresets));
            } else {
                setFolders(DEFAULT_PROMPT_FOLDERS);
            }
        } catch (error) { console.error("Failed to load presets:", error); }
    }, []);

    const saveFolders = (newFolders: PromptFolder[]) => {
        setFolders(newFolders);
        localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(newFolders));
    };

  useEffect(() => {
    const timer = setTimeout(() => { isInitialLoad.current = false; }, 500);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    const unsub = useCanvasStore.subscribe((state, prevState) => {
      if (!isInitialLoad.current && (state.boardImages !== prevState.boardImages || state.boardGroups !== prevState.boardGroups)) {
        setIsDirty(true);
      }
    });
    return unsub;
  }, []);
  
  useEffect(() => {
    if (!isInitialLoad.current) setIsDirty(true);
  }, [leftPanelState, rightPanelState]);
  
  useEffect(() => {
    if(window.electronAPI) window.electronAPI.setDirty(isDirty);
  }, [isDirty]);

  const markAsClean = useCallback(() => {
    setIsDirty(false);
    isInitialLoad.current = true;
    setTimeout(() => { isInitialLoad.current = false; }, 500);
  }, []);
  
  useEffect(() => {
      localStorage.setItem(LEFT_PANEL_STATE_KEY, JSON.stringify(leftPanelState));
  }, [leftPanelState]);

  useEffect(() => {
      localStorage.setItem(RIGHT_PANEL_STATE_KEY, JSON.stringify(rightPanelState));
  }, [rightPanelState]);

  const { boardImages, addNewCanvasImage, zoomToImage, setBoardImages, boardGroups, setBoardGroups, setSelectedImageIds: setCanvasSelectedIds, uploadImages, selectedImageIds, selectedGroupIds, updateImage, downloadSelection } = useCanvasStore();

  const showNotification = useCallback((message: string, type: NotificationType) => {
    setNotification({ id: Date.now(), message, type });
  }, []);

  const {
    generationQueue,
    isProcessing,
    queueGeneration,
    cancelAll,
    cancelSingleTask,
  } = useImageGeneration({
    monthlyCredit,
    setMonthlyCredit,
    userAcknowledgedPaidUsage,
    modelName,
    setGenerationBatches,
    setCurrentPage,
    setShowUsagePlanModal: setShowAppSettingsModal,
    setShowQuotaModal,
    language,
    mainPanelRef,
    onNotification: showNotification,
  });

  const originalImage = useMemo(() => boardImages.find(img => img.role === 'original'), [boardImages]);

  useEffect(() => {
    if (notification) {
        const timer = setTimeout(() => setNotification(null), notification.type === 'error' ? 6000 : 4000);
        return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleStartUnifiedEdit = (imageId: string) => {
      const imageToEdit = boardImages.find(img => img.id === imageId);
      if (imageToEdit) setUnifiedEditingImage(imageToEdit);
  };

  const handleUnifiedEditComplete = async (result: EditResult) => {
      if (!unifiedEditingImage) return;

      if (result.type === 'newImage') {
          const newFile = await dataURLtoFile(result.dataUrl, `edited-${unifiedEditingImage.file.name}`);
          addNewCanvasImage(result.dataUrl, newFile, unifiedEditingImage);
      } else if (result.type === 'update') {
          let updates: Partial<BoardImage> = { ...result.updates };
          if (result.updates.maskFile) {
              const oldImage = boardImages.find(img => img.id === unifiedEditingImage.id);
              if (oldImage?.maskSrc) URL.revokeObjectURL(oldImage.maskSrc);
              updates.maskSrc = URL.createObjectURL(result.updates.maskFile);
          }
          updateImage(unifiedEditingImage.id, updates);
      } else if (result.type === 'generate') {
          handleDoQueue(result.maskFile);
      }

      setUnifiedEditingImage(null);
  };

 useEffect(() => {
    const initializeCredit = () => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        try {
            const stored = localStorage.getItem(LOCAL_CREDIT_KEY);
            if (stored) {
              const parsed: unknown = JSON.parse(stored);
              if (parsed && typeof parsed === 'object' && parsed !== null && 'current' in parsed && 'total' in parsed && 'month' in parsed && typeof (parsed as MonthlyCredit).current === 'number' && typeof (parsed as MonthlyCredit).total === 'number' && typeof (parsed as MonthlyCredit).month === 'string' && (parsed as MonthlyCredit).month === currentMonth) {
                setMonthlyCredit(parsed as MonthlyCredit); return;
              }
            }
        } catch (e: any) { console.error("Failed to parse saved credit", e); }
        const newCreditState = { current: TOTAL_MONTHLY_CREDIT, total: TOTAL_MONTHLY_CREDIT, month: currentMonth };
        setMonthlyCredit(newCreditState);
        localStorage.setItem(LOCAL_CREDIT_KEY, JSON.stringify(newCreditState));
    };
    initializeCredit();
  }, []);

  const handleUpdateTotalCredit = (newTotal: number) => {
    setMonthlyCredit(prev => {
        const usagePercentage = prev.total > 0 ? (prev.total - prev.current) / prev.total : 0;
        const newUsed = Math.round(newTotal * usagePercentage);
        const newCurrent = newTotal - newUsed;
        
        const newCreditState = { ...prev, total: newTotal, current: newCurrent };
        localStorage.setItem(LOCAL_CREDIT_KEY, JSON.stringify(newCreditState));
        return newCreditState;
    });
  };

  useEffect(() => {
    if (document.activeElement?.id !== 'used-credit-input') setManualUsedCredit(monthlyCredit.total - monthlyCredit.current);
  }, [monthlyCredit]);

  const handleManualUsedCreditChange = (value: string) => {
      if (value === '') setManualUsedCredit('');
      else { const numValue = parseInt(value, 10); if (!isNaN(numValue)) setManualUsedCredit(numValue); }
  };

  const handleUpdateCredit = () => {
      const newUsedAmount = Math.max(0, Math.min(monthlyCredit.total, Number(manualUsedCredit)));
      const newCurrentAmount = monthlyCredit.total - newUsedAmount;
      const newCreditState = { ...monthlyCredit, current: newCurrentAmount };
      setMonthlyCredit(newCreditState);
      localStorage.setItem(LOCAL_CREDIT_KEY, JSON.stringify(newCreditState));
  };

  const handleCreditInputBlur = () => {
      const usedAmount = Number(manualUsedCredit);
      if (isNaN(usedAmount) || manualUsedCredit === '') setManualUsedCredit(monthlyCredit.total - monthlyCredit.current);
      else { const clamped = Math.max(0, Math.min(monthlyCredit.total, usedAmount)); if (clamped !== usedAmount) setManualUsedCredit(clamped); }
  };
  
  const handleToggleMediaSelection = (id: string) => setSelectedMediaIds(prev => { const newSet = new Set(prev); newSet.has(id) ? newSet.delete(id) : newSet.add(id); return newSet; });

  const allHistoryMedia = useMemo(() => generationBatches.flatMap(batch => batch.media), [generationBatches]);
  
  const handleDeleteSelectedMedia = async () => {
      if (selectedMediaIds.size === 0) return;
      const count = selectedMediaIds.size;
      setGenerationBatches(prev => prev.map(batch => ({ ...batch, media: batch.media.filter(item => !selectedMediaIds.has(item.id)) })).filter(batch => batch.media.length > 0));
      setSelectedMediaIds(new Set());
      showNotification(t('delete.success', language, { count }), 'success');
  };
  
  const handleHistoryDragStart = (e: React.DragEvent<HTMLElement>, media: GeneratedMedia) => { if (media.type !== 'image') { e.preventDefault(); return; } e.dataTransfer.setData(BANANANG_MEDIA_MIME_TYPE, media.id); e.dataTransfer.effectAllowed = 'copy'; };
  
  const saveMediaToHandle = async (media: GeneratedMedia, dirHandle: FileSystemDirectoryHandle) => {
      try {
          const res = await fetch(media.src); const blob = await res.blob();
          const fileName = `bananang-${media.id}.${media.type === 'video' ? 'mp4' : 'png'}`;
          const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable(); await writable.write(blob); await writable.close();
      } catch (err: any) {
          console.error(`Failed to save media ${media.id}:`, err);
          if (err instanceof Error && err.name === 'NotAllowedError') showNotification(t('error.permissionDenied', language), 'error');
          else showNotification(t('error.saveFailed', language), 'error');
          setSaveDirectoryHandle(null); throw err;
      }
  };
    
  const displayedHistoryMedia = useMemo(() => allHistoryMedia, [allHistoryMedia]);
  const totalPages = Math.ceil(displayedHistoryMedia.length / IMAGES_PER_PAGE);
  const currentMedia = useMemo(() => { const startIndex = (currentPage - 1) * IMAGES_PER_PAGE; return displayedHistoryMedia.slice(startIndex, startIndex + IMAGES_PER_PAGE); }, [displayedHistoryMedia, currentPage]);
  
  useEffect(() => { setCurrentPage(1); }, []);

  const handleSelectAllToggle = () => {
    const currentMediaIds = new Set(currentMedia.map(item => item.id));
    const areAllCurrentPageMediaSelected = currentMedia.length > 0 && currentMedia.every(item => selectedMediaIds.has(item.id));
    if (areAllCurrentPageMediaSelected) setSelectedMediaIds(prev => { const newSet = new Set(prev); currentMediaIds.forEach(id => newSet.delete(id)); return newSet; });
    else setSelectedMediaIds(prev => new Set([...prev, ...currentMediaIds]));
  };

  const handleDownload = async (e: React.MouseEvent, media: GeneratedMedia) => {
    e.stopPropagation();
    if (downloadStatus[media.id] === 'downloading') return;
    setDownloadStatus(prev => ({ ...prev, [media.id]: 'downloading' }));
    try {
        const link = document.createElement('a'); link.href = media.src; link.download = `bananang-${media.id}.${media.type === 'video' ? 'mp4' : 'png'}`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
        setDownloadedImageIds(prev => new Set(prev).add(media.id)); setDownloadStatus(prev => ({ ...prev, [media.id]: 'success' }));
        showNotification(t('downloadComplete', language), 'success');
        setTimeout(() => { setDownloadStatus(prev => { const newState = { ...prev }; if (newState[media.id] === 'success') delete newState[media.id]; return newState; }); }, 2000);
    } catch (err: any) {
        console.error("Download failed:", err);
        setDownloadStatus(prev => { const newState = { ...prev }; delete newState[media.id]; return newState; });
    }
  };
  
  const handleDownloadSelectedMedia = async () => {
    if (selectedMediaIds.size === 0) return;
    let successCount = 0;
    
    for (const mediaId of selectedMediaIds) {
        const mediaItem = allHistoryMedia.find(m => m.id === mediaId);
        if (mediaItem) {
            setDownloadStatus(prev => ({ ...prev, [mediaId]: 'downloading' }));
            try {
                if (saveDirectoryHandle) {
                    await saveMediaToHandle(mediaItem, saveDirectoryHandle);
                } else {
                    const link = document.createElement('a'); link.href = mediaItem.src; link.download = `bananang-${mediaItem.id}.${mediaItem.type === 'video' ? 'mp4' : 'png'}`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
                }
                await new Promise(resolve => setTimeout(resolve, 100));
                setDownloadedImageIds(prev => new Set(prev).add(mediaId)); setDownloadStatus(prev => ({ ...prev, [mediaId]: 'success' })); successCount++;
            } catch (err: any) {
                console.error(`Download failed for ${mediaId}:`, err);
                setDownloadStatus(prev => { const newState = { ...prev }; delete newState[mediaId]; return newState; });
            }
        }
    }

    if (successCount > 0) {
        if (saveDirectoryHandle) {
            showNotification(`${successCount}개의 파일이 ${saveDirectoryHandle.name} 폴더에 저장되었습니다.`, 'success');
        } else {
            showNotification(t('downloadCompleteMultiple', language, { count: successCount }), 'success');
        }
    }
    setTimeout(() => { setDownloadStatus(prev => { const newState = { ...prev }; for (const mediaId of selectedMediaIds) if (newState[mediaId] === 'success') delete newState[mediaId]; return newState; }); }, 2000);
};

  const handleSelectSaveDirectory = async () => {
    try {
        if (!window.showDirectoryPicker) {
            showNotification(t('error.fsApiNotSupported', language), 'error');
            return;
        }
        const handle = await window.showDirectoryPicker();
        setSaveDirectoryHandle(handle);
    } catch (err: any) {
        if (err.name !== 'AbortError') {
            console.error("Error selecting directory:", err);
            showNotification(t('error.directorySelectFailed', language), 'error');
        }
    }
  };

  const resetPanels = () => {
    setLeftPanelState(initialLeftPanelState);
    setRightPanelState(getInitialRightPanelState());
  }
  
  const handleZoomToImage = (image: BoardImage) => {
      if (mainPanelRef.current) zoomToImage(image, mainPanelRef.current.getBoundingClientRect());
  };
  
  const handleZoomImage = (media: File | string | null) => {
      if (!media) return;
      const src = media instanceof File ? URL.createObjectURL(media) : media;
      setZoomedImageSrc(src);
  };
  
  const handleCloseViewer = () => {
      if(zoomedImageSrc) URL.revokeObjectURL(zoomedImageSrc);
      setZoomedImageSrc(null);
  };
  const handleUploadAndPositionImages = useCallback(async (files: File[] | FileList, position?: { x: number; y: number }) => {
    if (!mainPanelRef.current) return;
    const containerRect = mainPanelRef.current.getBoundingClientRect();
    const dropPos = position || { x: containerRect.left + containerRect.width / 2, y: containerRect.top + containerRect.height / 2 };
    await uploadImages(Array.from(files), dropPos, containerRect);
  }, [uploadImages]);

  const handleSaveSuccess = useCallback((newFilePath?: string | null) => {
    showNotification(t('workspace.saved', language), 'success');
    markAsClean();
    if (newFilePath) {
        setWorkspaceFilePath(newFilePath);
    }
    if (quitAfterSave.current && window.electronAPI) {
        window.electronAPI.savedAndReadyToQuit();
    }
    if (quitAfterSave.current) {
        quitAfterSave.current = false;
    }
  }, [language, showNotification, markAsClean, setWorkspaceFilePath]);

  const handleSaveWorkspace = useCallback(async (isSaveAs = false) => {
    if (boardImages.length === 0 && boardGroups.length === 0) return;

    try {
        const serializableImages = await Promise.all(boardImages.map(async (img) => {
            const base64 = await fileToBase64(img.file);
            const { file, src, ...rest } = img;
            return { ...rest, fileData: { name: file.name, type: file.type, base64 } };
        }));
        const workspaceData = { 
            version: '1.0', 
            boardImages: serializableImages,
            boardGroups,
            leftPanelState,
            rightPanelState,
        };
        const content = JSON.stringify(workspaceData);

        if (window.electronAPI) {
            if (isSaveAs || !workspaceFilePath) {
                const result = await window.electronAPI.saveAs(content);
                if (result.success) {
                    handleSaveSuccess(result.filePath);
                } else if (result.error) {
                    showNotification(t('error.saveWorkspaceFailed', language), 'error');
                }
            } else {
                const success = await window.electronAPI.saveFile(workspaceFilePath, content);
                if (success) handleSaveSuccess();
                else showNotification(t('error.saveWorkspaceFailed', language), 'error');
            }
        }
    } catch (err: unknown) {
        console.error("Failed to save workspace:", err);
        showNotification(t('error.saveWorkspaceFailed', language), 'error');
    }
  }, [boardImages, boardGroups, language, leftPanelState, rightPanelState, workspaceFilePath, showNotification, handleSaveSuccess]);
  
  const handleLoadWorkspace = useCallback(async (content?: string, filePath?: string) => {
    type SavedImage = {
        fileData: { type: string; base64: string; name: string; };
        id: string; x: number; y: number; width: number; height: number;
        role: BoardImage['role']; refIndex?: number; zIndex: number; groupId?: string;
        generationParams?: GenerationParams;
    }
    try {
      let fileContent = content;
      let newFilePath = filePath;

      if (!fileContent && window.electronAPI) {
        const result = await window.electronAPI.openFileDialog();
        if (result) {
            fileContent = result.content;
            newFilePath = result.filePath;
        } else return; // User cancelled
      }
      
      if (!fileContent) throw new Error("No content to load");

      const data = JSON.parse(fileContent);
      if (data.version !== '1.0' || !Array.isArray(data.boardImages)) throw new Error('Invalid workspace file format.');
      
      if (data.leftPanelState) setLeftPanelState(data.leftPanelState);
      if (data.rightPanelState) setRightPanelState(data.rightPanelState);
      
      const newBoardImages: BoardImage[] = await Promise.all(
          data.boardImages.map(async (savedImg: SavedImage): Promise<BoardImage> => {
              const dataUrl = `data:${String(savedImg.fileData.type)};base64,${String(savedImg.fileData.base64)}`;
              const file = await dataURLtoFile(dataUrl, String(savedImg.fileData.name));
              const src = URL.createObjectURL(file);
              return {
                id: savedImg.id, src, file, x: savedImg.x, y: savedImg.y, width: savedImg.width, height: savedImg.height,
                role: savedImg.role, refIndex: savedImg.refIndex, zIndex: savedImg.zIndex, groupId: savedImg.groupId,
                generationParams: savedImg.generationParams,
              };
          })
      );
      setBoardImages(() => newBoardImages);
      setBoardGroups(() => data.boardGroups || []);
      setCanvasSelectedIds(() => new Set());
      setWorkspaceFilePath(newFilePath || null);
      showNotification(t('workspace.loaded', language), 'success');
      markAsClean();
    } catch (err: unknown) { console.error("Failed to load workspace:", err); showNotification(t('error.loadWorkspaceFailed', language), 'error'); }
  }, [language, setCanvasSelectedIds, setBoardImages, setBoardGroups, markAsClean, showNotification, setLeftPanelState, setRightPanelState]);
  
  useEffect(() => {
    if (window.electronAPI) {
      const cleanupLoad = window.electronAPI.onLoadWorkspace((filePath, content) => {
        if (isDirty) {
          // You might want to confirm with the user before overwriting
        }
        handleLoadWorkspace(content, filePath || undefined);
      });
      const cleanupClose = window.electronAPI.onCanClose(() => {
        setShowExitConfirmModal(true);
      });
      return () => {
        cleanupLoad();
        cleanupClose();
      };
    }
  }, [isDirty, handleLoadWorkspace]);

  const compositeSelectionToBlob = useCallback(async (): Promise<Blob | null> => {
    const imagesToCopy = new Map<string, BoardImage>();
    selectedImageIds.forEach(id => { const img = boardImages.find(i => i.id === id); if (img) imagesToCopy.set(id, img); });
    selectedGroupIds.forEach(groupId => { const group = boardGroups.find(g => g.id === groupId); group?.imageIds.forEach(id => { const img = boardImages.find(i => i.id === id); if (img) imagesToCopy.set(id, img); }); });
    const finalImages = Array.from(imagesToCopy.values());
    if (finalImages.length === 0) return null;
    const loadedImages = await Promise.all(finalImages.map(imgData => new Promise<{ data: BoardImage, element: HTMLImageElement }>((resolve, reject) => { const img = new Image(); img.crossOrigin = "anonymous"; img.onload = () => resolve({ data: imgData, element: img }); img.onerror = reject; img.src = imgData.src; })));
    const sortedLoadedImages = loadedImages.sort((a, b) => a.data.zIndex - b.data.zIndex);
    const bounds = {
        minX: Math.min(...sortedLoadedImages.map(i => i.data.x)),
        minY: Math.min(...sortedLoadedImages.map(i => i.data.y)),
        maxX: Math.max(...sortedLoadedImages.map(i => i.data.x + i.data.width)),
        maxY: Math.max(...sortedLoadedImages.map(i => i.data.y + i.data.height)),
    };
    let maxScale = 1;
    for (const { data, element } of sortedLoadedImages) { if (data.width > 0) { const scale = element.naturalWidth / data.width; if (scale > maxScale) maxScale = scale; }}
    const MAX_DIMENSION = 8192;
    let canvasWidth = (bounds.maxX - bounds.minX) * maxScale;
    let canvasHeight = (bounds.maxY - bounds.minY) * maxScale;
    if (canvasWidth > MAX_DIMENSION || canvasHeight > MAX_DIMENSION) { const downscale = Math.min(MAX_DIMENSION / canvasWidth, MAX_DIMENSION / canvasHeight); maxScale *= downscale; canvasWidth *= downscale; canvasHeight *= downscale; }
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    for (const { data, element } of sortedLoadedImages) { const drawX = (data.x - bounds.minX) * maxScale; const drawY = (data.y - bounds.minY) * maxScale; const drawWidth = data.width * maxScale; const drawHeight = data.height * maxScale; ctx.drawImage(element, drawX, drawY, drawWidth, drawHeight); }
    return new Promise<Blob | null>(resolve => canvas.toBlob(blob => resolve(blob), 'image/png'));
  }, [boardImages, boardGroups, selectedImageIds, selectedGroupIds]);
  
const handlePasteFromClipboard = useCallback(async (position?: { x: number; y: number }) => {
    try {
        let file: File | null = null;
        if (window.electronAPI) { // Electron environment
            const dataUrl = await window.electronAPI.readImage();
            if (dataUrl) {
                file = await dataURLtoFile(dataUrl, `pasted_image_${Date.now()}.png`);
            }
        } else { // Web environment
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                const imageType = item.types.find(type => type.startsWith('image/'));
                if (imageType) {
                    const blob = await item.getType(imageType);
                    file = new File([blob], `pasted_image_${Date.now()}.png`, { type: blob.type });
                    break; 
                }
            }
        }

        if (file) {
             await handleUploadAndPositionImages([file], position);
        }
    } catch (error) {
        console.error('Failed to read from clipboard:', error);
        showNotification(t('error.pasteImage', language), 'error');
    }
}, [handleUploadAndPositionImages, language, showNotification]);

  useEffect(() => {
    const pasteHandler = (e: ClipboardEvent) => {
        if (isModalOpen || document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        handlePasteFromClipboard(); // Paste to center
    };

    document.addEventListener('paste', pasteHandler);
    return () => document.removeEventListener('paste', pasteHandler);
  }, [handlePasteFromClipboard, isModalOpen]);

  const { setBodyPartReferenceMap, setSelectedClothingConcept, setSelectedObjectItems, setSelectedActionPose } = useGenerationStore();
  const handleLoadGenerationParams = useCallback((params: GenerationParams) => {
      setCustomPrompt(params.customPrompt);
      setBodyPartReferenceMap(params.bodyPartReferenceMap);
      setSelectedClothingConcept(params.selectedClothingItems[0] || null);
      setSelectedObjectItems(params.selectedObjectItems);
      setSelectedActionPose(params.selectedActionPose);
      showNotification('Generation parameters loaded!', 'success');
  }, [setCustomPrompt, setBodyPartReferenceMap, setSelectedClothingConcept, setSelectedObjectItems, setSelectedActionPose, showNotification]);

  const handleDoQueue = (maskImage: File | null = null) => {
      const { selectedPalette, numImages } = useGenerationStore.getState();
      const hasImageTask = true; 
      const canGenerate = (originalImage || (customPrompt && selectedPalette)) && hasImageTask && !!getApiKey() && !!modelName.trim();
    
      if (!canGenerate || (isProcessing && generationQueue.length === 0)) return;
      if (!originalImage && !(customPrompt && selectedPalette)) {
          showNotification(t('error.noOriginalImage', language), 'error');
          return;
      };

      const {
          cameraView, isCameraViewActive, lightDirection, lightIntensity, isLightDirectionActive,
          useAposeForViews, bodyPartReferenceMap, selectedClothingConcept, selectedObjectItems,
          poseControlImage, selectedActionPose, isApplyingFullOutfit, isApplyingTop, isApplyingBottom,
          selectedPalette: currentPalette, numPaletteColors, isAutoColorizeSketch,
      } = useGenerationStore.getState();

      const textureImages = boardImages
          .filter(img => img.role === 'reference')
          .sort((a, b) => (a.refIndex ?? 0) - (b.refIndex ?? 0))
          .map(img => ({ file: img.file, maskFile: img.maskFile || null }));

      const backgroundImage = boardImages.find(img => img.role === 'background');
      
      const taskToQueue: GenerationTask = {
          id: `task-img-${Date.now()}`, taskType: 'image', originalImage: originalImage ? originalImage.file : null, customPrompt,
          textureImages, 
          backgroundImage: backgroundImage ? backgroundImage.file : null, 
          backgroundImageAspectRatio: backgroundImage ? (backgroundImage.width / backgroundImage.height).toFixed(2) : null,
          poseControlImage, cameraView: isCameraViewActive ? cameraView : null, bodyPartReferenceMap,
          selectedClothingItems: selectedClothingConcept ? [selectedClothingConcept] : [],
          selectedObjectItems, selectedActionPose, useAposeForViews, isApplyingFullOutfit,
          isApplyingTop, isApplyingBottom,
          lightDirection: isLightDirectionActive ? lightDirection : null,
          lightIntensity: isLightDirectionActive ? lightIntensity : null,
          maskImage: maskImage || (originalImage ? originalImage.maskFile : null) || null,
          selectedPalette: currentPalette, numPaletteColors, isAutoColorizeSketch,
          numImages,
      };
      queueGeneration(taskToQueue);
  };

  const QuotaExceededModal = () => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[250]">
        <div className="bg-neutral-800/50 backdrop-blur-xl border border-white/10 rounded-lg p-8 max-w-md w-full shadow-lg text-center animate-shake">
            <h2 className="text-2xl font-bold mb-4 text-amber-400">{t('quotaModal.title', language)}</h2>
            <p className="text-zinc-400 mb-8 whitespace-pre-wrap">{t('quotaModal.body', language)}</p>
            <div className="flex justify-center gap-4">
                <button onClick={() => { setShowQuotaModal(false); cancelAll(); }} className="px-6 py-2 font-semibold rounded-md bg-neutral-600 hover:bg-neutral-500 text-white transition-colors">{t('quotaModal.stop', language)}</button>
                <button onClick={() => { setUserAcknowledgedPaidUsage(true); setShowQuotaModal(false); }} className="px-6 py-2 font-semibold rounded-md bg-white hover:bg-zinc-200 text-zinc-800 transition-colors">{t('quotaModal.continue', language)}</button>
            </div>
        </div>
    </div>
  );

  const ExitConfirmModal = () => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[300]">
        <div className="bg-neutral-800/50 backdrop-blur-xl border border-white/10 rounded-lg p-8 max-w-md w-full shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4 text-sky-400">저장되지 않은 변경사항</h2>
            <p className="text-zinc-400 mb-8">변경사항을 저장하지 않고 종료하면 작업 내용을 잃게 됩니다. 저장하시겠습니까?</p>
            <div className="flex justify-center gap-4">
                <button onClick={() => window.electronAPI.confirmClose()} className="px-6 py-2 font-semibold rounded-md bg-red-600 hover:bg-red-500 text-white transition-colors">저장 안 함</button>
                <button onClick={() => setShowExitConfirmModal(false)} className="px-6 py-2 font-semibold rounded-md bg-neutral-600 hover:bg-neutral-500 text-white transition-colors">취소</button>
                <button onClick={() => { quitAfterSave.current = true; handleSaveWorkspace(false); setShowExitConfirmModal(false); }} className="px-6 py-2 font-semibold rounded-md bg-white hover:bg-zinc-200 text-zinc-800 transition-colors">저장</button>
            </div>
        </div>
    </div>
  );
  
  return (
    <>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes category-fade-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes shake{10%,90%{transform:translate3d(-1px,0,0)}20%,80%{transform:translate3d(2px,0,0)}30%,50%,70%{transform:translate3d(-4px,0,0)}40%,60%{transform:translate3d(4px,0,0)}}.animate-shake{animation:shake .5s cubic-bezier(.36,.07,.19,.97) both}.animate-category-fade-in{animation:category-fade-in .4s ease-out forwards}@keyframes selection-toolbar-fade-in{from{opacity:0;transform:translate(-50%, 0) scale(0.9)}to{opacity:1;transform:translate(-50%, -100%) scale(1) translateY(-8px)}}@keyframes fade-in-out-top{0%{opacity:0;transform:translate(-50%,-20px)}15%{opacity:1;transform:translate(-50%,0)}85%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-20px)}}.animate-fade-in-out-top{animation:fade-in-out-top 4.0s ease-in-out forwards}input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:8px;background:#404040;border-radius:5px;outline:none;opacity:.8;transition:opacity .2s}input[type=range]:hover{opacity:1}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;background:#fff;cursor:pointer;border-radius:50%;border:2px solid #171717}input[type=range]::-moz-range-thumb{width:20px;height:20px;background:#fff;cursor:pointer;border-radius:50%;border:2px solid #171717}input[type=color]::-webkit-color-swatch-wrapper{padding:0}input[type=color]::-webkit-color-swatch{border:none;border-radius:.375rem}input[type=color]::-moz-color-swatch{border:none;border-radius:.375rem}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield}`}</style>
      <div className="flex flex-col h-screen overflow-hidden bg-neutral-900 text-zinc-200">
        {showAppSettingsModal && <AppSettingsModal 
            onSaveApiKey={(key) => { setApiKey(key); showNotification(t('appSettingsModal.save', language), 'success'); setShowAppSettingsModal(false); }} 
            onClose={() => setShowAppSettingsModal(false)}
            language={language}
            monthlyCredit={monthlyCredit}
            onUpdateTotalCredit={handleUpdateTotalCredit}
            folders={folders}
            saveFolders={saveFolders}
            currentPrompt={customPrompt}
            onLoadPrompt={setCustomPrompt}
            onNotification={showNotification}
            manualUsedCredit={manualUsedCredit}
            onManualUsedCreditChange={handleManualUsedCreditChange}
            onUpdateCredit={handleUpdateCredit}
            onCreditInputBlur={handleCreditInputBlur}
        />}
        {isSaveModalOpen && <SavePresetModal
            isOpen={isSaveModalOpen}
            onClose={() => setIsSaveModalOpen(false)}
            onSave={(name, folderId) => {
                const newPreset = { id: crypto.randomUUID(), name, prompt: customPrompt };
                const newFolders = folders.map(f => f.id === folderId ? { ...f, presets: [...f.presets, newPreset] } : f);
                saveFolders(newFolders);
                showNotification(t('presets.promptSaved', language), 'success');
                setIsSaveModalOpen(false);
            }}
            folders={folders}
            language={language}
            initialFolderId={null}
        />}
        {showQuotaModal && <QuotaExceededModal />}
        {showExitConfirmModal && <ExitConfirmModal />}
        {zoomedImageSrc && <ImageViewerModal src={zoomedImageSrc} onClose={handleCloseViewer} language={language} />}
        
        <Header onResetAll={resetPanels} onShowAppSettingsModal={() => setShowAppSettingsModal(true)} language={language} />

        <div className="relative flex flex-grow overflow-hidden">
          <main ref={mainPanelRef} className="flex-grow flex flex-col relative min-h-0">
            <Canvas
                allHistoryMedia={allHistoryMedia}
                language={language}
                onZoomSelection={handleZoomImage}
                onEditSelection={handleStartUnifiedEdit}
                onSaveWorkspace={() => handleSaveWorkspace(false)}
                onSaveWorkspaceAs={() => handleSaveWorkspace(true)}
                onLoadWorkspace={handleLoadWorkspace}
                mainPanelRef={mainPanelRef}
                customPrompt={customPrompt}
                onCustomPromptChange={setCustomPrompt}
                onQueueGeneration={queueGeneration}
                isProcessing={isProcessing}
                generationQueue={generationQueue}
                originalImage={originalImage}
                modelName={modelName}
                onZoomToImage={handleZoomToImage}
                notification={notification}
                onNotification={showNotification}
                isModalOpen={isModalOpen}
                onCopySelection={compositeSelectionToBlob}
                onPasteFromClipboard={handlePasteFromClipboard}
                folders={folders}
                saveFolders={saveFolders}
                onSavePreset={() => {
                    if (!customPrompt.trim()) {
                        showNotification(t('presets.noPromptToSave', language), 'error');
                        return;
                    }
                    setIsSaveModalOpen(true);
                }}
                onLoadGenerationParams={handleLoadGenerationParams}
                saveDirectoryHandle={saveDirectoryHandle}
            />
          </main>

          <div 
            style={{
              position: 'fixed',
              width: leftPanelState.width,
              height: leftPanelState.isCollapsed ? 'auto' : leftPanelState.height,
              transform: `translate3d(${leftPanelState.x}px, ${leftPanelState.y}px, 0)`,
              zIndex: 40,
            }}
            className="bg-neutral-800/50 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div onMouseDown={handleLeftPanelDragStart} className="h-10 px-4 flex items-center justify-between flex-shrink-0 cursor-move bg-black/20 border-b border-white/10">
              <h2 className="font-bold text-base text-zinc-100">{t('section.history.title', language)}</h2>
              <button 
                onClick={toggleLeftPanelCollapse}
                className="p-1 text-zinc-400 hover:text-white"
                aria-label={leftPanelState.isCollapsed ? "Expand panel" : "Collapse panel"}
              >
                {leftPanelState.isCollapsed ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4-4l-5 5M4 16v4m0 0h4m-4-4l5-5m11 1v4m0 0h-4m4-4l-5-5" /></svg> : <MinusIcon className="w-4 h-4" />}
              </button>
            </div>
            {!leftPanelState.isCollapsed && (
              <div className="flex-grow min-h-0 relative">
                <LeftPanel
                  language={language}
                  monthlyCredit={monthlyCredit}
                  manualUsedCredit={manualUsedCredit}
                  onManualUsedCreditChange={handleManualUsedCreditChange}
                  onUpdateCredit={handleUpdateCredit}
                  onCreditInputBlur={handleCreditInputBlur}
                  isProcessing={isProcessing}
                  generationQueue={generationQueue}
                  onCancelAll={cancelAll}
                  onCancelSingleTask={cancelSingleTask}
                  allHistoryMedia={allHistoryMedia}
                  saveDirectoryHandle={saveDirectoryHandle}
                  onSelectSaveDirectory={handleSelectSaveDirectory}
                  onSetSaveDirectoryHandle={setSaveDirectoryHandle}
                  selectedMediaIds={selectedMediaIds}
                  onSelectAllToggle={handleSelectAllToggle}
                  onDownloadSelectedMedia={handleDownloadSelectedMedia}
                  onDeleteSelectedMedia={handleDeleteSelectedMedia}
                  currentMedia={currentMedia}
                  onHistoryDragStart={handleHistoryDragStart}
                  onToggleMediaSelection={handleToggleMediaSelection}
                  onZoomImage={handleZoomImage}
                  onDownload={handleDownload}
                  downloadStatus={downloadStatus}
                  downloadedImageIds={downloadedImageIds}
                  totalPages={totalPages}
                  currentPage={currentPage}
                  onSetCurrentPage={setCurrentPage}
                  leftPanelWidth={leftPanelState.width}
                  onUpdateTotalCredit={handleUpdateTotalCredit}
                  onLoadGenerationParams={handleLoadGenerationParams}
                />
                <div onMouseDown={(e) => handleLeftPanelResizeStart(e, 'se')} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10 flex items-end justify-end p-1">
                  <svg className="w-2 h-2 text-zinc-500" fill="none" viewBox="0 0 8 8" stroke="currentColor" strokeWidth="2"><path d="M 0 8 L 8 0 M 3 8 L 8 3 M 6 8 L 8 6" /></svg>
                </div>
                <div onMouseDown={(e) => handleLeftPanelResizeStart(e, 'sw')} className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-10 flex items-end justify-start p-1">
                  <svg className="w-2 h-2 text-zinc-500" fill="none" viewBox="0 0 8 8" stroke="currentColor" strokeWidth="2"><path d="M 8 8 L 0 0 M 5 8 L 0 3 M 2 8 L 0 6" /></svg>
                </div>
              </div>
            )}
          </div>
          
          <GroupQuickBar language={language} mainPanelRef={mainPanelRef} />

          <div
              style={{
                  position: 'fixed',
                  width: rightPanelState.width,
                  height: rightPanelState.isCollapsed ? 'auto' : rightPanelState.height,
                  transform: `translate3d(${rightPanelState.x}px, ${rightPanelState.y}px, 0)`,
                  zIndex: 40,
              }}
              className="bg-neutral-800/50 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl flex flex-col"
          >
            {!rightPanelState.isCollapsed && (
                <RoleThumbnails language={language} onImageDoubleClick={handleZoomToImage} />
            )}
              <div onMouseDown={handleRightPanelDragStart} className="h-10 px-4 flex items-center justify-between flex-shrink-0 cursor-move bg-black/20 border-b border-white/10">
              <h2 className="font-bold text-base text-zinc-100">Generation Tools</h2>
              <button 
                  onClick={toggleRightPanelCollapse}
                  className="p-1 text-zinc-400 hover:text-white"
                  aria-label={rightPanelState.isCollapsed ? "Expand panel" : "Collapse panel"}
              >
                  {rightPanelState.isCollapsed ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4-4l-5 5M4 16v4m0 0h4m-4-4l5-5m11 1v4m0 0h-4m4-4l-5-5" /></svg> : <MinusIcon className="w-4 h-4" />}
              </button>
              </div>
              {!rightPanelState.isCollapsed && (
                <div className="flex-grow min-h-0 relative">
                    <div className="w-full h-full overflow-y-auto">
                      <RightPanel
                          language={language}
                          onNotification={showNotification}
                      />
                    </div>
                    <div onMouseDown={(e) => handleRightPanelResizeStart(e, 'se')} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10 flex items-end justify-end p-1">
                        <svg className="w-2 h-2 text-zinc-500" fill="none" viewBox="0 0 8 8" stroke="currentColor" strokeWidth="2"><path d="M 0 8 L 8 0 M 3 8 L 8 3 M 6 8 L 8 6" /></svg>
                    </div>
                    <div onMouseDown={(e) => handleRightPanelResizeStart(e, 'sw')} className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-10 flex items-end justify-start p-1">
                        <svg className="w-2 h-2 text-zinc-500" fill="none" viewBox="0 0 8 8" stroke="currentColor" strokeWidth="2"><path d="M 8 8 L 0 0 M 5 8 L 0 3 M 2 8 L 0 6" /></svg>
                    </div>
                </div>
              )}
          </div>
          {unifiedEditingImage && (
            <UnifiedEditorModal
                image={unifiedEditingImage}
                onComplete={handleUnifiedEditComplete}
                onCancel={() => setUnifiedEditingImage(null)}
                language={language}
                onNotification={showNotification}
            />
          )}
        </div>
      </div>
    </>
  );
}