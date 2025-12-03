import { FC, JSX, ReactNode } from 'react';

interface InfoSearchBlockProps {
  children: ReactNode;
}

export const InfoSearchBlock: FC<InfoSearchBlockProps> = ({ children }): JSX.Element => (
  <div className="flex flex-col items-center justify-center py-8 text-center select-none">{children}</div>
);

InfoSearchBlock.displayName = 'InfoSearchBlockComponent';
