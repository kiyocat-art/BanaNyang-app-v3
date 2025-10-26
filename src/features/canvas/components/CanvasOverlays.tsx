import React from 'react';
import { BoardImage } from '../../../types';
import { ActionRing } from './ActionRing';
import { ContextMenu, ContextMenuProps } from './ContextMenu';
import { UnifiedEditorModal, EditResult } from './UnifiedEditorModal';

interface CanvasOverlaysProps {
    contextMenu: ContextMenuProps | null;
    actionRingPosition: { x: number, y: number } | null;
    unifiedEditingImage: BoardImage | null;
    canvasRect: DOMRect | null;
    pan: { x: number, y: number };
    zoom: number;
    onZoomSelection: (media: File | string | null) => void;
    onEditSelection: (imageId: string) => void;
    onDelete: () => void;
    onDownload: () => void;
    onHideActionRing: () => void;
    onUnifiedEditComplete: (result: EditResult) => void;
    onUnifiedEditCancel: () => void;
    language: string;
    onNotification: (message: string, type: 'success' | 'error') => void;
}

export const CanvasOverlays: React.FC<CanvasOverlaysProps> = React.memo(({
    contextMenu,
    actionRingPosition,
    unifiedEditingImage,
    onZoomSelection,
    onEditSelection,
    onDelete,
    onDownload,
    onHideActionRing,
    onUnifiedEditComplete,
    onUnifiedEditCancel,
    language,
    onNotification,
}) => {

    if (unifiedEditingImage) {
        return (
            <UnifiedEditorModal
                image={unifiedEditingImage}
                onComplete={onUnifiedEditComplete}
                onCancel={onUnifiedEditCancel}
                language={language as 'ko'}
                onNotification={onNotification}
            />
        );
    }
    
    if (actionRingPosition) {
         return (
             <div
                className="fixed z-[100] pointer-events-auto"
                style={{
                    top: actionRingPosition.y,
                    left: actionRingPosition.x,
                    transform: 'translate(-50%, -100%) translateY(-8px)',
                    animation: 'selection-toolbar-fade-in 0.15s ease-out forwards',
                }}
            >
                <ActionRing
                    onZoom={(media) => { onZoomSelection(media); onHideActionRing(); }}
                    onEdit={(id) => { onEditSelection(id); onHideActionRing(); }}
                    language={language as 'ko'}
                    onDelete={onDelete}
                    onDownload={onDownload}
                />
             </div>
         )
    }

    if (contextMenu) {
        return <ContextMenu {...contextMenu} />;
    }

    return null;
});
