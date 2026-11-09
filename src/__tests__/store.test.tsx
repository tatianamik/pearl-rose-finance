import React from 'react';
import { renderHook } from '@testing-library/react';
import { BudgetProvider, useBudgetStore } from '../store';
import { describe, it, expect, vi } from 'vitest';

describe('useBudgetStore', () => {
  it('throws an error when used outside of BudgetProvider', () => {
    // Suppress console.error expected from throwing in renderHook
    const consoleSpy = vi.spyOn(console, 'error');
    consoleSpy.mockImplementation(() => {});

    expect(() => renderHook(() => useBudgetStore())).toThrow(
      'useBudgetStore must be used within a BudgetProvider'
    );

    consoleSpy.mockRestore();
  });

  it('returns context when used within BudgetProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BudgetProvider>{children}</BudgetProvider>
    );

    const { result } = renderHook(() => useBudgetStore(), { wrapper });

    expect(result.current.state).toBeDefined();
    expect(result.current.dispatch).toBeDefined();
    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.state.budget).toBeNull();
  });
});
