import { SeenItButton } from '@/components/ui';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import clsx from 'clsx';
import { forwardRef, JSX, useImperativeHandle, useState } from 'react';

export interface SeenitDialogHandle {
  open: () => void;
  close: () => void;
}

interface SeenitDialogProps {
  title: string;
  description: string;
  isAlert?: boolean;
  confirm?: () => void;
}

export const SeenitDialog = forwardRef<SeenitDialogHandle, SeenitDialogProps>(
  ({ title, description, isAlert = false, confirm }, ref): JSX.Element => {
    const [isOpen, setIsOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }));

    const handleClose = () => {
      setIsOpen(false);
    };

    const handleConfirm = () => {
      setIsOpen(false);
      confirm?.();
    };

    return (
      <Dialog
        open={isOpen}
        as="div"
        className={clsx(
          'absolute inset-0 z-30 focus:outline-none',
          'bg-black/30 transition-opacity duration-300 ease-out',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClose={() => setIsOpen(false)}
      >
        <div className="relative top-20 left-[50%] z-50 flex w-75 -translate-x-2/4 items-center justify-center">
          <DialogPanel
            transition
            className={clsx(
              'light:bg-white/90 light:border light:border-slate-200 relative w-full rounded-xl bg-gray-800 p-4',
              'duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0',
              'overflow-hidden',
            )}
          >
            {/* Decorative Background Gradient */}
            <div
              className={clsx(
                'pointer-events-none absolute -top-12 -right-12 size-40 rounded-full opacity-5',
                'bg-linear-to-br from-blue-500 to-purple-600',
                'light:from-blue-400 light:to-indigo-500 light:opacity-[0.03]',
                'blur-3xl',
              )}
            />
            <div
              className={clsx(
                'pointer-events-none absolute -bottom-10 -left-10 size-32 rounded-full opacity-5',
                'bg-linear-to-tr from-green-500 to-blue-500',
                'light:from-green-400 light:to-blue-400 light:opacity-[0.03]',
                'blur-3xl',
              )}
            />

            {/* Content */}
            <div className="relative z-10">
              <DialogTitle
                as="h3"
                className="light:text-slate-900 cursor-default text-base/7 font-semibold text-white"
              >
                {title}
              </DialogTitle>
              <p className="light:text-slate-600 mt-2 cursor-default text-sm/6 font-medium text-gray-400">
                {description}
              </p>
              <div className="mt-4 flex justify-end gap-2">
                {!isAlert && (
                  <SeenItButton
                    size="small"
                    onClick={handleClose}
                  >
                    Cancel
                  </SeenItButton>
                )}

                <SeenItButton
                  colorType={isAlert ? 'outlined' : 'warning'}
                  size="small"
                  onClick={handleConfirm}
                >
                  {isAlert ? 'OK' : 'Remove'}
                </SeenItButton>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    );
  },
);

SeenitDialog.displayName = 'SeenitDialog';
