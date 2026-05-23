import React from 'react';
import { useBudgetStore } from '../store';
import { ArrowRight, CheckCircle2, Clock, Lock, Play } from 'lucide-react';
import { FacilityType } from '../types';

export default function Step0_Dashboard() {
  const { state, dispatch } = useBudgetStore();
  const { budget } = state;

  if (!budget) return null;

  // Determine Completion Status of Steps
  const isStep1Complete = budget.facilityType !== FacilityType.UNHOUSED || budget.activeMembers > 0;
  
  const totalRoster = budget.activeMembers + budget.newMembersExpected;
  const totalAssigned = budget.billingGroups.reduce((acc, g) => acc + g.memberCount, 0);
  const isStep2Complete = totalRoster > 0 && totalAssigned === totalRoster;
  
  const isStep3Complete = budget.recruitmentBudget > 0 && budget.socialBudget > 0;
  const isStep4Complete = budget.draftStage === 'approved' || budget.draftStage === 'exported';

  const navigateTo = (stepNum: number) => {
    dispatch({ type: 'SET_STEP', payload: stepNum });
  };

  const hasNeedsInfoFlags = budget.needsInfoFlags && Object.values(budget.needsInfoFlags).some(f => f.flagged);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in pt-8">
      
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-slate-800">Welcome Back, {state.session?.name.split(' ')[0] || 'VPF'}! 👋</h1>
          <p className="text-slate-500 mt-2">Let's build this budget. Your progress is saved up to the second.</p>
        </div>
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-rose-200">
          🌸
        </div>
      </div>

      {hasNeedsInfoFlags && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 shadow-sm">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-900 text-sm">Action Needed: Unresolved Flags</h4>
            <p className="text-xs text-amber-800 mt-1">You have items flagged with ❓ Need Info. You'll need to resolve them before generating your final Billhighway export.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 ml-2">Your Task Blueprint</h2>
        
        {/* STEP 1 */}
        <div onClick={() => navigateTo(1)} className="group cursor-pointer bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between hover:border-indigo-300 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            {isStep1Complete ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Play className="w-6 h-6 text-indigo-500" />}
            <div>
              <h3 className={`font-bold ${isStep1Complete ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>Step 1: Calendar & Facility Profile</h3>
              <p className="text-xs text-slate-400">Establish your housing structure and member base.</p>
            </div>
          </div>
          <ArrowRight className={`w-5 h-5 ${isStep1Complete ? 'text-slate-300' : 'text-indigo-500 group-hover:translate-x-1'} transition-transform`} />
        </div>

        {/* STEP 2 */}
        <div onClick={() => isStep1Complete && navigateTo(2)} className={`group bg-white rounded-2xl border p-5 flex items-center justify-between transition ${!isStep1Complete ? 'opacity-50 border-slate-100' : 'cursor-pointer border-slate-200 hover:border-indigo-300 hover:shadow-md'}`}>
          <div className="flex items-center gap-4">
            {!isStep1Complete ? <Lock className="w-6 h-6 text-slate-300" /> : isStep2Complete ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Play className="w-6 h-6 text-indigo-500" />}
            <div>
              <h3 className={`font-bold ${!isStep1Complete ? 'text-slate-400' : isStep2Complete ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>Step 2: Roster & Membership Counts</h3>
              <p className="text-xs text-slate-400">Build your local billing setups and distribute beds.</p>
            </div>
          </div>
          {isStep1Complete && <ArrowRight className={`w-5 h-5 ${isStep2Complete ? 'text-slate-300' : 'text-indigo-500 group-hover:translate-x-1'} transition-transform`} />}
        </div>

        {/* STEP 3 */}
        <div onClick={() => isStep2Complete && navigateTo(3)} className={`group bg-white rounded-2xl border p-5 flex items-center justify-between transition ${!isStep2Complete ? 'opacity-50 border-slate-100' : 'cursor-pointer border-slate-200 hover:border-indigo-300 hover:shadow-md'}`}>
          <div className="flex items-center gap-4">
            {!isStep2Complete ? <Lock className="w-6 h-6 text-slate-300" /> : isStep3Complete ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Play className="w-6 h-6 text-indigo-500" />}
            <div>
              <h3 className={`font-bold ${!isStep2Complete ? 'text-slate-400' : isStep3Complete ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>Step 3: Officer Operations Fuel</h3>
              <p className="text-xs text-slate-400">Fund recruitment, social, and admin overhead.</p>
            </div>
          </div>
          {isStep2Complete && <ArrowRight className={`w-5 h-5 ${isStep3Complete ? 'text-slate-300' : 'text-indigo-500 group-hover:translate-x-1'} transition-transform`} />}
        </div>

        {/* STEP 4 & 5 */}
        <div onClick={() => isStep3Complete && navigateTo(4)} className={`group bg-white rounded-2xl border p-5 flex items-center justify-between transition ${!isStep3Complete ? 'opacity-50 border-slate-100' : 'cursor-pointer border-slate-200 hover:border-indigo-300 hover:shadow-md'}`}>
          <div className="flex items-center gap-4">
            {!isStep3Complete ? <Lock className="w-6 h-6 text-slate-300" /> : isStep4Complete ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Play className="w-6 h-6 text-rose-500" />}
            <div>
              <h3 className={`font-bold ${!isStep3Complete ? 'text-slate-400' : isStep4Complete ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>Step 4: Final Review & Launch</h3>
              <p className="text-xs text-slate-400">Balance check, Advisor submission, and Billhighway export.</p>
            </div>
          </div>
          {isStep3Complete && <ArrowRight className={`w-5 h-5 ${isStep4Complete ? 'text-slate-300' : 'text-rose-500 group-hover:translate-x-1'} transition-transform`} />}
        </div>
      </div>
    </div>
  );
}
