import React from 'react';
import { BoardImage } from '../../../types';
import { useCanvasStore } from '../../../store/canvasStore';
import { ActionRing } from './ActionRing';
import { ContextMenu, ContextMenuProps } from './ContextMenu';
import { LassoOverlay } from './LassoOverlay';

interface CanvasOverlaysProps {
    contextMenu: ContextMenuProps | null;
    actionRingPosition: { x: number, y: number } | null;
    lassoTarget: BoardImage | null;
    canvasRect: DOMRect | null;
    pan: { x: number, y: number };
    zoom: number;
    onZoomSelection: (media: File | string | null) => void;
    onEditSelection: (imageId: string) => void;
    onDelete: () => void;
    onDownload: () => void;
    onHideActionRing: () => void;
    onLassoCancel: () => void;
    onLassoConfirm: (maskFile: File) => void;
    language: string;
}

export const CanvasOverlays: React.FC<CanvasOverlaysProps> = React.memo(({
    contextMenu,
    actionRingPosition,
    lassoTarget,
    canvasRect,
    pan,
    zoom,
    onZoomSelection,
    onEditSelection,
    onDelete,
    onDownload,
    onHideActionRing,
    onLassoCancel,
    onLassoConfirm,
    language,
}) => {

    if (lassoTarget && canvasRect) {
        return <LassoOverlay 
            image={lassoTarget}
            canvasRect={canvasRect}
            pan={pan}
            zoom={zoom}
            onCancel={onLassoCancel}
            onConfirm={onLassoConfirm}
            language={language as 'ko'}
        />;
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