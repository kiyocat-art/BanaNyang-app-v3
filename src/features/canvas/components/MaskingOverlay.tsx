import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { BoardImage } from '../../../types';
import { t, Language } from '../../../localization';
import { Tooltip } from '../../../components/Tooltip';
import { PencilIcon, TrashIcon, UndoIcon, RedoIcon } from '../../../components/icons';

interface MaskingOverlayProps {
    image: BoardImage;
    canvasRect: DOMRect;
    pan: { x: number; y: number };
    zoom: number;
    onCancel: () => void;
    onConfirm: (maskFile: File) => void;
    language: Language;
}

export const MaskingOverlay: React.FC<MaskingOverlayProps> = ({ image, canvasRect, pan, zoom, onCancel, onConfirm, language }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'draw' | 'erase'>('draw');
    const [drawBrushSize, setDrawBrushSize] = useState(30);
    const [eraseBrushSize, setEraseBrushSize] = useState(50);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    const [toolbarPos, setToolbarPos] = useState<{ x: number, y: number } | null>(null);
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [isCursorVisible, setIsCursorVisible] = useState(false);

    const currentBrushSize = useMemo(() => (tool === 'draw' ? drawBrushSize : eraseBrushSize), [tool, drawBrushSize, eraseBrushSize]);
    const setCurrentBrushSize = useCallback((value: number | ((prev: number) => number)) => {
        if (tool === 'draw') {
            setDrawBrushSize(value);
        } else {
            setEraseBrushSize(value);
        }
    }, [tool]);

    const imageScreenPos = {
        x: canvasRect.left + pan.x + image.x * zoom,
        y: canvasRect.top + pan.y + image.y * zoom,
        width: image.width * zoom,
        height: image.height * zoom,
    };
    
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = image.src;
    }, [image.src]);

    useEffect(() => {
        setToolbarPos({
            x: imageScreenPos.x + imageScreenPos.width / 2,
            y: imageScreenPos.y + imageScreenPos.height + 20,
        });
    }, [imageScreenPos.x, imageScreenPos.y, imageScreenPos.width, imageScreenPos.height]);

    const handleToolbarDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!toolbarPos) return;

        const startPos = { ...toolbarPos };
        const startMouse = { x: e.clientX, y: e.clientY };

        const handleMouseMove = (moveEvent: PointerEvent) => {
            const dx = moveEvent.clientX - startMouse.x;
            const dy = moveEvent.clientY - startMouse.y;
            setToolbarPos({ x: startPos.x + dx, y: startPos.y + dy });
        };
        const handleMouseUp = () => {
            window.removeEventListener('pointermove', handleMouseMove);
            window.removeEventListener('pointerup', handleMouseUp);
        };
        window.addEventListener('pointermove', handleMouseMove);
        window.addEventListener('pointerup', handleMouseUp);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !naturalSize.width) return;
        
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (context) {
            context.lineCap = 'round';
            context.lineJoin = 'round';
            setCtx(context);
            
            if (image.maskSrc) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    context.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const loadedState = canvas.toDataURL();
                    setHistory([loadedState]);
                    setHistoryIndex(0);
                }
                img.src = image.maskSrc;
            } else {
                setHistory([canvas.toDataURL()]);
                setHistoryIndex(0);
            }
        }
    }, [image.maskSrc, naturalSize]);
    
    useEffect(() => { 
        if (ctx) { 
            ctx.lineWidth = currentBrushSize; 
            ctx.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over'; 
            ctx.strokeStyle = 'white'; // Always draw with opaque white
        }
    }, [currentBrushSize, tool, ctx]);

    const saveState = useCallback(() => {
        if (!canvasRef.current) return;
        const url = canvasRef.current.toDataURL();
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, url]);
        setHistoryIndex(newHistory.length);
    }, [history, historyIndex]);

    const clearCanvas = useCallback(() => { if (ctx) { ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); saveState(); }}, [ctx, saveState]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1; setHistoryIndex(newIndex);
            const img = new Image(); img.src = history[newIndex];
            img.onload = () => { if(ctx) { ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.drawImage(img, 0, 0); }};
        }
    }, [history, historyIndex, ctx]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1; setHistoryIndex(newIndex);
            const img = new Image(); img.src = history[newIndex];
            img.onload = () => { if(ctx) { ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.drawImage(img, 0, 0); }};
        }
    }, [history, historyIndex, ctx]);
    
    const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = e.currentTarget;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        return { x, y };
    };

    const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!ctx) return;
        const { x, y } = getCoords(e);
        setIsDrawing(true); ctx.beginPath(); ctx.moveTo(x, y);
    };

    const finishDrawing = () => { if (!ctx || !isDrawing) return; setIsDrawing(false); ctx.closePath(); saveState(); };
    
    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => { 
        if (!isDrawing || !ctx) return;
        const { x, y } = getCoords(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const handleConfirm = () => {
        if (!canvasRef.current || !naturalSize.width) return;
    
        const finalMaskCanvas = document.createElement('canvas');
        finalMaskCanvas.width = naturalSize.width;
        finalMaskCanvas.height = naturalSize.height;
        const finalCtx = finalMaskCanvas.getContext('2d');
        
        if (finalCtx) {
            // 1. Fill the entire canvas with black. This will be the unmasked (preserved) area.
            finalCtx.fillStyle = 'black';
            finalCtx.fillRect(0, 0, naturalSize.width, naturalSize.height);
    
            // 2. Draw the user's strokes (from the transparent drawing canvas) onto the black background.
            // Since the strokes are white, this creates a final black canvas with white strokes.
            finalCtx.drawImage(canvasRef.current!, 0, 0, naturalSize.width, naturalSize.height);
    
            // 3. Convert to a blob and confirm.
            finalMaskCanvas.toBlob(blob => {
                if (blob) {
                    const file = new File([blob], `${image.id}_mask.png`, { type: 'image/png' });
                    onConfirm(file);
                }
            }, 'image/png');
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { 
                e.preventDefault();
                handleUndo();
            } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') { 
                e.preventDefault();
                handleRedo();
            } else {
                switch (e.key.toLowerCase()) {
                    case 'escape':
                        e.stopPropagation();
                        onCancel();
                        break;
                    case 'b':
                        e.preventDefault();
                        setTool('draw');
                        break;
                    case 'e':
                        e.preventDefault();
                        setTool('erase');
                        break;
                    case 'c':
                        e.preventDefault();
                        setCurrentBrushSize(prev => Math.min(200, prev + 5));
                        break;
                    case 'x':
                        e.preventDefault();
                        setCurrentBrushSize(prev => Math.max(1, prev - 5));
                        break;
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel, setCurrentBrushSize, handleUndo, handleRedo]);

    const handleCursorMove = (e: React.PointerEvent<HTMLDivElement>) => {
        setCursorPos({ x: e.clientX, y: e.clientY });
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[120]" 
             onContextMenu={(e) => e.preventDefault()}
             onPointerMove={handleCursorMove}
             onPointerEnter={() => setIsCursorVisible(true)}
             onPointerLeave={() => setIsCursorVisible(false)}
        > 
            <div className="absolute" style={{
                left: imageScreenPos.x, top: imageScreenPos.y,
                width: imageScreenPos.width, height: imageScreenPos.height,
            }}>
                <img src={image.src} alt="Masking target" className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                <canvas
                    ref={canvasRef}
                    width={naturalSize.width || 1}
                    height={naturalSize.height || 1}
                    onPointerDown={startDrawing} onPointerUp={finishDrawing}
                    onPointerMove={draw} onPointerLeave={finishDrawing}
                    className="absolute top-0 left-0 w-full h-full cursor-none"
                    style={{ 
                        maskImage: `url(${image.src})`,
                        WebkitMaskImage: `url(${image.src})`,
                        maskSize: '100% 100%', WebkitMaskSize: '100% 100%',
                        maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                        maskPosition: 'center', WebkitMaskPosition: 'center',
                        backgroundColor: 'rgba(56, 189, 248, 0.5)',
                    }}
                />
            </div>
             {isCursorVisible && (
                <div
                    className="absolute bg-transparent border border-white rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
                    style={{
                        left: cursorPos.x,
                        top: cursorPos.y,
                        width: currentBrushSize * (naturalSize.width ? imageScreenPos.width / naturalSize.width : 0),
                        height: currentBrushSize * (naturalSize.width ? imageScreenPos.width / naturalSize.width : 0),
                    }}
                />
            )}
            {toolbarPos && (
                <div
                    className="absolute flex items-center gap-4 bg-zinc-800 border border-zinc-700 p-2 rounded-lg shadow-2xl"
                    style={{
                        left: toolbarPos.x,
                        top: toolbarPos.y,
                        transform: 'translateX(-50%)',
                    }}
                >
                    <div
                        onPointerDown={handleToolbarDrag}
                        className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-4 cursor-grab active:cursor-grabbing flex justify-center items-start pt-1"
                    >
                        <div className="w-8 h-1.5 bg-zinc-600 rounded-full"></div>
                    </div>
                    <div className="flex gap-1 bg-zinc-700 p-1 rounded-md">
                        <Tooltip tip={t('drawing.draw', language)} position="top"><button onClick={() => setTool('draw')} className={`p-2 rounded-md ${tool === 'draw' ? 'bg-white text-zinc-800' : 'hover:bg-zinc-600 text-zinc-300'}`}><PencilIcon className="w-5 h-5"/></button></Tooltip>
                        <Tooltip tip={t('drawing.erase', language)} position="top"><button onClick={() => setTool('erase')} className={`p-2 rounded-md ${tool === 'erase' ? 'bg-white text-zinc-800' : 'hover:bg-zinc-600 text-zinc-300'}`}><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button></Tooltip>
                    </div>
                    <Tooltip tip={`${t('drawing.decreaseBrush', language)} (X) / ${t('drawing.increaseBrush', language)} (C)`} position="top">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-zinc-300">{t('drawing.brushSize', language)}</label>
                            <input type="range" min="1" max="200" value={currentBrushSize} onChange={e => setCurrentBrushSize(Number(e.target.value))} className="w-32" />
                        </div>
                    </Tooltip>
                     <div className="flex gap-1 bg-zinc-700 p-1 rounded-md">
                        <Tooltip tip={t('drawing.undo', language)} position="top"><button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-md hover:bg-zinc-600 text-zinc-300 disabled:opacity-50"><UndoIcon/></button></Tooltip>
                        <Tooltip tip={t('drawing.redo', language)} position="top"><button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-md hover:bg-zinc-600 text-zinc-300 disabled:opacity-50"><RedoIcon/></button></Tooltip>
                        <Tooltip tip={`${t('drawing.clear', language)}`} position="top"><button onClick={clearCanvas} className="p-2 rounded-md hover:bg-zinc-600 text-zinc-300"><TrashIcon/></button></Tooltip>
                    </div>
                    <div className="w-px h-8 bg-zinc-700 mx-2"></div>
                    <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold rounded-md bg-zinc-600 hover:bg-zinc-500 text-white">{t('editModal.cancel', language)}</button>
                    <button onClick={handleConfirm} className="px-4 py-2 text-sm font-semibold rounded-md bg-white hover:bg-zinc-200 text-zinc-800">{t('editModal.apply', language)}</button>
                </div>
            )}
        </div>
    );
};