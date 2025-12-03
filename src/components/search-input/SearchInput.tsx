import { SeenitInput } from '@/components/ui';
import { DEFAULT_SEARCH_THROTTLE } from '@/constants';
import { useSidebarStore } from '@/store';
import { Button, Field } from '@headlessui/react';
import { BackspaceIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { ChangeEvent, forwardRef, JSX, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useDelayedSearchState } from './useDelayedSearchState';

interface SearchInputProps {
  placeholder: string;
  isSearching?: boolean;
  initialValue?: string;
  className?: string;
  inputChange: (query: string) => void;
  inputClear: () => void;
}

export interface SearchInputHandle {
  clear: () => void;
  focus: () => void;
}

export const SearchInput = memo(
  forwardRef<SearchInputHandle, SearchInputProps>(
    ({ placeholder, isSearching = false, inputChange, inputClear, initialValue = '', className }, ref): JSX.Element => {
      const isSidebarOpen = useSidebarStore(state => state.isSidebarOpen);
      const [query, setQuery] = useState<string>(() => initialValue);

      const inputRef = useRef<HTMLInputElement>(null);
      const delayedIsSearching = useDelayedSearchState(isSearching, DEFAULT_SEARCH_THROTTLE);

      const focusInput = () => {
        inputRef.current?.focus();
      };

      const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;

        setQuery(value);
        inputChange(value);
      };

      const handleInputClear = () => {
        inputClear();
        setQuery('');
        focusInput();
      };

      useImperativeHandle(ref, () => ({
        clear: () => setQuery(''),
        focus: focusInput,
      }));

      useEffect(() => {
        if (isSidebarOpen) {
          focusInput();
        }
      }, [isSidebarOpen]);

      return (
        <Field
          data-tag="search"
          className="relative"
        >
          <SeenitInput
            data-tag="search__input"
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className={className}
            value={query}
            onChange={handleInputChange}
          />

          {/* Clear button */}
          {query && (
            <Button
              data-tag="search__clear"
              type="button"
              className={clsx(
                'absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer',
                'text-gray-300 hover:text-gray-200',
                'transition-all duration-200 ease-out',
                'after:absolute after:top-[-25%] after:left-[-25%] after:h-[150%] after:w-[150%]',
                !delayedIsSearching
                  ? 'scale-100 rotate-0 opacity-100'
                  : 'pointer-events-none scale-50 -rotate-90 opacity-0',
                'light:text-slate-600 light:hover:text-slate-900',
              )}
              onClick={handleInputClear}
            >
              <BackspaceIcon className="size-5" />
              <span className="sr-only">Clear input</span>
            </Button>
          )}

          {
            <div
              data-tag="search__loader"
              className={clsx(
                'pointer-events-none absolute top-1/2 right-3.5 inline-block size-4 -translate-y-1/2',
                'animate-spin rounded-full border-3 border-blue-500 border-t-transparent',
                delayedIsSearching ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0',
              )}
              role="status"
              aria-label="loading"
            >
              <span className="sr-only">Loading...</span>
            </div>
          }
        </Field>
      );
    },
  ),
);

SearchInput.displayName = 'TextInputComponent';
