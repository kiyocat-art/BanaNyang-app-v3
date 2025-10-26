import React from 'react';
import { useCanvasStore } from '../../../store/canvasStore';
import { CanvasImage } from './CanvasImage';
import { CanvasGroup } from './CanvasGroup';
import { useVisibleObjects } from '../hooks/useVisibleObjects';

interface CanvasRendererProps {
    onElementMouseDown: (e: React.MouseEvent<HTMLDivElement>, id: string, type: 'image' | 'group') => void;
    onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
    onGroupDoubleClick: (groupId: string) => void;
    canvasRect: DOMRect | null;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = React.memo(({ onElementMouseDown, onContextMenu, onGroupDoubleClick, canvasRect }) => {
    const { boardImages, boardGroups, pan, zoom } = useCanvasStore(state => ({
        boardImages: state.boardImages,
        boardGroups: state.boardGroups,
        pan: state.pan,
        zoom: state.zoom,
    }));
    
    const { visibleImages, visibleGroups } = useVisibleObjects({
        boardImages,
        boardGroups,
        pan,
        zoom,
        canvasRect,
    });

    return (
        <>
            {visibleGroups.map(group => (
                <CanvasGroup
                    key={group.id}
                    group={group}
                    onMouseDown={(e, id) => onElementMouseDown(e, id, 'group')}
                    onContextMenu={onContextMenu}
                    isSuspended={false}
                    onDoubleClick={onGroupDoubleClick}
                />
            ))}
            {visibleImages.map(image => (
                <CanvasImage
                    key={image.id}
                    image={image}
                    onContextMenu={onContextMenu}
                    onMouseDown={(e, id) => onElementMouseDown(e, id, 'image')}
                />
            ))}
        </>
    );
});
