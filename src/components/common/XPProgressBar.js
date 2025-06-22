// src/components/common/XPProgressBar.js
import React from 'react';

export const XPProgressBar = ({
                                  value = 0,
                                  max = 100,
                                  label,
                                  showPercentage = true,
                                  className,
                                  size = 'medium'
                              }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={`xp-progress-container ${size} ${className || ''}`}>
            {label && (
                <div className="progress-label">
                    {label}
                    {showPercentage && ` (${Math.round(percentage)}%)`}
                </div>
            )}
            <div className="xp-progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                />
                <div className="progress-shine" />
            </div>
        </div>
    );
};
