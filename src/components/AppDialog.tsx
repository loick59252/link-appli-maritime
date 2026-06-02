// src/components/AppDialog.tsx
import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type DialogOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type DialogState = DialogOptions & {
  type: 'alert' | 'confirm';
  resolve: (value: boolean) => void;
};

type AppDialogContextValue = {
  alert: (message: string, options?: Omit<DialogOptions, 'message'>) => Promise<void>;
  confirm: (message: string, options?: Omit<DialogOptions, 'message'>) => Promise<boolean>;
};

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

export const AppDialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const openDialog = useCallback((dialogData: Omit<DialogState, 'resolve'>) =>
    new Promise<boolean>((resolve) => {
      setDialog({ ...dialogData, resolve });
    }), []);

  const alert = useCallback<AppDialogContextValue['alert']>(async (message, options = {}) => {
    await openDialog({
      type: 'alert',
      message,
      title: options.title ?? 'Information',
      confirmLabel: options.confirmLabel ?? 'OK',
      danger: options.danger,
    });
  }, [openDialog]);

  const confirm = useCallback<AppDialogContextValue['confirm']>(async (message, options = {}) =>
    openDialog({
      type: 'confirm',
      message,
      title: options.title ?? 'Confirmation',
      confirmLabel: options.confirmLabel ?? 'Confirmer',
      cancelLabel: options.cancelLabel ?? 'Annuler',
      danger: options.danger,
    }), [openDialog]);

  const closeDialog = (value: boolean) => {
    if (!dialog) return;
    dialog.resolve(value);
    setDialog(null);
  };

  return (
    <AppDialogContext.Provider value={{ alert, confirm }}>
      {children}
      {dialog && (
        <div className="app-dialog-overlay" role="presentation">
          <div className="app-dialog" role="dialog" aria-modal="true" aria-labelledby="app-dialog-title">
            <h2 id="app-dialog-title">{dialog.title}</h2>
            <p>{dialog.message}</p>
            <div className="app-dialog-actions">
              {dialog.type === 'confirm' && (
                <button className="cancel-button" onClick={() => closeDialog(false)}>
                  {dialog.cancelLabel}
                </button>
              )}
              <button
                className={dialog.danger ? 'dialog-danger-button' : 'submit-button'}
                onClick={() => closeDialog(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppDialogContext.Provider>
  );
};

export const useAppDialog = () => {
  const context = useContext(AppDialogContext);
  if (!context) {
    throw new Error('useAppDialog doit être utilisé dans AppDialogProvider.');
  }
  return context;
};
