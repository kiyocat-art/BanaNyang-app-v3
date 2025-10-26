import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

// FIX: Changed tip prop from string to React.ReactNode to allow for more complex tooltips.
export const Tooltip: React.FC<{ children: React.ReactNode; tip: React.ReactNode; position?: 'top' | 'bottom' | 'left' | 'right', className?: string }> = ({ children, tip, position = 'top', className = '' }) => {
  if (!tip) return <>{children}</>;

  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  useEffect(() => {
    if (visible && wrapperRef.current && tooltipRef.current) {
        const wrapperRect = wrapperRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        let top = 0, left = 0;

        switch (position) {
            case 'top':
                top = wrapperRect.top - tooltipRect.height - 8;
                left = wrapperRect.left + (wrapperRect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'bottom':
                top = wrapperRect.bottom + 8;
                left = wrapperRect.left + (wrapperRect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'left':
                top = wrapperRect.top + (wrapperRect.height / 2) - (tooltipRect.height / 2);
                left = wrapperRect.left - tooltipRect.width - 8;
                break;
            case 'right':
                top = wrapperRect.top + (wrapperRect.height / 2) - (tooltipRect.height / 2);
                left = wrapperRect.right + 8;
                break;
        }
        setPos({ top, left });
    }
  }, [visible, position]);
  
  const displayClass = (className.includes('w-') || className.includes('block') || className.includes('flex')) ? '' : 'inline-block';

  const tooltipElement = (
    <div 
        ref={tooltipRef} 
        className={`fixed bg-zinc-900 text-zinc-200 text-sm rounded-md py-2 px-4 z-[999] shadow-lg whitespace-pre-wrap border border-zinc-700 transition-opacity duration-200 pointer-events-none ${visible ? 'opacity-100' : 'opacity-0'}`} 
        style={{ top: pos.top, left: pos.left }}
    >
        {tip}
    </div>
  );

  return (
    <div ref={wrapperRef} onMouseEnter={show} onMouseLeave={hide} className={`${displayClass} ${className}`}>
        {children}
        {ReactDOM.createPortal(tooltipElement, document.getElementById('tooltip-root')!)}
    </div>
  );
};
