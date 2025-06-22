
// src/components/common/XPTabs.js
import React, { useState } from 'react';

export const XPTabs = ({
                           tabs = [],
                           activeTab,
                           onTabChange,
                           className
                       }) => {
    const [activeIndex, setActiveIndex] = useState(
        activeTab ? tabs.findIndex(tab => tab.id === activeTab) : 0
    );

    const handleTabClick = (index, tab) => {
        setActiveIndex(index);
        if (onTabChange) {
            onTabChange(tab.id, index);
        }
    };

    return (
        <div className={`xp-tabs ${className || ''}`}>
            <div className="tabs-header">
                {tabs.map((tab, index) => (
                    <div
                        key={tab.id}
                        className={`tab-button ${index === activeIndex ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
                        onClick={() => !tab.disabled && handleTabClick(index, tab)}
                    >
                        {tab.icon && <span className="tab-icon">{tab.icon}</span>}
                        {tab.label}
                    </div>
                ))}
            </div>
            <div className="tabs-content">
                {tabs[activeIndex] && tabs[activeIndex].content}
            </div>
        </div>
    );
};