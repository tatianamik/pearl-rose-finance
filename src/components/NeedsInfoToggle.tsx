import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useBudgetStore } from '../store';

interface Props {
  fieldId: string;
  label: string;
  children: React.ReactNode;
}

export default function NeedsInfoToggle({ fieldId, label, children }: Props) {
  const { state, dispatch } = useBudgetStore();
  const { budget } = state;
  const [isOpen, setIsOpen] = useState(false);

  if (!budget) return <>{children}</>;

  const flagState = budget.needsInfoFlags?.[fieldId] || { flagged: false, note: '' };
  
  const toggleFlag = () => {
    if (flagState.flagged) {
      // Clear flag
      dispatch({
        type: 'UPDATE_BUDGET',
        payload: {
          needsInfoFlags: {
            ...budget.needsInfoFlags,
            [fieldId]: { flagged: false, note: '' }
          }
        }
      });
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };

  const saveNote = (note: string) => {
    dispatch({
      type: 'UPDATE_BUDGET',
      payload: {
        needsInfoFlags: {
          ...budget.needsInfoFlags,
          [fieldId]: { flagged: true, note }
        }
      }
    });
    setIsOpen(false);
  };

  return (
    <div className="relative group">
      <div className={`relative rounded-xl transition-all ${flagState.flagged ? 'ring-2 ring-amber-400 bg-amber-50/30' : 'hover:bg-slate-50'}`}>
        
        {/* The Wrapped Input Component */}
        {children}
        
        {/* Toggle Button */}
        <button
          onClick={toggleFlag}
          className={`absolute top-1/2 -translate-y-1/2 -right-8 p-1.5 rounded-full transition-all ${flagState.flagged ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'text-slate-300 hover:bg-slate-100 hover:text-slate-600 opacity-0 group-hover:opacity-100'}`}
          title={flagState.flagged ? "Unflag this item" : "Flag as Needs Info"}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Existing Flag Display */}
      {flagState.flagged && !isOpen && (
        <div className="mt-1 text-xs text-amber-700 font-medium flex items-center gap-1.5 pl-2 border-l-2 border-amber-400">
          ❓ Waiting on info: <span className="text-amber-900">{flagState.note || 'No note attached'}</span>
        </div>
      )}

      {/* Popover to enter note */}
      {isOpen && !flagState.flagged && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded-xl p-3 z-20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">Flag "{label}"</span>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea 
            autoFocus
            placeholder="E.g., waiting on VP Recruitment venue quote..."
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveNote(e.currentTarget.value);
              }
            }}
          />
          <div className="text-[10px] text-slate-400 mt-1 text-right">Press Enter to save</div>
        </div>
      )}
    </div>
  );
}
