// src/components/common/XPDialog.js
import React from 'react';
import { XPWindow } from './XPWindow';
import { XPButton } from './XPButton';

export const XPDialog = ({
                             title,
                             message,
                             type = 'info', // info, warning, error, question
                             buttons = ['OK'],
                             onButton,
                             onClose,
                             icon
                         }) => {
    const getDialogIcon = (type) => {
        switch (type) {
            case 'info': return 'ℹ️';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'question': return '❓';
            default: return icon || 'ℹ️';
        }
    };

    return (
        <div className="xp-dialog-overlay">
            <XPWindow
                title={title}
                onClose={onClose}
                width={350}
                height={150}
                x={window.innerWidth / 2 - 175}
                y={window.innerHeight / 2 - 75}
                icon="💬"
                className="xp-dialog"
            >
                <div className="dialog-content">
                    <div className="dialog-body">
                        <div className="dialog-icon">
                            {getDialogIcon(type)}
                        </div>
                        <div className="dialog-message">
                            {message}
                        </div>
                    </div>
                    <div className="dialog-buttons">
                        {buttons.map((button, index) => (
                            <XPButton
                                key={index}
                                variant={index === 0 ? 'primary' : 'default'}
                                onClick={() => onButton && onButton(button, index)}
                            >
                                {button}
                            </XPButton>
                        ))}
                    </div>
                </div>
            </XPWindow>
        </div>
    );
};

export default XPDialog;