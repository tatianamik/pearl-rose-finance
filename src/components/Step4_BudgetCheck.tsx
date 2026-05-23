import React from 'react';
import { useBudgetStore } from '../store';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function Step4_BudgetCheck() {
  const { state, dispatch } = useBudgetStore();
  const { budget } = state;

  if (!budget) return null;

  const handleLockForEC = async () => {
    try {
      const res = await fetch(`/agd-budgets/api/budget/${encodeURIComponent(budget.chapter)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...budget, draftStage: 'executive_council' })
      });
      const data = await res.json();
      if (data.success) {
        dispatch({ type: 'UPDATE_BUDGET', payload: { draftStage: 'executive_council' } });
        dispatch({ type: 'SET_STEP', payload: 5 });
      }
    } catch (e) {
      console.error(e);
      alert("Failed to lock budget for EC review.");
    }
  };

  // Validation Checks
  const hasTshirtMismatch = !budget.hasPurchaseFund && budget.tshirtIncome !== budget.tshirtExpense;
  
  // IRS 5% Guardrail Re-Check
  const totalActives = budget.activeMembers;
  const totalNew = budget.newMembersExpected;
  const totalMembers = totalActives + totalNew;
  const totalLiveInCount = budget.actualOccupants;
  const totalLiveOutCount = Math.max(0, totalMembers - totalLiveInCount);
  
  const corpIncome = totalActives * (budget.octoberDuesRate + budget.februaryDuesRate + budget.insuranceRate);
  const localLiveInRevenue = totalLiveInCount * (budget.localOperationsFeeLiveIn - budget.localCreditLiveInOffset);
  const localLiveOutRevenue = totalLiveOutCount * budget.localOperationsFeeLiveOut;
  const totalMemberIncome = corpIncome + localLiveInRevenue + localLiveOutRevenue;

  const totalRevenue = totalMemberIncome + budget.miscIncome + budget.tshirtIncome; 
  const totalExpenses = budget.socialBudget + budget.recruitmentBudget + budget.sisterhoodBudget + budget.philanthropyBudget + budget.baseRentHoused + budget.miscExpense + budget.tshirtExpense;

  const miscIncomePct = totalRevenue > 0 ? (budget.miscIncome / totalRevenue) * 100 : 0;
  const miscExpensePct = totalExpenses > 0 ? (budget.miscExpense / totalExpenses) * 100 : 0;
  
  const isIrsViolation = miscIncomePct > 5.0 || miscExpensePct > 5.0;
  const needsJustification = isIrsViolation && (!budget.miscExpenseJustification || budget.miscExpenseJustification.length < 10);

  // Calculate Net Surplus for Deficit Blocking
  const expCorp = corpIncome;
  const targetHousing = (totalLiveOutCount * budget.parlorFee) + (totalMembers * budget.propertySupportFee) + budget.baseRentHoused; // simplified for Step4 context
  const expHousing = targetHousing;
  const expProg = budget.recruitmentBudget + budget.sisterhoodBudget + budget.philanthropyBudget + budget.socialBudget;
  const expMisc = budget.miscExpense + budget.tshirtExpense + 22000;
  
  const totalExpenseFull = expCorp + expHousing + expProg + expMisc;
  const netSurplus = totalRevenue - totalExpenseFull;

  const hasLocalDeficit = netSurplus < -1.0;
  const isBlocked = hasTshirtMismatch || needsJustification || hasLocalDeficit;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 animate-in fade-in">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-serif text-stone-800">Executive Council Vote Prep</h1>
        <p className="text-stone-500 max-w-lg mx-auto">Your draft is balanced! Before sending this to the Advisor Portal, your chapter's elected leaders must vote to approve this budget.</p>
      </div>

      {hasLocalDeficit && (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-xl animate-in slide-in-from-bottom-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
          <h3 className="font-bold text-rose-900 mb-2 flex items-center gap-2">
            <span className="text-xl">🚨</span> Chapter Operating Vibe Check: Red Alert
          </h3>
          <p className="text-sm text-rose-800 mb-3">
            By giving a <strong>${budget.localCreditLiveInOffset.toLocaleString()} incentive credit</strong> to your live-in members, your local chapter operating revenue dropped significantly.
          </p>
          <p className="text-sm text-rose-800 font-medium mb-3">
            Right now, your remaining local cash isn't enough to cover your baseline chapter expenses. Your net position is tracking at <strong className="font-mono text-rose-900 bg-rose-200 px-1 py-0.5 rounded">-${Math.abs(netSurplus).toLocaleString()} (In the Negative)</strong>.
          </p>
          <div className="bg-white/80 p-3 rounded-lg text-sm text-rose-900 border border-rose-200/50">
            <strong>The Reality:</strong> The chapter cannot afford this incentive without trimming costs elsewhere. Head over to <strong>Officer Budgets</strong> and cut funding for non-essential tracks, or adjust your member billing setups until your health meter scales back into a safe green profit cushion!
          </div>
        </div>
      )}

      {hasTshirtMismatch && (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-xl animate-in slide-in-from-bottom-4">
          <h3 className="font-bold text-rose-900 mb-2 flex items-center gap-2">🛑 Hold on! Your t-shirt math is a little out of pocket.</h3>
          <p className="text-sm text-rose-800 mb-3">
            Right now, you have budgeted <strong>${budget.tshirtExpense.toLocaleString()}</strong> for optional apparel expenses, but your members are only paying back <strong>${budget.tshirtIncome.toLocaleString()}</strong>. This means the chapter is accidentally losing <strong>${Math.abs(budget.tshirtIncome - budget.tshirtExpense).toLocaleString()}</strong> of local operational dues to cover extra clothes!
          </p>
          <div className="bg-white/80 p-3 rounded-lg text-sm text-rose-900 border border-rose-200/50">
            <strong>How to fix this:</strong> Go back to Step 3 and either increase the estimated number of buyers, adjust your shirt price, or trim the expense line so your Miscellaneous accounts wash out to exactly $0.00.
          </div>
        </div>
      )}

      {isIrsViolation && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl animate-in slide-in-from-bottom-4">
          <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">⚠️ EXPLAIN YOUR MISCELLANEOUS BALANCES</h3>
          <p className="text-sm text-amber-800 mb-4">
            Your Miscellaneous Chapter tracking is currently at <strong>{Math.max(miscIncomePct, miscExpensePct).toFixed(1)}%</strong>, which exceeds the recommended 5% threshold. To proceed to the Executive Council vote, please leave a quick note explaining exactly what this cash is being reserved for:
          </p>
          <textarea 
            className="w-full p-4 rounded-xl border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm text-stone-700 bg-white"
            rows={3}
            placeholder='Type explanation here... e.g., "Reserving $3,000 for a special 50th Anniversary Chapter Alumnae Gala in the spring."'
            value={budget.miscExpenseJustification || ''}
            onChange={(e) => dispatch({ type: 'UPDATE_BUDGET', payload: { miscExpenseJustification: e.target.value } })}
          />
        </div>
      )}

      <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200 text-center">
        <p className="text-lg text-stone-700 mb-6 font-medium">Ready to lock your draft and prepare your presentation?</p>
        <button 
          onClick={handleLockForEC}
          disabled={isBlocked}
          className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 mx-auto"
        >
          Lock & Generate EC Presentation <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={() => dispatch({ type: 'SET_STEP', payload: 3 })} className="px-6 py-2 border rounded-lg font-medium text-stone-600 hover:bg-stone-50">Back to Officer Budgets</button>
      </div>
    </div>
  );
}
