import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OnboardingStage = 'signup' | 'business' | 'address' | 'selling' | 'complete';

export interface OnboardingData {
  businessName: string;
  country: 'US' | 'BR';
  firstName: string;
  lastName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  timezone: string;
  sellingMethod: 'hosted_store' | 'integration';
  integrationTypes: string[];
}

interface OnboardingStore {
  stage: OnboardingStage;
  data: Partial<OnboardingData>;
  setStage: (stage: OnboardingStage) => void;
  updateData: (newData: Partial<OnboardingData>) => void;
  clearData: () => void;
  getCurrentStepIndex: () => number;
  isComplete: () => boolean;
}

const initialData: Partial<OnboardingData> = {
  businessName: '',
  country: 'US',
  firstName: '',
  lastName: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
  timezone: '',
  sellingMethod: 'hosted_store',
  integrationTypes: [],
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      stage: 'signup',
      data: initialData,
      setStage: (stage) => set({ stage }),
      updateData: (newData) =>
        set((state) => ({
          data: { ...state.data, ...newData },
        })),
      clearData: () => set({ 
        data: initialData, 
        stage: 'complete' 
      }),
      getCurrentStepIndex: () => {
        const { stage } = get();
        switch (stage) {
          case 'business':
            return 0;
          case 'address':
            return 1;
          case 'selling':
            return 2;
          default:
            return -1;
        }
      },
      isComplete: () => {
        const { stage } = get();
        return stage === 'complete';
      },
    }),
    {
      name: 'onboarding-storage',
    }
  )
);