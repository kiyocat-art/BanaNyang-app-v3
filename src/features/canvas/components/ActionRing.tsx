import React from 'react';
import { BoardImage } from '../../../types';
import { t, Language } from '../../../localization';
import { Tooltip } from '../../../components/Tooltip';
import { useCanvasStore, REF_COLORS } from '../../../store/canvasStore';
import {
  DownloadIcon, MagnifyIcon, BodyIcon, TrashIcon,
  ScissorsIcon, LandscapeIcon, PaintBrushIcon,
} from '../../../components/icons';

interface ActionRingProps {
    onEdit: (imageId: string) => void;
    onZoom: (media: File | string | null) => void;
    onDelete: () => void;
    onDownload: () => void;
    language: Language;
}

export const ActionRing: React.FC<ActionRingProps> = ({ onEdit, onZoom, onDelete, onDownload, language }) => {
    const { boardImages, selectedImageIds, setRoleForSelection } = useCanvasStore();

    const selectedImageId = selectedImageIds.size === 1 ? Array.from(selectedImageIds)[0] : null;
    const selectedImage = selectedImageId ? boardImages.find(img => img.id === selectedImageId) : null;
    
    if (!selectedImage) return null;

    const handleZoomClick = () => {
        if (selectedImage) {
            onZoom(selectedImage.src);
        }
    };

    const roleButtons = [
        { key: 'original', role: 'original', content: '원본', tooltip: '원본 이미지로 설정' },
        { key: 'reference', role: 'reference', content: '참조', tooltip: '참조 이미지로 설정' },
        { key: 'pose', role: 'pose', icon: <BodyIcon className="w-4 h-4" />, tooltip: '포즈 참조로 설정' },
        { key: 'background', role: 'background', icon: <LandscapeIcon className="w-4 h-4" />, tooltip: '배경 이미지로 설정' },
    ];

    const actionButtons = [
        { key: 'zoom', onClick: handleZoomClick, icon: <MagnifyIcon className="w-5 h-5" />, tooltip: '확대' },
        { key: 'edit', onClick: () => onEdit(selectedImage.id), icon: <PaintBrushIcon className="w-5 h-5" />, tooltip: t('tooltip.edit', language) },
    ];

    const destructiveButtons = [
        { key: 'download', onClick: onDownload, icon: <DownloadIcon className="w-5 h-5" />, tooltip: t('tooltip.downloadSelected', language, {count: 1}) },
        { key: 'delete', onClick: onDelete, icon: <TrashIcon className="w-5 h-5" />, tooltip: '삭제' },
    ];
    
    return (
        <div className="flex items-center gap-1 bg-neutral-800/80 backdrop-blur-md border border-white/10 p-1 rounded-lg shadow-2xl">
            <div className="flex items-center gap-1">
                {roleButtons.map(btn => {
                    const isActive = selectedImage.role === btn.role;
                    let activeStyle: React.CSSProperties = {};
                    let activeClass = '';

                    if (isActive) {
                        let color = '';
                        const { role, refIndex } = selectedImage;
                        if (role === 'original') color = '#22c55e';
                        else if (role === 'background') color = '#a855f7';
                        else if (role === 'pose') color = '#f59e0b';
                        else if (role === 'reference' && refIndex !== undefined) color = REF_COLORS[refIndex % REF_COLORS.length];
                        
                        if (color) {
                            activeStyle = { backgroundColor: color };
                            activeClass = 'text-white';
                        }
                    }
                    
                    return (
                        <Tooltip key={btn.key} tip={btn.tooltip} position="bottom">
                            <button
                                onClick={() => setRoleForSelection(btn.role as BoardImage['role'])}
                                className={`px-3 h-8 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1 ${isActive ? activeClass : 'text-zinc-300 bg-neutral-700 hover:bg-neutral-600'}`}
                                style={activeStyle}
                            >
                                {btn.icon}{btn.content}
                            </button>
                        </Tooltip>
                    );
                })}
            </div>
            <div className="w-px h-5 bg-neutral-600 mx-1"></div>
            <div className="flex items-center gap-1">
                {actionButtons.map(btn => (
                    <Tooltip key={btn.key} tip={btn.tooltip} position="bottom">
                        <button onClick={btn.onClick} className="w-8 h-8 flex items-center justify-center text-zinc-300 bg-neutral-700 hover:bg-neutral-600 rounded-md transition-colors">
                            {btn.icon}
                        </button>
                    </Tooltip>
                ))}
            </div>
            <div className="w-px h-5 bg-neutral-600 mx-1"></div>
            <div className="flex items-center gap-1">
                {destructiveButtons.map(btn => (
                    <Tooltip key={btn.key} tip={btn.tooltip} position="bottom">
                        <button onClick={btn.onClick} className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${btn.key === 'delete' ? 'text-red-400 hover:bg-red-500/20' : 'text-zinc-300 hover:bg-neutral-600'} bg-neutral-700`}>
                            {btn.icon}
                        </button>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
}
