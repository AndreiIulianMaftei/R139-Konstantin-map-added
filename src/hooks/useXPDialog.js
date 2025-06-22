// src/hooks/useXPDialog.js
import React, { createContext, useContext, useState } from 'react';
import { XPDialog } from '../components/common/XPDialog';

const DialogContext = createContext();

export const XPDialogProvider = ({ children }) => {
    const [dialog, setDialog] = useState(null);

    const showDialog = (config) => {
        return new Promise((resolve) => {
            setDialog({
                ...config,
                onButton: (button, index) => {
                    setDialog(null);
                    resolve({ button, index });
                },
                onClose: () => {
                    setDialog(null);
                    resolve({ button: null, index: -1 });
                }
            });
        });
    };

    const hideDialog = () => {
        setDialog(null);
    };

    return (
        <DialogContext.Provider value={{ showDialog, hideDialog }}>
            {children}
            {dialog && <XPDialog {...dialog} />}
        </DialogContext.Provider>
    );
};

export const useXPDialog = () => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useXPDialog must be used within XPDialogProvider');
    }
    return context;
};