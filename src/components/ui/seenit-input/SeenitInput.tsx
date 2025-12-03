import { Input } from '@headlessui/react';
import { clsx } from 'clsx';
import { forwardRef, InputHTMLAttributes } from 'react';

export interface SeenitInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const SeenitInput = forwardRef<HTMLInputElement, SeenitInputProps>(({ className, ...rest }, ref) => {
  return (
    <Input
      ref={ref}
      {...rest}
      className={clsx(
        'block w-full rounded-full py-1.5 pr-10 pl-3',
        'text-sm/6',
        'border-none bg-gray-700 text-white placeholder-gray-400',
        'focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-white/50',
        'light:bg-slate-100 light:text-slate-900 light:placeholder-slate-500 light:shadow-2xl shadow-gray-500/50',
        'light:focus:border-gray-500 light:data-focus:outline-blue-500',
        className,
      )}
    />
  );
});

SeenitInput.displayName = 'SeenitInput';
