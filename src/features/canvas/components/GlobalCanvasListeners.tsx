import React, { useEffect } from 'react';
import { useCanvasStore } from '../../../store/canvasStore';
import { isShortcut } from '../../../hooks/useShortcuts';

interface GlobalCanvasListenersProps {
    onSaveWorkspace: () => void;
    onSaveWorkspaceAs: () => void;
    onLoadWorkspace: (content?: string, filePath?: string) => void;
    isModalOpen: boolean;
}
export const GlobalCanvasListeners: React.FC<GlobalCanvasListenersProps> = ({ onSaveWorkspace, onSaveWorkspaceAs, onLoadWorkspace, isModalOpen }) => {
    const {
        deleteSelection,
        setSelectedImageIds,
        setSelectedGroupIds,
        clearRoleForSelection,
        clearActiveReferenceRole,
        boardImages,
        selectedImageIds,
        selectedGroupIds,
        activeReferenceIndex,
        groupEditModeId,
        setGroupEditModeId,
    } = useCanvasStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isModalOpen || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (isShortcut(e, 'deleteSelection')) {
                if (selectedImageIds.size > 0 || selectedGroupIds.size > 0) {
                    deleteSelection();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();

                if (groupEditModeId) {
                    setGroupEditModeId(null);
                    return;
                }

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
            } else if (isShortcut(e, 'saveWorkspaceAs')) {
                e.preventDefault();
                onSaveWorkspaceAs();
            } else if (isShortcut(e, 'saveWorkspace')) {
                e.preventDefault();
                onSaveWorkspace();
            } else if (isShortcut(e, 'loadWorkspace')) {
                e.preventDefault();
                onLoadWorkspace();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        isModalOpen,
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
        onSaveWorkspaceAs,
        onLoadWorkspace,
        groupEditModeId,
        setGroupEditModeId
    ]);
    return null; // This component does not render anything
};
