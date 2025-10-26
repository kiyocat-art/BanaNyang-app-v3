import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BoardImage } from '../types';
import { t, Language, TranslationKey } from '../localization';
import { Tooltip } from './Tooltip';
import { LoadingSpinner } from './LoadingSpinner';
import { expandImage, keepBackgroundOnly, removeImageBackground, fileToBase64 } from '../services/geminiService';
import { ScissorsIcon, HandIcon, MagnifyIcon } from './icons';

interface ImageEditorModalProps {
  image: BoardImage;
  onComplete: (dataUrl: string, width: number, height: number) => void;
  onCancel: () => void;
  language: Language;
  onNotification: (message: string, type: 'success' | 'error') => void;
}

type EditMode = 'idle' | 'remove-bg' | 'keep-bg' | 'expand';

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ 
    image, onComplete, onCancel, language, onNotification 
}) => {
    const [editBox, setEditBox] = useState({ x: 0, y: 0, width: 100, height: 100 });
    const [imageSize, setImageSize] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });
    const [mode, setMode] = useState<EditMode>('idle');
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);
    
    const imageRef = useRef<HTMLImageElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const interactionRef = useRef<{
        type: 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'pan';
        startX: number;
        startY: number;
        startEditBox?: typeof editBox;
        startPan?: typeof pan;
    } | null>(null);

    const handleApply = useCallback(async () => {
        if (!imageRef.current || !imageSize.naturalWidth) return;
        const scaleX = imageSize.naturalWidth / imageSize.width;
        const scaleY = imageSize.naturalHeight / imageSize.height;

        const isExpanding = editBox.x < 0 || editBox.y < 0 ||
                             editBox.x + editBox.width > imageSize.width ||
                             editBox.y + editBox.height > imageSize.height;

        if (isExpanding) {
            setMode('expand');
            try {
                const expandedCanvas = document.createElement('canvas');
                const newWidth = Math.round(editBox.width * scaleX);
                const newHeight = Math.round(editBox.height * scaleY);
                expandedCanvas.width = newWidth;
                expandedCanvas.height = newHeight;
                const ctx = expandedCanvas.getContext('2d');
                if (!ctx) throw new Error("Canvas context failed");
                
                const imageDrawX = Math.round(-editBox.x * scaleX);
                const imageDrawY = Math.round(-editBox.y * scaleY);

                ctx.drawImage(imageRef.current, imageDrawX, imageDrawY, imageSize.naturalWidth, imageSize.naturalHeight);
                
                const inputBase64 = expandedCanvas.toDataURL('image/png').split(',')[1];
                const resultDataUrl = await expandImage({ data: inputBase64, mimeType: 'image/png' }, new AbortController().signal);
                onComplete(resultDataUrl, newWidth, newHeight);

            } catch (err: any) {
                const errorKey = err instanceof Error ? err.message : 'error.unknown';
                onNotification(t(errorKey as TranslationKey, language), 'error');
            } finally {
                setMode('idle');
            }

        } else { // Cropping
            const sourceX = editBox.x * scaleX;
            const sourceY = editBox.y * scaleY;
            const sourceWidth = editBox.width * scaleX;
            const sourceHeight = editBox.height * scaleY;

            const canvas = document.createElement('canvas');
            canvas.width = sourceWidth;
            canvas.height = sourceHeight;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.drawImage(
                    imageRef.current,
                    sourceX, sourceY, sourceWidth, sourceHeight,
                    0, 0, sourceWidth, sourceHeight
                );
                onComplete(canvas.toDataURL('image/png'), sourceWidth, sourceHeight);
            }
        }
    }, [editBox, imageSize, onComplete, onNotification, language]);

    const handleSimpleEdit = async (editFunction: (img: {data: string, mimeType: string}, signal: AbortSignal) => Promise<string>, loadingMode: EditMode, successMessage: TranslationKey) => {
        setMode(loadingMode);
        try {
            const imageBase64 = await fileToBase64(image.file);
            const resultDataUrl = await editFunction({ data: imageBase64, mimeType: image.file.type }, new AbortController().signal);
            
            const img = new Image();
            img.onload = () => onComplete(resultDataUrl, img.naturalWidth, img.naturalHeight);
            img.src = resultDataUrl;

            onNotification(t(successMessage, language), 'success');
        } catch (err: any) {
             const errorKey = err instanceof Error ? err.message : 'error.unknown';
            onNotification(t(errorKey as TranslationKey, language), 'error');
        } finally {
            setMode('idle');
        }
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onCancel();
            } else if (e.key === 'Enter') {
                e.stopPropagation();
                handleApply();
            } else if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                e.stopPropagation();
                setIsSpacebarPressed(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === ' ' || e.code === 'Space') {
                e.stopPropagation();
                setIsSpacebarPressed(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);
        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
        };
    }, [onCancel, handleApply]);

    useEffect(() => {
        const img = imageRef.current;
        const container = viewportRef.current;
        if (!img || !container) return;
    
        const calculateSizes = () => {
            if (!img.naturalWidth || !img.naturalHeight) return;
            const containerRect = container.getBoundingClientRect();
            const imageAspectRatio = img.naturalWidth / img.naturalHeight;
            const containerAspectRatio = containerRect.width / containerRect.height;
            
            let width, height;
            if (imageAspectRatio > containerAspectRatio) {
                width = containerRect.width;
                height = width / imageAspectRatio;
            } else {
                height = containerRect.height;
                width = height * imageAspectRatio;
            }
            
            setImageSize({ width, height, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
            const initialCropSize = Math.min(width, height) * 0.8;
            setEditBox({ x: (width - initialCropSize) / 2, y: (height - initialCropSize) / 2, width: initialCropSize, height: initialCropSize });
        };
    
        img.onload = calculateSizes;
        img.src = image.src;
        if (img.complete && img.naturalWidth > 0) calculateSizes();

        setZoom(1);
        setPan({x: 0, y: 0});
        
        return () => { img.onload = null; };
    }, [image.src]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, type: typeof interactionRef.current['type']) => {
        e.preventDefault(); e.stopPropagation();
        
        interactionRef.current = { type, startX: e.clientX, startY: e.clientY, startEditBox: { ...editBox }, startPan: { ...pan } };
        
        const viewport = viewportRef.current;
        if (type === 'pan' && viewport) viewport.classList.add('cursor-grabbing');

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!interactionRef.current) return;
            const { startX, startY, startEditBox, startPan, type } = interactionRef.current;
            const dx = (moveEvent.clientX - startX);
            const dy = (moveEvent.clientY - startY);

            if (type === 'pan') {
                setPan({ x: startPan!.x + dx, y: startPan!.y + dy });
                return;
            }

            const dxCanvas = dx / zoom;
            const dyCanvas = dy / zoom;

            let newEditBox = { ...startEditBox! };

            if (type.includes('w')) {
                const newX = startEditBox!.x + dxCanvas;
                newEditBox.width = startEditBox!.width - (newX - startEditBox!.x);
                newEditBox.x = newX;
            }
            if (type.includes('e')) newEditBox.width = startEditBox!.width + dxCanvas;
            if (type.includes('n')) {
                const newY = startEditBox!.y + dyCanvas;
                newEditBox.height = startEditBox!.height - (newY - startEditBox!.y);
                newEditBox.y = newY;
            }
            if (type.includes('s')) newEditBox.height = startEditBox!.height + dyCanvas;
            if (type === 'move') {
                newEditBox.x = startEditBox!.x + dxCanvas;
                newEditBox.y = startEditBox!.y + dyCanvas;
            }
            if(newEditBox.width < 20 / zoom) newEditBox.width = 20 / zoom;
            if(newEditBox.height < 20 / zoom) newEditBox.height = 20 / zoom;

            setEditBox(newEditBox);
        };

        const handleMouseUp = () => {
            if(interactionRef.current?.type === 'pan' && viewport) viewport.classList.remove('cursor-grabbing');
            interactionRef.current = null;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [editBox, pan, zoom]);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const scaleAmount = 1.4; // Faster zoom
        const newZoom = e.deltaY < 0 ? zoom * scaleAmount : zoom / scaleAmount;
        const clampedZoom = Math.max(0.2, Math.min(10, newZoom));
        
        const rect = viewportRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newPanX = mouseX - (mouseX - pan.x) * (clampedZoom / zoom);
        const newPanY = mouseY - (mouseY - pan.y) * (clampedZoom / zoom);

        setZoom(clampedZoom);
        setPan({x: newPanX, y: newPanY});
    };

    const handleViewportMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button === 1 || (e.button === 0 && isSpacebarPressed)) {
            handleMouseDown(e, 'pan');
        }
    };
    
    const cursorClass = isSpacebarPressed ? 'cursor-grab' : 'cursor-default';

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]">
            <div className="bg-neutral-800/50 backdrop-blur-xl border border-white/10 rounded-lg p-6 max-w-5xl w-full shadow-lg flex flex-col gap-4">
                <h2 className="text-xl font-bold text-zinc-100">{t('editModal.title', language)}</h2>
                <div className="flex gap-4 h-[60vh]">
                    <div 
                        ref={viewportRef} 
                        className={`relative w-full h-full flex items-center justify-center bg-neutral-900 rounded-md overflow-hidden ${cursorClass}`} 
                        onMouseDown={handleViewportMouseDown}
                        onWheel={handleWheel}
                    >
                        <div className="absolute" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'top left' }}>
                            <div className="relative" style={{ width: imageSize.width, height: imageSize.height, visibility: imageSize.width > 0 ? 'visible' : 'hidden' }}>
                                <img ref={imageRef} alt="Edit target" className="w-full h-full pointer-events-none" />
                                {imageSize.width > 0 && (
                                    <div
                                        className="absolute border-2 border-dashed border-white"
                                        style={{
                                            left: editBox.x, top: editBox.y, width: editBox.width, height: editBox.height,
                                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)', cursor: 'move',
                                        }}
                                        onMouseDown={(e) => handleMouseDown(e, 'move')}
                                    >
                                        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-2 border-white rounded-full bg-neutral-800 cursor-nw-resize" style={{transform: `scale(${1/zoom})`}} onMouseDown={(e) => handleMouseDown(e, 'nw')} />
                                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 border-2 border-white rounded-full bg-neutral-800 cursor-n-resize" style={{transform: `scale(${1/zoom})`}} onMouseDown={(e) => handleMouseDown(e, 'n')} />
                                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-2 border-white rounded-full bg-neutral-800 cursor-ne-resize" style={{transform: `scale(${1/zoom})`}} onMouseDown={(e) => handleMouseDown(e, 'ne')} />
                                        <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 border-2 border-white rounded-full bg-neutral-800 cursor-e-resize" style={{transform: `scale(${1/zoom})`}} onMouseDown={(e) => handleMouseDown(e, 'e')} />
                                        <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-2 border-white rounded-full bg-neutral-800 cursor-se-resize" style={{transform: `scale(${1/zoom})`}} onMouseDown={(e) => handleMouseDown(e, 'se')} />
                                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 border-2 border-white rounded-full bg-neutral-800 cursor-s-resize" style={{transform: `scale(${1/zoom})`}} onMouseDown={(e) => handleMouseDown(e, 's')} />
                                        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-2 border-white rounded-full bg-neutral-800 cursor-sw-resize" style={{transform: `scale(${1/zoom})`}} onMouseDown={(e) => handleMouseDown(e, 'sw')} />
                                        <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 border-2 border-white rounded-full bg-neutral-800 cursor-w-resize" style={{transform: `scale(${1/zoom})`}} onMouseDown={(e) => handleMouseDown(e, 'w')} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <Tooltip tip={t('removeBackground.tooltip', language)} position="top">
                            <button onClick={() => handleSimpleEdit(removeImageBackground, 'remove-bg', 'removeBackground.complete')} disabled={mode !== 'idle'} className="px-3 py-2 text-sm font-semibold rounded-md bg-sky-600 hover:bg-sky-500 text-white transition-colors disabled:bg-sky-800 disabled:cursor-wait flex items-center gap-2">
                                {mode === 'remove-bg' ? <LoadingSpinner className="h-5 w-5" /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" /></svg>}
                                <span>{t('removeBackground.button', language)}</span>
                            </button>
                        </Tooltip>
                        <Tooltip tip={t('editModal.keepBackgroundOnlyTooltip', language)} position="top">
                             <button onClick={() => handleSimpleEdit(keepBackgroundOnly, 'keep-bg', 'editModal.keepBackgroundOnlyComplete')} disabled={mode !== 'idle'} className="px-3 py-2 text-sm font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:bg-emerald-800 disabled:cursor-wait flex items-center gap-2">
                                {mode === 'keep-bg' ? <LoadingSpinner className="h-5 w-5" /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6 7.5 6 9c0 1.5.512 3.27 1.244 3.679.537.299 1.135.425 1.756.425H13a1 1 0 100-2h-1.014a1 1 0 00-1-1H10a1 1 0 00-1-1H6c0-1.5.512-3.27 1.244-3.679.537-.299 1.135-.425 1.756-.425H13a1 1 0 100-2h-2.986c-.621 0-1.219.126-1.756.425a6.012 6.012 0 01-2.706-1.912c0 .006-.007.011-.01.016z" clipRule="evenodd" /></svg>}
                                <span>{t('editModal.keepBackgroundOnly', language)}</span>
                            </button>
                        </Tooltip>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onCancel} className="px-6 py-2 font-semibold rounded-md bg-neutral-600 hover:bg-neutral-500 text-white transition-colors">
                            {t('editModal.cancel', language)}
                        </button>
                        <button onClick={handleApply} disabled={mode !== 'idle'} className="px-6 py-2 font-semibold rounded-md bg-white hover:bg-zinc-200 text-zinc-800 transition-colors disabled:bg-zinc-300 disabled:cursor-wait flex items-center gap-2">
                           {mode === 'expand' ? <LoadingSpinner className="h-5 w-5" /> : null}
                           <span>{t('editModal.apply', language)}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
