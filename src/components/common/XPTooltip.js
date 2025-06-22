// src/components/common/XPTooltip.js
import React, { useState, useRef } from 'react';

export const XPTooltip = ({
                              children,
                              content,
                              position = 'top',
                              delay = 500,
                              className
                          }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [timeoutId, setTimeoutId] = useState(null);
    const tooltipRef = useRef(null);

    const showTooltip = () => {
        const id = setTimeout(() => {
            setIsVisible(true);
        }, delay);
        setTimeoutId(id);
    };

    const hideTooltip = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }
        setIsVisible(false);
    };

    return (
        <div
            className="xp-tooltip-wrapper"
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            ref={tooltipRef}
        >
            {children}
            {isVisible && content && (
                <div className={`xp-tooltip ${position} ${className || ''}`}>
                    <div className="tooltip-content">
                        {content}
                    </div>
                    <div className="tooltip-arrow" />
                </div>
            )}
        </div>
    );
};