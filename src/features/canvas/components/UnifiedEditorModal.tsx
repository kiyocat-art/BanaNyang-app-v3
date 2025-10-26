import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { BoardImage } from '../../../types';
import { t, Language, TranslationKey } from '../../../localization';
import { Tooltip } from '../../../components/Tooltip';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { expandImage, keepBackgroundOnly, removeImageBackground, fileToBase64 } from '../../../services/geminiService';
import { ScissorsIcon, SparklesIcon, LassoIcon, PaintBrushIcon, UndoIcon, RedoIcon, TrashIcon, ResetIcon } from '../../../components/icons';

export type EditResult =
    | { type: 'newImage', dataUrl: string, width: number, height: number }
    | { type: 'update', updates: Partial<BoardImage> }
    | { type: 'generate', maskFile: File | null };

interface UnifiedEditorModalProps {
  image: BoardImage;
  onComplete: (result: EditResult) => void;
  onCancel: () => void;
  language: Language;
  onNotification: (message: string, type: 'success' | 'error') => void;
}

type EditTool = 'crop' | 'mask' | 'ai';

export const UnifiedEditorModal: React.FC<UnifiedEditorModalProps> = ({
    image, onComplete, onCancel, language, onNotification
}) => {
    const [activeTool, setActiveTool] = useState<EditTool>('crop');

    // Crop state
    const [editBox, setEditBox] = useState({ x: 0, y: 0, width: 100, height: 100 });
    
    // Mask state
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const [maskCtx, setMaskCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [isDrawingMask, setIsDrawingMask] = useState(false);
    const [maskTool, setMaskTool] = useState<'draw' | 'erase'>('draw');
    const [drawBrushSize, setDrawBrushSize] = useState(30);
    const [eraseBrushSize, setEraseBrushSize] = useState(50);
    const [maskHistory, setMaskHistory] = useState<string[]>([]);
    const [maskHistoryIndex, setMaskHistoryIndex] = useState(-1);
    
    // AI state
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [inpaintingPrompt, setInpaintingPrompt] = useState('');
    
    // Viewport state
    const [imageSize, setImageSize] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [isCursorVisible, setIsCursorVisible] = useState(false);

    const imageRef = useRef<HTMLImageElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    
    const interactionRef = useRef<{
        type: 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'pan';
        startX: number; startY: number;
        startEditBox?: typeof editBox;
        startPan?: typeof pan;
    } | null>(null);

    const currentMaskBrushSize = useMemo(() => (maskTool === 'draw' ? drawBrushSize : eraseBrushSize), [maskTool, drawBrushSize, eraseBrushSize]);
    const setCurrentMaskBrushSize = useCallback((value: React.SetStateAction<number>) => {
        if (maskTool === 'draw') setDrawBrushSize(value);
        else setEraseBrushSize(value);
    }, [maskTool]);

    // Initialize/Reset State on Image Change
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const container = viewportRef.current;
            if (!container) return;
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
            setEditBox({ x: 0, y: 0, width: width, height: height });
            setZoom(1); setPan({x: (containerRect.width - width)/2, y: (containerRect.height - height)/2});
        };
        img.src = image.src;
    }, [image.src]);

    // Mask Canvas Setup
    useEffect(() => {
        const canvas = maskCanvasRef.current;
        if (activeTool !== 'mask' || !canvas || !imageSize.naturalWidth) return;
        
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (context) {
            context.lineCap = 'round'; context.lineJoin = 'round';
            setMaskCtx(context);
            if (image.maskSrc) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    context.drawImage(img, 0, 0, canvas.width, canvas.height);
                    setMaskHistory([canvas.toDataURL()]); setMaskHistoryIndex(0);
                }
                img.src = image.maskSrc;
            } else {
                setMaskHistory([canvas.toDataURL()]); setMaskHistoryIndex(0);
            }
        }
    }, [activeTool, image.maskSrc, imageSize.naturalWidth]);
    
    useEffect(() => { if (maskCtx) { maskCtx.lineWidth = currentMaskBrushSize; maskCtx.globalCompositeOperation = maskTool === 'erase' ? 'destination-out' : 'source-over'; maskCtx.strokeStyle = 'white'; }}, [currentMaskBrushSize, maskTool, maskCtx]);

    const saveMaskState = useCallback(() => { if (!maskCanvasRef.current) return; const url = maskCanvasRef.current.toDataURL(); const newHistory = maskHistory.slice(0, maskHistoryIndex + 1); setMaskHistory([...newHistory, url]); setMaskHistoryIndex(newHistory.length); }, [maskHistory, maskHistoryIndex]);
    const handleMaskUndo = useCallback(() => { if (maskHistoryIndex > 0) { const newIndex = maskHistoryIndex - 1; setMaskHistoryIndex(newIndex); const img = new Image(); img.src = maskHistory[newIndex]; img.onload = () => { if(maskCtx) { maskCtx.clearRect(0, 0, maskCtx.canvas.width, maskCtx.canvas.height); maskCtx.drawImage(img, 0, 0); }}; } }, [maskHistory, maskHistoryIndex, maskCtx]);
    const handleMaskRedo = useCallback(() => { if (maskHistoryIndex < maskHistory.length - 1) { const newIndex = maskHistoryIndex + 1; setMaskHistoryIndex(newIndex); const img = new Image(); img.src = maskHistory[newIndex]; img.onload = () => { if(maskCtx) { maskCtx.clearRect(0, 0, maskCtx.canvas.width, maskCtx.canvas.height); maskCtx.drawImage(img, 0, 0); }}; } }, [maskHistory, maskHistoryIndex, maskCtx]);
    const clearMask = useCallback(() => { if (maskCtx) { maskCtx.clearRect(0, 0, maskCtx.canvas.width, maskCtx.canvas.height); saveMaskState(); }}, [maskCtx, saveMaskState]);
    
    const getMaskCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = e.currentTarget;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        return { x, y };
    };

    const startDrawingMask = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!maskCtx) return;
        const { x, y } = getMaskCoords(e);
        setIsDrawingMask(true);
        maskCtx.beginPath();
        maskCtx.moveTo(x, y);
    };

    const finishDrawingMask = () => {
        if (!maskCtx || !isDrawingMask) return;
        setIsDrawingMask(false);
        maskCtx.closePath();
        saveMaskState();
    };

    const drawMask = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingMask || !maskCtx) return;
        const { x, y } = getMaskCoords(e);
        maskCtx.lineTo(x, y);
        maskCtx.stroke();
    };

    const handleSimpleAiEdit = async (editFunction: (img: {data: string, mimeType: string}, signal: AbortSignal) => Promise<string>, loadingMsgKey: TranslationKey, successMsgKey: TranslationKey) => {
        setIsLoading(true); setLoadingMessage(t(loadingMsgKey, language));
        try {
            const imageBase64 = await fileToBase64(image.file);
            const resultDataUrl = await editFunction({ data: imageBase64, mimeType: image.file.type }, new AbortController().signal);
            const img = new Image();
            img.onload = () => onComplete({ type: 'newImage', dataUrl: resultDataUrl, width: img.naturalWidth, height: img.naturalHeight });
            img.src = resultDataUrl;
            onNotification(t(successMsgKey, language), 'success');
        } catch (err: any) { const errorKey = err instanceof Error ? err.message : 'error.unknown'; onNotification(t(errorKey as TranslationKey, language), 'error'); } 
        finally { setIsLoading(false); }
    };
    
    const handleApply = async () => {
        if (activeTool === 'crop') {
            if (!imageRef.current || !imageSize.naturalWidth) return;
            setIsLoading(true);
            try {
                const scaleX = imageSize.naturalWidth / imageSize.width; const scaleY = imageSize.naturalHeight / imageSize.height;
                const isExpanding = editBox.x < 0 || editBox.y < 0 || editBox.x + editBox.width > imageSize.width || editBox.y + editBox.height > imageSize.height;
                if (isExpanding) {
                    setLoadingMessage("이미지 확장 중...");
                    const expandedCanvas = document.createElement('canvas'); const newWidth = Math.round(editBox.width * scaleX); const newHeight = Math.round(editBox.height * scaleY);
                    expandedCanvas.width = newWidth; expandedCanvas.height = newHeight; const ctx = expandedCanvas.getContext('2d');
                    if (!ctx) throw new Error("Canvas context failed");
                    ctx.drawImage(imageRef.current, Math.round(-editBox.x * scaleX), Math.round(-editBox.y * scaleY), imageSize.naturalWidth, imageSize.naturalHeight);
                    const inputBase64 = expandedCanvas.toDataURL('image/png').split(',')[1];
                    const resultDataUrl = await expandImage({ data: inputBase64, mimeType: 'image/png' }, new AbortController().signal);
                    onComplete({ type: 'newImage', dataUrl: resultDataUrl, width: newWidth, height: newHeight });
                } else { // Cropping
                    const canvas = document.createElement('canvas'); canvas.width = editBox.width * scaleX; canvas.height = editBox.height * scaleY; const ctx = canvas.getContext('2d');
                    if (ctx) { ctx.drawImage(imageRef.current, editBox.x * scaleX, editBox.y * scaleY, editBox.width * scaleX, editBox.height * scaleY, 0, 0, canvas.width, canvas.height); onComplete({ type: 'newImage', dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height }); }
                }
            } catch (err: any) { const errorKey = err instanceof Error ? err.message : 'error.unknown'; onNotification(t(errorKey as TranslationKey, language), 'error'); } 
            finally { setIsLoading(false); }
        } else if (activeTool === 'mask') {
            if (!maskCanvasRef.current) return;
            maskCanvasRef.current.toBlob(blob => { if (blob) { const file = new File([blob], `${image.id}_mask.png`, { type: 'image/png' }); onComplete({ type: 'update', updates: { maskFile: file } }); } }, 'image/png');
        }
    };
    
    const handleGenerate = () => {
        if (!maskCanvasRef.current) return;
        maskCanvasRef.current.toBlob(blob => { if (blob) { const file = new File([blob], `${image.id}_mask.png`, { type: 'image/png' }); onComplete({ type: 'generate', maskFile: file }); } }, 'image/png');
    };
    
    const handleViewportMouseDown = (e: React.MouseEvent<HTMLDivElement>) => { if (e.button === 1 || (e.button === 0 && isSpacebarPressed)) { e.preventDefault(); e.stopPropagation(); interactionRef.current = { type: 'pan', startX: e.clientX, startY: e.clientY, startPan: pan }; } };
    const handleCropMouseDown = (e: React.MouseEvent<HTMLDivElement>, type: typeof interactionRef.current['type']) => { e.preventDefault(); e.stopPropagation(); interactionRef.current = { type, startX: e.clientX, startY: e.clientY, startEditBox: { ...editBox }, startPan: { ...pan } }; };
    const handleWheel = (e: React.WheelEvent) => { e.preventDefault(); const scaleAmount = 1.2; const newZoom = e.deltaY < 0 ? zoom * scaleAmount : zoom / scaleAmount; const clampedZoom = Math.max(0.2, Math.min(10, newZoom)); const rect = viewportRef.current!.getBoundingClientRect(); const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top; const newPanX = mouseX - (mouseX - pan.x) * (clampedZoom / zoom); const newPanY = mouseY - (mouseY - pan.y) * (clampedZoom / zoom); setZoom(clampedZoom); setPan({x: newPanX, y: newPanY}); };

    const handleCursorMove = (e: React.PointerEvent<HTMLDivElement>) => {
        setCursorPos({ x: e.clientX, y: e.clientY });
    };

    useEffect(() => { const handleGlobalKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onCancel(); } else if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); e.stopPropagation(); setIsSpacebarPressed(true); }}; const handleGlobalKeyUp = (e: KeyboardEvent) => { if (e.key === ' ' || e.code === 'Space') setIsSpacebarPressed(false); }; window.addEventListener('keydown', handleGlobalKeyDown, true); window.addEventListener('keyup', handleGlobalKeyUp, true); return () => { window.removeEventListener('keydown', handleGlobalKeyDown, true); window.removeEventListener('keyup', handleGlobalKeyUp, true); }; }, [onCancel]);
    useEffect(() => { const handleMouseMove = (moveEvent: MouseEvent) => { if (!interactionRef.current) return; const { startX, startY, startEditBox, startPan, type } = interactionRef.current; const dx = moveEvent.clientX - startX; const dy = moveEvent.clientY - startY; if (type === 'pan') { setPan({ x: startPan!.x + dx, y: startPan!.y + dy }); return; } const dxCanvas = dx / zoom; const dyCanvas = dy / zoom; let newEditBox = { ...startEditBox! }; if (type.includes('w')) { const newX = startEditBox!.x + dxCanvas; newEditBox.width = startEditBox!.width - (newX - startEditBox!.x); newEditBox.x = newX; } if (type.includes('e')) newEditBox.width = startEditBox!.width + dxCanvas; if (type.includes('n')) { const newY = startEditBox!.y + dyCanvas; newEditBox.height = startEditBox!.height - (newY - startEditBox!.y); newEditBox.y = newY; } if (type.includes('s')) newEditBox.height = startEditBox!.height + dyCanvas; if (type === 'move') { newEditBox.x = startEditBox!.x + dxCanvas; newEditBox.y = startEditBox!.y + dyCanvas; } if(newEditBox.width < 20 / zoom) newEditBox.width = 20 / zoom; if(newEditBox.height < 20 / zoom) newEditBox.height = 20 / zoom; setEditBox(newEditBox); }; const handleMouseUp = () => { interactionRef.current = null; }; window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); }; }, [pan, zoom]);

    const toolButtons: { tool: EditTool, icon: React.ReactNode, label: string }[] = [ { tool: 'crop', icon: <ScissorsIcon className="w-5 h-5"/>, label: "자르기/확장" }, { tool: 'mask', icon: <LassoIcon className="w-5 h-5"/>, label: "마스킹" }, { tool: 'ai', icon: <SparklesIcon className="w-5 h-5"/>, label: "AI 편집" }, ];

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]">
            {isLoading && <div className="fixed inset-0 bg-black/50 z-10 flex flex-col items-center justify-center"><LoadingSpinner/><p className="mt-4 text-white">{loadingMessage}</p></div>}
            <div className="bg-neutral-800/50 backdrop-blur-xl border border-white/10 rounded-lg max-w-7xl w-full h-[90vh] shadow-lg flex flex-col">
                <div className="flex-shrink-0 p-4 border-b border-white/10 flex items-center justify-between"><h2 className="text-xl font-bold text-zinc-100">{t('editModal.title', language)}</h2><div className="flex items-center gap-2"><button onClick={onCancel} className="px-4 py-2 font-semibold text-sm rounded-md bg-neutral-600 hover:bg-neutral-500 text-white transition-colors">{t('editModal.cancel', language)}</button>{activeTool === 'mask' ? <button onClick={handleGenerate} className="px-4 py-2 font-semibold text-sm rounded-md bg-sky-500 hover:bg-sky-400 text-white transition-colors">{t('editModal.generate', language)}</button> : null}<button onClick={handleApply} className="px-4 py-2 font-semibold text-sm rounded-md bg-white hover:bg-zinc-200 text-zinc-800 transition-colors">{t('editModal.apply', language)}</button></div></div>
                <div className="flex-grow flex min-h-0">
                    <div className="w-16 flex-shrink-0 bg-black/10 border-r border-white/10 p-2 flex flex-col items-center gap-2">{toolButtons.map(tb => <Tooltip key={tb.tool} tip={tb.label} position="right"><button onClick={() => setActiveTool(tb.tool)} className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${activeTool === tb.tool ? 'bg-white text-zinc-800' : 'text-zinc-400 hover:bg-white/10'}`}>{tb.icon}</button></Tooltip>)}</div>
                    <div 
                        ref={viewportRef} 
                        className={`relative flex-1 h-full flex items-center justify-center bg-neutral-900 overflow-hidden ${isSpacebarPressed ? 'cursor-grab' : 'cursor-default'}`} 
                        onMouseDown={handleViewportMouseDown} 
                        onWheel={handleWheel}
                        onPointerMove={handleCursorMove}
                        onPointerEnter={() => setIsCursorVisible(true)}
                        onPointerLeave={() => setIsCursorVisible(false)}
                    >
                        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'top left' }}>
                            <div className="relative" style={{ width: imageSize.width, height: imageSize.height, visibility: imageSize.width > 0 ? 'visible' : 'hidden' }}>
                                <img ref={imageRef} src={image.src} alt="Edit target" className="w-full h-full pointer-events-none" />
                                {activeTool === 'crop' && imageSize.width > 0 && <div className="absolute border-2 border-dashed border-white" style={{ left: editBox.x, top: editBox.y, width: editBox.width, height: editBox.height, boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)', cursor: 'move' }} onMouseDown={(e) => handleCropMouseDown(e, 'move')}>{[ { c: 'nw', p: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2' }, { c: 'n', p: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' }, { c: 'ne', p: 'top-0 right-0 translate-x-1/2 -translate-y-1/2' }, { c: 'e', p: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2' }, { c: 'se', p: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2' }, { c: 's', p: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' }, { c: 'sw', p: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2' }, { c: 'w', p: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2' } ].map(h => <div key={h.c} className={`absolute w-3 h-3 border-2 border-white rounded-full bg-neutral-800 cursor-${h.c}-resize ${h.p}`} style={{transform: `scale(${1/zoom}) ${h.p.includes('translate') ? 'translate(-50%, -50%)' : ''}`}} onMouseDown={(e) => handleCropMouseDown(e, h.c as any)} />)}</div>}
                                {activeTool === 'mask' && <canvas ref={maskCanvasRef} width={imageSize.naturalWidth} height={imageSize.naturalHeight} onPointerDown={startDrawingMask} onPointerUp={finishDrawingMask} onPointerMove={drawMask} onPointerLeave={finishDrawingMask} className="absolute top-0 left-0 w-full h-full cursor-none" style={{ backgroundColor: 'rgba(56, 189, 248, 0.5)' }} />}
                            </div>
                        </div>
                        {activeTool === 'mask' && isCursorVisible && (
                            <div
                                className="absolute bg-transparent border border-white rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    left: cursorPos.x - (viewportRef.current?.getBoundingClientRect().left ?? 0),
                                    top: cursorPos.y - (viewportRef.current?.getBoundingClientRect().top ?? 0),
                                    width: currentMaskBrushSize * (imageSize.width / imageSize.naturalWidth) * zoom,
                                    height: currentMaskBrushSize * (imageSize.width / imageSize.naturalWidth) * zoom,
                                }}
                            />
                        )}
                    </div>
                    <div className="w-64 flex-shrink-0 bg-black/10 border-l border-white/10 p-4 overflow-y-auto space-y-4">
                        {activeTool === 'mask' && <div className="space-y-4"> <h3 className="text-base font-semibold">마스킹 도구</h3> <div className="flex gap-2"><button onClick={() => setMaskTool('draw')} className={`flex-1 py-2 text-sm rounded-md ${maskTool === 'draw' ? 'bg-white text-zinc-800' : 'bg-white/10 hover:bg-white/20'}`}>{t('drawing.draw', language)}</button><button onClick={() => setMaskTool('erase')} className={`flex-1 py-2 text-sm rounded-md ${maskTool === 'erase' ? 'bg-white text-zinc-800' : 'bg-white/10 hover:bg-white/20'}`}>{t('drawing.erase', language)}</button></div> <div className="flex items-center gap-2"> <label className="text-sm">{t('drawing.brushSize', language)}</label> <input type="range" min="1" max="200" value={currentMaskBrushSize} onChange={e => setCurrentMaskBrushSize(Number(e.target.value))} className="w-full" /> </div> <div className="flex items-center justify-between"><button onClick={handleMaskUndo} disabled={maskHistoryIndex <= 0} className="p-2 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-50"><UndoIcon/></button><button onClick={handleMaskRedo} disabled={maskHistoryIndex >= maskHistory.length - 1} className="p-2 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-50"><RedoIcon/></button><button onClick={clearMask} className="p-2 rounded-md bg-white/10 hover:bg-white/20"><TrashIcon/></button></div> <div> <label className="text-sm">프롬프트</label> <textarea value={inpaintingPrompt} onChange={e => setInpaintingPrompt(e.target.value)} placeholder="마스크 영역에 적용할 내용을 입력하세요..." className="w-full mt-1 bg-neutral-900 border border-neutral-600 rounded-md py-2 px-3 text-sm text-zinc-200 focus:ring-1 focus:ring-white outline-none resize-y" rows={4} /> </div></div>}
                        {activeTool === 'ai' && <div className="space-y-4">
                            <h3 className="text-base font-semibold">AI 편집 도구</h3>
                            <button onClick={() => handleSimpleAiEdit(removeImageBackground, 'removeBackground.loading', 'removeBackground.complete')} className="w-full py-2 text-sm rounded-md bg-white/10 hover:bg-white/20">{t('removeBackground.button', language)}</button>
                            <button onClick={() => handleSimpleAiEdit(keepBackgroundOnly, 'editModal.keepBackgroundOnly', 'editModal.keepBackgroundOnlyComplete')} className="w-full py-2 text-sm rounded-md bg-white/10 hover:bg-white/20">{t('editModal.keepBackgroundOnly', language)}</button>
                        </div>}
                    </div>
                </div>
            </div>
        </div>
    );
};