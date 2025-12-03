import { Button } from '@headlessui/react';
import { clsx } from 'clsx';
import { ButtonHTMLAttributes, FC, ReactNode } from 'react';

const colorTypesMap = {
  primary: 'bg-blue-700 text-white data-[hover]:bg-blue-600',
  secondary:
    'bg-gray-700 light:bg-blue-600 text-gray-200 light:text-slate-100 data-[hover]:bg-gray-600 light:data-[hover]:bg-blue-700',
  outlined:
    'bg-transparent border-1 border-gray-400 light:border-gray-700 text-gray-300 light:text-slate-700 data-[hover]:border-blue-500 light:data-[hover]:border-blue-600 data-[hover]:text-blue-400 light:data-[hover]:text-blue-600',
  warning: 'bg-red-800 text-white  data-[hover]:bg-red-700',
} as const;

const sizesMap = {
  small: 'px-3.5 py-1 text-xs/5 ',
  medium: 'px-3.5 py-1.5 text-sm/6',
  large: 'px-4.5 py-2 text-base/6',
} as const;

interface SeenItButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  colorType?: 'primary' | 'secondary' | 'outlined' | 'warning';
  size?: 'small' | 'medium' | 'large';
}

export const SeenItButton: FC<SeenItButtonProps> = ({
  children,
  colorType = 'secondary',
  size = 'medium',
  className,
  disabled,
  ...props
}) => (
  <Button
    data-tag="seenit-button"
    className={clsx(
      'inline-flex items-center justify-center gap-2',
      'rounded-full',
      'font-semibold',
      'shadow-inner shadow-white/10',
      'cursor-pointer transition duration-100 ease-linear',
      disabled && 'pointer-events-none opacity-40',
      colorTypesMap[colorType],
      sizesMap[size],
      className,
    )}
    {...props}
  >
    {children}
  </Button>
);

SeenItButton.displayName = 'SeenItButtonComponent';
