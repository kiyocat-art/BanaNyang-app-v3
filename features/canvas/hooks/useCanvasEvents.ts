import { useEffect, useCallback } from 'react';
import { useCanvasStore } from '../../../store/canvasStore';

interface UseCanvasEventsProps {
    onSaveWorkspace: () => void;
    onLoadWorkspace: () => void;
}

export const useCanvasEvents = ({ onSaveWorkspace, onLoadWorkspace }: UseCanvasEventsProps) => {
    const {
        deleteSelection,
        setSelectedImageIds,
        setSelectedGroupIds,
        clearRoleForSelection,
        clearActiveReferenceRole,
        boardImages,
        selectedImageIds,
        selectedGroupIds,
        activeReferenceIndex
    } = useCanvasStore();

    const handlePaste = useCallback(async (e: ClipboardEvent) => {
        if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;

        if (e.clipboardData) {
            const items = Array.from(e.clipboardData.items).filter(item => item.type.startsWith('image/'));
            if (items.length > 0) {
                const files = items.map(item => item.getAsFile()!).filter((f): f is File => f !== null);
                // The uploadImages function needs canvasRef and position, which we don't have here.
                // This suggests that either upload logic needs to be more flexible, or paste should be handled where canvasRef is available.
                // For now, we'll delegate this back to the interaction layer. This hook will primarily handle non-positional events.
            }
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedImageIds.size > 0 || selectedGroupIds.size > 0) {
                    deleteSelection();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                const selectionHasRoles = Array.from(selectedImageIds).some(id => {
                    const img = boardImages.find(i => i.id === id);
                    return img && img.role !== 'none';
                });

                if (selectedImageIds.size > 0) {
                    if (selectionHasRoles) clearRoleForSelection();
                    else setSelectedImageIds(() => new Set());
                } else if (selectedGroupIds.size > 0) {
                    setSelectedGroupIds(() => new Set());
                } else if (activeReferenceIndex !== null) {
                    clearActiveReferenceRole();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                onSaveWorkspace();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
                e.preventDefault();
                onLoadWorkspace();
            }
        };

        // Paste is handled in useCanvasInteractions where canvasRef is available
        // window.addEventListener('paste', handlePaste);

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            // window.removeEventListener('paste', handlePaste);
        };
    }, [
        deleteSelection, 
        setSelectedImageIds, 
        setSelectedGroupIds, 
        clearRoleForSelection, 
        clearActiveReferenceRole,
        selectedImageIds, 
        selectedGroupIds, 
        activeReferenceIndex, 
        boardImages, 
        onSaveWorkspace,
        onLoadWorkspace
    ]);
};