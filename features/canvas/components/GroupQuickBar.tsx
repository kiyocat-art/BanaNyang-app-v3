import React from 'react';
import { useCanvasStore } from '../../../store/canvasStore';
import { Language, t } from '../../../localization';
import { Tooltip } from '../../../components/Tooltip';
import { BoardGroup } from '../../../types';

interface GroupQuickBarProps {
    language: Language;
    mainPanelRef: React.RefObject<HTMLElement>;
}

export const GroupQuickBar: React.FC<GroupQuickBarProps> = ({ mainPanelRef }) => {
    const { boardGroups, zoomToGroup, setSelectedGroupIds, selectedGroupIds } = useCanvasStore();

    if (boardGroups.length === 0) {
        return null;
    }

    const handleGroupClick = (group: BoardGroup) => {
        if (mainPanelRef.current) {
            zoomToGroup(group, mainPanelRef.current.getBoundingClientRect());
            setSelectedGroupIds(() => new Set([group.id]));
        }
    };

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-neutral-800/50 backdrop-blur-md border border-white/10 p-2 rounded-xl">
            {boardGroups.map(group => (
                <Tooltip key={group.id} tip={t('tooltip.goToGroup', 'ko')} position="bottom">
                    <button
                        onClick={() => handleGroupClick(group)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${selectedGroupIds.has(group.id) ? 'bg-white text-black' : 'bg-neutral-700 text-white hover:bg-neutral-600'}`}
                    >
                        {group.name}
                    </button>
                </Tooltip>
            ))}
        </div>
    );
};