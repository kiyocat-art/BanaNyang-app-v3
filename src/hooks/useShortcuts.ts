import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Shortcut = {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean; // For Command key on Mac
    shiftKey: boolean;
    altKey: boolean;
};

export type ShortcutAction =
    | 'alignSelection'
    | 'groupSelection'
    | 'maskingTool'
    | 'saveWorkspace'
    | 'saveWorkspaceAs'
    | 'loadWorkspace'
    | 'deleteSelection'
    | 'undoDrawing'
    | 'redoDrawing';

export const shortcutLabels: Record<ShortcutAction, string> = {
    alignSelection: '선택 항목 정렬',
    groupSelection: '선택 항목 그룹화',
    maskingTool: '마스킹 도구 열기',
    saveWorkspace: '워크스페이스 저장',
    saveWorkspaceAs: '다른 이름으로 저장',
    loadWorkspace: '워크스페이스 불러오기',
    deleteSelection: '선택 항목 삭제',
    undoDrawing: '그리기 실행 취소',
    redoDrawing: '그리기 다시 실행',
};

const defaultShortcuts: Record<ShortcutAction, Shortcut> = {
    alignSelection: { key: 'p', ctrlKey: true, metaKey: true, shiftKey: false, altKey: false },
    groupSelection: { key: 'g', ctrlKey: true, metaKey: true, shiftKey: false, altKey: false },
    maskingTool: { key: 'm', ctrlKey: true, metaKey: true, shiftKey: false, altKey: false },
    saveWorkspace: { key: 's', ctrlKey: true, metaKey: true, shiftKey: false, altKey: false },
    saveWorkspaceAs: { key: 's', ctrlKey: true, metaKey: true, shiftKey: true, altKey: false },
    loadWorkspace: { key: 'o', ctrlKey: true, metaKey: true, shiftKey: false, altKey: false },
    deleteSelection: { key: 'Delete', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false },
    undoDrawing: { key: 'z', ctrlKey: true, metaKey: true, shiftKey: false, altKey: false },
    redoDrawing: { key: 'z', ctrlKey: true, metaKey: true, shiftKey: true, altKey: false },
};

// A second key for deleteSelection (Backspace)
export const defaultShortcutsAlternate: Partial<Record<ShortcutAction, Shortcut>> = {
    deleteSelection: { key: 'Backspace', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false },
}

interface ShortcutState {
    shortcuts: Record<ShortcutAction, Shortcut>;
    setShortcut: (action: ShortcutAction, shortcut: Shortcut) => void;
    resetShortcuts: () => void;
}

export const useShortcutStore = create<ShortcutState>()(
    persist(
        (set) => ({
            shortcuts: defaultShortcuts,
            setShortcut: (action, shortcut) => set(state => ({
                shortcuts: { ...state.shortcuts, [action]: shortcut }
            })),
            resetShortcuts: () => set({ shortcuts: defaultShortcuts }),
        }),
        {
            name: 'bananang-shortcuts',
        }
    )
);

export function isShortcut(e: KeyboardEvent, action: ShortcutAction): boolean {
    const state = useShortcutStore.getState();
    const shortcut = state.shortcuts[action];
    if (!shortcut) return false;
    
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const platformCtrl = isMac ? e.metaKey : e.ctrlKey;
    const otherCtrl = isMac ? e.ctrlKey : e.metaKey;

    const checkMatch = (s: Shortcut) => {
        // For platform-specific Ctrl/Cmd
        if (s.ctrlKey || s.metaKey) {
            return platformCtrl &&
                   e.key.toLowerCase() === s.key.toLowerCase() &&
                   e.shiftKey === s.shiftKey &&
                   e.altKey === s.altKey &&
                   !otherCtrl; // Ensure the other modifier isn't pressed unless intended
        } else { // Handle shortcuts without Ctrl/Cmd (like 'Delete')
            return e.key.toLowerCase() === s.key.toLowerCase() &&
                    e.shiftKey === s.shiftKey &&
                    e.altKey === s.altKey &&
                    !e.ctrlKey && !e.metaKey;
        }
    };
    
    let match = checkMatch(shortcut);
    
    if (!match) {
        const alternate = defaultShortcutsAlternate[action];
        if (alternate) {
            match = checkMatch(alternate);
        }
    }
           
    return match;
}

export function formatShortcut(shortcut: Shortcut): string {
    const parts: string[] = [];
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    if (shortcut.ctrlKey || shortcut.metaKey) parts.push(isMac ? 'Cmd' : 'Ctrl');
    if (shortcut.altKey) parts.push(isMac ? 'Option' : 'Alt');
    if (shortcut.shiftKey) parts.push('Shift');
    
    let key = shortcut.key;
    if (key.length === 1) key = key.toUpperCase();
    else if (key.startsWith('Arrow')) key = key.replace('Arrow', '');
    
    parts.push(key);
    
    return parts.join(' + ');
}
