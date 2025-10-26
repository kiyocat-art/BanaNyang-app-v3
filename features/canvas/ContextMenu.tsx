import React, { useEffect, useRef } from 'react';

export type ContextMenuItem = {
    label: string;
    onClick: () => void;
    disabled?: boolean;
} | { type: 'separator' };

export interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div ref={menuRef} className="fixed z-[150] bg-zinc-800 border border-zinc-700 rounded-md shadow-lg text-sm" style={{ top: y, left: x }}>
            <ul className="py-1">
                {items.map((item, index) => {
                    // FIX: Use a type guard to correctly narrow the type of `item` before accessing its properties.
                    if ('label' in item) {
                        return (
                            <li key={index}>
                                <button
                                    onClick={() => { item.onClick(); onClose(); }}
                                    disabled={item.disabled}
                                    className="w-full text-left px-4 py-1.5 text-zinc-200 hover:bg-white hover:text-zinc-800 disabled:text-zinc-500 disabled:bg-transparent"
                                >
                                    {item.label}
                                </button>
                            </li>
                        );
                    } else {
                        return <li key={index} className="h-px bg-neutral-700 my-1" />;
                    }
                })}
            </ul>
        </div>
    );
};
