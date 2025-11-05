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
              'light:bg-white/90 light:border light:border-slate-200 w-full rounded-xl bg-white/5 p-4 backdrop-blur-2xl',
              'duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0',
            )}
          >
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
          </DialogPanel>
        </div>
      </Dialog>
    );
  },
);

SeenitDialog.displayName = 'SeenitDialog';
