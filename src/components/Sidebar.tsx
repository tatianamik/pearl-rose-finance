import React from 'react';
import { useBudgetStore } from '../store';
import { CheckCircle, AlertCircle, TrendingUp, Landmark } from 'lucide-react';

export default function Sidebar() {
  const { state } = useBudgetStore();
  const { budget, fhcRates } = state;

  if (!budget) return <div className="w-64 bg-[#F8F5F2] border-l border-stone-200 p-6">Loading...</div>;

  // Real-time calculations
  const totalActives = budget.activeMembers;
  const totalNew = budget.newMembersExpected;
  const totalMembers = totalActives + totalNew;
  
  const totalLiveIn = budget.actualOccupants;
  const totalLiveOut = Math.max(0, totalMembers - totalLiveIn);

  // Revenue
  const revDues = totalActives * (budget.octoberDuesRate + budget.februaryDuesRate);
  const revInsurance = totalActives * budget.insuranceRate;
  const revLiveIn = totalLiveIn * (budget.localOperationsFeeLiveIn - budget.localCreditLiveInOffset);
  const revLiveOut = totalLiveOut * budget.localOperationsFeeLiveOut;
  const revHousing = (totalLiveIn * budget.baseRentHoused) + (totalLiveOut * budget.parlorFee) + (totalMembers * budget.propertySupportFee);
  
  const totalRevenue = revDues + revInsurance + revLiveIn + revLiveOut + revHousing + budget.tshirtIncome + budget.miscIncome;

  // Expenses
  const expCorp = revDues + revInsurance; // passed through
  const targetHousing = fhcRates ? fhcRates.baseRentHoused + (totalLiveOut * fhcRates.parlorFeePerMember) + (totalMembers * fhcRates.propertySupportFeePerMember) : revHousing;
  const expHousing = targetHousing;
  const expProg = budget.recruitmentBudget + budget.sisterhoodBudget + budget.philanthropyBudget + budget.socialBudget;
  const expMisc = budget.miscExpense + budget.tshirtExpense + 22000; // 22000 is base local ops

  const totalExpense = expCorp + expHousing + expProg + expMisc;
  const netSurplus = totalRevenue - totalExpense;

  const isBalanced = Math.abs(netSurplus) < 1.0;

  // Checks
  const fhcRentCheck = fhcRates ? (totalLiveIn * budget.baseRentHoused >= fhcRates.baseRentHoused) : true;
  const fhcParlorCheck = fhcRates ? (budget.parlorFee >= fhcRates.parlorFeePerMember) : true;

  return (
    <div className="w-80 bg-[#FAFAFA] border-l border-stone-200 p-6 flex flex-col h-full shadow-inner overflow-y-auto">
      <h2 className="text-xl font-serif text-stone-800 mb-6 flex items-center gap-2">
        <Landmark className="w-5 h-5 text-rose-500" /> Health Meter
      </h2>

      <div className="space-y-6">
        {/* Net Balance Meter */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Net Balance</div>
          <div className={`text-2xl font-bold ${isBalanced ? 'text-emerald-600' : netSurplus > 0 ? 'text-amber-500' : 'text-rose-600'}`}>
            ${netSurplus.toFixed(2)}
          </div>
          <p className="text-xs text-stone-400 mt-1">
            {isBalanced ? "Perfectly balanced! 🌸" : netSurplus > 0 ? "You have a surplus. Allocate it!" : "Deficit! Reduce expenses."}
          </p>
          {isBalanced && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />}
        </div>

        {/* FHC Compliance */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">FHC Compliance</div>
          
          <div className={`flex gap-3 p-3 rounded-lg border ${fhcRentCheck ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
            {fhcRentCheck ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
            <div className="text-sm">
              <p className={`font-medium ${fhcRentCheck ? 'text-emerald-900' : 'text-rose-900'}`}>Rent Recovery</p>
              <p className={`text-xs mt-0.5 ${fhcRentCheck ? 'text-emerald-700' : 'text-rose-700'}`}>
                {fhcRentCheck ? "Covering base rent." : "Under-billing for rent."}
              </p>
            </div>
          </div>

          <div className={`flex gap-3 p-3 rounded-lg border ${fhcParlorCheck ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-200'}`}>
            {fhcParlorCheck ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> : <TrendingUp className="w-5 h-5 text-amber-600 shrink-0" />}
            <div className="text-sm">
              <p className={`font-medium ${fhcParlorCheck ? 'text-emerald-900' : 'text-amber-900'}`}>Parlor Fees</p>
              <p className={`text-xs mt-0.5 ${fhcParlorCheck ? 'text-emerald-700' : 'text-amber-700'}`}>
                {fhcParlorCheck ? "Matching contract rate." : "Below contracted minimum."}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
