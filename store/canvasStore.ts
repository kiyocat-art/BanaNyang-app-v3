import { create } from 'zustand';
import { BoardImage, GeneratedMedia, BoardGroup } from '../types';
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
}

interface CanvasActions {
  setBoardImages: (updater: (prev: BoardImage[]) => BoardImage[]) => void;
  setSelectedImageIds: (updater: (prev: Set<string>) => Set<string>) => void;
  setBoardGroups: (updater: (prev: BoardGroup[]) => BoardGroup[]) => void;
  setSelectedGroupIds: (updater: (prev: Set<string>) => Set<string>) => void;
  setEditingGroupId: (id: string | null) => void;
  setPan: (updater: (prev: { x: number; y: number }) => { x: number; y: number }) => void;
  setZoom: (updater: (prev: number) => number) => void;
  addImagesToCenter: (media: GeneratedMedia[], canvasRect: DOMRect) => Promise<void>;
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
  // Prioritize explicit single selection of a reference image.
  if (selectedImageIds.size === 1) {
    const selectedId = Array.from(selectedImageIds)[0];
    const selectedImage = boardImages.find(img => img.id === selectedId);
    if (selectedImage && selectedImage.role === 'reference' && selectedImage.refIndex !== undefined) {
      return selectedImage.refIndex;
    }
  }

  // If no explicit selection, or if the single selection is not a reference image,
  // check if any reference images exist on the canvas.
  const hasReferenceImages = boardImages.some(img => img.role === 'reference');
  if (hasReferenceImages) {
    // Default to the first reference image (refIndex 0).
    return 0;
  }

  // No reference images exist, so no active index.
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
};

export const useCanvasStore = create<CanvasState & CanvasActions>((set, get) => ({
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

  addImagesToCenter: async (media, canvasRect) => {
    if (media.length === 0) return;
    const { pan, zoom } = get();
    let zIndexCounter = get().zIndexCounter;
    const newImages: BoardImage[] = await Promise.all(media.map(async (item, index) => {
        const src = item.src;
        const imageEl = new Image(); imageEl.src = src; await new Promise(r => { imageEl.onload = r; });
        let { naturalWidth: width, naturalHeight: height } = imageEl;
        const MAX_DIM = 400;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) { height = (height / width) * MAX_DIM; width = MAX_DIM; }
          else { width = (width / height) * MAX_DIM; height = MAX_DIM; }
        }
        const centerX = (canvasRect.width / 2 - pan.x) / zoom;
        const centerY = (canvasRect.height / 2 - pan.y) / zoom;
        const x = centerX - (width / 2) + ((index - (media.length - 1) / 2) * (width + 20));
        const y = centerY - (height / 2);
        zIndexCounter += 1;
        const file = await dataURLtoFile(src, `generated-${item.id}.png`);
        return { id: item.id, src, file, x, y, width, height, role: 'none', zIndex: zIndexCounter };
    }));
    set(state => ({ boardImages: [...state.boardImages, ...newImages], selectedImageIds: new Set(newImages.map(img => img.id)), zIndexCounter, activeReferenceIndex: updateActiveReferenceIndex([...state.boardImages, ...newImages], new Set(newImages.map(img => img.id))) }));
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
    get().uploadImages([file], position, canvasRect);
  },

  deleteSelection: () => set(state => {
    const { boardImages, selectedImageIds, boardGroups, selectedGroupIds } = state;
    const newBoardImagesAfterImgDelete = boardImages.filter(img => !selectedImageIds.has(img.id));
    const imageIdsInSelectedGroups = new Set(boardGroups.filter(g => selectedGroupIds.has(g.id)).flatMap(g => g.imageIds));
    const newBoardImages = newBoardImagesAfterImgDelete.filter(img => !imageIdsInSelectedGroups.has(img.id));
    const newBoardGroups = boardGroups.filter(g => !selectedGroupIds.has(g.id));
    return { boardImages: newBoardImages, boardGroups: newBoardGroups, selectedImageIds: new Set<string>(), selectedGroupIds: new Set<string>(), activeReferenceIndex: null };
  }),

  downloadSelection: async (saveDirectoryHandle) => {
    const { boardImages, selectedImageIds, boardGroups, selectedGroupIds } = get();
    
    const imageIdsInSelectedGroups = new Set(
      boardGroups.filter(g => selectedGroupIds.has(g.id)).flatMap(g => g.imageIds)
    );
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
          } catch (err) {
             console.error("Failed to download image", imageId, err);
          }
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
    // Maintain a consistent order for processing
    const selectedImages = prevImages.filter(img => selectedImageIds.has(img.id))
                                     .sort((a, b) => a.y - b.y || a.x - b.x); // Sort by position to get a stable order
    if (selectedImages.length <= 1) return prevImages;

    const SPACING = 0;
    const minX = Math.min(...selectedImages.map(i => i.x));
    const minY = Math.min(...selectedImages.map(i => i.y));

    // 1. Determine the number of columns
    const numCols = Math.max(1, Math.round(Math.sqrt(selectedImages.length)));

    // 2. Distribute images into columns
    const colHeights = Array(numCols).fill(minY);
    const imagesInCols: BoardImage[][] = Array.from({ length: numCols }, () => []);

    selectedImages.forEach(image => {
        const shortestColIndex = colHeights.indexOf(Math.min(...colHeights));
        imagesInCols[shortestColIndex].push(image);
        colHeights[shortestColIndex] += image.height + SPACING;
    });

    // 3. Calculate column widths and X offsets
    const colMaxWidths = imagesInCols.map(col => Math.max(0, ...col.map(img => img.width)));
    
    const colXOffsets: number[] = [];
    let currentX = minX;
    for (let i = 0; i < numCols; i++) {
        colXOffsets.push(currentX);
        currentX += colMaxWidths[i] + SPACING;
    }

    // 4. Calculate final positions for each image
    const updates = new Map<string, { x: number, y: number }>();
    
    for (let i = 0; i < numCols; i++) {
        let currentY = minY;
        const columnX = colXOffsets[i];
        const columnWidth = colMaxWidths[i];
        
        imagesInCols[i].forEach(image => {
            // Center image within the column
            const imageX = columnX + (columnWidth - image.width) / 2;
            updates.set(image.id, { x: imageX, y: currentY });
            currentY += image.height + SPACING;
        });
    }

    return prevImages.map(img => updates.has(img.id) ? { ...img, ...updates.get(img.id)! } : img);
  }),

  handleImageMouseDown: (imageId, isShiftKey) => {
    const { boardImages, selectedImageIds } = get();
    const image = boardImages.find(img => img.id === imageId);
    if (image?.groupId) {
      get().handleGroupMouseDown(image.groupId, isShiftKey);
      return;
    }

    let zIndexCounter = get().zIndexCounter + 1;
    let nextSelectedIds;
    if (isShiftKey) {
        const newSet = new Set(selectedImageIds); newSet.has(imageId) ? newSet.delete(imageId) : newSet.add(imageId); nextSelectedIds = newSet;
    } else if (!selectedImageIds.has(imageId)) {
        nextSelectedIds = new Set([imageId]);
    } else { nextSelectedIds = selectedImageIds; }
    
    get().setBoardImages(prev => prev.map(img => nextSelectedIds.has(img.id) ? { ...img, zIndex: zIndexCounter } : img));
    get().setSelectedImageIds(() => nextSelectedIds);
    get().setSelectedGroupIds(() => new Set<string>());
    set({ zIndexCounter });
  },

  handleGroupMouseDown: (groupId, isShiftKey) => {
    const { selectedGroupIds } = get();
    let zIndexCounter = get().zIndexCounter + 1;
    let nextSelectedGroupIds;

    if (isShiftKey) {
      const newSet = new Set(selectedGroupIds);
      newSet.has(groupId) ? newSet.delete(groupId) : newSet.add(groupId);
      nextSelectedGroupIds = newSet;
    } else if (!selectedGroupIds.has(groupId)) {
      nextSelectedGroupIds = new Set([groupId]);
    } else {
      nextSelectedGroupIds = selectedGroupIds;
    }
    
    get().setBoardGroups(prev => prev.map(g => nextSelectedGroupIds.has(g.id) ? { ...g, zIndex: zIndexCounter + 1 } : g));
    get().setSelectedGroupIds(() => nextSelectedGroupIds);
    get().setSelectedImageIds(() => new Set<string>());
    set({ zIndexCounter });
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
    const newGroup: BoardGroup = {
        id: newGroupId, name: t('group.defaultName', 'ko'),
        x: minX, y: minY, width: maxX - minX, height: maxY - minY,
        imageIds: selectedIdsArray, zIndex: zIndexCounter + 1,
    };
    
    const updatedImages = boardImages.map(img => selectedIdsSet.has(img.id) ? { ...img, groupId: newGroupId } : img);
    return {
        boardImages: updatedImages, boardGroups: [...state.boardGroups, newGroup],
        selectedImageIds: new Set<string>(), selectedGroupIds: new Set([newGroupId]),
        zIndexCounter: zIndexCounter + 1,
    };
  }),

  ungroupSelection: () => set(state => {
      const { boardImages, boardGroups, selectedGroupIds } = state;
      if (selectedGroupIds.size === 0) return state;

      const imageIdsToUngroup = new Set<string>();
      boardGroups.forEach(g => {
        if (selectedGroupIds.has(g.id)) { g.imageIds.forEach(id => imageIdsToUngroup.add(id)); }
      });

      const remainingGroups = boardGroups.filter(g => !selectedGroupIds.has(g.id));
      const updatedImages = boardImages.map((img): BoardImage => {
          if (imageIdsToUngroup.has(img.id)) {
              const newImg = { ...img };
              delete newImg.groupId;
              return newImg;
          }
          return img;
      });

      return {
          boardImages: updatedImages, 
          boardGroups: remainingGroups,
          selectedImageIds: imageIdsToUngroup, 
          selectedGroupIds: new Set<string>(),
      };
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

  zoomToImage: (image, canvasRect) => {
    get().zoomToBounds(image, canvasRect);
  },

  zoomToGroup: (group, canvasRect) => {
    get().zoomToBounds(group, canvasRect);
  },
  
  reorderBoardGroups: (draggedId, targetId) => set(state => {
    const { boardGroups } = state;
    const draggedIndex = boardGroups.findIndex(g => g.id === draggedId);
    const targetIndex = boardGroups.findIndex(g => g.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
        return state;
    }

    const newGroups = [...boardGroups];
    const [draggedItem] = newGroups.splice(draggedIndex, 1);
    newGroups.splice(targetIndex, 0, draggedItem);
    
    return { boardGroups: newGroups };
  }),

  reset: () => set(initialState),
}));