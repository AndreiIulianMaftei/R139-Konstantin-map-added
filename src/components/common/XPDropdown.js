
// src/components/common/XPDropdown.js
import React, { useState, useRef, useEffect } from 'react';

export const XPDropdown = ({
                               label,
                               options = [],
                               value,
                               onChange,
                               placeholder = "Select...",
                               disabled = false,
                               className
                           }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (!isOpen) return;

            switch (event.key) {
                case 'Escape':
                    setIsOpen(false);
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    setSelectedIndex(prev =>
                        prev < options.length - 1 ? prev + 1 : prev
                    );
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
                    break;
                case 'Enter':
                    event.preventDefault();
                    if (selectedIndex >= 0) {
                        onChange(options[selectedIndex].value);
                        setIsOpen(false);
                    }
                    break;
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, selectedIndex, options, onChange]);

    return (
        <div className={`xp-dropdown ${className || ''}`} ref={dropdownRef}>
            {label && <label className="dropdown-label">{label}</label>}

            <div
                className={`dropdown-trigger ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
        <span className="dropdown-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
                <span className="dropdown-arrow">▼</span>
            </div>

            {isOpen && (
                <div className="dropdown-menu">
                    {options.map((option, index) => (
                        <div
                            key={option.value}
                            className={`dropdown-option ${index === selectedIndex ? 'highlighted' : ''} ${option.value === value ? 'selected' : ''}`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};