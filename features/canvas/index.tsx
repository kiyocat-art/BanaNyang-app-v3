import React, { useState, useMemo, useRef, useEffect, useCallback, forwardRef } from 'react';
import { BoardImage, GeneratedMedia, GenerationTask, BoardGroup, ModelName, PromptFolder, PromptItem, GenerationParams } from '../../../types';
import { t, Language } from '../../../localization';
import { Tooltip } from '../../components/Tooltip';
import { Section } from '../../components/Section';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useCanvasStore, REF_COLORS } from '../../store/canvasStore';
import {
  DownloadIcon, MagnifyIcon, BodyIcon, TrashIcon,
  ScissorsIcon, MapIcon, PlusIcon, MinusIcon, FitToScreenIcon, CheckIcon, LandscapeIcon, CloseIcon,
  CheckCircleIcon, ExclamationIcon, InfoIcon, LassoIcon, UndoIcon, RedoIcon, ResetIcon, PencilIcon
} from '../../components/icons';
import { BANANANG_MEDIA_MIME_TYPE, APPLY_FULL_OUTFIT_BODY_PARTS, APPLY_TOP_BODY_PARTS, APPLY_BOTTOM_BODY_PARTS } from '../../constants';
import { PresetManagerModal } from '../../components/PresetManagerModal';
import { getApiKey } from '../../services/geminiService';
import { useGenerationStore } from '../../store/generationStore';
import { ActionRing } from './components/ActionRing';
import { CanvasGroup } from './components/CanvasGroup';
import { CanvasImage } from './components/CanvasImage';
import { ContextMenu, ContextMenuItem } from './components/ContextMenu';
import { LassoOverlay } from './components/LassoOverlay';
import { SelectionBox } from './components/SelectionBox';
import { PromptPanel } from './components/PromptPanel';
import { RoleThumbnails } from './components/RoleThumbnails';
import { CanvasNavigator } from './components/CanvasNavigator';
import { GlobalCanvasListeners } from './components/GlobalCanvasListeners';
import { useVisibleObjects } from './hooks/useVisibleObjects';
// FIX: Import the 'CanvasOverlays' component to resolve the 'Cannot find name' error.
import { CanvasOverlays } from './components/CanvasOverlays';

// --- START: Infinite Canvas Components ---
interface InfiniteCanvasProps {
    allHistoryMedia: GeneratedMedia[];
    language: Language;
    onZoomSelection: (media: File | string | null) => void;
    onEditSelection: (imageId: string) => void;
    onSaveWorkspace: () => void;
    onSaveWorkspaceAs: () => void;
    onLoadWorkspace: (content?: string, filePath?: string) => void;
    notification: { id: number; message: string; type: 'success' | 'error' } | null;
    onNotification: (message: string, type: 'success' | 'error') => void;
    isModalOpen: boolean;
    onCopySelection: () => Promise<Blob | null>;
    onPasteFromClipboard: (position: { x: number; y: number }) => void;
    onLoadGenerationParams: (params: GenerationParams) => void;
    saveDirectoryHandle: FileSystemDirectoryHandle | null;
}

const fileToText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
};

const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({ allHistoryMedia, language, onZoomSelection, onEditSelection, onSaveWorkspace, onSaveWorkspaceAs, onLoadWorkspace, notification, onNotification, isModalOpen, onCopySelection, onPasteFromClipboard, onLoadGenerationParams, saveDirectoryHandle }) => {
    const {
        boardImages, boardGroups, selectedImageIds, selectedGroupIds, pan, zoom,
        setBoardImages, setBoardGroups, setSelectedImageIds, setSelectedGroupIds, setPan, setZoom,
        uploadImages, addHistoryImage, alignSelection, handleImageMouseDown, handleGroupMouseDown,
        groupSelection, ungroupSelection, setEditingGroupId, clearRoleForSelection,
        deleteSelection,
        downloadSelection,
        updateImage,
    } = useCanvasStore();

    const [isSpacebarDown, setIsSpacebarDown] = useState(false);
    const [contextMenu, setContextMenu] = useState<any | null>(null);
    const [marquee, setMarquee] = useState<{x: number, y: number, width: number, height: number} | null>(null);
    const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);
    const [lassoTargetId, setLassoTargetId] = useState<string | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    
    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const interactionRef = useRef<{ 
      type: 'pan' | 'marquee' | 'drag'; 
      startX: number; 
      startY: number;
      startPan?: { x: number, y: number };
      elementStartPositions?: {
        images: Map<string, {x: number, y: number}>,
        groups: Map<string, {x: number, y: number}>,
      };
      marqueeRect?: {x: number; y: number; width: number; height: number;};
    } | null>(null);

    const { visibleImages, visibleGroups } = useVisibleObjects({
        boardImages,
        boardGroups,
        pan,
        zoom,
        canvasRect,
    });

    const actionRingPosition = useMemo(() => {
        if (selectedImageIds.size === 1 && selectedGroupIds.size === 0 && canvasRect) {
            const selectedId = Array.from(selectedImageIds)[0];
            const image = boardImages.find(img => img.id === selectedId);
            if (image) {
                const top = (image.y * zoom) + pan.y + canvasRect.top;
                const left = (image.x * zoom + (image.width * zoom) / 2) + pan.x + canvasRect.left;
                return { x: left, y: top };
            }
        }
        return null;
    }, [selectedImageIds, selectedGroupIds, boardImages, pan, zoom, canvasRect]);

    const startPan = useCallback((e: React.MouseEvent | MouseEvent) => {
        interactionRef.current = { type: 'pan', startX: e.clientX, startY: e.clientY, startPan: pan };
    
        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!interactionRef.current || interactionRef.current.type !== 'pan') return;
            const dx = moveEvent.clientX - interactionRef.current!.startX;
            const dy = moveEvent.clientY - interactionRef.current!.startY;
            setPan(() => ({ x: interactionRef.current!.startPan!.x + dx, y: interactionRef.current!.startPan!.y + dy }));
        };
    
        const handleMouseUp = () => {
            interactionRef.current = null;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [pan, setPan]);

    const selectionBounds = useMemo(() => {
        const selectedStandaloneImages = boardImages.filter(img => selectedImageIds.has(img.id) && !img.groupId);
        const selectedGroups = boardGroups.filter(g => selectedGroupIds.has(g.id));
        
        const elementsToBound = [...selectedStandaloneImages, ...selectedGroups];

        if (elementsToBound.length === 0) return null;

        const minX = Math.min(...elementsToBound.map(i => i.x));
        const minY = Math.min(...elementsToBound.map(i => i.y));
        const maxX = Math.max(...elementsToBound.map(i => i.x + i.width));
        const maxY = Math.max(...elementsToBound.map(i => i.y + i.height));
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }, [selectedImageIds, selectedGroupIds, boardImages, boardGroups]);

    useEffect(() => {
        const element = canvasRef.current;
        if (!element) return;
    
        const observer = new ResizeObserver(() => {
          setCanvasRect(element.getBoundingClientRect());
        });
    
        observer.observe(element);
        setCanvasRect(element.getBoundingClientRect()); // Initial set
    
        return () => observer.disconnect();
    }, []);

    const handleUploadAndPositionImages = useCallback(async (files: File[] | FileList, position?: { x: number; y: number }) => {
        if (!canvasRef.current) return;
        const containerRect = canvasRef.current.getBoundingClientRect();
        const dropPos = position || { x: containerRect.left + containerRect.width / 2, y: containerRect.top + containerRect.height / 2 };
        uploadImages(Array.from(files), dropPos, containerRect);
    }, [uploadImages]);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('Files')) {
            setIsDraggingOver(true);
        }
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.relatedTarget && canvasRef.current?.contains(e.relatedTarget as Node)) {
            return;
        }
        setIsDraggingOver(false);
    };

    const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const position = { x: e.clientX, y: e.clientY };

        const files: File[] = Array.from(e.dataTransfer.files);
        const workspaceFile = files.find(f => f.name.endsWith('.bananyang'));
        
        if (workspaceFile) {
            const filePath = (workspaceFile as any).path;
            if (filePath) {
                onLoadWorkspace(await fileToText(workspaceFile), filePath);
            } else {
                onLoadWorkspace(await fileToText(workspaceFile));
            }
            return;
        }

        if (e.dataTransfer.types.includes(BANANANG_MEDIA_MIME_TYPE)) {
            const mediaId = e.dataTransfer.getData(BANANANG_MEDIA_MIME_TYPE);
            const mediaItem = allHistoryMedia.find(m => m.id === mediaId);
            if (mediaItem) {
                addHistoryImage(mediaItem, position, rect);
                return;
            }
        }
        
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length > 0) {
            handleUploadAndPositionImages(imageFiles, position);
        }
    }, [handleUploadAndPositionImages, allHistoryMedia, addHistoryImage, onLoadWorkspace]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isModalOpen || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.code === 'Space') { e.preventDefault(); setIsSpacebarDown(true); }
            else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedImageIds.size > 0 || selectedGroupIds.size > 0) useCanvasStore.getState().deleteSelection();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setLassoTargetId(null);
                if (contextMenu) {
                    setContextMenu(null);
                } else {
                    const { boardImages, selectedImageIds, selectedGroupIds, activeReferenceIndex, clearActiveReferenceRole } = useCanvasStore.getState();
                    if (selectedImageIds.size > 0) {
                        const selectionHasRoles = Array.from(selectedImageIds).some(id => {
                            const img = boardImages.find(i => i.id === id);
                            return img && img.role !== 'none';
                        });

                        if (selectionHasRoles) {
                            clearRoleForSelection();
                        } else {
                            setSelectedImageIds(() => new Set());
                        }
                    } else if (selectedGroupIds.size > 0) {
                        setSelectedGroupIds(() => new Set());
                    } else if (activeReferenceIndex !== null) {
                        clearActiveReferenceRole();
                    }
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacebarDown(false); };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedImageIds, selectedGroupIds, setSelectedImageIds, setSelectedGroupIds, contextMenu, clearRoleForSelection, isModalOpen]);

    useEffect(() => {
        const handleCopy = async (event: ClipboardEvent) => {
            if (isModalOpen || document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
                return;
            }
            const { selectedImageIds, selectedGroupIds } = useCanvasStore.getState();
            if (selectedImageIds.size === 0 && selectedGroupIds.size === 0) return;
            
            event.preventDefault();

            try {
                const blob = await onCopySelection();
                if (!blob) return;

                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                
                onNotification(t('copy.success', language), 'success');
            } catch (error) {
                console.error("Failed to copy image to clipboard:", error);
                onNotification(t('error.copyFailed', language), 'error');
            }
        };

        document.addEventListener('copy', handleCopy);
        return () => document.removeEventListener('copy', handleCopy);
    }, [onCopySelection, onNotification, language, isModalOpen]);
    
    const handleMouseDownOnCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget) return; // Only trigger on background
    
        if (actionRingPosition) setSelectedImageIds(() => new Set());

        if (e.button === 1 || (e.button === 0 && isSpacebarDown)) {
            startPan(e);
            return;
        }

        if (e.button === 0) {
            const rect = canvasRef.current!.getBoundingClientRect();
            interactionRef.current = { type: 'marquee', startX: e.clientX - rect.left, startY: e.clientY - rect.top };

            const handleMouseMove = (moveEvent: MouseEvent) => {
                if (!interactionRef.current || interactionRef.current.type !== 'marquee') return;
                const currentMarquee = {
                    x: Math.min((interactionRef.current!.startX - pan.x) / zoom, (moveEvent.clientX - rect.left - pan.x) / zoom),
                    y: Math.min((interactionRef.current!.startY - pan.y) / zoom, (moveEvent.clientY - rect.top - pan.y) / zoom),
                    width: Math.abs(moveEvent.clientX - rect.left - interactionRef.current!.startX) / zoom,
                    height: Math.abs(moveEvent.clientY - rect.top - interactionRef.current!.startY) / zoom,
                };
                setMarquee(currentMarquee);
                interactionRef.current.marqueeRect = currentMarquee;
            };

            const handleMouseUp = (upEvent: MouseEvent) => {
                const finalMarquee = interactionRef.current?.marqueeRect;
                if (finalMarquee) {
                    const affectedImageIds = new Set<string>();
                    const affectedGroupIds = new Set<string>();

                    boardImages.forEach(img => {
                        if (!img.groupId && img.x < finalMarquee.x + finalMarquee.width && img.x + img.width > finalMarquee.x && img.y < finalMarquee.y + finalMarquee.height && img.y + img.height > finalMarquee.y) {
                            affectedImageIds.add(img.id);
                        }
                    });

                    boardGroups.forEach(group => {
                        if (group.x < finalMarquee.x + finalMarquee.width && group.x + group.width > finalMarquee.x && group.y < finalMarquee.y + finalMarquee.height && group.y + group.height > finalMarquee.y) {
                            affectedGroupIds.add(group.id);
                        }
                    });
                    
                    setSelectedImageIds(prev => upEvent.shiftKey ? new Set([...prev, ...affectedImageIds]) : affectedImageIds);
                    setSelectedGroupIds(prev => upEvent.shiftKey ? new Set([...prev, ...affectedGroupIds]) : affectedGroupIds);

                } else if (!upEvent.shiftKey && upEvent.target === canvasRef.current) {
                    setSelectedImageIds(() => new Set());
                    setSelectedGroupIds(() => new Set());
                }
                setMarquee(null);
                interactionRef.current = null;
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
    };

    const handleElementMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string, type: 'image' | 'group') => {
        e.stopPropagation();

        if (type === 'image') {
            const image = boardImages.find(img => img.id === id);
            if (image && image.generationParams && !e.shiftKey && !selectedImageIds.has(id)) {
                onLoadGenerationParams(image.generationParams);
            }
        }
        
        if (isSpacebarDown || e.button === 1) { startPan(e); return; }
        if (e.button !== 0) return;
        
        if (type === 'image') {
            handleImageMouseDown(id, e.shiftKey);
        } else {
            handleGroupMouseDown(id, e.shiftKey);
        }
        
        // This needs a moment for the selection state to update
        setTimeout(() => {
            const { boardImages, boardGroups, selectedImageIds, selectedGroupIds } = useCanvasStore.getState();

            const imageStartPositions = new Map<string, { x: number; y: number }>();
            const groupStartPositions = new Map<string, { x: number; y: number }>();

            boardImages.forEach(img => {
                if (selectedImageIds.has(img.id)) imageStartPositions.set(img.id, { x: img.x, y: img.y });
            });
            boardGroups.forEach(group => {
                if (selectedGroupIds.has(group.id)) {
                    groupStartPositions.set(group.id, { x: group.x, y: group.y });
                    group.imageIds.forEach(imgId => {
                        const img = boardImages.find(i => i.id === imgId);
                        if (img) imageStartPositions.set(img.id, { x: img.x, y: img.y });
                    });
                }
            });

            interactionRef.current = { type: 'drag', startX: e.clientX, startY: e.clientY, elementStartPositions: { images: imageStartPositions, groups: groupStartPositions } };

            const handleMouseMove = (moveEvent: MouseEvent) => {
                if (interactionRef.current?.type !== 'drag') return;
                const dx = (moveEvent.clientX - interactionRef.current.startX) / zoom;
                const dy = (moveEvent.clientY - interactionRef.current.startY) / zoom;
                setBoardImages(prev => prev.map(img => {
                    const startPos = interactionRef.current?.elementStartPositions?.images.get(img.id);
                    return startPos ? { ...img, x: startPos.x + dx, y: startPos.y + dy } : img;
                }));
                setBoardGroups(prev => prev.map(group => {
                    const startPos = interactionRef.current?.elementStartPositions?.groups.get(group.id);
                    return startPos ? { ...group, x: startPos.x + dx, y: startPos.y + dy } : group;
                }));
            };

            const handleMouseUp = () => {
                interactionRef.current = null;
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }, 0);
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const handleActualCopy = async () => {
            try {
                const blob = await onCopySelection();
                if (!blob) return;

                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                
                onNotification(t('copy.success', language), 'success');
            } catch (error) {
                console.error("Failed to copy image to clipboard:", error);
                onNotification(t('error.copyFailed', language), 'error');
            }
        };

        const items: any[] = [];
        const { selectedImageIds, selectedGroupIds, boardImages } = useCanvasStore.getState();
        const hasSelection = selectedImageIds.size > 0 || selectedGroupIds.size > 0;
        const imagesInSelectionAreUngrouped = Array.from(selectedImageIds).every(id => !boardImages.find(i => i.id === id)?.groupId);

        const isBackgroundClick = e.target === canvasRef.current;

        if (isBackgroundClick) {
            items.push(
                { label: t('contextMenu.uploadImage', language), onClick: () => fileInputRef.current?.click() },
                { label: t('contextMenu.paste', language), onClick: () => onPasteFromClipboard({ x: e.clientX, y: e.clientY }) }
            );
             items.push({ type: 'separator' });
             items.push(
                { label: t('contextMenu.saveWorkspace', language), onClick: onSaveWorkspace, disabled: boardImages.length === 0 && boardGroups.length === 0 },
                { label: t('contextMenu.saveWorkspaceAs', language), onClick: onSaveWorkspaceAs, disabled: boardImages.length === 0 && boardGroups.length === 0 },
                { type: 'separator' },
                { label: t('contextMenu.loadWorkspace', language), onClick: () => onLoadWorkspace() }
            );
        } else {
            if (hasSelection) {
                items.push({ label: t('contextMenu.copySelection', language), onClick: handleActualCopy });
                items.push({ type: 'separator' });
            }

            if (selectedImageIds.size > 1 && selectedGroupIds.size === 0) {
                items.push({ label: t('contextMenu.alignSelection', language), onClick: alignSelection });
                if (imagesInSelectionAreUngrouped) {
                   items.push({ label: t('contextMenu.groupSelection', language), onClick: groupSelection });
                }
            } else if (selectedGroupIds.size > 0) {
                 if (selectedGroupIds.size > 1) {
                    // Future multi-group actions
                 }
                items.push({ label: t('contextMenu.ungroupSelection', language), onClick: ungroupSelection });
                if (selectedGroupIds.size === 1) {
                    const groupId = Array.from(selectedGroupIds)[0];
                    items.push({ label: t('contextMenu.renameGroup', language), onClick: () => setEditingGroupId(groupId) });
                }
            }
        }
        
        if (items.length > 0) {
            setContextMenu({ x: e.clientX, y: e.clientY, onClose: () => setContextMenu(null), items });
        }
    };
    
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        const scaleAmount = 1.1;
        const newZoom = e.deltaY < 0 ? zoom * scaleAmount : zoom / scaleAmount;
        const clampedZoom = Math.max(0.1, Math.min(5, newZoom));
        const rect = canvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const newPanX = mouseX - (mouseX - pan.x) * (clampedZoom / zoom);
        const newPanY = mouseY - (mouseY - pan.y) * (clampedZoom / zoom);
        setZoom(() => clampedZoom);
        setPan(() => ({ x: newPanX, y: newPanY }));
    };
    
    const cursorClass = isSpacebarDown ? 'cursor-grab' : 'cursor-default';

    const notificationStyles = {
        base: "absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full shadow-lg z-[200] animate-fade-in-out-top",
        success: "bg-yellow-400 text-zinc-800",
        error: "bg-red-600 text-white",
    };
    const notificationIcon = notification?.type === 'success' 
        ? <CheckCircleIcon className="w-5 h-5" /> 
        : <ExclamationIcon className="w-5 h-5" />;

    const lassoTarget = boardImages.find(img => img.id === lassoTargetId);

    const {pan: currentPan, zoom: currentZoom} = useCanvasStore();
    
    const handleDownload = useCallback(async () => {
        const count = selectedImageIds.size;
        if (count === 0) return;

        await downloadSelection(saveDirectoryHandle);
        if (saveDirectoryHandle) {
            const message = `${count}개의 파일이 ${saveDirectoryHandle.name} 폴더에 저장되었습니다.`;
            onNotification(message, 'success');
        } else {
            const message = count > 1 
                ? t('downloadCompleteMultiple', language, { count }) 
                : t('downloadComplete', language);
            onNotification(message, 'success');
        }
    }, [downloadSelection, saveDirectoryHandle, onNotification, language, selectedImageIds]);

    return (
        <div className="flex-grow flex flex-col relative min-h-0">
            <CanvasOverlays
                contextMenu={contextMenu}
                actionRingPosition={actionRingPosition}
                lassoTarget={lassoTarget}
                canvasRect={canvasRect}
                pan={currentPan}
                zoom={currentZoom}
                onZoomSelection={onZoomSelection}
                onEditSelection={onEditSelection}
                onLassoSelection={setLassoTargetId}
                onDelete={() => { deleteSelection(); setSelectedImageIds(() => new Set()); }}
                onDownload={() => { handleDownload(); setSelectedImageIds(() => new Set()); }}
                onHideActionRing={() => setSelectedImageIds(() => new Set())}
                onLassoCancel={() => setLassoTargetId(null)}
                onLassoConfirm={(maskFile) => {
                    if (lassoTarget) {
                        const oldImage = boardImages.find(img => img.id === lassoTarget.id);
                        if (oldImage?.maskSrc) URL.revokeObjectURL(oldImage.maskSrc);
                        updateImage(lassoTarget.id, { maskFile, maskSrc: URL.createObjectURL(maskFile) });
                    }
                    setLassoTargetId(null);
                }}
                language={language}
            />
            <div
                ref={canvasRef}
                className={`flex-grow w-full h-full relative bg-zinc-900 overflow-hidden grid-background ${cursorClass}`}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onMouseDown={handleMouseDownOnCanvas}
                onWheel={handleWheel}
                onContextMenu={handleContextMenu}
                tabIndex={0}
            >
                 {notification && (
                    <div key={notification.id} className={`${notificationStyles.base} ${notificationStyles[notification.type]}`}>
                        {notificationIcon}
                        <span>{notification.message}</span>
                    </div>
                )}
                 {isDraggingOver && (
                    <div className="absolute inset-0 bg-sky-500/20 border-4 border-dashed border-sky-500 pointer-events-none z-[100] flex items-center justify-center transition-all duration-200">
                        <p className="text-2xl font-bold text-white bg-black/50 px-4 py-2 rounded-lg">{t('uploader.orDragAndDrop', language)}</p>
                    </div>
                 )}
                <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
                    {visibleGroups.map(group => (
                        <CanvasGroup
                            key={group.id}
                            group={group}
                            onMouseDown={(e, id) => handleElementMouseDown(e, id, 'group')}
                            onContextMenu={handleContextMenu}
                            isSuspended={false}
                        />
                    ))}
                    {visibleImages.map(image => (
                        <CanvasImage
                            key={image.id}
                            image={image}
                            onContextMenu={handleContextMenu}
                            onMouseDown={(e, id) => handleElementMouseDown(e, id, 'image')}
                        />
                    ))}
                    {marquee && (
                        <div
                            className="absolute border-2 border-dashed border-white bg-white/20"
                            style={{ left: marquee.x, top: marquee.y, width: marquee.width, height: marquee.height, zIndex: 9998 }}
                        />
                    )}
                    {selectionBounds && <SelectionBox bounds={selectionBounds} />}
                </div>
                <input type="file" ref={fileInputRef} multiple accept="image/*,.bananyang" className="hidden" onChange={(e) => {
                    if (e.target.files) {
                        const files: File[] = Array.from(e.target.files);
                        const workspaceFile = files.find(f => f.name.endsWith('.bananyang'));
                        if (workspaceFile) {
                            fileToText(workspaceFile).then(content => onLoadWorkspace(content));
                        } else {
                            handleUploadAndPositionImages(files);
                        }
                    }
                }} />
            </div>
        </div>
    );
};

interface CanvasProps {
    allHistoryMedia: GeneratedMedia[];
    language: Language;
    onZoomSelection: (media: File | string | null) => void;
    onEditSelection: (imageId: string) => void;
    onSaveWorkspace: () => void;
    onSaveWorkspaceAs: () => void;
    onLoadWorkspace: (content?: string, filePath?: string) => void;
    mainPanelRef: React.RefObject<HTMLElement>;
    customPrompt: string;
    onCustomPromptChange: (prompt: string) => void;
    onQueueGeneration: (task: GenerationTask) => void;
    isProcessing: boolean;
    generationQueue: GenerationTask[];
    originalImage: BoardImage | undefined;
    modelName: ModelName;
    notification: { id: number; message: string; type: 'success' | 'error' } | null;
    onZoomToImage: (image: BoardImage) => void;
    onNotification: (message: string, type: 'success' | 'error') => void;
    isModalOpen: boolean;
    onCopySelection: () => Promise<Blob|null>;
    onPasteFromClipboard: (position: { x: number; y: number; }) => void;
    folders: PromptFolder[];
    saveFolders: (folders: PromptFolder[]) => void;
    onSavePreset: () => void;
    onLoadGenerationParams: (params: GenerationParams) => void;
    saveDirectoryHandle: FileSystemDirectoryHandle | null;
}

export const Canvas: React.FC<CanvasProps> = (props) => {
    
    return (
        <>
        <InfiniteCanvas 
            {...props}
        />
        <GlobalCanvasListeners onSaveWorkspace={props.onSaveWorkspace} onSaveWorkspaceAs={props.onSaveWorkspaceAs} onLoadWorkspace={props.onLoadWorkspace} isModalOpen={props.isModalOpen}/>
        <PromptPanel
            customPrompt={props.customPrompt}
            onCustomPromptChange={props.onCustomPromptChange}
            onQueueGeneration={props.onQueueGeneration}
            isProcessing={props.isProcessing}
            generationQueue={props.generationQueue}
            originalImage={props.originalImage}
            modelName={props.modelName}
            language={props.language}
            mainPanelRef={props.mainPanelRef}
            onNotification={props.onNotification}
            folders={props.folders}
            onSavePreset={props.onSavePreset}
            saveFolders={props.saveFolders}
        />
        <CanvasNavigator language={props.language} canvasRef={props.mainPanelRef} />
        </>
    )
}
