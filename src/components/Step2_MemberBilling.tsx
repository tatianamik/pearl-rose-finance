import React, { useState } from 'react';
import { useBudgetStore } from '../store';
import { AlertCircle, Plus, Trash2, Users, Lock } from 'lucide-react';
import { FacilityType, ChapterStatus, PropertyManager } from '../types';

function EmptyBedFeeAllocator({ 
  houseCapacity, 
  expectedLiveIns, 
  contractedRoomExpense, 
  totalRoomRevenue,
  liveOutMemberCount,
  termMultiplier,
  currentReserveDraw,
  currentSurcharge,
  onApplyEmptyBedFees
}) {
  const [strategy, setStrategy] = useState(currentReserveDraw > 0 ? 'use-savings' : 'split-even');
  const [savingsCushion, setSavingsCushion] = useState(currentReserveDraw || 0);

  const emptyBeds = Math.max(0, houseCapacity - expectedLiveIns);
  const rentShortfall = Math.max(0, contractedRoomExpense - totalRoomRevenue);

  // Calculate final fee per live-out member per term to close the loop
  const netShortfall = Math.max(0, rentShortfall - savingsCushion);
  const costPerLiveOutPerTerm = liveOutMemberCount > 0 
    ? (netShortfall / liveOutMemberCount) / termMultiplier
    : 0;

  if (rentShortfall === 0) return null;

  return (
    <div className="mt-8 p-5 washi-tape-pink rounded-2xl shadow-md w-full">
      {/* HEADER SECTION */}
      <div className="flex gap-2.5 items-start">
        <span className="text-xl">👋</span>
        <div>
          <h4 className="text-sm font-bold text-slate-800 handwritten text-xl">Quick heads up about your housing math!</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            The house has <strong>{houseCapacity} spots</strong>, but only <strong>{expectedLiveIns} members</strong> are living in. 
            With <strong>{emptyBeds} empty beds</strong>, we're tracking a rent shortage of <span className="text-rose-600 font-bold">${rentShortfall.toLocaleString()}</span> compared to your FHC Contract (${contractedRoomExpense.toLocaleString()}).
          </p>
        </div>
      </div>

      {/* STRATEGY SELECTION */}
      <div className="mt-4 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">How do you want to handle this?</span>
        
        <label className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition text-xs ${strategy === 'split-even' ? 'border-indigo-600 bg-indigo-50/40 font-semibold' : 'border-slate-100 hover:bg-slate-50'}`}>
          <input type="radio" checked={strategy === 'split-even'} onChange={() => { setStrategy('split-even'); setSavingsCushion(0); }} className="mt-0.5" />
          <div>
            <span className="text-slate-800 block">Split it evenly among live-out members</span>
            <span className="text-slate-400 text-[11px] font-normal">Adds a small Empty Bed Fee to everyone living out-of-house.</span>
          </div>
        </label>

        <label className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition text-xs ${strategy === 'use-savings' ? 'border-indigo-600 bg-indigo-50/40 font-semibold' : 'border-slate-100 hover:bg-slate-50'}`}>
          <input type="radio" checked={strategy === 'use-savings'} onChange={() => setStrategy('use-savings')} className="mt-0.5" />
          <div>
            <span className="text-slate-800 block">Use some chapter savings to lower the cost</span>
            <span className="text-slate-400 text-[11px] font-normal">Cover part of the bill with reserves so member dues stay lower.</span>
          </div>
        </label>
      </div>

      {/* SAVINGS INPUT FORM */}
      {strategy === 'use-savings' && (
        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <label className="font-medium text-slate-600 block mb-1">How much savings are you pitching in?</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">$</span>
            <input 
              type="number" 
              max={rentShortfall}
              placeholder="e.g. 5000"
              value={savingsCushion === 0 ? '' : savingsCushion}
              onChange={(e) => setSavingsCushion(Math.min(rentShortfall, Number(e.target.value)))}
              className="w-full pl-6 pr-2 py-1.5 border border-slate-300 rounded-lg bg-white"
            />
          </div>
          <span className="text-[10px] text-amber-600 block mt-1">
            ✨ Your Finance Specialist will just need to double-check and sign off on using savings!
          </span>
        </div>
      )}

      {/* BOTTOM LINE BOX */}
      <div className="mt-4 p-3 bg-slate-900 text-white rounded-xl text-xs space-y-1">
        <div className="flex justify-between text-slate-400 text-[11px]">
          <span>Remaining Shortage:</span>
          <span>${netShortfall.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-800">
          <span>New Fee / Live-Out / Term:</span>
          <span className="text-emerald-400">${costPerLiveOutPerTerm.toFixed(2)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onApplyEmptyBedFees(costPerLiveOutPerTerm, savingsCushion)}
        className={`w-full mt-3 font-bold text-xs py-3 rounded-xl transition ${currentSurcharge === costPerLiveOutPerTerm && currentReserveDraw === savingsCushion ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
      >
        {currentSurcharge === costPerLiveOutPerTerm && currentReserveDraw === savingsCushion ? 'Shortfall Applied' : 'Update Billing & Balance Housing!'}
      </button>
    </div>
  );
}

function PerfectedDuesCalculator({ 
  memberType = 'active-fall', // active-fall, active-spring, nm-fall, nm-spring
  ihqActiveDuesPerSemester = 95, // Set globally by IHQ for Oct & Feb
  ihqInsuranceAnnual = 60,       // Set globally by IHQ ($60 total)
  initialTotalDues = 0,
  isPreviewMode = false,
  onDuesCompiled 
}: any) {
  // Precision Logic Engine matching exact international schedule
  let currentIhqDues = ihqActiveDuesPerSemester; 
  let currentIhqInsurance = ihqInsuranceAnnual / 2; // $60 split evenly over 2 terms

  // Switch gears instantly if handling the unique Spring New Member track
  if (memberType === 'nm-spring') {
    currentIhqDues = 50;        // Mandated February New Member Dues
    currentIhqInsurance = 10;   // Mandated Spring New Member Insurance
  }

  const defaultLocalOps = initialTotalDues > 0 ? initialTotalDues - (currentIhqDues + currentIhqInsurance) : 355;
  const [localOpsFee, setLocalOpsFee] = useState<number>(defaultLocalOps);

  const grandTotalDues = Number(localOpsFee) + currentIhqDues + currentIhqInsurance;

  return (
    <div className="journal-paper p-5 rounded-2xl shadow-xl max-w-sm w-[350px]">
      <div className="flex justify-between items-start pb-2.5 border-b border-slate-100">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Billing Group Setup</h4>
          <span className="text-sm font-black text-slate-800">
            {memberType.includes('nm') ? '✨ New Member Roster' : '👯 Active Roster'}
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-sm">
          {memberType.includes('fall') ? 'October Cycle' : 'February Cycle'}
        </span>
      </div>

      <div className="mt-4 space-y-3.5 text-left">
        {/* SECTION 1: LOCAL CONTROLS */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            1. Local Chapter Operations Fee
          </label>
          <p className="text-[11px] text-slate-400 mb-1.5 leading-snug">
            Your local fund for t-shirts, recruitment events, social venue deposits, and chapter programming.
          </p>
          <div className="relative rounded-lg shadow-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
            <input
              type="number"
              value={localOpsFee}
              onChange={(e) => setLocalOpsFee(Number(e.target.value))}
              className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* SECTION 2: FIXED AUTOMATED LINES */}
        <div className="space-y-2 pt-2.5 border-t border-slate-200 relative">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            2. Fixed International Fees (Auto-Calculated)
          </label>
          
          <div className="flex justify-between text-xs p-2 bg-slate-50 border border-slate-100 rounded-lg">
            <div className="flex flex-col">
              <span className="text-slate-600">👑 IHQ National Membership Dues</span>
              {isPreviewMode && (
                <span className="text-[9px] text-amber-600 mt-0.5 leading-tight">
                  Preview: Using last year's ${currentIhqDues} schedule. Will auto-update in Jan!
                </span>
              )}
            </div>
            <span className="font-mono font-bold text-slate-800">${currentIhqDues.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-xs p-2 bg-slate-50 border border-slate-100 rounded-lg">
            <div className="flex flex-col">
              <span className="text-slate-600">🛡️ IHQ Liability Insurance Fee</span>
              {isPreviewMode && (
                <span className="text-[9px] text-amber-600 mt-0.5 leading-tight">
                  Preview: Placeholder split. Keep an eye out for final Feb update.
                </span>
              )}
            </div>
            <span className="font-mono font-bold text-slate-800">${currentIhqInsurance.toFixed(2)}</span>
          </div>
        </div>

        {/* SECTION 3: THE COMPILATION BAR */}
        <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center mt-4">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide block">
              Total Student Bill Amount:
            </span>
            <span className="text-lg font-black text-emerald-400">${grandTotalDues.toFixed(2)}</span>
          </div>
          <button
            type="button"
            onClick={() => onDuesCompiled(grandTotalDues, localOpsFee)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-3 py-2 rounded-lg transition shadow-sm"
          >
            Save & Sync Group
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Step2_MemberBilling() {
  const { state, dispatch } = useBudgetStore();
  const { budget, fhcRates } = state;

  const [newGroupName, setNewGroupName] = useState('');
  const [newHasMeals, setNewHasMeals] = useState(false);
  const [newHasParking, setNewHasParking] = useState(false);
  const [activeDuesEdit, setActiveDuesEdit] = useState<string | null>(null);

  if (!budget) return null;

  const isColony = budget.status === ChapterStatus.COLONY;
  const handleSovereignClick = () => {
    alert("Colony budgets are established by International HQ and cannot be reduced prior to chartering.");
  };

  const termCount = budget.termSystem === 'quarter' ? 3 : 2;

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    
    const newGroup = {
      id: `bg_${Date.now()}`,
      groupName: newGroupName + (newHasMeals ? ' + Meals' : '') + (newHasParking ? ' + Parking' : ''),
      memberCount: 0,
      breakdown: {
        chapterDues: 300,
        parlorFee: (budget.propertyManager === PropertyManager.FHC && fhcRates) ? fhcRates.contractedRates.parlorFeePerMember : (budget.facilityType === FacilityType.RESIDENTIAL ? 180 : 0),
        roomCharge: newGroupName.toLowerCase().includes('room') || newGroupName.toLowerCase().includes('porch') ? 2000 : 0,
        parkingFee: newHasParking ? 200 : 0
      }
    };

    dispatch({
      type: 'UPDATE_BUDGET',
      payload: {
        billingGroups: [...(budget.billingGroups || []), newGroup]
      }
    });

    setNewGroupName('');
    setNewHasMeals(false);
    setNewHasParking(false);
  };

  const handleUpdateGroup = (id: string, field: string, value: number) => {
    const updated = budget.billingGroups.map(bg => {
      if (bg.id === id) {
        if (field === 'memberCount') return { ...bg, memberCount: value };
        return { ...bg, breakdown: { ...bg.breakdown, [field]: value } };
      }
      return bg;
    });
    dispatch({ type: 'UPDATE_BUDGET', payload: { billingGroups: updated } });
  };

  const handleRemoveGroup = (id: string) => {
    dispatch({ type: 'UPDATE_BUDGET', payload: { billingGroups: budget.billingGroups.filter(bg => bg.id !== id) } });
  };

  const handleApplyEmptyBedFees = (surcharge: number, reserveDraw: number) => {
    dispatch({
      type: 'UPDATE_BUDGET',
      payload: {
        emptyBedMemberSurcharge: surcharge,
        emptyBedReserveDraw: reserveDraw
      }
    });
  };

  const totalMembersAssigned = (budget.billingGroups || []).reduce((sum, bg) => sum + bg.memberCount, 0);
  const totalRoster = budget.activeMembers + budget.newMembersExpected;

  const liveOutMemberCount = (budget.billingGroups || []).reduce((sum, bg) => sum + (bg.breakdown.roomCharge === 0 ? bg.memberCount : 0), 0);
  const totalRoomRevenue = (budget.billingGroups || []).reduce((sum, bg) => sum + (bg.breakdown.roomCharge * termCount * bg.memberCount), 0);
  const totalRentShortfall = Math.max(0, budget.baseRentHoused - totalRoomRevenue);

  const appliedShortfallCover = budget.emptyBedReserveDraw + (budget.emptyBedMemberSurcharge * liveOutMemberCount * termCount);
  const isRentBalanced = totalRentShortfall === 0 || Math.abs(appliedShortfallCover - totalRentShortfall) < 1.0;

  const canProceed = totalMembersAssigned === totalRoster && isRentBalanced;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-4xl handwritten text-stone-800">Dynamic Member Billing</h1>
        <p className="text-stone-500 mt-2 font-medium">Build your local billing groups. Rates entered below should be <strong className="text-stone-700">Per Term</strong>.</p>
      </div>

      <div className="journal-paper rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#FAF6ED]/50 border-b border-stone-200 p-4 flex justify-between items-center torn-header">
          <div className="flex items-center gap-2 text-stone-800 font-semibold handwritten text-2xl">
            <span className="text-xl">📊</span> Matrix Generator
          </div>
          <div className={`text-sm font-bold ${totalMembersAssigned === totalRoster ? 'text-emerald-600' : 'text-amber-600'}`}>
            Members Assigned: {totalMembersAssigned} / {totalRoster}
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Add New Group Builder */}
          <div className="bg-white/60 p-4 rounded-lg border border-stone-200 flex items-end gap-4 shadow-sm">
            <div className="flex-1">
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">New Setup Name (e.g., "The Porch")</label>
              <input 
                type="text" 
                value={newGroupName} 
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="Living Setup Name..."
                className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-4 pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newHasMeals} onChange={e => setNewHasMeals(e.target.checked)} className="rounded text-indigo-600" />
                <span className="text-sm font-medium text-stone-700">Meal Plan</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newHasParking} onChange={e => setNewHasParking(e.target.checked)} className="rounded text-indigo-600" />
                <span className="text-sm font-medium text-stone-700">Parking</span>
              </label>
            </div>
            <button 
              onClick={handleAddGroup}
              disabled={!newGroupName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white font-bold px-4 py-2 rounded transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> Add Setup
            </button>
          </div>

          {/* Matrix Table */}
          {budget.billingGroups && budget.billingGroups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-stone-200 text-xs uppercase tracking-wider text-stone-500">
                    <th className="pb-3 font-bold">Group Name</th>
                    <th className="pb-3 font-bold w-24">Members</th>
                    <th className="pb-3 font-bold w-28">Base Dues</th>
                    {(budget.facilityType === FacilityType.SUITE || budget.facilityType === FacilityType.RESIDENTIAL) && <th className="pb-3 font-bold w-28">Parlor Fee</th>}
                    {budget.facilityType === FacilityType.RESIDENTIAL && <th className="pb-3 font-bold w-28">Room Charge</th>}
                    <th className="pb-3 font-bold w-28">Parking</th>
                    <th className="pb-3 font-bold text-right">Total / Term</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {budget.billingGroups.map(bg => {
                    const totalPerTerm = bg.breakdown.chapterDues + bg.breakdown.parlorFee + bg.breakdown.roomCharge + bg.breakdown.parkingFee;
                    const annualTotal = totalPerTerm * termCount;
                    
                    return (
                      <tr key={bg.id} className="group hover:bg-stone-50 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-stone-800">{bg.groupName}</td>
                        <td className="py-3 pr-4">
                          <input type="number" min="0" value={bg.memberCount} onChange={e => handleUpdateGroup(bg.id, 'memberCount', Number(e.target.value))} className="w-16 px-2 py-1 border border-stone-300 rounded text-sm" />
                        </td>
                        <td className="py-3 pr-4 relative">
                          {activeDuesEdit === bg.id ? (
                            <div className="absolute top-0 left-0 z-10 w-[350px]">
                              <PerfectedDuesCalculator 
                                memberType={bg.groupName.toLowerCase().includes('new member') ? 'nm-fall' : 'active-fall'}
                                initialTotalDues={bg.breakdown.chapterDues}
                                isPreviewMode={state.isGlobalPreviewMode}
                                ihqActiveDuesPerSemester={budget.octoberDuesRate}
                                ihqInsuranceAnnual={budget.insuranceRate}
                                onDuesCompiled={(grandTotal: number, localOps: number) => {
                                  handleUpdateGroup(bg.id, 'chapterDues', grandTotal);
                                  setActiveDuesEdit(null);
                                }}
                              />
                            </div>
                          ) : isColony ? (
                            <button 
                              onClick={handleSovereignClick}
                              className="w-20 px-2 py-1 border border-stone-300 rounded text-sm bg-stone-100 text-left font-mono text-stone-500 shadow-sm cursor-not-allowed flex items-center justify-between"
                            >
                              ${bg.breakdown.chapterDues}
                              <Lock className="w-3 h-3 ml-1" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => setActiveDuesEdit(bg.id)}
                              className="w-20 px-2 py-1 border border-stone-300 rounded text-sm bg-white hover:bg-stone-50 text-left font-mono text-indigo-700 shadow-sm transition"
                            >
                              ${bg.breakdown.chapterDues}
                            </button>
                          )}
                        </td>
                        {(budget.facilityType === FacilityType.SUITE || budget.facilityType === FacilityType.RESIDENTIAL) && (
                          <td className="py-3 pr-4">
                            {budget.propertyManager === PropertyManager.FHC || isColony ? (
                              <div onClick={isColony ? handleSovereignClick : undefined} className={`flex items-center gap-1.5 w-24 px-2 py-1 border border-stone-200 bg-stone-100 rounded text-sm text-stone-500 font-mono ${isColony ? 'cursor-not-allowed' : ''}`} title="Locked by FHC Registry">
                                <span className="text-[10px]">🔒</span>
                                ${(fhcRates?.contractedRates.parlorFeePerMember || budget.parlorFee).toFixed(2)}
                              </div>
                            ) : (
                              <input type="number" min="0" value={bg.breakdown.parlorFee} onChange={e => handleUpdateGroup(bg.id, 'parlorFee', Number(e.target.value))} className="w-20 px-2 py-1 border border-stone-300 rounded text-sm" />
                            )}
                          </td>
                        )}
                        {budget.facilityType === FacilityType.RESIDENTIAL && (
                          <td className="py-3 pr-4">
                            {isColony ? (
                              <div onClick={handleSovereignClick} className="flex items-center gap-1.5 w-24 px-2 py-1 border border-stone-200 bg-stone-100 rounded text-sm text-stone-500 font-mono cursor-not-allowed" title="Locked">
                                <span className="text-[10px]">🔒</span>
                                ${bg.breakdown.roomCharge}
                              </div>
                            ) : (
                              <input type="number" min="0" value={bg.breakdown.roomCharge} onChange={e => handleUpdateGroup(bg.id, 'roomCharge', Number(e.target.value))} className="w-20 px-2 py-1 border border-stone-300 rounded text-sm" />
                            )}
                          </td>
                        )}
                        <td className="py-3 pr-4">
                          <input type="number" min="0" value={bg.breakdown.parkingFee} onChange={e => handleUpdateGroup(bg.id, 'parkingFee', Number(e.target.value))} className="w-20 px-2 py-1 border border-stone-300 rounded text-sm" />
                        </td>
                        <td className="py-3 text-right">
                          <div className="font-bold text-stone-800">${totalPerTerm.toLocaleString()}</div>
                          <div className="text-[10px] text-stone-400 uppercase">x {termCount} Terms = ${annualTotal.toLocaleString()}</div>
                        </td>
                        <td className="py-3 pl-4 text-right">
                          <button onClick={() => handleRemoveGroup(bg.id)} className="text-stone-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-8 border-2 border-dashed border-stone-200 rounded-lg text-stone-400">
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p>No billing groups created yet.</p>
              <p className="text-sm">Use the builder above to create your roster breakdown.</p>
            </div>
          )}

          {totalMembersAssigned !== totalRoster && (
            <div className="flex items-start gap-2 p-3 washi-tape-yellow rounded-md text-amber-900 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <p>
                You have <strong>{totalRoster}</strong> total members expected, but only <strong>{totalMembersAssigned}</strong> are assigned to billing groups. Please ensure every member is accounted for.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* IN-HOUSE INCENTIVE GUIDE */}
      {budget.propertyManager === PropertyManager.FHC && budget.facilityType === FacilityType.RESIDENTIAL && (
        <div className="journal-paper p-6 rounded-xl shadow-sm border-2 border-indigo-200 overflow-hidden relative mt-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-indigo-100 torn-header">
            <span className="text-xl">🏠</span>
            <h3 className="font-bold text-indigo-900 handwritten text-2xl">Want to create an in-house incentive?</h3>
          </div>
          
          <p className="text-sm text-stone-600 mb-4 font-medium">
            Looking to encourage more sisters to live in the house this year?
          </p>

          <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-start gap-3 mb-6">
            <Lock className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-900 leading-relaxed">
              <strong>⚠️ REMINDER:</strong> Your FHC Contract strictly requires a <strong className="text-rose-600">${(fhcRates?.contractedRates.parlorFeePerMember || budget.parlorFee).toFixed(2)}</strong> Parlor Fee for all members. The system has locked this line in the matrix above to stay compliant with international corporate rules.
            </p>
          </div>

          <div className="mb-6 space-y-4">
            <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2">💡 THE REGIONAL METHOD</h4>
            <p className="text-sm text-stone-600">
              If you want to lower the financial burden for live-in members, do not touch the Parlor Fee. Instead, use the slider below to offer a credit on their <strong>LOCAL Chapter Operations Fee</strong>:
            </p>
            
            <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
              <div className="flex justify-between text-sm font-bold text-indigo-900 mb-2">
                <span>Live-In Local Fee Discount</span>
                <span className="font-mono">${budget.localCreditLiveInOffset.toFixed(2)} Credit / Semester</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1000" 
                step="10"
                value={budget.localCreditLiveInOffset} 
                onChange={(e) => dispatch({ type: 'UPDATE_BUDGET', payload: { localCreditLiveInOffset: Number(e.target.value) }})}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          <div className="bg-slate-800 text-white p-5 rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">📊 Real-Time Overhead Monitor</h4>
            <div className="flex justify-between text-sm mb-2 font-mono">
              <span className="text-amber-400">👉 Total Chapter Income Impact:</span>
              <span className="text-amber-400">-${(budget.localCreditLiveInOffset * budget.actualOccupants * termCount).toLocaleString()}</span>
            </div>
            {budget.localCreditLiveInOffset > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-600 text-sm font-medium text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                Warning: This discount will lower your local operations cash cushion! Make sure your Officer Budgets (Step 3) are trimmed to afford this.
              </div>
            )}
          </div>
        </div>
      )}

      {budget.facilityType === FacilityType.RESIDENTIAL && totalRentShortfall > 0 && (
        <EmptyBedFeeAllocator 
          houseCapacity={budget.contractedBeds}
          expectedLiveIns={budget.actualOccupants}
          contractedRoomExpense={budget.baseRentHoused}
          totalRoomRevenue={totalRoomRevenue}
          liveOutMemberCount={liveOutMemberCount}
          termMultiplier={termCount}
          currentReserveDraw={budget.emptyBedReserveDraw}
          currentSurcharge={budget.emptyBedMemberSurcharge}
          onApplyEmptyBedFees={handleApplyEmptyBedFees}
        />
      )}

      {/* Pearl Strand Easter Egg */}
      {canProceed && budget.facilityType === FacilityType.RESIDENTIAL && (
        <div className="py-6 flex justify-center animate-in zoom-in slide-in-from-bottom-4 duration-500">
          <div 
            className="w-3/4 h-2 rounded-full opacity-80" 
            style={{ 
              backgroundImage: 'radial-gradient(circle, #EBE3D5 4px, transparent 4px)',
              backgroundSize: '12px 12px',
              backgroundPosition: 'center',
              boxShadow: '0 2px 4px rgba(61, 53, 49, 0.05)'
            }} 
            title="Pearl Strand - FHC Housing Lines Perfectly Balanced!"
          />
        </div>
      )}
      
      <div className="flex justify-end pt-4">
        <button 
          onClick={() => dispatch({ type: 'SET_STEP', payload: 3 })}
          className={`px-6 py-2 rounded-lg font-medium shadow-sm transition-colors ${!canProceed ? 'bg-stone-300 text-stone-500 cursor-not-allowed' : 'bg-rose-600 text-white hover:bg-rose-700'}`}
          disabled={!canProceed}
        >
          {totalMembersAssigned !== totalRoster 
            ? 'Assign all members to continue' 
            : !isRentBalanced 
              ? 'Balance Rent Shortfall to continue' 
              : 'Continue to Officer Budgets'}
        </button>
      </div>
    </div>
  );
}
