import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ChapterBudgetState, FHCContractedRates, UserContext } from './types';

interface State {
  currentStep: number;
  budget: ChapterBudgetState | null;
  fhcRates: FHCContractedRates | null;
  session: UserContext | null;
  isLoading: boolean;
  error: string | null;
  isGlobalPreviewMode: boolean;
}

type Action =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_BUDGET'; payload: ChapterBudgetState }
  | { type: 'UPDATE_BUDGET'; payload: Partial<ChapterBudgetState> }
  | { type: 'SET_FHC_RATES'; payload: FHCContractedRates | null }
  | { type: 'SET_SESSION'; payload: UserContext | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PREVIEW_MODE'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: State = {
  currentStep: 1,
  budget: null,
  fhcRates: null,
  session: null,
  isLoading: false,
  error: null,
  isGlobalPreviewMode: false,
};

function budgetReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_BUDGET':
      return { ...state, budget: action.payload, error: null };
    case 'UPDATE_BUDGET':
      return { ...state, budget: state.budget ? { ...state.budget, ...action.payload } : null };
    case 'SET_FHC_RATES':
      return { ...state, fhcRates: action.payload };
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_PREVIEW_MODE':
      return { ...state, isGlobalPreviewMode: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

interface BudgetContextType {
  state: State;
  dispatch: React.Dispatch<Action>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, initialState);
  return (
    <BudgetContext.Provider value={{ state, dispatch }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudgetStore() {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudgetStore must be used within a BudgetProvider');
  }
  return context;
}

export function useAutoSave() {
  const { state } = useBudgetStore();
  const { budget } = state;

  React.useEffect(() => {
    if (!budget) return;

    const handler = setTimeout(async () => {
      try {
        await fetch(`/agd-budgets/api/budget/${encodeURIComponent(budget.chapter)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(budget)
        });
        // Optionally emit a global event or update sync status
        window.dispatchEvent(new CustomEvent('budget-auto-saved'));
      } catch (err) {
        console.error("Auto-save failed", err);
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(handler);
  }, [budget]);
}
