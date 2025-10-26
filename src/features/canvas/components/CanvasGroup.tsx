import React, { useState, useEffect, useRef } from 'react';
import { BoardGroup } from '../../../types';
import { useCanvasStore } from '../../../store/canvasStore';

interface CanvasGroupProps {
    group: BoardGroup;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>, groupId: string) => void;
    onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
    isSuspended: boolean;
    onDoubleClick: (groupId: string) => void;
}

export const CanvasGroup: React.FC<CanvasGroupProps> = React.memo(({ group, onMouseDown, onContextMenu, isSuspended, onDoubleClick }) => {
    const { selectedGroupIds, zoom, setGroupName, editingGroupId, setEditingGroupId, groupEditModeId } = useCanvasStore();
    const [name, setName] = useState(group.name);
    const inputRef = useRef<HTMLInputElement>(null);
    const isSelected = selectedGroupIds.has(group.id);
    const isEditing = editingGroupId === group.id;
    const isInEditMode = groupEditModeId === group.id;

    const handleNameDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingGroupId(group.id);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value);
    
    const handleNameBlur = () => {
        setGroupName(group.id, name);
        setEditingGroupId(null);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleNameBlur();
        } else if (e.key === 'Escape') {
            setName(group.name);
            setEditingGroupId(null);
        }
    };
    
    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);
    
    useEffect(() => {
        setName(group.name);
    }, [group.name]);

    return (
        <div
            className={`absolute select-none bg-white/5 border-2 ${isSuspended ? 'border-dotted' : (isInEditMode ? 'border-solid' : 'border-dashed')} ${isInEditMode ? 'pointer-events-none' : ''}`}
            style={{
                left: group.x,
                top: group.y,
                width: group.width,
                height: group.height,
                zIndex: group.zIndex,
                borderColor: isInEditMode ? '#0ea5e9' : (isSelected ? 'white' : 'rgba(255, 255, 255, 0.2)'),
                boxShadow: isInEditMode ? `0 0 ${12 / zoom}px #0ea5e950` : 'none',
                cursor: isInEditMode ? 'default' : 'grab',
            }}
            onMouseDown={(e) => { if (!isInEditMode) onMouseDown(e, group.id); }}
            onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(group.id); }}
            onContextMenu={onContextMenu}
        >
            <div
                className="absolute text-white text-xs px-2 py-1 rounded-md pointer-events-auto"
                style={{
                    top: -24 / zoom,
                    left: 0,
                    transform: `scale(${1/zoom})`,
                    transformOrigin: 'top left',
                    backgroundColor: isSelected || isInEditMode ? '#0ea5e9' : 'rgba(0,0,0,0.5)',
                    color: 'white',
                }}
                onDoubleClick={handleNameDoubleClick}
            >
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={handleNameChange}
                        onBlur={handleNameBlur}
                        onKeyDown={handleNameKeyDown}
                        onClick={e => e.stopPropagation()}
                        className="bg-transparent outline-none border-none p-0"
                        style={{ width: `${name.length + 2}ch`, color: 'white' }}
                    />
                ) : (
                    <span>{group.name}</span>
                )}
            </div>
        </div>
    );
});