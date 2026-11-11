'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type NotificationTone = 'success' | 'error' | 'info';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface NotificationContextValue {
  notify: (message: string, tone?: NotificationTone) => void;
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

interface Notice {
  id: number;
  message: string;
  tone: NotificationTone;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const noticeStyles: Record<NotificationTone, { box: string; icon: string }> = {
  success: { box: 'border-emerald-300', icon: 'text-emerald-700' },
  error: { box: 'border-rose-300', icon: 'text-rose-700' },
  info: { box: 'border-sky-300', icon: 'text-sky-700' },
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationOptions | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmationResolver = useRef<((accepted: boolean) => void) | null>(null);

  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    confirmationResolver.current?.(false);
  }, []);

  const notify = (message: string, tone: NotificationTone = 'success') => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ id: Date.now(), message, tone });
    noticeTimer.current = setTimeout(() => setNotice(null), 6500);
  };

  const confirm = (options: ConfirmationOptions) => new Promise<boolean>((resolve) => {
    confirmationResolver.current?.(false);
    confirmationResolver.current = resolve;
    setConfirmation(options);
  });

  const finishConfirmation = (accepted: boolean) => {
    const resolve = confirmationResolver.current;
    confirmationResolver.current = null;
    setConfirmation(null);
    resolve?.(accepted);
  };

  const NoticeIcon = notice?.tone === 'error'
    ? ExclamationCircleIcon
    : notice?.tone === 'info'
      ? InformationCircleIcon
      : CheckCircleIcon;

  return (
    <NotificationContext.Provider value={{ notify, confirm }}>
      {children}
      {notice && (
        <div className="fixed inset-x-0 top-3 z-[100] flex justify-center px-3 print:hidden">
          <div
            key={notice.id}
            role={notice.tone === 'error' ? 'alert' : 'status'}
            aria-live={notice.tone === 'error' ? 'assertive' : 'polite'}
            aria-atomic="true"
            className={`flex w-full max-w-2xl items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-xl shadow-slate-950/20 animate-in slide-in-from-top-2 duration-200 ${noticeStyles[notice.tone].box}`}
          >
            <NoticeIcon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${noticeStyles[notice.tone].icon}`} />
            <p className="min-w-0 flex-1 whitespace-pre-line font-semibold leading-6">{notice.message}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Cerrar notificación"
              className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-600"
            >
              <XMarkIcon aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {confirmation && (
        <div className="fixed inset-x-0 top-3 z-[101] flex justify-center px-3 print:hidden">
          <section
            role="alertdialog"
            aria-modal="false"
            aria-labelledby="global-confirmation-title"
            aria-describedby="global-confirmation-message"
            className="w-full max-w-xl rounded-xl border border-slate-300 bg-white p-4 text-slate-900 shadow-2xl shadow-slate-950/25 animate-in slide-in-from-top-2 duration-200 sm:p-5"
          >
            <h2 id="global-confirmation-title" className="text-base font-bold">{confirmation.title}</h2>
            <p id="global-confirmation-message" className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">
              {confirmation.message}
            </p>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                autoFocus
                onClick={() => finishConfirmation(false)}
                className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-600"
              >
                {confirmation.cancelLabel || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={() => finishConfirmation(true)}
                className={`min-h-10 rounded-lg px-4 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${confirmation.destructive
                  ? 'bg-rose-700 hover:bg-rose-800 focus-visible:outline-rose-700'
                  : 'bg-[#1f5a8a] hover:bg-[#174a74] focus-visible:outline-sky-700'
                }`}
              >
                {confirmation.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </section>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications debe usarse dentro de NotificationProvider.');
  return context;
}