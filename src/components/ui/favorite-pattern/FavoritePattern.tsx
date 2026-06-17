import { Theme } from '@/enums';
import { useThemeStore } from '@/store';
import { clsx } from 'clsx';
import { FC, JSX } from 'react';

const STROKE_DARK = 'fbbf24';
const STROKE_LIGHT = 'b45309';

const buildPattern = (stroke: string): string =>
  `url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='150'%20height='60'%20viewBox='0%200%20150%2060'%3E%3Cdefs%3E%3Cpolygon%20id='s'%20points='0,-10%202.35,-3.24%209.51,-3.09%203.8,1.24%205.88,8.09%200,4%20-5.88,8.09%20-3.8,1.24%20-9.51,-3.09%20-2.35,-3.24'/%3E%3C/defs%3E%3Cg%20fill='none'%20stroke='%23${stroke}'%20stroke-width='1.6'%20stroke-linejoin='round'%3E%3Cuse%20href='%23s'%20transform='translate(24%2020)%20rotate(-12)%20scale(1.15)'/%3E%3Cuse%20href='%23s'%20transform='translate(74%2042)%20rotate(16)%20scale(0.75)'/%3E%3Cuse%20href='%23s'%20transform='translate(120%2022)%20rotate(6)%20scale(1)'/%3E%3Cuse%20href='%23s'%20transform='translate(56%2012)%20rotate(-24)%20scale(0.5)'/%3E%3Ccircle%20cx='98'%20cy='13'%20r='1.6'/%3E%3Ccircle%20cx='140'%20cy='45'%20r='1.6'/%3E%3Ccircle%20cx='40'%20cy='46'%20r='1.4'/%3E%3C/g%3E%3C/svg%3E")`;

export const FavoritePattern: FC = (): JSX.Element => {
  const isLightTheme = useThemeStore(state => state.theme) === Theme.Light;
  const stroke = isLightTheme ? STROKE_LIGHT : STROKE_DARK;

  return (
    <span
      data-tag="favorite-pattern"
      aria-hidden="true"
      className={clsx(
        'pointer-events-none absolute inset-0 z-0 bg-size-[150px_60px] bg-center bg-repeat-x',
        'light:opacity-[0.38] opacity-[0.24]',
        'mask-[linear-gradient(to_right,transparent,black)]',
        '[-webkit-mask-image:linear-gradient(to_right,transparent,black)]',
      )}
      style={{ backgroundImage: buildPattern(stroke) }}
    />
  );
};

FavoritePattern.displayName = 'FavoritePatternComponent';
