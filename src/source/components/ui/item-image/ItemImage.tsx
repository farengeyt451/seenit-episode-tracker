import { Image } from '@/types';
import { Nullable } from '@/utility-types';
import { clsx } from 'clsx';
import { FC, JSX, useState } from 'react';

const randomBackgrounds = [
  'bg-red-800 light:bg-red-100',
  'bg-orange-800 light:bg-orange-100',
  'bg-amber-800 light:bg-amber-100',
  'bg-yellow-800 light:bg-yellow-100',
  'bg-green-800 light:bg-green-100',
  'bg-teal-800 light:bg-teal-100',
  'bg-cyan-800 light:bg-cyan-100',
  'bg-sky-800 light:bg-sky-100',
  'bg-blue-800 light:bg-blue-100',
  'bg-indigo-800 light:bg-indigo-100',
  'bg-violet-800 light:bg-violet-100',
  'bg-purple-800 light:bg-purple-100',
  'bg-fuchsia-800 light:bg-fuchsia-100',
  'bg-pink-800 light:bg-pink-100',
];

const getRandomBackground = (): string => randomBackgrounds[Math.floor(Math.random() * randomBackgrounds.length)];

interface ItemImageProps {
  image: Nullable<Image>;
  seriesName: string;
}

export const ItemImage: FC<ItemImageProps> = ({ image, seriesName }): JSX.Element => {
  const [isImageLoadingError, setIsImageLoadingError] = useState<boolean>(false);
  const [backgroundColor] = useState(() => getRandomBackground());

  const handelImageLoadingError = () => {
    setIsImageLoadingError(true);
  };

  return (
    <>
      {image?.medium && !isImageLoadingError ? (
        <img
          data-tag="item-image"
          className="h-full w-full object-cover"
          src={image.medium}
          alt={`Cover for ${seriesName}`}
          onError={handelImageLoadingError}
        />
      ) : (
        <div
          data-tag="item-image__fallback"
          className={clsx(
            'inline-flex h-full w-full items-center justify-center overflow-hidden',
            'light:text-slate-600 text-[70px] leading-0 font-semibold text-gray-300',
            backgroundColor,
          )}
        >
          <span className="mb-2 ml-2 rotate-30">{seriesName.charAt(0).toLowerCase()}</span>
        </div>
      )}
    </>
  );
};

ItemImage.displayName = 'ItemImageComponent';
