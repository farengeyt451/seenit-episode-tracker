import { useLicenseStore } from '@/store';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { FC, JSX, ReactNode } from 'react';

interface LockWrapperProps {
  children: ReactNode;
}

export const LockWrapper: FC<LockWrapperProps> = ({ children }): JSX.Element => {
  const isLicenseActivated = useLicenseStore(state => state.isLicenseActivated);

  return (
    <div
      data-tag="lock-wrapper"
      className={clsx('relative', !isLicenseActivated && 'pointer-events-none')}
    >
      {!isLicenseActivated && (
        <LockClosedIcon className="light:text-slate-700 absolute -right-0.5 -bottom-0.5 z-10 size-4 text-slate-300"></LockClosedIcon>
      )}

      {children}
    </div>
  );
};
