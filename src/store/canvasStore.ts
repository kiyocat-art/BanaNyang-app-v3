import { create } from 'zustand';
import { BoardImage, GeneratedMedia, BoardGroup, GenerationParams } from '../types';
import { t } from '../localization';

const dataURLtoFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
};

export const REF_COLORS = ['#38bdf8', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#f472b6'];

interface CanvasState {
  boardImages: BoardImage[];
  boardGroups: BoardGroup[];
  selectedImageIds: Set<string>;
  selectedGroupIds: Set<string>;
  pan: { x: number; y: number };
  zoom: number;
  activeReferenceIndex: number | null;
  zIndexCounter: number;
  editingGroupId: string | null;
  groupEditModeId: string | null;
}

interface CanvasActions {
  setBoardImages: (updater: (prev: BoardImage[]) => BoardImage[]) => void;
  setSelectedImageIds: (updater: (prev: Set<string>) => Set<string>) => void;
  setBoardGroups: (updater: (prev: BoardGroup[]) => BoardGroup[]) => void;
  setSelectedGroupIds: (updater: (prev: Set<string>) => Set<string>) => void;
  setEditingGroupId: (id: string | null) => void;
  setGroupEditModeId: (id: string | null) => void;
  removeImageFromGroup: (imageId: string) => void;
  setPan: (updater: (prev: { x: number; y: number }) => { x: number; y: number }) => void;
  setZoom: (updater: (prev: number) => number) => void;
  addImagesToCenter: (media: GeneratedMedia[], canvasRect: DOMRect, sourceImageId?: string) => Promise<void>;
  uploadImages: (files: File[], position: { x: number; y: number }, canvasRect: DOMRect) => Promise<void>;
  addHistoryImage: (mediaItem: GeneratedMedia, position: { x: number; y: number }, canvasRect: DOMRect) => Promise<void>;
  updateImage: (id: string, updates: Partial<BoardImage>) => void;
  updateGroup: (id: string, updates: Partial<BoardGroup>) => void;
  deleteSelection: () => void;
  downloadSelection: (saveDirectoryHandle: FileSystemDirectoryHandle | null) => Promise<void>;
  setRoleForSelection: (role: BoardImage['role']) => void;
  clearRoleForSelection: () => void;
  clearActiveReferenceRole: () => void;
  alignSelection: () => void;
  addNewCanvasImage: (dataUrl: string, file: File, originalImage?: BoardImage) => void;
  handleImageMouseDown: (imageId: string, isShiftKey: boolean) => void;
  handleGroupMouseDown: (groupId: string, isShiftKey: boolean) => void;
  groupSelection: () => void;
  ungroupSelection: () => void;
  setGroupName: (id: string, name: string) => void;
  zoomToImage: (image: BoardImage, canvasRect: DOMRect) => void;
  zoomToGroup: (group: BoardGroup, canvasRect: DOMRect) => void;
  zoomToBounds: (bounds: { x: number, y: number, width: number, height: number }, canvasRect: DOMRect) => void;
  reorderBoardGroups: (draggedId: string, targetId: string) => void;
  reset: () => void;
}

const updateActiveReferenceIndex = (boardImages: BoardImage[], selectedImageIds: Set<string>): number | null => {
  if (selectedImageIds.size === 1) {
    const selectedId = Array.from(selectedImageIds)[0];
    const selectedImage = boardImages.find(img => img.id === selectedId);
    if (selectedImage && selectedImage.role === 'reference' && selectedImage.refIndex !== undefined) {
      return selectedImage.refIndex;
    }
  }
  const hasReferenceImages = boardImages.some(img => img.role === 'reference');
  if (hasReferenceImages) {
    return 0;
  }
  return null;
};

const initialState: CanvasState = {
  boardImages: [],
  boardGroups: [],
  selectedImageIds: new Set<string>(),
  selectedGroupIds: new Set<string>(),
  pan: { x: 0, y: 0 },
  zoom: 1,
  activeReferenceIndex: null,
  zIndexCounter: 10,
  editingGroupId: null,
  groupEditModeId: null,
};

export const useCanvasStore = create<CanvasState & CanvasActions>((set, get) => {
    
    const realignGroup = (groupId: string, state: CanvasState): Partial<Pick<CanvasState, 'boardImages' | 'boardGroups'>> => {
        const { boardImages, boardGroups } = state;
        const group = boardGroups.find(g => g.id === groupId);
        if (!group) return {};

        const imagesInGroup = boardImages.filter(img => img.groupId === groupId);
        if (imagesInGroup.length === 0) {
            return { boardGroups: boardGroups.filter(g => g.id !== groupId) };
        }

        const sortedImages = [...imagesInGroup].sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
        });

        const PADDING = 20;
        let currentX = PADDING;
        let currentY = PADDING;
        let rowMaxHeight = 0;
        const updates = new Map<string, { x: number; y: number }>();
        const groupContentWidth = group.width - (2 * PADDING);

        sortedImages.forEach(image => {
            if (currentX > PADDING && currentX + image.width > groupContentWidth) {
                currentX = PADDING;
                currentY += rowMaxHeight + PADDING;
                rowMaxHeight = 0;
            }
            updates.set(image.id, { x: currentX, y: currentY });
            currentX += image.width + PADDING;
            rowMaxHeight = Math.max(rowMaxHeight, image.height);
        });

        const allImagesWithNewPositions = sortedImages.map(img => ({ ...img, ...updates.get(img.id)! }));
        if (allImagesWithNewPositions.length === 0) return {};

        const contentMinX = 0;
        const contentMinY = 0;
        const contentMaxX = Math.max(...allImagesWithNewPositions.map(i => i.x + i.width));
        const contentMaxY = Math.max(...allImagesWithNewPositions.map(i => i.y + i.height));
        
        const newContentWidth = contentMaxX - contentMinX;
        const newContentHeight = contentMaxY - contentMinY;
        
        const newGroupWidth = newContentWidth + PADDING * 2;
        const newGroupHeight = newContentHeight + PADDING * 2;
        
        const groupOffsetX = group.x;
        const groupOffsetY = group.y;

        const updatedImages = boardImages.map(img => {
            if (updates.has(img.id)) {
                const newPos = updates.get(img.id)!;
                return { ...img, x: groupOffsetX + newPos.x, y: groupOffsetY + newPos.y };
            }
            return img;
        });

        const updatedGroups = boardGroups.map(g => {
            if (g.id === groupId) {
                return { ...g, width: newGroupWidth, height: newGroupHeight };
            }
            return g;
        });

        return { boardImages: updatedImages, boardGroups: updatedGroups };
    };


    return {
      ...initialState,

      setBoardImages: (updater) => set(state => {
        const newBoardImages = updater(state.boardImages);
        return { boardImages: newBoardImages, activeReferenceIndex: updateActiveReferenceIndex(newBoardImages, state.selectedImageIds) };
      }),
      setSelectedImageIds: (updater) => set(state => {
        const newSelectedImageIds = updater(state.selectedImageIds);
        return { selectedImageIds: newSelectedImageIds, activeReferenceIndex: updateActiveReferenceIndex(state.boardImages, newSelectedImageIds) };
      }),
      setBoardGroups: (updater) => set(state => ({ boardGroups: updater(state.boardGroups) })),
      setSelectedGroupIds: (updater) => set(state => ({ selectedGroupIds: updater(state.selectedGroupIds) })),
      setEditingGroupId: (id) => set({ editingGroupId: id }),
      setGroupEditModeId: (id) => set({ 
        groupEditModeId: id, 
        selectedImageIds: new Set(), 
        selectedGroupIds: id ? new Set([id]) : new Set() 
      }),
      setPan: (updater) => set(state => ({ pan: updater(state.pan) })),
      setZoom: (updater) => set(state => ({ zoom: updater(state.zoom) })),
      
      updateImage: (id, updates) => get().setBoardImages(prev => prev.map(img => (img.id === id ? { ...img, ...updates } : img))),
      updateGroup: (id, updates) => get().setBoardGroups(prev => prev.map(g => (g.id === id ? { ...g, ...updates } : g))),
      setGroupName: (id, name) => get().updateGroup(id, { name }),
      
      addNewCanvasImage: (dataUrl, file, originalImage) => {
        const imageEl = new Image();
        imageEl.onload = () => {
            const { naturalWidth, naturalHeight } = imageEl;
            const MAX_DIM = 400;
            let displayWidth = naturalWidth, displayHeight = naturalHeight;
            if (displayWidth > MAX_DIM || displayHeight > MAX_DIM) {
                if (displayWidth > displayHeight) { displayHeight = (displayHeight / displayWidth) * MAX_DIM; displayWidth = MAX_DIM; }
                else { displayWidth = (displayWidth / displayHeight) * MAX_DIM; displayHeight = MAX_DIM; }
            }

            let zIndexCounter = get().zIndexCounter + 1;
            const newImage: BoardImage = {
                id: crypto.randomUUID(),
                src: dataUrl,
                file: file,
                x: originalImage ? originalImage.x + 20 : 0,
                y: originalImage ? originalImage.y + 20 : 0,
                width: displayWidth,
                height: displayHeight,
                role: 'none',
                zIndex: zIndexCounter,
            };

            set(state => ({
                boardImages: [...state.boardImages, newImage],
                zIndexCounter,
                selectedImageIds: new Set([newImage.id]),
            }));
        };
        imageEl.src = dataUrl;
      },

      addImagesToCenter: async (media, canvasRect, sourceImageId) => {
        if (media.length === 0) return;

        let zIndexCounter = get().zIndexCounter;
        const processedNewImages: BoardImage[] = [];
        const sourceImage = sourceImageId ? get().boardImages.find(img => img.id === sourceImageId) : undefined;

        const mediaWithDims = await Promise.all(media.map(async (item) => {
            const src = item.src;
            const imageEl = new Image(); 
            imageEl.src = src; 
            await new Promise(r => { if (imageEl.complete) r(true); else imageEl.onload = () => r(true); });
            let { naturalWidth: width, naturalHeight: height } = imageEl;
            const MAX_DIM = 400;
            if (width > MAX_DIM || height > MAX_DIM) {
              if (width > height) { height = (height / width) * MAX_DIM; width = MAX_DIM; }
              else { width = (width / height) * MAX_DIM; height = MAX_DIM; }
            }
            const file = await dataURLtoFile(src, `generated-${item.id}.png`);
            return { item, width, height, src, file };
        }));

        if (sourceImage) {
            const SPACING = 20;
            const cols = media.length > 4 ? Math.ceil(Math.sqrt(media.length)) : media.length;
            const startX = sourceImage.x + sourceImage.width + SPACING;
            let currentX = startX;
            let currentY = sourceImage.y;
            let rowMaxHeight = 0;

            for (let i = 0; i < mediaWithDims.length; i++) {
                const { item, width, height, src, file } = mediaWithDims[i];
                
                if (i > 0 && i % cols === 0) {
                    currentX = startX;
                    currentY += rowMaxHeight + SPACING;
                    rowMaxHeight = 0;
                }
                
                zIndexCounter++;
                processedNewImages.push({
                    id: item.id, src, file, x: currentX, y: currentY, width, height,
                    role: 'none', zIndex: zIndexCounter, generationParams: item.generationParams
                });
                
                currentX += width + SPACING;
                if (height > rowMaxHeight) {
                    rowMaxHeight = height;
                }
            }
        } else {
            const { pan, zoom } = get();
            for (let i = 0; i < mediaWithDims.length; i++) {
                const { item, width, height, src, file } = mediaWithDims[i];
                const centerX = (canvasRect.width / 2 - pan.x) / zoom;
                const centerY = (canvasRect.height / 2 - pan.y) / zoom;
                const x = centerX - (width / 2) + ((i - (media.length - 1) / 2) * (width + 20));
                const y = centerY - (height / 2);
                zIndexCounter++;
                processedNewImages.push({
                     id: item.id, src, file, x, y, width, height,
                     role: 'none', zIndex: zIndexCounter, generationParams: item.generationParams
                });
            }
        }
        
        set(state => ({ 
            boardImages: [...state.boardImages, ...processedNewImages], 
            selectedImageIds: new Set(processedNewImages.map(img => img.id)), 
            zIndexCounter, 
            activeReferenceIndex: updateActiveReferenceIndex([...state.boardImages, ...processedNewImages], new Set(processedNewImages.map(img => img.id))) 
        }));
      },

      uploadImages: async (files: File[], position, canvasRect) => {
        const { pan, zoom } = get();
        let zIndexCounter = get().zIndexCounter;
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) return;
        const newImages: BoardImage[] = await Promise.all(imageFiles.map(async (file, index) => {
            const src = URL.createObjectURL(file);
            const imageEl = new Image(); imageEl.src = src; await new Promise(r => { imageEl.onload = r; });
            let { naturalWidth: width, naturalHeight: height } = imageEl;
            const MAX_DIM = 400;
            if (width > MAX_DIM || height > MAX_DIM) {
                if (width > height) { height = (height / width) * MAX_DIM; width = MAX_DIM; }
                else { width = (width / height) * MAX_DIM; height = MAX_DIM; }
            }
            const x = (position.x - pan.x - canvasRect.left) / zoom - (width / 2) + (index * 20);
            const y = (position.y - pan.y - canvasRect.top) / zoom - (height / 2) + (index * 20);
            zIndexCounter += 1;
            return { id: crypto.randomUUID(), src, file, x, y, width, height, role: 'none', zIndex: zIndexCounter };
        }));
        set(state => ({ boardImages: [...state.boardImages, ...newImages], zIndexCounter }));
      },

      addHistoryImage: async (mediaItem, position, canvasRect) => {
        const file = await dataURLtoFile(mediaItem.src, `history-${mediaItem.id}.png`);
        const { pan, zoom } = get();
        let zIndexCounter = get().zIndexCounter + 1;
        
        const src = URL.createObjectURL(file);
        const imageEl = new Image();
        imageEl.src = src;
        await new Promise(r => { if (imageEl.complete) r(true); else imageEl.onload = () => r(true); });
        
        let { naturalWidth: width, naturalHeight: height } = imageEl;
        const MAX_DIM = 400;
        if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) { height = (height / width) * MAX_DIM; width = MAX_DIM; }
            else { width = (width / height) * MAX_DIM; height = MAX_DIM; }
        }
        const x = (position.x - pan.x - canvasRect.left) / zoom - (width / 2);
        const y = (position.y - pan.y - canvasRect.top) / zoom - (height / 2);
        
        const newImage: BoardImage = {
            id: crypto.randomUUID(),
            src,
            file,
            x,
            y,
            width,
            height,
            role: 'none',
            zIndex: zIndexCounter,
            generationParams: mediaItem.generationParams,
        };
        
        set(state => ({ boardImages: [...state.boardImages, newImage], zIndexCounter }));
      },

      deleteSelection: () => set(state => {
        const { boardImages, selectedImageIds, boardGroups, selectedGroupIds, groupEditModeId } = state;

        if (groupEditModeId && selectedImageIds.size > 0) {
            const group = boardGroups.find(g => g.id === groupEditModeId);
            if (group) {
                const newBoardImages = boardImages.filter(img => !selectedImageIds.has(img.id));
                const remainingImageIds = group.imageIds.filter(id => !selectedImageIds.has(id));

                if (remainingImageIds.length < 2) {
                    const newBoardGroups = boardGroups.filter(g => g.id !== groupEditModeId);
                    const finalImages = newBoardImages.map(img => remainingImageIds.includes(img.id) ? { ...img, groupId: undefined } : img);
                    return { ...state, boardImages: finalImages, boardGroups: newBoardGroups, selectedImageIds: new Set(remainingImageIds), selectedGroupIds: new Set(), groupEditModeId: null };
                } else {
                    const newBoardGroups = boardGroups.map(g => g.id === groupEditModeId ? { ...g, imageIds: remainingImageIds } : g);
                    const intermediateState = { ...state, boardImages: newBoardImages, boardGroups: newBoardGroups, selectedImageIds: new Set() };
                    const realignedState = realignGroup(groupEditModeId, intermediateState);
                    return { ...intermediateState, ...realignedState };
                }
            }
        }
        
        const imageIdsInSelectedGroups = new Set(boardGroups.filter(g => selectedGroupIds.has(g.id)).flatMap(g => g.imageIds));
        const allImageIdsToDelete = new Set([...selectedImageIds, ...imageIdsInSelectedGroups]);
        const newBoardImages = boardImages.filter(img => !allImageIdsToDelete.has(img.id));
        const newBoardGroups = boardGroups.filter(g => !selectedGroupIds.has(g.id));
        
        return { ...state, boardImages: newBoardImages, boardGroups: newBoardGroups, selectedImageIds: new Set<string>(), selectedGroupIds: new Set<string>(), activeReferenceIndex: null, groupEditModeId: null };
      }),

      downloadSelection: async (saveDirectoryHandle) => {
        const { boardImages, selectedImageIds, boardGroups, selectedGroupIds } = get();
        const imageIdsInSelectedGroups = new Set(boardGroups.filter(g => selectedGroupIds.has(g.id)).flatMap(g => g.imageIds));
        const allImageIdsToDownload = new Set([...selectedImageIds, ...imageIdsInSelectedGroups]);
        for (const imageId of allImageIdsToDownload) {
          const image = boardImages.find(img => img.id === imageId);
          if (image) {
              try {
                const res = await fetch(image.src);
                const blob = await res.blob();
                const extension = image.file.type.split('/')[1] || 'png';
                const fileName = `bananang-${image.id}.${extension}`;
                if (saveDirectoryHandle) {
                    const fileHandle = await saveDirectoryHandle.getFileHandle(fileName, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                } else {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);
                }
                await new Promise(resolve => setTimeout(resolve, 100));
              } catch (err) { console.error("Failed to download image", imageId, err); }
          }
        }
      },
      
      setRoleForSelection: (role) => get().setBoardImages(prev => {
        let updatedImages = [...prev];
        const { selectedImageIds } = get();
        const allSelectedHaveRole = Array.from(selectedImageIds).every(id => prev.find(i => i.id === id)?.role === role);
        const newRoleForSelection = allSelectedHaveRole ? 'none' : role;
        if (newRoleForSelection !== 'none' && (role === 'original' || role === 'background' || role === 'pose' || role === 'reference')) {
             updatedImages = updatedImages.map(img => (img.role === role && !selectedImageIds.has(img.id)) ? { ...img, role: 'none' as const, refIndex: undefined } : img);
        }
        updatedImages = updatedImages.map(img => selectedImageIds.has(img.id) ? { ...img, role: newRoleForSelection } : img);
        let refCounter = 0;
        return updatedImages.map(img => {
            if (img.role === 'reference') return { ...img, refIndex: refCounter++ };
            if (img.refIndex !== undefined) return { ...img, refIndex: undefined };
            return img;
        });
      }),
      
      clearRoleForSelection: () => get().setBoardImages(prev => {
        const { selectedImageIds } = get();
        const imagesWithClearedRoles = prev.map(img => selectedImageIds.has(img.id) ? { ...img, role: 'none' as const, refIndex: undefined } : img);
        let refCounter = 0;
        return imagesWithClearedRoles.map(img => { if (img.role === 'reference') return { ...img, refIndex: refCounter++ }; return img; });
      }),
      
      clearActiveReferenceRole: () => {
        const { activeReferenceIndex } = get();
        if (activeReferenceIndex === null) return;
        get().setBoardImages(prev => {
            const imagesWithClearedRole = prev.map(img => (img.role === 'reference' && img.refIndex === activeReferenceIndex) ? { ...img, role: 'none' as const, refIndex: undefined } : img);
            let refCounter = 0;
            return imagesWithClearedRole.map(img => { if (img.role === 'reference') return { ...img, refIndex: refCounter++ }; return img; });
        });
        set({ activeReferenceIndex: null });
      },
      
      alignSelection: () => get().setBoardImages(prevImages => {
        const { selectedImageIds } = get();
        const selectedImages = prevImages.filter(img => selectedImageIds.has(img.id));
        if (selectedImages.length <= 1) return prevImages;
    
        const SPACING = 4;
    
        const originalImage = selectedImages.find(img => img.role === 'original');
        const imagesToLayout = selectedImages.filter(img => img.id !== originalImage?.id);
        
        if (imagesToLayout.length === 0) {
            return prevImages;
        }
    
        const roleOrder: Record<BoardImage['role'], number> = { 'original': 0, 'reference': 1, 'pose': 2, 'background': 3, 'none': 4 };
        imagesToLayout.sort((a, b) => {
            const orderA = roleOrder[a.role];
            const orderB = roleOrder[b.role];
            if (orderA !== orderB) return orderA - orderB;
            if (a.role === 'reference') return (a.refIndex ?? 0) - (b.refIndex ?? 0);
            return (a.y - b.y) || (a.x - b.x);
        });
    
        const numCols = Math.max(1, Math.round(Math.sqrt(imagesToLayout.length)));
    
        const updates = new Map<string, { x: number, y: number }>();
        const colHeights: number[] = Array(numCols).fill(0);
    
        const colsForWidthCalc: BoardImage[][] = Array.from({ length: numCols }, () => []);
        imagesToLayout.forEach((img, i) => colsForWidthCalc[i % numCols].push(img));
        const colWidths = colsForWidthCalc.map(col => Math.max(0, ...col.map(img => img.width)));
    
        const colXOffsets: number[] = [];
        let currentX = 0;
        for (const width of colWidths) {
            colXOffsets.push(currentX);
            currentX += width + SPACING;
        }
    
        imagesToLayout.forEach(image => {
            const shortestColIndex = colHeights.indexOf(Math.min(...colHeights));
            
            const newX = colXOffsets[shortestColIndex] + (colWidths[shortestColIndex] - image.width) / 2;
            const newY = colHeights[shortestColIndex];
    
            updates.set(image.id, { x: newX, y: newY });
            
            colHeights[shortestColIndex] += image.height + SPACING;
        });
    
        const originalBounds = {
            minX: Math.min(...selectedImages.map(i => i.x)),
            minY: Math.min(...selectedImages.map(i => i.y)),
        };
        
        const newPositions = Array.from(updates.values());
        if (newPositions.length === 0) {
            if (originalImage) {
                updates.set(originalImage.id, { x: originalImage.x, y: originalImage.y });
            } else {
                 return prevImages;
            }
        }
        
        const layoutMinX = Math.min(0, ...newPositions.map(p => p.x));
        const layoutMinY = Math.min(0, ...newPositions.map(p => p.y));
    
        let masonryStartX = originalBounds.minX;
        
        if (originalImage) {
            const originalImageX = originalBounds.minX - originalImage.width - SPACING;
            const originalImageY = originalBounds.minY;
            updates.set(originalImage.id, { x: originalImageX, y: originalImageY });
            masonryStartX = originalBounds.minX;
        }
        
        const offsetX = masonryStartX - layoutMinX;
        const offsetY = originalBounds.minY - layoutMinY;
    
        imagesToLayout.forEach(image => {
            const pos = updates.get(image.id)!;
            updates.set(image.id, { x: pos.x + offsetX, y: pos.y + offsetY });
        });
    
        return prevImages.map(img => updates.has(img.id) ? { ...img, ...updates.get(img.id)! } : img);
      }),

      handleImageMouseDown: (imageId, isShiftKey) => {
        const { boardImages, selectedImageIds, groupEditModeId, setGroupEditModeId, handleGroupMouseDown } = get();
        const image = boardImages.find(img => img.id === imageId);
        if (!image) return;

        if (groupEditModeId) {
            if (image.groupId === groupEditModeId) {
                let zIndexCounter = get().zIndexCounter + 1;
                let nextSelectedIds;
                if (isShiftKey) {
                    const newSet = new Set(selectedImageIds);
                    newSet.has(imageId) ? newSet.delete(imageId) : newSet.add(imageId);
                    nextSelectedIds = newSet;
                } else {
                    nextSelectedIds = selectedImageIds.has(imageId) ? selectedImageIds : new Set([imageId]);
                }
                set(state => ({
                    boardImages: state.boardImages.map(img => (img.id === imageId) ? { ...img, zIndex: zIndexCounter } : img),
                    zIndexCounter: zIndexCounter,
                    selectedImageIds: nextSelectedIds,
                    selectedGroupIds: new Set(),
                }));
                return;
            } else {
                setGroupEditModeId(null);
            }
        }
        
        if (image.groupId) { handleGroupMouseDown(image.groupId, isShiftKey); return; }

        let zIndexCounter = get().zIndexCounter + 1;
        let nextSelectedIds;
        if (isShiftKey) { const newSet = new Set(selectedImageIds); newSet.has(imageId) ? newSet.delete(imageId) : newSet.add(imageId); nextSelectedIds = newSet;
        } else if (!selectedImageIds.has(imageId)) { nextSelectedIds = new Set([imageId]);
        } else { nextSelectedIds = selectedImageIds; }
        
        set(state => ({ boardImages: state.boardImages.map(img => (img.id === imageId) ? { ...img, zIndex: zIndexCounter } : img), zIndexCounter: zIndexCounter, selectedImageIds: nextSelectedIds, selectedGroupIds: new Set<string>() }));
      },

      handleGroupMouseDown: (groupId, isShiftKey) => {
        const { selectedGroupIds, zIndexCounter, groupEditModeId } = get();
        if (groupEditModeId) return;
        let newZIndexCounter = zIndexCounter + 1;
        let nextSelectedGroupIds;
        if (isShiftKey) { const newSet = new Set(selectedGroupIds); newSet.has(groupId) ? newSet.delete(groupId) : newSet.add(groupId); nextSelectedGroupIds = newSet;
        } else if (!selectedGroupIds.has(groupId)) { nextSelectedGroupIds = new Set([groupId]);
        } else { nextSelectedGroupIds = selectedGroupIds; }
        get().setBoardGroups(prev => prev.map(g => nextSelectedGroupIds.has(g.id) ? { ...g, zIndex: newZIndexCounter + 1 } : g));
        get().setSelectedGroupIds(() => nextSelectedGroupIds);
        get().setSelectedImageIds(() => new Set<string>());
        set({ zIndexCounter: newZIndexCounter });
      },

      groupSelection: () => set(state => {
        const { boardImages, selectedImageIds, zIndexCounter } = state;
        const selectedImages = boardImages.filter(img => selectedImageIds.has(img.id) && !img.groupId);
        if (selectedImages.length < 2) return state;
        const selectedIdsArray = selectedImages.map(img => img.id);
        const selectedIdsSet = new Set(selectedIdsArray);
        const minX = Math.min(...selectedImages.map(i => i.x));
        const minY = Math.min(...selectedImages.map(i => i.y));
        const maxX = Math.max(...selectedImages.map(i => i.x + i.width));
        const maxY = Math.max(...selectedImages.map(i => i.y + i.height));
        const newGroupId = `group-${crypto.randomUUID()}`;
        const newGroup: BoardGroup = { id: newGroupId, name: t('group.defaultName', 'ko'), x: minX, y: minY, width: maxX - minX, height: maxY - minY, imageIds: selectedIdsArray, zIndex: zIndexCounter + 1 };
        const updatedImages = boardImages.map(img => selectedIdsSet.has(img.id) ? { ...img, groupId: newGroupId } : img);
        return { boardImages: updatedImages, boardGroups: [...state.boardGroups, newGroup], selectedImageIds: new Set<string>(), selectedGroupIds: new Set([newGroupId]), zIndexCounter: zIndexCounter + 1 };
      }),

      ungroupSelection: () => set(state => {
          const { boardImages, boardGroups, selectedGroupIds } = state;
          if (selectedGroupIds.size === 0) return state;
          const imageIdsToUngroup = new Set<string>();
          boardGroups.forEach(g => { if (selectedGroupIds.has(g.id)) { g.imageIds.forEach(id => imageIdsToUngroup.add(id)); }});
          const remainingGroups = boardGroups.filter(g => !selectedGroupIds.has(g.id));
          const updatedImages = boardImages.map((img): BoardImage => { if (imageIdsToUngroup.has(img.id)) { const newImg = { ...img }; delete newImg.groupId; return newImg; } return img; });
          const groupIds = Array.from(state.selectedGroupIds);
          return { boardImages: updatedImages, boardGroups: remainingGroups, selectedImageIds: imageIdsToUngroup, selectedGroupIds: new Set<string>(), groupEditModeId: groupIds.includes(state.groupEditModeId!) ? null : state.groupEditModeId };
      }),

      zoomToBounds: (bounds, canvasRect) => {
        const PADDING = 100;
        const targetWidth = bounds.width + PADDING * 2;
        const targetHeight = bounds.height + PADDING * 2;
        if (targetWidth <= 0 || targetHeight <= 0) return;
        const scaleX = canvasRect.width / targetWidth;
        const scaleY = canvasRect.height / targetHeight;
        const newZoom = Math.min(scaleX, scaleY, 2);
        const newPanX = (canvasRect.width / 2) - (bounds.x + bounds.width / 2) * newZoom;
        const newPanY = (canvasRect.height / 2) - (bounds.y + bounds.height / 2) * newZoom;
        set({ zoom: newZoom, pan: { x: newPanX, y: newPanY } });
      },

      zoomToImage: (image, canvasRect) => { get().zoomToBounds(image, canvasRect); },
      zoomToGroup: (group, canvasRect) => { get().zoomToBounds(group, canvasRect); },
      
      reorderBoardGroups: (draggedId, targetId) => set(state => {
        const { boardGroups } = state;
        const draggedIndex = boardGroups.findIndex(g => g.id === draggedId);
        const targetIndex = boardGroups.findIndex(g => g.id === targetId);
        if (draggedIndex === -1 || targetIndex === -1) return state;
        const newGroups = [...boardGroups];
        const [draggedItem] = newGroups.splice(draggedIndex, 1);
        newGroups.splice(targetIndex, 0, draggedItem);
        return { boardGroups: newGroups };
      }),

      removeImageFromGroup: (imageId) => set(state => {
        const image = state.boardImages.find(img => img.id === imageId);
        if (!image || !image.groupId) return state;
        const groupId = image.groupId;
        const newImages = state.boardImages.map(img => img.id === imageId ? { ...img, groupId: undefined } : img);
        const group = state.boardGroups.find(g => g.id === groupId);
        if (!group) return { ...state, boardImages: newImages };
        const remainingImageIds = group.imageIds.filter(id => id !== imageId);
        if (remainingImageIds.length < 2) {
            const finalImages = newImages.map(img => remainingImageIds.includes(img.id) ? { ...img, groupId: undefined } : img);
            const newGroups = state.boardGroups.filter(g => g.id !== groupId);
            return { ...state, boardImages: finalImages, boardGroups: newGroups, groupEditModeId: state.groupEditModeId === groupId ? null : state.groupEditModeId, selectedImageIds: new Set([imageId]), selectedGroupIds: new Set() };
        } else {
            const intermediateState = {
                ...state,
                boardImages: newImages,
                boardGroups: state.boardGroups.map(g => g.id === groupId ? { ...g, imageIds: remainingImageIds } : g),
                selectedImageIds: new Set([imageId]),
                selectedGroupIds: new Set(),
            };
            const realignedState = realignGroup(groupId, intermediateState);
            return { ...intermediateState, ...realignedState };
        }
      }),

      reset: () => set(initialState),
    }
});
