import React from 'react';
import { Tooltip } from './Tooltip';

export const Section: React.FC<{ title?: string; children: React.ReactNode; className?: string; tooltipText?: string; topRightAction?: React.ReactNode; icon?: React.ReactNode; }> = ({ title, children, className, tooltipText, topRightAction: TopRightAction, icon }) => (
  <div className={`bg-neutral-800/50 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg flex flex-col ${className}`}>
    {title && (
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
              {icon && <div className="text-zinc-400">{icon}</div>}
              <Tooltip tip={tooltipText || ''}>
                  <h2 className="text-base font-bold text-zinc-100">{title}</h2>
              </Tooltip>
          </div>
          {TopRightAction && <div>{TopRightAction}</div>}
      </div>
    )}
    <div className={`flex flex-col flex-grow min-h-0 p-4`}>
        {children}
    </div>
  </div>
);