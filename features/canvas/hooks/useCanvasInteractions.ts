import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useCanvasStore } from '../../../store/canvasStore';
import { GeneratedMedia } from '../../../types';
import { BANANANG_MEDIA_MIME_TYPE } from '../../../constants';
import { t } from '../../../localization';
import { ContextMenuProps, ContextMenuItem } from '../components/ContextMenu';

interface UseCanvasInteractionsProps {
    allHistoryMedia: GeneratedMedia[];
    onSaveWorkspace: () => void;
    onLoadWorkspace: () => void;
}

export const useCanvasInteractions = ({ allHistoryMedia, onSaveWorkspace, onLoadWorkspace }: UseCanvasInteractionsProps) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        pan, zoom, setPan, setZoom, boardImages, boardGroups,
        selectedImageIds, selectedGroupIds, setSelectedImageIds, setSelectedGroupIds,
        setBoardImages, setBoardGroups, handleImageMouseDown, handleGroupMouseDown,
        alignSelection, groupSelection, ungroupSelection, setEditingGroupId, uploadImages, addHistoryImage
    } = useCanvasStore();

    const [isSpacebarDown, setIsSpacebarDown] = useState(false);
    const [contextMenu, setContextMenu] = useState<ContextMenuProps | null>(null);
    const [selectionBarPosition, setSelectionBarPosition] = useState<{ x: number, y: number } | null>(null);
    const [marquee, setMarquee] = useState<{x: number, y: number, width: number, height: number} | null>(null);
    const [lassoTargetId, setLassoTargetId] = useState<string | null>(null);

    const interactionRef = useRef<{
        type: 'pan' | 'marquee' | 'drag';
        startX: number;
        startY: number;
        startPan?: { x: number; y: number };
        elementStartPositions?: {
            images: Map<string, { x: number; y: number }>;
            groups: Map<string, { x: number; y: number }>;
        };
        marqueeRect?: { x: number; y: number; width: number; height: number; };
    } | null>(null);

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
        const handleKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); setIsSpacebarDown(true); }};
        const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setIsSpacebarDown(false); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const cursorClass = useMemo(() => {
        if (interactionRef.current?.type === 'pan') return 'cursor-grabbing';
        return isSpacebarDown ? 'cursor-grab' : 'cursor-default';
    }, [isSpacebarDown]);

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

    const handleUploadAndPositionImages = useCallback(async (files: File[] | FileList, position?: { x: number; y: number }) => {
        if (!canvasRef.current) return;
        const containerRect = canvasRef.current.getBoundingClientRect();
        const dropPos = position || { x: containerRect.left + containerRect.width / 2, y: containerRect.top + containerRect.height / 2 };
        uploadImages(Array.from(files), dropPos, containerRect);
    }, [uploadImages]);

    const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const position = { x: e.clientX, y: e.clientY };

        if (e.dataTransfer.types.includes(BANANANG_MEDIA_MIME_TYPE)) {
            const mediaId = e.dataTransfer.getData(BANANANG_MEDIA_MIME_TYPE);
            const mediaItem = allHistoryMedia.find(m => m.id === mediaId);
            if (mediaItem) addHistoryImage(mediaItem, position, rect);
        } else if (e.dataTransfer.files.length > 0) {
            handleUploadAndPositionImages(e.dataTransfer.files, position);
        }
    }, [handleUploadAndPositionImages, allHistoryMedia, addHistoryImage]);

    const handleElementMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string, type: 'image' | 'group') => {
        e.stopPropagation();
        if (isSpacebarDown || e.button === 1 || e.button === 2) {
            if (e.button === 2) { // Right click
                // If the item is not part of the current selection, select it.
                const { selectedImageIds, selectedGroupIds } = useCanvasStore.getState();
                const isSelected = type === 'image' ? selectedImageIds.has(id) : selectedGroupIds.has(id);
                if (!isSelected) {
                    if (type === 'image') handleImageMouseDown(id, false);
                    else handleGroupMouseDown(id, false);
                }
            } else { // Pan
                interactionRef.current = { type: 'pan', startX: e.clientX, startY: e.clientY, startPan: pan };
            }
            return;
        }

        if (e.button !== 0) return;
        
        if (type === 'image') {
            handleImageMouseDown(id, e.shiftKey);
        } else {
            handleGroupMouseDown(id, e.shiftKey);
        }
        
        setTimeout(() => { 
            const currentStoreState = useCanvasStore.getState();
            const imageStartPositions = new Map<string, { x: number; y: number }>();
            const groupStartPositions = new Map<string, { x: number; y: number }>();

            currentStoreState.boardImages.forEach(img => {
                if (currentStoreState.selectedImageIds.has(img.id)) imageStartPositions.set(img.id, { x: img.x, y: img.y });
            });
            currentStoreState.boardGroups.forEach(group => {
                if (currentStoreState.selectedGroupIds.has(group.id)) {
                    groupStartPositions.set(group.id, { x: group.x, y: group.y });
                    group.imageIds.forEach(imgId => {
                        const img = currentStoreState.boardImages.find(i => i.id === imgId);
                        if (img) imageStartPositions.set(img.id, { x: img.x, y: img.y });
                    });
                }
            });

            interactionRef.current = { type: 'drag', startX: e.clientX, startY: e.clientY, elementStartPositions: { images: imageStartPositions, groups: groupStartPositions } };
        }, 0);
    };
    
    const handleMouseDownOnCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget) return;
        if (selectionBarPosition) setSelectionBarPosition(null);
        if (contextMenu) setContextMenu(null);

        if (e.button === 1 || e.button === 2 || (e.button === 0 && isSpacebarDown)) {
            interactionRef.current = { type: 'pan', startX: e.clientX, startY: e.clientY, startPan: pan };
        } else if (e.button === 0) {
            const rect = canvasRef.current!.getBoundingClientRect();
            interactionRef.current = { type: 'marquee', startX: e.clientX - rect.left, startY: e.clientY - rect.top };
        }
    };

    useEffect(() => {
        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!interactionRef.current) return;
            const { type, startX, startY } = interactionRef.current;
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            if (type === 'pan') {
                const { startPan } = interactionRef.current;
                if(startPan) setPan(() => ({ x: startPan.x + dx, y: startPan.y + dy }));
            } else if (type === 'drag') {
                const { elementStartPositions } = interactionRef.current;
                if (!elementStartPositions) return;
                const canvasDx = dx / zoom;
                const canvasDy = dy / zoom;
                setBoardImages(prev => prev.map(img => {
                    const startPos = elementStartPositions.images.get(img.id);
                    return startPos ? { ...img, x: startPos.x + canvasDx, y: startPos.y + canvasDy } : img;
                }));
                setBoardGroups(prev => prev.map(group => {
                    const startPos = elementStartPositions.groups.get(group.id);
                    return startPos ? { ...group, x: startPos.x + canvasDx, y: startPos.y + canvasDy } : group;
                }));
            } else if (type === 'marquee') {
                const rect = canvasRef.current!.getBoundingClientRect();
                const currentMarquee = {
                    x: Math.min((startX - pan.x) / zoom, (moveEvent.clientX - rect.left - pan.x) / zoom),
                    y: Math.min((startY - pan.y) / zoom, (moveEvent.clientY - rect.top - pan.y) / zoom),
                    width: Math.abs(moveEvent.clientX - rect.left - startX) / zoom,
                    height: Math.abs(moveEvent.clientY - rect.top - startY) / zoom,
                };
                setMarquee(currentMarquee);
                interactionRef.current.marqueeRect = currentMarquee;
            }
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            if (!interactionRef.current) return;
            const { type, marqueeRect } = interactionRef.current;
            
            if (type === 'marquee') {
                if (marqueeRect && (marqueeRect.width * zoom > 5 || marqueeRect.height * zoom > 5)) {
                    const affectedImageIds = new Set<string>();
                    const affectedGroupIds = new Set<string>();
                    boardImages.forEach(img => {
                        if (!img.groupId && img.x < marqueeRect.x + marqueeRect.width && img.x + img.width > marqueeRect.x && img.y < marqueeRect.y + marqueeRect.height && img.y + img.height > marqueeRect.y) {
                            affectedImageIds.add(img.id);
                        }
                    });
                    boardGroups.forEach(group => {
                        if (group.x < marqueeRect.x + marqueeRect.width && group.x + group.width > marqueeRect.x && group.y < marqueeRect.y + marqueeRect.height && group.y + group.height > marqueeRect.y) {
                            affectedGroupIds.add(group.id);
                        }
                    });
                    setSelectedImageIds(prev => upEvent.shiftKey ? new Set([...prev, ...affectedImageIds]) : affectedImageIds);
                    setSelectedGroupIds(prev => upEvent.shiftKey ? new Set([...prev, ...affectedGroupIds]) : affectedGroupIds);
                } else { // A click or tiny drag
                    if (!upEvent.shiftKey) {
                        setSelectedImageIds(() => new Set());
                        setSelectedGroupIds(() => new Set());
                    }
                }
            }

            setMarquee(null);
            interactionRef.current = null;
        };

        const handleGlobalMouseMove = (e: MouseEvent) => { if(interactionRef.current) handleMouseMove(e) };
        const handleGlobalMouseUp = (e: MouseEvent) => { if(interactionRef.current) handleMouseUp(e) };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [pan, zoom, setPan, setBoardImages, setBoardGroups, boardImages, boardGroups, setSelectedImageIds, setSelectedGroupIds]);

    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        
        const { selectedImageIds, selectedGroupIds, boardImages } = useCanvasStore.getState();

        if (selectedImageIds.size === 1 && selectedGroupIds.size === 0) {
            setSelectionBarPosition({ x: e.clientX, y: e.clientY });
            return;
        }

        const items: ContextMenuItem[] = [];
        const imagesInSelectionAreUngrouped = Array.from(selectedImageIds).every(id => !boardImages.find(i => i.id === id)?.groupId);

        if (selectedImageIds.size > 1 && selectedGroupIds.size === 0) {
            items.push({ label: t('contextMenu.alignSelection', 'ko'), onClick: alignSelection });
            if (imagesInSelectionAreUngrouped) items.push({ label: t('contextMenu.groupSelection', 'ko'), onClick: groupSelection });
        } else if (selectedGroupIds.size > 0) {
             if (selectedGroupIds.size > 1) {
                // Future multi-group actions
             }
            items.push({ label: t('contextMenu.ungroupSelection', 'ko'), onClick: ungroupSelection });
            if (selectedGroupIds.size === 1) {
                const groupId = Array.from(selectedGroupIds)[0];
                items.push({ label: t('contextMenu.renameGroup', 'ko'), onClick: () => setEditingGroupId(groupId) });
            }
        } else { // Background menu
            items.push(
                { label: t('contextMenu.uploadImage', 'ko'), onClick: () => fileInputRef.current?.click() },
                { label: t('contextMenu.saveWorkspace', 'ko'), onClick: onSaveWorkspace, disabled: boardImages.length === 0 && boardGroups.length === 0 },
                { label: t('contextMenu.loadWorkspace', 'ko'), onClick: onLoadWorkspace }
            );
        }

        if (items.length > 0) {
            setContextMenu({ x: e.clientX, y: e.clientY, onClose: () => setContextMenu(null), items });
        }
    };
    
    return {
        canvasRef,
        fileInputRef,
        cursorClass,
        pan,
        zoom,
        marquee,
        contextMenu,
        selectionBarPosition,
        lassoTargetId,
        handleDrop,
        handleMouseDownOnCanvas,
        handleWheel,
        handleContextMenu,
        handleElementMouseDown,
        setSelectionBarPosition,
        setLassoTargetId,
        selectionBounds,
// FIX: Export handleUploadAndPositionImages to be used by the canvas component.
        handleUploadAndPositionImages,
    };
};