
// src/components/common/XPWindow.js
import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from '../../icons/XPIcons';
import clsx from "clsx";

export const XPWindow = ({
                             title,
                             children,
                             onClose,
                             width = 400,
                             height = 300,
                             x = 100,
                             y = 100,
                             icon,
                             resizable = false,
                             maximizable = false,
                             minimizable = false,
                             className
                         }) => {
    const [position, setPosition] = useState({ x, y });
    const [size, setSize] = useState({ width, height });
    const [isMaximized, setIsMaximized] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const windowRef = useRef(null);

    const handleMouseDown = (e) => {
        if (e.target.closest('.window-controls')) return;

        const rect = windowRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setIsDragging(true);
    };

    const handleMaximize = () => {
        if (isMaximized) {
            setPosition({ x, y });
            setSize({ width, height });
        } else {
            setPosition({ x: 0, y: 0 });
            setSize({
                width: window.innerWidth,
                height: window.innerHeight - 40
            });
        }
        setIsMaximized(!isMaximized);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging && !isMaximized) {
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: Math.max(0, e.clientY - dragOffset.y)
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragOffset, isMaximized]);

    return (
        <div
            ref={windowRef}
            className={clsx('xp-window', className, {
                'maximized': isMaximized,
                'dragging': isDragging
            })}
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                zIndex: 1000
            }}
        >
            <div
                className="xp-titlebar"
                onMouseDown={handleMouseDown}
                onDoubleClick={maximizable ? handleMaximize : undefined}
            >
                <div className="title">
                    {icon && <span className="title-icon">{icon}</span>}
                    {title}
                </div>
                <div className="window-controls">
                    {minimizable && (
                        <button className="control-btn minimize-btn" title="Minimize">
                            −
                        </button>
                    )}
                    {maximizable && (
                        <button
                            className="control-btn maximize-btn"
                            onClick={handleMaximize}
                            title={isMaximized ? "Restore" : "Maximize"}
                        >
                            {isMaximized ? '⧉' : '□'}
                        </button>
                    )}
                    <button className="control-btn close-btn" onClick={onClose} title="Close">
                        <CloseIcon />
                    </button>
                </div>
            </div>

            <div className="xp-window-content">
                {children}
            </div>

            {resizable && !isMaximized && (
                <div
                    className="resize-handle"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setIsResizing(true);
                    }}
                />
            )}
        </div>
    );
};
export default XPWindow;