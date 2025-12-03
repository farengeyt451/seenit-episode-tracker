import { LICENSE_STATUS_STORAGE_NAME } from '@/constants';
import { Nullable } from '@/utility-types';
import { activateLicense, checkLicense } from '@/utils';
import { encodedStorage } from '@/utils/storage.utils';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

enum LicenseActionTypes {
  Activating = 'activating',
  ActivatedSuccess = 'activatedSuccess',
  ActivatedError = 'activatedError',
  ActivatingFinally = 'activatingFinally',

  Checking = 'checking',
  CheckingSuccess = 'checkingSuccess',
  CheckingError = 'checkingError',
  CheckingFinally = 'checkingFinally',

  ClearActivateState = 'clearActivateState',
  ClearCheckState = 'clearCheckState',
}

type LicenseStatusStore = {
  isLicenseActivating: boolean;
  isLicenseActivated: boolean;
  isLicenseChecking: boolean;
  isLicenseChecked: boolean;
  activateLicenseErrorMessage: Nullable<string>;
  activateLicenseSuccessMessage: Nullable<string>;
  checkLicenseErrorMessage: Nullable<string>;
  checkLicenseSuccessMessage: Nullable<string>;
};

type LicenseStatusStoreActions = {
  activateLicense: (key: string, signal?: AbortSignal) => void;
  checkLicenseActivation: (key: string, signal?: AbortSignal) => void;
  clearLicenseActivationState: () => void;
  clearLicenseCheckState: () => void;
};

const initialState: LicenseStatusStore = {
  isLicenseActivating: false,
  isLicenseActivated: false,
  isLicenseChecking: false,
  isLicenseChecked: false,
  activateLicenseErrorMessage: null,
  activateLicenseSuccessMessage: null,
  checkLicenseErrorMessage: null,
  checkLicenseSuccessMessage: null,
} as const;

export const useLicenseStore = create<LicenseStatusStore & LicenseStatusStoreActions>()(
  devtools(
    immer(
      persist(
        set => ({
          ...initialState,
          activateLicense: (key: string, signal?: AbortSignal) => {
            set(
              draft => {
                draft.isLicenseActivating = true;
                draft.activateLicenseErrorMessage = null;
              },
              false,
              LicenseActionTypes.Activating,
            );

            activateLicense({
              licenseKey: key,
              signal,
              onSuccess(resp) {
                set(
                  draft => {
                    if (resp?.message) {
                      draft.activateLicenseSuccessMessage = resp.message;
                      draft.isLicenseActivated = true;
                    }
                  },
                  false,
                  LicenseActionTypes.ActivatedSuccess,
                );
              },
              onError(error) {
                set(
                  draft => {
                    if (error) {
                      draft.isLicenseActivated = false;
                      draft.activateLicenseErrorMessage = error;
                    }
                  },
                  false,
                  LicenseActionTypes.ActivatedError,
                );
              },
              onFinally() {
                set(
                  draft => {
                    draft.isLicenseActivating = false;
                  },
                  false,
                  LicenseActionTypes.ActivatingFinally,
                );
              },
            });
          },
          clearLicenseActivationState: () => {
            set(
              draft => {
                draft.activateLicenseErrorMessage = null;
                draft.activateLicenseSuccessMessage = null;
              },
              false,
              LicenseActionTypes.ClearActivateState,
            );
          },
          checkLicenseActivation: (key: string, signal?: AbortSignal) => {
            set(
              draft => {
                draft.isLicenseChecking = true;
              },
              false,
              LicenseActionTypes.Checking,
            );

            checkLicense({
              licenseKey: key,
              signal,
              onSuccess(resp) {
                set(
                  draft => {
                    if (resp?.message) {
                      draft.isLicenseChecked = true;
                      draft.checkLicenseSuccessMessage = resp.message;
                    }
                  },
                  false,
                  LicenseActionTypes.CheckingSuccess,
                );
              },
              onError(error) {
                set(
                  draft => {
                    if (error) {
                      draft.isLicenseChecked = false;
                      draft.checkLicenseErrorMessage = error;
                    }
                  },
                  false,
                  LicenseActionTypes.CheckingError,
                );
              },
              onFinally() {
                set(
                  draft => {
                    draft.isLicenseChecking = false;
                  },
                  false,
                  LicenseActionTypes.CheckingFinally,
                );
              },
            });
          },
          clearLicenseCheckState: () => {
            set(
              draft => {
                draft.checkLicenseErrorMessage = null;
                draft.checkLicenseSuccessMessage = null;
              },
              false,
              LicenseActionTypes.ClearCheckState,
            );
          },
        }),
        {
          name: LICENSE_STATUS_STORAGE_NAME,
          storage: createJSONStorage(() => encodedStorage),
          version: 1.0,
          partialize: state => ({
            isLicenseActivated: state.isLicenseActivated,
            isLicenseChecked: state.isLicenseChecked,
          }),
        },
      ),
    ),

    { name: 'Store', store: 'license-status' },
  ),
);
