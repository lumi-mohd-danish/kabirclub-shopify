'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useCallback, useRef, useState, type ReactNode } from 'react';

import { BTN_DANGER, BTN_GHOST, BTN_PRIMARY } from './admin-ui';

/**
 * The admin confirm step.
 *
 * Deleting a product, deleting a collection, disabling a live product and
 * dropping an image were all guarded by `window.confirm`. That dialog cannot
 * be styled, cannot be read by the design system, renders the raw URL of the
 * site above the question in most browsers, and — the part that actually
 * matters — is blocked outright by some browsers inside cross-origin frames
 * and by "prevent this page from creating additional dialogs", in which case
 * it returns `false` and the admin silently believes the user said no.
 *
 * This is the Headless UI replacement: a real dialog with a focus trap, Escape
 * to dismiss, focus returned to the trigger on close, an accessible name from
 * `Dialog.Title` and a description from `Dialog.Description`.
 *
 * Initial focus is the CANCEL button on purpose. The destructive button must
 * never be the one the keyboard is already resting on.
 */
export type ConfirmTone = 'danger' | 'default';

export interface ConfirmOptions {
  /** The question. Short, and it names the thing. */
  title: string;
  /** What will actually happen, and whether it can be undone. */
  body?: ReactNode;
  /** Default 'Confirm'. Label the ACTION ("Delete product"), not the answer. */
  confirmLabel?: string;
  /** Default 'Cancel'. */
  cancelLabel?: string;
  /** Default 'danger'. */
  tone?: ConfirmTone;
}

export interface ConfirmDialogProps {
  open: boolean;
  options: ConfirmOptions | null;
  onCancel: () => void;
  onConfirm: () => void;
}

interface ConfirmRequest {
  options: ConfirmOptions;
  open: boolean;
}

/**
 * A promise-shaped confirm, so a call site reads the way `window.confirm` did:
 *
 *   const { confirm, dialogProps } = useConfirm();
 *   ...
 *   if (!(await confirm({ title: 'Delete "Kurta"?' }))) return;
 *   ...
 *   <ConfirmDialog {...dialogProps} />
 */
export function useConfirm() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  // eslint-disable-next-line no-unused-vars
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const settle = useCallback((confirmed: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;

    // The copy stays mounted through the leave transition; only `open` drops,
    // so the panel does not blank out as it slides away.
    setRequest((current) => (current ? { ...current, open: false } : null));

    resolve?.(confirmed);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        // A second question supersedes an unanswered one rather than leaking a
        // promise that can never settle.
        resolverRef.current?.(false);
        resolverRef.current = resolve;
        setRequest({ options, open: true });
      }),
    []
  );

  const onCancel = useCallback(() => settle(false), [settle]);
  const onConfirm = useCallback(() => settle(true), [settle]);

  return {
    confirm,
    dialogProps: {
      open: request?.open ?? false,
      options: request?.options ?? null,
      onCancel,
      onConfirm
    } satisfies ConfirmDialogProps
  };
}

export default function ConfirmDialog({ open, options, onCancel, onConfirm }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const tone = options?.tone ?? 'danger';

  return (
    <Transition show={open && options !== null}>
      {/* `onClose` covers Escape and the backdrop alike, and both mean "no". */}
      <Dialog onClose={onCancel} className="relative z-50" initialFocus={cancelRef}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity duration-panel ease-cloth"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-panel ease-cloth"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ink-900/70" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-5">
          <Transition.Child
            as={Fragment}
            enter="transition-transform duration-panel ease-cloth"
            enterFrom="translate-y-2"
            enterTo="translate-y-0"
            leave="transition-transform duration-panel ease-cloth"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-2"
          >
            {/* A plate: hairline and zero radius, lifted off the page by the
                warm overlay shadow. */}
            <Dialog.Panel className="w-full max-w-md rounded-plate border border-ink-700 bg-ink-900 p-5 text-paper shadow-overlay">
              <Dialog.Title as="h2" className="text-h3 text-paper">
                {options?.title}
              </Dialog.Title>

              {options?.body ? (
                <Dialog.Description as="div" className="mt-3 text-body-sm text-paper-muted">
                  {options.body}
                </Dialog.Description>
              ) : null}

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button ref={cancelRef} type="button" onClick={onCancel} className={BTN_GHOST}>
                  {options?.cancelLabel ?? 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className={tone === 'danger' ? BTN_DANGER : BTN_PRIMARY}
                >
                  {options?.confirmLabel ?? 'Confirm'}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
