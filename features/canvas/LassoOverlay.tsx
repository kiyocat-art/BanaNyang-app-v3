import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BoardImage } from '../../types';
import { t, Language } from '../../localization';
import { Tooltip } from '../../components/Tooltip';
import { PencilIcon, TrashIcon, UndoIcon, RedoIcon } from '../../components/icons';

interface LassoOverlayProps {
    image: BoardImage;
    canvasRect: DOMRect;
    pan: { x: number; y: number };
    zoom: number;
    onCancel: () => void;
    onConfirm: (maskFile: File) => void;
    language: Language;
}

export const LassoOverlay: React.FC<LassoOverlayProps> = ({ image, canvasRect, pan, zoom, onCancel, onConfirm, language }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'draw' | 'erase'>('draw');
    const [brushSize, setBrushSize] = useState(30);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const imageScreenPos = {
        x: canvasRect.left + pan.x + image.x * zoom,
        y: canvasRect.top + pan.y + image.y * zoom,
        width: image.width * zoom,
        height: image.height * zoom,
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (context) {
            context.lineCap = 'round';
            context.lineJoin = 'round';
            setCtx(context);
            
            const initialHistory = [canvas.toDataURL()];
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
                setHistory(initialHistory);
                setHistoryIndex(0);
            }
        }
    }, [image.maskSrc]);
    
    useEffect(() => { 
        if (ctx) { 
            ctx.lineWidth = brushSize; 
            ctx.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over'; 
            ctx.strokeStyle = '#FFFFFF'; 
        }
    }, [brushSize, tool, ctx]);

    const saveState = useCallback(() => {
        if (!canvasRef.current) return;
        const url = canvasRef.current.toDataURL();
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, url]);
        setHistoryIndex(newHistory.length);
    }, [history, historyIndex]);

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

    const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!ctx) return;
        const { offsetX, offsetY } = e.nativeEvent;
        setIsDrawing(true); ctx.beginPath(); ctx.moveTo(offsetX, offsetY);
    };

    const finishDrawing = () => { if (!ctx || !isDrawing) return; setIsDrawing(false); ctx.closePath(); saveState(); };
    
    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => { if (!isDrawing || !ctx) return; const { offsetX, offsetY } = e.nativeEvent; ctx.lineTo(offsetX, offsetY); ctx.stroke(); };

    const clearCanvas = () => { if (ctx) { ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); saveState(); }};

    const handleConfirm = () => {
        if (!canvasRef.current) return;
        const originalImageEl = new Image();
        originalImageEl.onload = () => {
            const finalMaskCanvas = document.createElement('canvas');
            finalMaskCanvas.width = originalImageEl.naturalWidth;
            finalMaskCanvas.height = originalImageEl.naturalHeight;
            const finalCtx = finalMaskCanvas.getContext('2d');
            if (finalCtx) {
                finalCtx.drawImage(canvasRef.current!, 0, 0, originalImageEl.naturalWidth, originalImageEl.naturalHeight);
                finalMaskCanvas.toBlob(blob => {
                    if (blob) {
                        const file = new File([blob], `${image.id}_mask.png`, { type: 'image/png' });
                        onConfirm(file);
                    }
                }, 'image/png');
            }
        };
        originalImageEl.src = image.src;
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);


    return (
        <div className="fixed inset-0 z-[120]" onContextMenu={(e) => e.preventDefault()}> 
            <div className="absolute" style={{
                left: imageScreenPos.x, top: imageScreenPos.y,
                width: imageScreenPos.width, height: imageScreenPos.height,
            }}>
                <canvas
                    ref={canvasRef}
                    width={imageScreenPos.width}
                    height={imageScreenPos.height}
                    onPointerDown={startDrawing} onPointerUp={finishDrawing}
                    onPointerMove={draw} onPointerLeave={finishDrawing}
                    className="w-full h-full cursor-crosshair"
                    style={{ 
                        maskImage: `url(${image.src})`,
                        WebkitMaskImage: `url(${image.src})`,
                        maskSize: '100% 100%', WebkitMaskSize: '100% 100%',
                        backgroundColor: 'rgba(56, 189, 248, 0.5)'
                    }}
                />
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-800 border border-zinc-700 p-2 rounded-lg shadow-2xl">
                <div className="flex gap-1 bg-zinc-700 p-1 rounded-md">
                    <Tooltip tip={t('drawing.draw', language)} position="top"><button onClick={() => setTool('draw')} className={`p-2 rounded-md ${tool === 'draw' ? 'bg-white text-zinc-800' : 'hover:bg-zinc-600 text-zinc-300'}`}><PencilIcon className="w-5 h-5"/></button></Tooltip>
                    <Tooltip tip={t('drawing.erase', language)} position="top"><button onClick={() => setTool('erase')} className={`p-2 rounded-md ${tool === 'erase' ? 'bg-white text-zinc-800' : 'hover:bg-zinc-600 text-zinc-300'}`}><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button></Tooltip>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-zinc-300">{t('drawing.brushSize', language)}</label>
                    <input type="range" min="1" max="100" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-32" />
                </div>
                 <div className="flex gap-1 bg-zinc-700 p-1 rounded-md">
                    <Tooltip tip={t('drawing.undo', language)} position="top"><button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-md hover:bg-zinc-600 text-zinc-300 disabled:opacity-50"><UndoIcon/></button></Tooltip>
                    <Tooltip tip={t('drawing.redo', language)} position="top"><button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-md hover:bg-zinc-600 text-zinc-300 disabled:opacity-50"><RedoIcon/></button></Tooltip>
                    <Tooltip tip={t('drawing.clear', language)} position="top"><button onClick={clearCanvas} className="p-2 rounded-md hover:bg-zinc-600 text-zinc-300"><TrashIcon/></button></Tooltip>
                </div>
                <div className="w-px h-8 bg-zinc-700 mx-2"></div>
                <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold rounded-md bg-zinc-600 hover:bg-zinc-500 text-white">{t('editModal.cancel', language)}</button>
                <button onClick={handleConfirm} className="px-4 py-2 text-sm font-semibold rounded-md bg-white hover:bg-zinc-200 text-zinc-800">{t('editModal.apply', language)}</button>
            </div>
        </div>
    );
};