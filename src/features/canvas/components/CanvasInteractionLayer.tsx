import React from 'react';
import { GeneratedMedia } from '../../../types';
import { useCanvasInteractions } from '../hooks/useCanvasInteractions';
// FIX: Import the 't' function for localization.
import { t } from '../../../localization';
// FIX: Import the 'SelectionBox' component.
import { SelectionBox } from './SelectionBox';


interface CanvasInteractionLayerProps {
    children: React.ReactNode;
    allHistoryMedia: GeneratedMedia[];
    onSaveWorkspace: () => void;
    onSaveWorkspaceAs: () => void;
    onLoadWorkspace: (content?: string, filePath?: string) => void;
    handleUploadAndPositionImages: (files: File[], position?: {x: number, y: number}) => void;
}

export const CanvasInteractionLayer: React.FC<CanvasInteractionLayerProps> = ({ children, allHistoryMedia, onSaveWorkspace, onSaveWorkspaceAs, onLoadWorkspace, handleUploadAndPositionImages }) => {
    const {
        canvasRef,
        fileInputRef,
        cursorClass,
        pan,
        zoom,
        // FIX: Destructure missing properties returned from the hook.
        isDraggingOver,
        marquee,
        selectionBounds,
        handleDrop,
        handleDragEnter,
        handleDragLeave,
        handleMouseDownOnCanvas,
        handleWheel,
        handleContextMenu,
        handleElementMouseDown,
    // FIX: Pass missing 'onSaveWorkspaceAs' and 'handleUploadAndPositionImages' props to the hook.
    } = useCanvasInteractions({ allHistoryMedia, onSaveWorkspace, onSaveWorkspaceAs, onLoadWorkspace, handleUploadAndPositionImages });
    
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            // FIX: Cast child to React.ReactElement<any> to resolve props overload error.
            return React.cloneElement(child as React.ReactElement<any>, { 
                onElementMouseDown: handleElementMouseDown, 
                onContextMenu: handleContextMenu,
                canvasRect: canvasRef.current?.getBoundingClientRect() ?? null,
            });
        }
        return child;
    });

    return (
        <div
            ref={canvasRef}
            className={`flex-grow w-full h-full relative bg-zinc-900 overflow-hidden grid-background ${cursorClass}`}
            onDragOver={(e) => e.preventDefault()}
            // FIX: Use handlers returned from the hook.
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onMouseDown={handleMouseDownOnCanvas}
            onWheel={handleWheel}
            onContextMenu={handleContextMenu}
            tabIndex={0}
        >
            {isDraggingOver && (
                <div className="absolute inset-0 bg-sky-500/20 border-4 border-dashed border-sky-500 pointer-events-none z-[100] flex items-center justify-center transition-all duration-200">
                    <p className="text-2xl font-bold text-white bg-black/50 px-4 py-2 rounded-lg">{t('uploader.orDragAndDrop', 'ko')}</p>
                </div>
            )}
            <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
                {childrenWithProps}
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
                        const fileReader = new FileReader();
                        fileReader.onload = (event) => onLoadWorkspace(event.target?.result as string);
                        fileReader.readAsText(workspaceFile);
                    } else {
                        handleUploadAndPositionImages(files);
                    }
                }
            }} />
        </div>
    );
};