import React from 'react';
import { GeneratedMedia } from '../../../types';
import { useCanvasInteractions } from '../hooks/useCanvasInteractions';

interface CanvasInteractionLayerProps {
    children: React.ReactNode;
    allHistoryMedia: GeneratedMedia[];
    onSaveWorkspace: () => void;
    onLoadWorkspace: () => void;
}

export const CanvasInteractionLayer: React.FC<CanvasInteractionLayerProps> = ({ children, allHistoryMedia, onSaveWorkspace, onLoadWorkspace }) => {
    const {
        canvasRef,
        cursorClass,
        pan,
        zoom,
        handleDrop,
        handleMouseDownOnCanvas,
        handleWheel,
        handleContextMenu,
        handleElementMouseDown,
    } = useCanvasInteractions({ allHistoryMedia, onSaveWorkspace, onLoadWorkspace });
    
    // Pass down interaction handlers to children
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            // FIX: Cast child to React.ReactElement<any> to resolve props overload error.
            return React.cloneElement(child as React.ReactElement<any>, { onElementMouseDown: handleElementMouseDown, onContextMenu: handleContextMenu });
        }
        return child;
    });

    return (
        <div
            ref={canvasRef}
            className={`flex-grow w-full h-full relative bg-zinc-900 overflow-hidden grid-background ${cursorClass}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onMouseDown={handleMouseDownOnCanvas}
            onWheel={handleWheel}
            onContextMenu={handleContextMenu}
            tabIndex={0}
        >
            <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
                {childrenWithProps}
            </div>
        </div>
    );
};