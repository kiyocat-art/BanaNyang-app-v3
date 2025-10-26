import React, { useState, useMemo, useRef } from 'react';
import { BoardImage } from '../../../types';
import { t, Language } from '../../../localization';
import { useCanvasStore, REF_COLORS } from '../../../store/canvasStore';
import { Tooltip } from '../../../components/Tooltip';
import {
  MapIcon, PlusIcon, MinusIcon, FitToScreenIcon, CloseIcon,
} from '../../../components/icons';


export const CanvasNavigator: React.FC<{ language: Language; canvasRef: React.RefObject<HTMLElement>; }> = ({ language, canvasRef }) => {
    const { boardImages, pan, zoom, setPan, setZoom } = useCanvasStore();
    const [isOpen, setIsOpen] = useState(true);
    const minimapRef = useRef<HTMLDivElement>(null);
    const [isDraggingViewport, setIsDraggingViewport] = useState(false);
    const interactionRef = useRef<{ startX: number; startY: number; startPan: { x: number; y: number; } } | null>(null);

    const contentBounds = useMemo(() => {
        if (boardImages.length === 0) return { x: 0, y: 0, width: 0, height: 0, defined: false };
        const minX = Math.min(...boardImages.map(i => i.x));
        const minY = Math.min(...boardImages.map(i => i.y));
        const maxX = Math.max(...boardImages.map(i => i.x + i.width));
        const maxY = Math.max(...boardImages.map(i => i.y + i.height));
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY, defined: true };
    }, [boardImages]);

    const handleZoomToFit = () => {
        const canvasEl = canvasRef.current;
        if (!canvasEl || !contentBounds.defined || contentBounds.width === 0 || contentBounds.height === 0) return;
        
        const PADDING = 50;
        const scaleX = (canvasEl.offsetWidth - PADDING * 2) / contentBounds.width;
        const scaleY = (canvasEl.offsetHeight - PADDING * 2) / contentBounds.height;
        const newZoom = Math.min(scaleX, scaleY, 5);
        const newPanX = (canvasEl.offsetWidth - contentBounds.width * newZoom) / 2 - contentBounds.x * newZoom;
        const newPanY = (canvasEl.offsetHeight - contentBounds.height * newZoom) / 2 - contentBounds.y * newZoom;
        setZoom(() => newZoom);
        setPan(() => ({ x: newPanX, y: newPanY }));
    };

    const MINIMAP_SIZE = 200;
    const minimapScale = (contentBounds.defined && contentBounds.width > 0 && contentBounds.height > 0) 
        ? Math.min(MINIMAP_SIZE / contentBounds.width, MINIMAP_SIZE / contentBounds.height) 
        : 0;
    
    const handleViewportMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!minimapRef.current || !canvasRef.current || !contentBounds.defined || minimapScale === 0) return;
        e.preventDefault(); e.stopPropagation();
        setIsDraggingViewport(true);
        interactionRef.current = { startX: e.clientX, startY: e.clientY, startPan: pan };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!interactionRef.current) return;
            const dx = moveEvent.clientX - interactionRef.current.startX;
            const dy = moveEvent.clientY - interactionRef.current.startY;
            const deltaPanX = -(dx / minimapScale) * zoom;
            const deltaPanY = -(dy / minimapScale) * zoom;
            setPan(p => ({ x: interactionRef.current!.startPan.x + deltaPanX, y: interactionRef.current!.startPan.y + deltaPanY }));
        };
        const handleMouseUp = () => {
            setIsDraggingViewport(false);
            interactionRef.current = null;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const minimapEl = minimapRef.current;
        const canvasEl = canvasRef.current;
        if (!minimapEl || !canvasEl || !contentBounds.defined) return;
        const minimapRect = minimapEl.getBoundingClientRect();

        const contentDisplayWidth = contentBounds.width * minimapScale;
        const contentDisplayHeight = contentBounds.height * minimapScale;
        const contentOffsetX = (minimapRect.width - contentDisplayWidth) / 2;
        const contentOffsetY = (minimapRect.height - contentDisplayHeight) / 2;
        const clickX = e.clientX - minimapRect.left - contentOffsetX;
        const clickY = e.clientY - minimapRect.top - contentOffsetY;
        const targetCanvasX = (clickX / minimapScale) + contentBounds.x;
        const targetCanvasY = (clickY / minimapScale) + contentBounds.y;
        const newPanX = -targetCanvasX * zoom + canvasEl.offsetWidth / 2;
        const newPanY = -targetCanvasY * zoom + canvasEl.offsetHeight / 2;
        setPan(() => ({ x: newPanX, y: newPanY }));
    };

    const getRoleColor = (image: BoardImage) => {
        if (image.role === 'original') return '#22c55e';
        if (image.role === 'background') return '#a855f7';
        if (image.role === 'pose') return '#f59e0b';
        if (image.role === 'reference' && image.refIndex !== undefined) return REF_COLORS[image.refIndex % REF_COLORS.length];
        return '#737373'; // neutral-500
    };
    
    const canvasEl = canvasRef.current;
    let viewport = { x: 0, y: 0, width: 0, height: 0 };
    if (canvasEl && contentBounds.defined && zoom > 0) {
        const contentDisplayWidth = contentBounds.width * minimapScale;
        const contentDisplayHeight = contentBounds.height * minimapScale;
        const contentOffsetX = (MINIMAP_SIZE - contentDisplayWidth) / 2;
        const contentOffsetY = (MINIMAP_SIZE - contentDisplayHeight) / 2;
        viewport = {
            width: (canvasEl.offsetWidth / zoom) * minimapScale,
            height: (canvasEl.offsetHeight / zoom) * minimapScale,
            x: ((-pan.x / zoom) - contentBounds.x) * minimapScale + contentOffsetX,
            y: ((-pan.y / zoom) - contentBounds.y) * minimapScale + contentOffsetY,
        };
    }

    return (
        <div className="absolute bottom-4 right-4 z-50">
             {isOpen ? (
                <div className="relative bg-neutral-800/80 backdrop-blur-md border border-neutral-700 rounded-lg p-2 shadow-2xl animate-category-fade-in">
                    <Tooltip tip={t('navigator.hide', language)} position="left"><button onClick={() => setIsOpen(false)} className="absolute top-1 right-1 z-10 p-1 text-zinc-400 hover:text-white rounded-full hover:bg-neutral-700 transition-colors"><CloseIcon className="w-4 h-4" /></button></Tooltip>
                    <div className="flex flex-col items-end gap-2 pt-4">
                        <div ref={minimapRef} className="w-[200px] h-[200px] bg-neutral-900/50 rounded-md overflow-hidden relative cursor-pointer" onClick={handleMinimapClick}>
                            {contentBounds.defined && minimapScale > 0 && (
                                <div style={{ width: contentBounds.width * minimapScale, height: contentBounds.height * minimapScale, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                                    {boardImages.map(img => (<div key={img.id} style={{ position: 'absolute', left: (img.x - contentBounds.x) * minimapScale, top: (img.y - contentBounds.y) * minimapScale, width: img.width * minimapScale, height: img.height * minimapScale, backgroundColor: getRoleColor(img) }}/>))}
                                    <div onMouseDown={handleViewportMouseDown} style={{ position: 'absolute', left: viewport.x, top: viewport.y, width: viewport.width, height: viewport.height, border: '1px solid white', backgroundColor: 'rgba(255, 255, 255, 0.2)', cursor: isDraggingViewport ? 'grabbing' : 'grab' }} />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1 bg-neutral-900/50 rounded-lg p-1">
                            <Tooltip tip={t('navigator.zoomOut', language)} position="top"><button onClick={() => setZoom(z => z / 1.2)} className="p-2 rounded-md hover:bg-neutral-700"><MinusIcon className="w-4 h-4"/></button></Tooltip>
                            <Tooltip tip={t('navigator.zoomTo100', language)} position="top"><button onClick={() => setZoom(() => 1)} className="px-2 text-xs font-mono w-12 text-center h-8 rounded-md hover:bg-neutral-700">{(zoom * 100).toFixed(0)}%</button></Tooltip>
                            <Tooltip tip={t('navigator.zoomIn', language)} position="top"><button onClick={() => setZoom(z => z * 1.2)} className="p-2 rounded-md hover:bg-neutral-700"><PlusIcon className="w-4 h-4"/></button></Tooltip>
                            <div className="w-px h-5 bg-neutral-600 mx-1"></div>
                            <Tooltip tip={t('navigator.zoomToFit', language)} position="top"><button onClick={handleZoomToFit} disabled={boardImages.length === 0} className="p-2 rounded-md hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"><FitToScreenIcon className="w-4 h-4"/></button></Tooltip>
                        </div>
                    </div>
                </div>
            ) : (
                <Tooltip tip={t('navigator.show', language)} position="left">
                    <button onClick={() => setIsOpen(true)} className="w-12 h-12 bg-neutral-800 border border-neutral-700 rounded-lg flex items-center justify-center shadow-lg hover:bg-neutral-700 transition-colors">
                        <MapIcon className="w-6 h-6"/>
                    </button>
                </Tooltip>
            )}
        </div>
    );
};
