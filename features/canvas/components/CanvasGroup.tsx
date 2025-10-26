import React, { useState, useEffect, useRef } from 'react';
import { BoardGroup } from '../../../types';
import { useCanvasStore } from '../../../store/canvasStore';

interface CanvasGroupProps {
    group: BoardGroup;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>, groupId: string) => void;
    // FIX: Corrected onContextMenu signature to match its usage.
    onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
    // FIX: Added missing isSuspended prop.
    isSuspended: boolean;
}

export const CanvasGroup: React.FC<CanvasGroupProps> = React.memo(({ group, onMouseDown, onContextMenu, isSuspended }) => {
    const { selectedGroupIds, zoom, setGroupName, editingGroupId, setEditingGroupId } = useCanvasStore();
    const [name, setName] = useState(group.name);
    const inputRef = useRef<HTMLInputElement>(null);
    const isSelected = selectedGroupIds.has(group.id);
    const isEditing = editingGroupId === group.id;

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
            // FIX: Use isSuspended prop for styling.
            className={`absolute select-none bg-white/5 border-2 ${isSuspended ? 'border-dotted pointer-events-none' : 'border-dashed'}`}
            style={{
                left: group.x,
                top: group.y,
                width: group.width,
                height: group.height,
                zIndex: group.zIndex,
                // FIX: Use isSuspended prop for styling.
                borderColor: isSelected ? 'white' : isSuspended ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)',
                cursor: 'grab'
            }}
            onMouseDown={(e) => onMouseDown(e, group.id)}
            // FIX: Corrected onContextMenu usage.
            onContextMenu={onContextMenu}
        >
            <div
                className="absolute text-white text-xs px-2 py-1 rounded-md"
                style={{
                    top: -24 / zoom,
                    left: 0,
                    transform: `scale(${1/zoom})`,
                    transformOrigin: 'top left',
                    backgroundColor: isSelected ? 'white' : 'rgba(0,0,0,0.5)',
                    color: isSelected ? 'black' : 'white',
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
                        style={{ width: `${name.length + 2}ch`, color: 'black' }}
                    />
                ) : (
                    <span>{group.name}</span>
                )}
            </div>
        </div>
    );
});
