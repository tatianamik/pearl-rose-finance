import React, { useState } from 'react';
import { useBudgetStore } from '../store';
import { OfficerStructure, ChapterStatus } from '../types';
import { Briefcase, HeartHandshake, Mic, Calculator, PartyPopper, Lock } from 'lucide-react';
import NeedsInfoToggle from './NeedsInfoToggle';

export default function Step3_OfficerBudgets() {
  const { state, dispatch } = useBudgetStore();
  const { budget } = state;
  const [showEventCalc, setShowEventCalc] = useState(false);
  const [showSpendCalc, setShowSpendCalc] = useState(false);
  const [showTechCalc, setShowTechCalc] = useState(false);
  const [showIrsCalc, setShowIrsCalc] = useState(false);
  const [showLcCalc, setShowLcCalc] = useState(false);
  const [showLargeChapterCalc, setShowLargeChapterCalc] = useState(false);

  // Local state for the event calculator
  const [guestRatio, setGuestRatio] = useState(0.75);
  const [alumnaeCount, setAlumnaeCount] = useState(25);
  const [parentsCount, setParentsCount] = useState(40);
  const [vipCount, setVipCount] = useState(5);
  const [cateringPerHead, setCateringPerHead] = useState(40);
  const [favorsPerHead, setFavorsPerHead] = useState(12);
  const [fixedVenueCost, setFixedVenueCost] = useState(1500);
  const [fixedDecorCost, setFixedDecorCost] = useState(400);
  const [isSubsidized, setIsSubsidized] = useState(false);
  const [ticketPrice, setTicketPrice] = useState(25);

  // Local state for the tech calculator
  const [subscriptions, setSubscriptions] = useState([
    { id: 'zoom', name: 'Zoom Pro (Exec/Chapter Meetings)', cost: 160, checked: false, type: 'annual' },
    { id: 'greekstudy', name: 'GreekStudy (Academic Tracking)', cost: 120, checked: false, type: 'annual' },
    { id: 'canva', name: 'Canva Pro for Teams (VP Marketing)', cost: 150, checked: false, type: 'annual' },
    { id: 'website', name: 'Local Website Hosting / Domain', cost: 100, checked: false, type: 'annual' },
  ]);
  const [customName, setCustomName] = useState('');
  const [customCost, setCustomCost] = useState('');

  // Local state for LC Visits
  const [visitCount, setVisitCount] = useState(budget?.lcMandatoryVisits || 1);
  const [unhousedRate, setUnhousedRate] = useState(350);

  // Local state for Large Chapter Fee
  const [feeTier, setFeeTier] = useState('');
  const [customFeeAmount, setCustomFeeAmount] = useState('');

  if (!budget) return null;

  const isColony = budget.status === ChapterStatus.COLONY;
  const handleSovereignClick = () => {
    alert("Colony budgets are established by International HQ and cannot be reduced prior to chartering.");
  };

  const updateBudget = (field: string, value: number) => {
    dispatch({ type: 'UPDATE_BUDGET', payload: { [field]: value } });
  };

  // Processing Fee Estimator Logic
  const totalActives = budget.activeMembers;
  const totalNew = budget.newMembersExpected;
  const totalMembers = totalActives + totalNew;
  const totalLiveInCount = budget.actualOccupants;
  const totalLiveOutCount = Math.max(0, totalMembers - totalLiveInCount);
  
  const corpIncome = totalActives * (budget.octoberDuesRate + budget.februaryDuesRate + budget.insuranceRate);
  const localLiveInRevenue = totalLiveInCount * (budget.localOperationsFeeLiveIn - budget.localCreditLiveInOffset);
  const localLiveOutRevenue = totalLiveOutCount * budget.localOperationsFeeLiveOut;
  const totalMemberIncome = corpIncome + localLiveInRevenue + localLiveOutRevenue;

  const cardPercentage = budget.processingFeeCardPercentage;
  const achFee = totalMemberIncome * 0.01;
  const cardFee = totalMemberIncome * 0.03;
  const blendedRate = 0.01 + ((cardPercentage / 100) * 0.02);
  const estimatedFee = totalMemberIncome * blendedRate;
  
  const isTooLowWarning = budget.processingFee < achFee;

  // Panhellenic Dues Logic
  const fallActives = budget.activeMembers;
  const fallNMs = budget.newMembersExpected;
  const springActives = Math.floor((budget.activeMembers + budget.newMembersExpected) * ((100 - budget.attritionFallPercent) / 100));
  const springNMs = 0; // Assuming formal recruitment is fall-only for this simple calc

  const panhellenicFallTotal = (fallActives * budget.panhellenicActiveRate) + (fallNMs * budget.panhellenicNewMemberRate);
  const panhellenicSpringTotal = (springActives * budget.panhellenicActiveRate) + (springNMs * budget.panhellenicNewMemberRate);
  const panhellenicAnnualTotal = panhellenicFallTotal + panhellenicSpringTotal;

  // Event Calc Logic
  const dateCount = Math.round(fallActives * guestRatio);
  const totalAttendance = fallActives + dateCount + alumnaeCount + parentsCount + vipCount;
  const totalVariableCost = totalAttendance * (Number(cateringPerHead) + Number(favorsPerHead));
  const totalFixedCost = Number(fixedVenueCost) + Number(fixedDecorCost);
  const grandTotalEventBudget = totalVariableCost + totalFixedCost;
  const totalTicketIncome = isSubsidized ? ((alumnaeCount + parentsCount) * ticketPrice) : 0;

  const handleApplyEventBudget = () => {
    dispatch({
      type: 'UPDATE_BUDGET',
      payload: {
        socialBudget: grandTotalEventBudget,
        ...(isSubsidized ? { miscIncome: budget.miscIncome + totalTicketIncome } : {})
      }
    });
    setShowEventCalc(false);
  };

  // Spend Related Fees Calc Logic
  const CARD_UNIT_COST = 9;
  const totalCardCost = budget.spendRelatedCards * CARD_UNIT_COST;

  let totalCheckCost = 0;
  let checkBreakdownText = "No checks requested";
  if (budget.spendRelatedChecks > 0 && budget.spendRelatedChecks <= 50) {
    totalCheckCost = 30;
    checkBreakdownText = "50-Check Pack Tier";
  } else if (budget.spendRelatedChecks > 50 && budget.spendRelatedChecks <= 100) {
    totalCheckCost = 40;
    checkBreakdownText = "100-Check Pack Tier";
  } else if (budget.spendRelatedChecks > 100 && budget.spendRelatedChecks <= 200) {
    totalCheckCost = 60;
    checkBreakdownText = "200-Check Pack Tier";
  } else if (budget.spendRelatedChecks > 200) {
    const packsOf200 = Math.floor(budget.spendRelatedChecks / 200);
    const remainder = budget.spendRelatedChecks % 200;
    let remainderCost = 0;
    if (remainder > 0 && remainder <= 50) remainderCost = 30;
    else if (remainder > 50 && remainder <= 100) remainderCost = 40;
    else if (remainder > 100) remainderCost = 60;
    totalCheckCost = (packsOf200 * 60) + remainderCost;
    checkBreakdownText = `${packsOf200}x (200-pack) + remainder adjustment`;
  }
  const grandTotal6800 = totalCardCost + totalCheckCost;

  // Recommended cards based on structure
  let recommendedCards = 4;
  if (budget.officerStructure === OfficerStructure.A) recommendedCards = 12;
  else if (budget.officerStructure === OfficerStructure.B) recommendedCards = 10;
  else if (budget.officerStructure === OfficerStructure.C) recommendedCards = 8;
  else if (budget.officerStructure === OfficerStructure.MC) recommendedCards = 2;

  const isMC = budget.officerStructure === OfficerStructure.MC;

  // Tech Expense Calc Logic
  const toggleSubscription = (id: string) => {
    setSubscriptions(subscriptions.map(sub => 
      sub.id === id ? { ...sub, checked: !sub.checked } : sub
    ));
  };

  const addCustomSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customCost) return;
    setSubscriptions([
      ...subscriptions,
      { id: Date.now().toString(), name: customName, cost: Number(customCost), checked: true, type: 'annual' }
    ]);
    setCustomName('');
    setCustomCost('');
  };

  const total5040 = subscriptions
    .filter(sub => sub.checked)
    .reduce((sum, sub) => sum + sub.cost, 0);

  // IRS Logic
  const IRS_THRESHOLD = 50000;
  const isBelowThreshold = totalMemberIncome < IRS_THRESHOLD;

  // LC Visits Logic
  let baselineRatePerVisit = 350;
  let scenarioLabel = "";

  if (budget.hasFacility && budget.hasMeals) {
    baselineRatePerVisit = 200;
    scenarioLabel = "Chapter w/ facility & meal service";
  } else if (budget.hasFacility && !budget.hasMeals) {
    baselineRatePerVisit = 350;
    scenarioLabel = "Chapter w/ facility & no meal service";
  } else {
    baselineRatePerVisit = unhousedRate; 
    scenarioLabel = "Chapter w/ no facility or meal service";
  }

  const total5115Budget = baselineRatePerVisit * visitCount;
  const hasMandatoryVisits = budget.lcMandatoryVisits > 1;

  // IRS 5% Guardrail Logic
  // Approximating Total Revenue & Expenses for Prototype
  const totalRevenue = totalMemberIncome + budget.miscIncome + budget.tshirtIncome; 
  const totalExpenses = budget.socialBudget + budget.recruitmentBudget + budget.sisterhoodBudget + budget.philanthropyBudget + budget.baseRentHoused + budget.miscExpense + budget.tshirtExpense;

  const miscIncomePct = totalRevenue > 0 ? (budget.miscIncome / totalRevenue) * 100 : 0;
  const miscExpensePct = totalExpenses > 0 ? (budget.miscExpense / totalExpenses) * 100 : 0;
  
  const isIrsViolation = miscIncomePct > 5.0 || miscExpensePct > 5.0;
  const taxAuthority = budget.isCanadian ? "CRA" : "IRS";
  const taxForm = budget.isCanadian ? "T1044 NPO Information Return" : "Form 990";
  const taxEntity = budget.isCanadian ? "Canada Revenue Agency (CRA) guidelines for Non-Profit Organizations (NPOs)" : "IRS filing guidelines for 501(c)(7) non-profit organizations";

  // T-Shirt Logic
  const [newShirtName, setNewShirtName] = useState('');
  const [newShirtBuyers, setNewShirtBuyers] = useState(80);
  const [newShirtCost, setNewShirtCost] = useState(25);

  const handleAddTshirt = () => {
    if (!newShirtName) return;
    const totalCost = newShirtBuyers * newShirtCost;
    const newOrder = {
      id: Date.now().toString(),
      description: newShirtName,
      quantity: newShirtBuyers,
      pricePerUnit: newShirtCost,
      totalIncome: totalCost,
      totalExpense: totalCost
    };
    
    dispatch({
      type: 'UPDATE_BUDGET',
      payload: {
        tshirtOrders: [...(budget.tshirtOrders || []), newOrder],
        tshirtIncome: budget.tshirtIncome + totalCost,
        tshirtExpense: budget.tshirtExpense + totalCost
      }
    });
    setNewShirtName('');
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-4xl handwritten text-stone-800">Officer Budgets</h1>
        <p className="text-stone-500 mt-2 font-medium">Allocating operational budgets. Fields are filtered for <strong>Structure {budget.officerStructure}</strong>.</p>
      </div>

      <div className="space-y-6">
        
        <div className="journal-paper rounded-xl shadow-sm overflow-hidden">
          <div className="torn-header p-4 font-semibold text-stone-800 flex items-center gap-2 handwritten text-2xl">
            <Briefcase className="w-5 h-5 text-rose-500" /> Chapter Administration
          </div>
          <div className="p-6 space-y-4">
            {isMC && (
              <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 text-sm">
                <span className="font-bold flex items-center gap-2 mb-1"><Briefcase className="w-4 h-4"/> Microchapter Structure Active</span>
                <p>Because you are a Microchapter, non-essential director lines have been hidden to keep your budget streamlined. Your <strong>VP Recruitment</strong> also manages Marketing/PR expenses, and <strong>VP Finance</strong> handles basic administrative overhead.</p>
              </div>
            )}
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-stone-700">Misc Expenses (Presidential Discretion)</label>
              <div className="flex items-center gap-2">
                <span className="text-stone-500">$</span>
                <input type="number" value={budget.miscExpense} onChange={e => updateBudget('miscExpense', Number(e.target.value))} className="w-32 px-3 py-1.5 border rounded" />
              </div>
            </div>
            
            {!isMC && (
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-stone-700">Director of Administration</label>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500">$</span>
                  <input type="number" defaultValue={200} className="w-32 px-3 py-1.5 border rounded bg-stone-50 text-stone-400" disabled />
                </div>
              </div>
            )}
            
            {/* 5115 LC & VST Visits */}
            <div className="mt-8 pt-6 border-t border-stone-200">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-stone-800">5115 - LC & VST Visits</label>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 font-bold">$</span>
                  {isColony ? (
                    <div onClick={handleSovereignClick} className="w-32 px-3 py-2 border border-stone-200 bg-stone-100 rounded text-stone-500 font-mono font-bold flex items-center justify-between cursor-not-allowed">
                      {budget.lcVisitsExpense}
                      <Lock className="w-4 h-4" />
                    </div>
                  ) : (
                    <input 
                      type="number" 
                      value={budget.lcVisitsExpense} 
                      onChange={e => updateBudget('lcVisitsExpense', Number(e.target.value))} 
                      className="w-32 px-3 py-2 border border-stone-300 rounded font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500" 
                    />
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => setShowLcCalc(!showLcCalc)}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors border border-stone-200 mb-4"
              >
                <Calculator className="w-4 h-4" /> 
                {showLcCalc ? 'Hide LC Visit Calculator' : 'Plan International Visits'}
              </button>

              {showLcCalc && (
                <div className="p-5 journal-paper rounded-xl shadow-md">
                  <h4 className="text-sm font-bold text-stone-800 flex items-center gap-1.5 handwritten text-xl">
                    <span>✈️</span> Account 5115: LC & VST Visits
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 mb-4">
                    Calculate travel, lodging, and hosting expenses for International Leadership Consultant visits.
                  </p>

                  {/* Profile Auto-Detection Badge */}
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs mb-4 shadow-sm">
                    <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">Detected Chapter Profile</span>
                    <span className="font-semibold text-stone-800 text-sm mt-0.5 block">{scenarioLabel}</span>
                    <span className="block text-[11px] text-rose-600 font-bold mt-1">
                      Required Baseline: ${baselineRatePerVisit} / visit
                    </span>
                  </div>

                  {/* Unhoused Scenario Slider Adjustment */}
                  {!budget.hasFacility && (
                    <div className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs shadow-sm flex items-start gap-3">
                      <span className="text-lg">✈️</span>
                      <div>
                        <strong className="block text-amber-950 mb-1 text-sm">The LC is coming to town! Let's get hosted.</strong>
                        <p className="text-amber-800 leading-relaxed">
                          Based on your onboarding answers, your chapter is unhoused. Because we don't have an FHC kitchen to feed our consultant or a guest room for them to sleep in, we need to make sure we treat them right! We've pre-budgeted a friendly cushion of <strong>$350 to $800</strong> per visit so you can easily cover their local hotel stays and meals without sweating the bill.
                        </p>
                      </div>
                    </div>
                      <div className="flex gap-4 items-center">
                        <input 
                          type="range" min="350" max="800" step="50" value={unhousedRate} 
                          onChange={(e) => setUnhousedRate(Number(e.target.value))}
                          className="w-full accent-amber-600 h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="font-black text-amber-950 text-sm bg-white px-2 py-1 rounded shadow-xs">${unhousedRate}</span>
                      </div>
                    </div>
                  )}

                  {/* Advisor Warning System */}
                  {hasMandatoryVisits && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 shadow-sm flex gap-2 items-start">
                      <span className="mt-0.5">🔒</span>
                      <div>
                        <strong className="block mb-0.5">Advisor Directive</strong>
                        Your Chapter Finance Specialist has designated <strong>{budget.lcMandatoryVisits} scheduled visits</strong> for this upcoming fiscal year. The baseline budget is locked to cover these blocks safely.
                      </div>
                    </div>
                  )}

                  {/* VISIT COUNTER MULTIPLIER */}
                  <div className="flex items-center justify-between p-3 border border-stone-200 rounded-lg mb-4 bg-white shadow-sm">
                    <div className="text-xs">
                      <span className="font-bold text-stone-800 block text-sm">Number of Annual Visits</span>
                      <span className="text-[11px] text-stone-500">Include standard, recruitment, or special visits</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={() => setVisitCount(Math.max(budget.lcMandatoryVisits, visitCount - 1))}
                        className={`w-8 h-8 rounded-md font-black text-lg flex items-center justify-center transition shadow-xs border ${visitCount <= budget.lcMandatoryVisits ? 'bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed' : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200'}`}
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-base font-black text-stone-900">{visitCount}</span>
                      <button 
                        type="button"
                        onClick={() => setVisitCount(visitCount + 1)}
                        className="w-8 h-8 bg-white hover:bg-stone-50 border border-stone-200 rounded-md font-black text-lg text-stone-600 flex items-center justify-center transition shadow-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* CALCULATED OUTPUT BAR */}
                  <div className="p-4 bg-stone-900 text-white rounded-xl flex flex-col gap-3">
                    <div className="flex justify-between items-center text-xs border-b border-stone-700 pb-2">
                      <span className="font-medium text-stone-400">Total Visits:</span>
                      <span className="font-bold">{visitCount}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">Total 5115 Allocation</span>
                        <span className="text-xl font-black text-emerald-400">${total5115Budget}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateBudget('lcVisitsExpense', total5115Budget);
                          setShowLcCalc(false);
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg transition shadow-sm text-xs"
                      >
                        Apply Allocation
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5040 Technology Expense */}
            <div className="mt-8 pt-6 border-t border-stone-200">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-stone-800">5040 - Technology Expense</label>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 font-bold">$</span>
                  <NeedsInfoToggle fieldId="techExpense" label="Tech Expense (5040)">
                    {isColony ? (
                      <div onClick={handleSovereignClick} className="w-32 px-3 py-2 border border-stone-200 bg-stone-100 rounded text-stone-500 font-mono font-bold flex items-center justify-between cursor-not-allowed">
                        {budget.techExpense}
                        <Lock className="w-4 h-4" />
                      </div>
                    ) : (
                      <input 
                        type="number" 
                        value={budget.techExpense} 
                        onChange={e => updateBudget('techExpense', Number(e.target.value))} 
                        className="w-32 px-3 py-2 border border-stone-300 rounded font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500" 
                      />
                    )}
                  </NeedsInfoToggle>
                </div>
              </div>
              
              <button 
                onClick={() => setShowTechCalc(!showTechCalc)}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors border border-stone-200 mb-4"
              >
                <Calculator className="w-4 h-4" /> 
                {showTechCalc ? 'Hide Tech Assistant' : 'Calculate Local Subscriptions'}
              </button>

              {showTechCalc && (
                <div className="p-5 journal-paper rounded-xl shadow-md">
                  <h4 className="text-sm font-bold text-stone-800 flex items-center gap-1.5 handwritten text-xl">
                    <span>🧠</span> Account 5040: Let's secure the tech stack!
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 mb-4 leading-relaxed">
                    Before you skip this box, don't forget that tools like <strong>Zoom Pro</strong> for exec chats, <strong>GreekStudy</strong> for keeping up those chapter GPAs, or a <strong>Canva Pro</strong> team account for your VP Marketing aren't covered by International HQ. If your team plans to use them, check the boxes below and we'll calculate the annual cost for you automatically!
                  </p>
                  
                  {/* Cross-Department Alert Simulation */}
                  <div className="mb-4 p-3 washi-tape-yellow rounded-lg text-amber-900 text-xs flex gap-2 items-start shadow-sm font-medium">
                    <span className="mt-0.5">⚠️</span>
                    <div>
                      <strong className="block mb-0.5">Officer Request Detected:</strong>
                      Your Director of Academic Excellence added <strong>GreekStudy ($120)</strong> to her officer requests, and VP Marketing added <strong>Canva Pro ($150)</strong>. These have been pre-selected below.
                    </div>
                  </div>

                  {/* Preset Subscriptions Checklist */}
                  <div className="space-y-2.5">
                    {subscriptions.map((sub) => (
                      <label key={sub.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-stone-100 hover:bg-stone-50 cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={sub.checked}
                          onChange={() => toggleSubscription(sub.id)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1 text-xs">
                          <p className="font-semibold text-stone-700">{sub.name}</p>
                          <p className="text-stone-400">${sub.cost} / year</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Add Custom Subscription Form */}
                  <form onSubmit={addCustomSubscription} className="mt-4 pt-3 border-t border-stone-100">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Add Other App/Tool</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Mailchimp, Linktree"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="p-1.5 border border-stone-200 rounded-md text-xs focus:ring-rose-500 outline-none"
                      />
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-stone-400 text-xs">$</span>
                        <input
                          type="number"
                          placeholder="Annual Cost"
                          value={customCost}
                          onChange={(e) => setCustomCost(e.target.value)}
                          className="w-full pl-5 pr-1.5 py-1.5 border border-stone-200 rounded-md text-xs focus:ring-rose-500 outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full mt-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-[11px] py-1.5 rounded-md transition"
                    >
                      + Add Custom Tool
                    </button>
                  </form>

                  {/* Live Calculation Output */}
                  <div className="mt-5 p-3 bg-stone-800 text-white rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-stone-400">Total Tech Overhead</span>
                      <span className="text-base font-black text-emerald-400">${total5040}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateBudget('techExpense', total5040);
                        setShowTechCalc(false);
                      }}
                      className="bg-stone-600 hover:bg-stone-700 text-white font-semibold px-4 py-2 rounded-md transition shadow-sm"
                    >
                      Apply to 5040
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 5160 Professional Services (IRS) */}
            <div className="mt-8 pt-6 border-t border-stone-200">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-stone-800">5160 - Professional Services (990 Filing / CPA)</label>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 font-bold">$</span>
                  {isColony ? (
                    <div onClick={handleSovereignClick} className="w-32 px-3 py-2 border border-stone-200 bg-stone-100 rounded text-stone-500 font-mono font-bold flex items-center justify-between cursor-not-allowed">
                      {budget.professionalServicesExpense}
                      <Lock className="w-4 h-4" />
                    </div>
                  ) : (
                    <input 
                      type="number" 
                      value={budget.professionalServicesExpense} 
                      onChange={e => updateBudget('professionalServicesExpense', Number(e.target.value))} 
                      className="w-32 px-3 py-2 border border-stone-300 rounded font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500" 
                    />
                  )}
                </div>
              </div>

              <button 
                onClick={() => setShowIrsCalc(!showIrsCalc)}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors border border-stone-200 mb-4"
              >
                <Calculator className="w-4 h-4" /> 
                {showIrsCalc ? 'Hide IRS Assistant' : 'Tax & CPA Assistant'}
              </button>

              {showIrsCalc && (
                <div className="p-5 journal-paper rounded-xl shadow-md">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-stone-100 mb-3 torn-header">
                    <span className="text-base">🏛️</span>
                    <div>
                      <h4 className="font-bold text-stone-800 handwritten text-2xl">Account 5160: Tax Assistant</h4>
                      <span className="text-[10px] font-mono font-bold text-stone-400 block">
                        Projected Gross Receipts: ${totalMemberIncome.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {budget.isCanadian ? (
                    <div className="p-4 washi-tape-yellow text-amber-950 rounded-xl text-xs shadow-sm font-medium">
                      <h4 className="font-bold flex items-center gap-1 text-sm mb-1 handwritten text-xl">🇨🇦 CRA Tax Compliance Reminder</h4>
                      <p className="leading-relaxed">
                        Because your chapter is located in Canada, US IRS 990 rules do not apply. Please review your annual financial reporting requirements under the <strong>Canada Revenue Agency (CRA)</strong> guidelines. 
                      </p>
                      <p className="mt-2 text-amber-800 font-medium">
                        Consult your Regional Finance Coordinator regarding local accounting service costs before finalizing this line item.
                      </p>
                    </div>
                  ) : isBelowThreshold ? (
                    <div className="space-y-3">
                      <div className="p-3 washi-tape-green rounded-lg text-xs text-emerald-900 leading-relaxed shadow-sm font-medium">
                        <strong className="block mb-1 text-sm handwritten text-xl">🎉 Awesome news!</strong> Your chapter's projected total income is under $50,000 this year, which means you qualify for the IRS <strong>990-N Electronic Postcard</strong>. It's 100% free and takes like 5 minutes to file on IRS.gov. You can safely set this budget box to <strong>$0</strong> and skip the expensive accountant fees!
                      </div>
                      <button
                        onClick={() => {
                          updateBudget('professionalServicesExpense', 0);
                          setShowIrsCalc(false);
                        }}
                        className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs py-2.5 rounded-lg transition"
                      >
                        Set 990 Budget to $0
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 washi-tape-pink rounded-lg text-xs text-rose-950 leading-relaxed shadow-sm font-medium">
                        <strong className="handwritten text-xl">⚠️ Mandatory Return Required:</strong> Because your gross receipts exceed $50,000, the IRS requires a full digital filing (<strong>Form 990 or 990-EZ</strong>). Failing to file will jeopardize your tax-exempt status.
                      </div>

                      {/* User Option Checkbox */}
                      <label className="flex items-start gap-2.5 p-3 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer transition hover:bg-stone-100">
                        <input
                          type="checkbox"
                          checked={budget.hasAlumnaCpaVolunteer}
                          onChange={(e) => {
                            updateBudget('hasAlumnaCpaVolunteer', e.target.checked);
                            if (e.target.checked) updateBudget('professionalServicesExpense', 0);
                          }}
                          className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                        />
                        <div className="text-stone-700">
                          <span className="font-semibold block text-sm">Free Alumna CPA Volunteer</span>
                          <span className="text-[11px] text-stone-500">An alumna accountant has committed to doing our taxes for free.</span>
                        </div>
                      </label>

                      {!budget.hasAlumnaCpaVolunteer ? (
                        <div className="space-y-2 pt-2 border-t border-stone-100">
                          <label className="text-xs font-semibold text-stone-700 block">Estimated Accountant Fee</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 text-sm">$</span>
                            <input
                              type="number"
                              placeholder="Recommended: 350 - 800"
                              value={budget.professionalServicesExpense === 0 ? '' : budget.professionalServicesExpense}
                              onChange={(e) => updateBudget('professionalServicesExpense', Number(e.target.value))}
                              className="w-full pl-7 pr-3 py-2 border border-stone-300 rounded-lg text-sm font-semibold focus:ring-rose-500 focus:border-rose-500 outline-none"
                            />
                          </div>
                          <p className="text-[10px] text-stone-400 italic">
                            *Typical outsourced 990 filings cost chapters between $350 and $800 annually.
                          </p>
                        </div>
                      ) : (
                        <div className="pt-2">
                          <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-md border border-amber-100 mb-3 font-medium">
                            🤝 <strong>Handled!</strong> You've indicated an alumna is handling this. Make sure you keep her contact info recorded for chapter transitions.
                          </div>
                          <button
                            onClick={() => {
                              updateBudget('professionalServicesExpense', 0);
                              setShowIrsCalc(false);
                            }}
                            className="w-full bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs py-2.5 rounded-lg transition"
                          >
                            Lock In $0 (Alumna Supported)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5180 Panhellenic Dues */}
            <div className="mt-8 pt-6 border-t border-stone-200">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-stone-800">5180 - Panhellenic Dues</label>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 font-bold">$</span>
                  <input 
                    type="number" 
                    value={budget.panhellenicDues} 
                    onChange={e => updateBudget('panhellenicDues', Number(e.target.value))} 
                    className="w-32 px-3 py-2 border border-stone-300 rounded font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500" 
                  />
                </div>
              </div>

              <div className="p-5 bg-white rounded-xl border border-stone-200 shadow-sm">
                <h4 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                  <span>⚖️</span> Account 5180: Panhellenic Dues Calculator
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Configure how your local campus Panhellenic Association bills your chapter.
                </p>

                {/* Mode Selector Toggles */}
                <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-stone-100 rounded-lg">
                  <button
                    onClick={() => updateBudget('panhellenicCalcMode', 'flat' as any)}
                    className={`py-1.5 text-xs font-semibold rounded-md transition ${budget.panhellenicCalcMode === 'flat' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                  >
                    Flat Chapter Rate
                  </button>
                  <button
                    onClick={() => updateBudget('panhellenicCalcMode', 'per-member' as any)}
                    className={`py-1.5 text-xs font-semibold rounded-md transition ${budget.panhellenicCalcMode === 'per-member' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                  >
                    Per-Member Rate
                  </button>
                </div>

                {budget.panhellenicCalcMode === 'flat' ? (
                  <div className="mt-4">
                    <p className="text-xs text-stone-500 mb-2">If your campus uses a flat rate, simply enter it above.</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-stone-600 block mb-1">Active Rate / Sem</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-stone-400 text-xs">$</span>
                          <input
                            type="number"
                            value={budget.panhellenicActiveRate}
                            onChange={(e) => updateBudget('panhellenicActiveRate', Number(e.target.value))}
                            className="w-full pl-6 pr-2 py-1.5 border border-stone-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-stone-600 block mb-1">New Member Rate / Sem</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-stone-400 text-xs">$</span>
                          <input
                            type="number"
                            value={budget.panhellenicNewMemberRate}
                            onChange={(e) => updateBudget('panhellenicNewMemberRate', Number(e.target.value))}
                            className="w-full pl-6 pr-2 py-1.5 border border-stone-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs space-y-1.5">
                      <div className="flex justify-between text-stone-600">
                        <span>Fall Semester ({fallActives} Actives + {fallNMs} NMs):</span>
                        <span className="font-medium text-stone-800">${panhellenicFallTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Spring Semester ({springActives} Actives + {springNMs} NMs):</span>
                        <span className="font-medium text-stone-800">${panhellenicSpringTotal.toLocaleString()}</span>
                      </div>
                      <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-stone-900 text-sm">
                        <span>Total Annual Budget:</span>
                        <span className="text-rose-600">${panhellenicAnnualTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => updateBudget('panhellenicDues', panhellenicAnnualTotal)}
                      className="w-full bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs py-2 rounded-lg transition"
                    >
                      Lock In Calculated Total (${panhellenicAnnualTotal.toLocaleString()})
                    </button>
                    
                    <div className="mt-3 p-2 bg-indigo-50 border border-indigo-100 rounded text-xs text-indigo-800 flex gap-2 items-start">
                      <span className="mt-0.5">💡</span>
                      <p><strong>Pro-Tip:</strong> This calculator pulls directly from your Intro tab estimates and attrition rules. If your chapter beats your Spring recruitment goal, your Panhellenic bill will increase!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 6700 Processing Fees & Smart Widget */}
            <div className="mt-8 pt-6 border-t border-stone-200">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-stone-800">6700 - Processing Fees</label>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 font-bold">$</span>
                  <input 
                    type="number" 
                    value={budget.processingFee} 
                    onChange={e => updateBudget('processingFee', Number(e.target.value))} 
                    className={`w-32 px-3 py-2 border rounded font-semibold ${isTooLowWarning ? 'bg-amber-50 border-amber-300 text-amber-900' : 'border-stone-300'}`} 
                  />
                </div>
              </div>

              {isTooLowWarning && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm shadow-sm flex items-start gap-3">
                  <span className="text-lg">👋</span>
                  <div>
                    <strong className="block mb-1">Hey! Quick math check on Processing Fees:</strong>
                    You put <strong>${budget.processingFee}</strong> for transaction fees, but based on your total dues, even if every single member pays straight from their bank account, the absolute minimum processing overhead will be <strong>${Math.round(achFee)}</strong>. Let's bump this up a bit so the chapter doesn't accidentally get stuck with a surprise bill at the end of the semester!
                  </div>
                </div>
              )}

              <div className="p-5 bg-stone-50 rounded-xl border border-stone-200 shadow-sm">
                <h4 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                  <span>💡</span> Smart Estimator: Account 6700
                </h4>
                <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                  Based on your Member Billing setup, your total projected member collection income is <strong>${totalMemberIncome.toLocaleString()}</strong>. Processing fees depend heavily on how your members choose to pay.
                </p>

                {/* Range Visualizer */}
                <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold block mb-1">1% Fee (All ACH)</span>
                    <p className="text-lg font-bold text-emerald-900">${achFee.toFixed(2)}</p>
                    <p className="text-[10px] text-emerald-600/80 mt-1">If all pay via bank transfer</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                    <span className="text-[10px] uppercase tracking-wider text-rose-700 font-bold block mb-1">3% Fee (All Card)</span>
                    <p className="text-lg font-bold text-rose-900">${cardFee.toFixed(2)}</p>
                    <p className="text-[10px] text-rose-600/80 mt-1">If all pay via credit card</p>
                  </div>
                </div>

                {/* Interactive Mix Slider */}
                <div className="mt-6 px-1">
                  <div className="flex justify-between text-xs font-semibold text-stone-500 mb-2">
                    <span>{100 - cardPercentage}% Bank (ACH)</span>
                    <span>{cardPercentage}% Credit Card</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={cardPercentage} 
                    onChange={(e) => updateBudget('processingFeeCardPercentage', Number(e.target.value))}
                    className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                </div>

                {/* Dynamic Recommendation */}
                <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 block font-bold tracking-wide uppercase">Estimated Overhead ({ (blendedRate * 100).toFixed(1) }%)</span>
                    <span className="text-2xl font-black text-rose-900">${estimatedFee.toFixed(0)}</span>
                  </div>
                  <button 
                    onClick={() => updateBudget('processingFee', Math.round(estimatedFee))}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    Use This Estimate
                  </button>
                </div>
                
                {isMC && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-900 text-xs">
                    ⚠️ <strong>Microchapter Alert:</strong> For Microchapters, credit card processing fees (3%) can heavily impact your bottom line because you have a smaller pool of dues. We highly recommend emphasizing ACH/Bank transfers (1% fee) during member onboarding to keep your 6700 overhead at its absolute minimum.
                  </div>
                )}
              </div>
            </div>

            {/* 6800 Spend Related Fees */}
            <div className="mt-8 pt-6 border-t border-stone-200">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-stone-800">6800 - Spend Related Fees</label>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 font-bold">$</span>
                  <input 
                    type="number" 
                    value={budget.spendRelatedFees} 
                    onChange={e => updateBudget('spendRelatedFees', Number(e.target.value))} 
                    className="w-32 px-3 py-2 border border-stone-300 rounded font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500" 
                  />
                </div>
              </div>
              
              <button 
                onClick={() => setShowSpendCalc(!showSpendCalc)}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors border border-stone-200 mb-4"
              >
                <Calculator className="w-4 h-4" /> 
                {showSpendCalc ? 'Hide Fee Estimator' : 'Calculate Cards & Checks'}
              </button>

              {showSpendCalc && (
                <div className="p-5 bg-white rounded-xl border border-stone-200 shadow-md">
                  <h4 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                    <span>💳</span> Account 6800: Spend Related Fees
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 mb-4">
                    Estimate card overhead and physical checkbook supply tiers for the upcoming year.
                  </p>

                  <div className="space-y-4">
                    {/* INPUT: PRE-PAID CARDS */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-stone-700">Pre-Paid Officer Cards</label>
                        <span className="text-[11px] font-mono font-bold text-stone-400">($9.00 / card)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          value={budget.spendRelatedCards}
                          onChange={(e) => updateBudget('spendRelatedCards', Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-20 p-1.5 border border-stone-300 rounded-lg text-xs font-medium text-center focus:ring-rose-500 outline-none"
                        />
                        <span className="text-xs text-stone-500">
                          Allocated Cost: <strong className="text-stone-800">${totalCardCost}</strong>
                        </span>
                      </div>
                      
                      <div className="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded text-xs text-indigo-800 flex gap-2 items-start">
                        <span className="mt-0.5">💡</span>
                        <p><strong>Smart Sync:</strong> Based on your choice of <strong>Officer Structure {budget.officerStructure}</strong>, we recommend setting up at least <strong>{recommendedCards} pre-paid cards</strong> so your directors can make authorized vendor payments.</p>
                      </div>
                    </div>

                    {/* INPUT: PHYSICAL CHECKS */}
                    <div className="pt-3 border-t border-stone-100">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-stone-700">Physical Checks Needed</label>
                        <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
                          Tiered Volume Pricing
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 50, 100, 200"
                        value={budget.spendRelatedChecks === 0 ? '' : budget.spendRelatedChecks}
                        onChange={(e) => updateBudget('spendRelatedChecks', Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full p-2 border border-stone-300 rounded-lg text-xs font-medium mb-1.5 focus:ring-rose-500 outline-none"
                      />
                      
                      {/* Live Tier Badge Preview */}
                      {budget.spendRelatedChecks > 0 && (
                        <div className="flex justify-between items-center text-[11px] text-stone-500 bg-stone-50 p-2 rounded-md border border-stone-200 mt-2">
                          <span>Applied Bundle: <strong>{checkBreakdownText}</strong></span>
                          <span className="font-bold text-stone-800">${totalCheckCost}</span>
                        </div>
                      )}
                      
                      {isMC && budget.spendRelatedChecks > 50 && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs">
                          ⚠️ <strong>Microchapter Tip:</strong> Based on your structure, a 50-check supply tier ($30) is likely sufficient for your annual distribution. Avoid over-ordering bulk check packs to keep your 6800 account streamlined.
                        </div>
                      )}
                    </div>

                    {/* LEDGER LIVE CALCULATION DISPLAY */}
                    <div className="p-3 bg-stone-800 text-white rounded-lg space-y-1 text-xs">
                      <div className="flex justify-between text-stone-400">
                        <span>Total Card Overhead:</span>
                        <span>${totalCardCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-stone-400 pb-1.5 border-b border-stone-700">
                        <span>Total Check Supply Cost:</span>
                        <span>${totalCheckCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1.5 text-sm">
                        <span>Total 6800 Allocation:</span>
                        <span className="text-emerald-400">${grandTotal6800}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        updateBudget('spendRelatedFees', grandTotal6800);
                        setShowSpendCalc(false);
                      }}
                      className="w-full bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs py-2.5 rounded-lg transition"
                    >
                      Apply To Spend Related Fees
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <h3 className="font-semibold text-stone-800 mb-6 flex items-center gap-2">
            <span className="text-xl">🏢</span> Chapter Administration
          </h3>

          <div className="space-y-6">
            
            {/* 5000 Large Chapter Administration Fee (Conditionally Displayed) */}
            {budget.isLargeChapterEligible ? (
              <div className="mb-8 pb-6 border-b border-stone-200">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <label className="text-sm font-bold text-stone-800 block">5000 - Large Chapter Administration Fee</label>
                    <span className="text-[10px] text-amber-600 bg-amber-50 font-bold px-1.5 py-0.5 rounded inline-block mt-1 border border-amber-200">
                      Gated Requirement
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 font-bold">$</span>
                    <input 
                      type="number" 
                      value={budget.largeChapterFee} 
                      onChange={e => updateBudget('largeChapterFee', Number(e.target.value))} 
                      className="w-32 px-3 py-2 border border-stone-300 rounded font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 bg-amber-50/30" 
                    />
                  </div>
                </div>

                <button 
                  onClick={() => setShowLargeChapterCalc(!showLargeChapterCalc)}
                  className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors border border-stone-200 mb-4"
                >
                  <Calculator className="w-4 h-4" /> 
                  {showLargeChapterCalc ? 'Hide Options' : 'View Fee Tiers'}
                </button>

                {showLargeChapterCalc && (
                  <div className="p-5 bg-white rounded-xl border border-stone-200 shadow-md">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-stone-100">
                      <span className="text-base">🏢</span>
                      <div>
                        <h4 className="text-sm font-bold text-stone-800">Account 5000: Large Chapter Fee</h4>
                      </div>
                    </div>

                    <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                      This fee applies only to designated chapters globally. Review your direct notices from International Headquarters to confirm your tier for the <strong>2026–2027</strong> fiscal year.
                    </p>

                    {/* Advisor Flag for $0 */}
                    {budget.largeChapterFee === 0 && (
                      <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs shadow-sm flex gap-2 items-start">
                        <span className="mt-0.5">⚠️</span>
                        <div>
                          <strong className="block mb-0.5">Advisor Flag:</strong>
                          Your chapter is flagged for this fee but you have budgeted <strong>$0</strong>. This will trigger a block during final review unless an international waiver was officially granted.
                        </div>
                      </div>
                    )}

                    {/* Tier Radio Selection */}
                    <div className="mt-4 space-y-2">
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition text-xs font-semibold ${feeTier === '5000' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-stone-200 hover:bg-stone-50 text-stone-700'}`}>
                        <input
                          type="radio"
                          name="feeTier"
                          value="5000"
                          checked={feeTier === '5000'}
                          onChange={() => {
                            setFeeTier('5000');
                            updateBudget('largeChapterFee', 5000);
                          }}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1 flex justify-between">
                          <span>Full Admin Fee Tier</span>
                          <span className="font-mono font-bold text-sm">$5,000</span>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition text-xs font-semibold ${feeTier === '2500' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-stone-200 hover:bg-stone-50 text-stone-700'}`}>
                        <input
                          type="radio"
                          name="feeTier"
                          value="2500"
                          checked={feeTier === '2500'}
                          onChange={() => {
                            setFeeTier('2500');
                            updateBudget('largeChapterFee', 2500);
                          }}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1 flex justify-between">
                          <span>Adjusted Admin Fee Tier</span>
                          <span className="font-mono font-bold text-sm">$2,500</span>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition text-xs font-semibold ${feeTier === 'custom' ? 'border-stone-400 bg-stone-50 text-stone-900' : 'border-stone-200 hover:bg-stone-50 text-stone-700'}`}>
                        <input
                          type="radio"
                          name="feeTier"
                          value="custom"
                          checked={feeTier === 'custom'}
                          onChange={() => setFeeTier('custom')}
                          className="text-stone-600 focus:ring-stone-500"
                        />
                        <span>Other Approved Custom Amount</span>
                      </label>
                    </div>

                    {/* Custom Amount Form Expansion */}
                    {feeTier === 'custom' && (
                      <div className="mt-3 p-3 bg-stone-50 rounded-lg border border-stone-200 flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 text-sm">$</span>
                          <input
                            type="number"
                            placeholder="Enter specific amount"
                            value={customFeeAmount}
                            onChange={(e) => setCustomFeeAmount(e.target.value)}
                            className="w-full pl-7 pr-2 py-2 border border-stone-300 rounded-md text-sm font-semibold outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (customFeeAmount) {
                              updateBudget('largeChapterFee', Number(customFeeAmount));
                              setShowLargeChapterCalc(false);
                            }
                          }}
                          className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded-md transition shadow-sm"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {/* Dir of Administration */}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="bg-stone-50 border-b border-stone-200 p-4 font-semibold text-stone-800 flex items-center gap-2">
            <Mic className="w-5 h-5 text-rose-500" /> Member Experience
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-stone-700">VP Recruitment Budget</label>
              <div className="flex items-center gap-2">
                <span className="text-stone-500">$</span>
              <NeedsInfoToggle fieldId="recruitmentBudget" label="VP Recruitment Budget">
                <input type="number" value={budget.recruitmentBudget} onChange={e => updateBudget('recruitmentBudget', Number(e.target.value))} className="w-32 px-3 py-1.5 border rounded" />
              </NeedsInfoToggle>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-stone-700">VP Sisterhood Budget</label>
              <div className="flex items-center gap-2">
                <span className="text-stone-500">$</span>
                <input type="number" value={budget.sisterhoodBudget} onChange={e => updateBudget('sisterhoodBudget', Number(e.target.value))} className="w-32 px-3 py-1.5 border rounded" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="bg-stone-50 border-b border-stone-200 p-4 font-semibold text-stone-800 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-rose-500" /> Community
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-stone-700">Philanthropy Allocation</label>
              <div className="flex items-center gap-2">
                <span className="text-stone-500">$</span>
                <input type="number" value={budget.philanthropyBudget} onChange={e => updateBudget('philanthropyBudget', Number(e.target.value))} className="w-32 px-3 py-1.5 border rounded" />
              </div>
            </div>
            <div className="pt-4 border-t border-stone-200">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-medium text-stone-700">5210-8 Social / Events Budget</label>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500">$</span>
                <NeedsInfoToggle fieldId="socialBudget" label="VP Social Budget">
                  <input type="number" value={budget.socialBudget} onChange={e => updateBudget('socialBudget', Number(e.target.value))} className="w-32 px-3 py-1.5 border rounded" />
                </NeedsInfoToggle>
                </div>
              </div>
              
              <button 
                onClick={() => setShowEventCalc(!showEventCalc)}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors border border-stone-200"
              >
                <Calculator className="w-4 h-4" /> 
                {showEventCalc ? 'Hide Event Estimator' : 'Calculate Major Event Budget by Attendance'}
              </button>

              {showEventCalc && (
                <div className="mt-4 p-5 bg-white rounded-xl border border-stone-200 shadow-lg">
                  <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                        <PartyPopper className="w-4 h-4 text-rose-500"/> Account 5210: Time to plan the event of the year! 🌹✨
                      </h3>
                      <p className="text-xs text-stone-500 font-medium mt-1 leading-relaxed">
                        Budgeting for Feast of Roses or IRD can get a little wild since people love to bring dates, parents, and cool alumnae. Slide the bar below to tell us what percentage of the chapter you think is bringing a guest. We'll calculate the catering numbers automatically so you can focus on picking the perfect photo backdrop!
                      </p>
                    </div>
                    <span className="bg-rose-50 text-rose-700 text-[11px] font-bold px-2 py-1 rounded-md">
                      Base Chapter: {fallActives}
                    </span>
                  </div>

                  {/* STEP 1: ATTENDANCE MIX */}
                  <div className="mt-4 space-y-3">
                    <h4 className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">1. Attendance Blueprint</h4>
                    
                    {/* Date Ratio Slider */}
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                      <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
                        <span>Date/Guest Turnout:</span>
                        <span className="font-bold text-rose-700">{Math.round(guestRatio * 100)}% ({dateCount} Guests)</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.05" value={guestRatio} 
                        onChange={(e) => setGuestRatio(Number(e.target.value))}
                        className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                      />
                    </div>

                    {/* Other Guests */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-stone-500 block mb-1">Alumnae</label>
                        <input type="number" value={alumnaeCount} onChange={(e) => setAlumnaeCount(Number(e.target.value))} className="w-full p-2 border border-stone-200 rounded-lg text-xs font-medium focus:ring-rose-500 focus:border-rose-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-stone-500 block mb-1">Parents/Family</label>
                        <input type="number" value={parentsCount} onChange={(e) => setParentsCount(Number(e.target.value))} className="w-full p-2 border border-stone-200 rounded-lg text-xs font-medium focus:ring-rose-500 focus:border-rose-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-stone-500 block mb-1">Advisors/VIPs</label>
                        <input type="number" value={vipCount} onChange={(e) => setVipCount(Number(e.target.value))} className="w-full p-2 border border-stone-200 rounded-lg text-xs font-medium focus:ring-rose-500 focus:border-rose-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* STEP 2: COST MATRIX */}
                  <div className="mt-5 space-y-3">
                    <h4 className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">2. Cost Projections</h4>
                    <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100">
                      <div>
                        <label className="text-[10px] font-medium text-stone-600 block mb-0.5">F&B / Catering (Per Head)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-stone-400 text-xs">$</span>
                          <input type="number" value={cateringPerHead} onChange={(e) => setCateringPerHead(Number(e.target.value))} className="w-full pl-6 pr-2 py-1.5 border border-stone-200 rounded-md text-xs font-semibold focus:ring-rose-500 focus:border-rose-500 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-stone-600 block mb-0.5">Favors/Gifts (Per Head)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-stone-400 text-xs">$</span>
                          <input type="number" value={favorsPerHead} onChange={(e) => setFavorsPerHead(Number(e.target.value))} className="w-full pl-6 pr-2 py-1.5 border border-stone-200 rounded-md text-xs font-semibold focus:ring-rose-500 focus:border-rose-500 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-stone-600 block mb-0.5">Venue Rental (Fixed)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-stone-400 text-xs">$</span>
                          <input type="number" value={fixedVenueCost} onChange={(e) => setFixedVenueCost(Number(e.target.value))} className="w-full pl-6 pr-2 py-1.5 border border-stone-200 rounded-md text-xs font-semibold focus:ring-rose-500 focus:border-rose-500 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-stone-600 block mb-0.5">Decor & Extras (Fixed)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-stone-400 text-xs">$</span>
                          <input type="number" value={fixedDecorCost} onChange={(e) => setFixedDecorCost(Number(e.target.value))} className="w-full pl-6 pr-2 py-1.5 border border-stone-200 rounded-md text-xs font-semibold focus:ring-rose-500 focus:border-rose-500 outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 3: REVENUE SAFETY NET */}
                  <div className="mt-5 space-y-3">
                    <h4 className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">3. Revenue Offset</h4>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-xs font-medium text-emerald-900 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isSubsidized} 
                          onChange={(e) => setIsSubsidized(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        Is this event subsidized by ticket sales? (Alumnae & Parents)
                      </label>
                      
                      {isSubsidized && (
                        <div className="flex items-center gap-3 mt-2">
                          <label className="text-[10px] font-medium text-emerald-800">Ticket Price:</label>
                          <div className="relative w-24">
                            <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-emerald-600 text-xs">$</span>
                            <input type="number" value={ticketPrice} onChange={(e) => setTicketPrice(Number(e.target.value))} className="w-full pl-5 pr-2 py-1 border border-emerald-200 rounded text-xs font-semibold outline-none focus:border-emerald-400" />
                          </div>
                          <span className="text-[10px] text-emerald-700">Projected Income: <strong>${totalTicketIncome.toLocaleString()}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SUMMARY DASHBOARD */}
                  <div className="mt-5 p-4 bg-stone-800 text-white rounded-xl space-y-2">
                    <div className="flex justify-between text-xs text-stone-300 font-medium">
                      <span>Total Projected Attendance:</span>
                      <span>{totalAttendance} people</span>
                    </div>
                    <div className="flex justify-between text-xs text-stone-300 font-medium">
                      <span>Variable Per-Head Expenses:</span>
                      <span>${totalVariableCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-stone-300 font-medium pb-2 border-b border-stone-600">
                      <span>Fixed Production Expenses:</span>
                      <span>${totalFixedCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm pt-1">
                      <span>Recommended Expense Allocation:</span>
                      <span className="text-rose-400 text-base">${grandTotalEventBudget.toLocaleString()}</span>
                    </div>
                    {isSubsidized && (
                      <div className="flex justify-between font-bold text-xs pt-1">
                        <span>Projected Ticket Revenue (to 4070):</span>
                        <span className="text-emerald-400">+${totalTicketIncome.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleApplyEventBudget}
                    className="w-full mt-4 bg-stone-800 hover:bg-stone-900 text-white font-semibold text-sm py-2.5 rounded-xl transition shadow-sm"
                  >
                    Sync Line Item Allocation
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* T-SHIRT PASS-THROUGH ASSISTANT */}
      {!budget.hasPurchaseFund && (
        <div className="journal-paper p-6 rounded-xl shadow-sm border-2 border-indigo-200 overflow-hidden relative mt-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-indigo-100 torn-header">
            <span className="text-xl">👕</span>
            <h3 className="font-bold text-indigo-900 handwritten text-2xl">The Optional T-Shirt & Merch Assistant</h3>
          </div>
          
          <p className="text-sm text-stone-600 mb-6">
            You don't have a formalized Purchase Fund, which means any optional apparel (Bid Day shirts, formal favors, crewnecks) must be run as a "net-zero pass-through."
          </p>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-4 gap-4 items-end bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-indigo-900 mb-1">Item Name</label>
                <input type="text" placeholder="e.g., Bid Day Merch" value={newShirtName} onChange={e => setNewShirtName(e.target.value)} className="w-full px-3 py-2 border border-indigo-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-indigo-900 mb-1">Est. Buyers</label>
                <input type="number" value={newShirtBuyers} onChange={e => setNewShirtBuyers(Number(e.target.value))} className="w-full px-3 py-2 border border-indigo-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-indigo-900 mb-1">Cost Per Shirt</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-stone-400 text-sm">$</span>
                  <input type="number" value={newShirtCost} onChange={e => setNewShirtCost(Number(e.target.value))} className="w-full pl-6 pr-3 py-2 border border-indigo-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
              </div>
            </div>
            <button onClick={handleAddTshirt} className="w-full py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-sm font-bold rounded-lg transition-colors border border-indigo-200">
              + Add Apparel Event
            </button>
          </div>

          <div className="space-y-2">
            {budget.tshirtOrders?.map(order => (
              <div key={order.id} className="flex justify-between items-center bg-white border border-stone-200 p-3 rounded-lg text-sm">
                <span className="font-semibold text-stone-700">{order.description} ({order.quantity} @ ${order.pricePerUnit})</span>
                <span className="font-mono text-stone-500">${order.totalExpense.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-slate-800 text-white p-5 rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">📊 The Accounting Mirror</h4>
            <div className="flex justify-between text-sm mb-2 font-mono">
              <span className="text-emerald-400">👉 Account 4630 (Misc Reimbursed Income)</span>
              <span className="text-emerald-400">+{budget.tshirtIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-4 font-mono pb-4 border-b border-slate-600">
              <span className="text-rose-400">👉 Account 5210-8 (Misc Reimbursed Expense)</span>
              <span className="text-rose-400">-{budget.tshirtExpense.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center relative">
              <span className="font-bold">🌟 Vibe Check: Net Budget Impact</span>
              {budget.tshirtIncome === budget.tshirtExpense && budget.tshirtIncome > 0 ? (
                <>
                  <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded font-bold text-sm border border-emerald-500/30">$0.00 (Perfect!)</span>
                  {/* Rose Petals Easter Egg */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                      key={`petal-${i}`} 
                      className="rose-petal" 
                      style={{ 
                        left: `${50 + Math.random() * 40}%`, 
                        animationDelay: `${Math.random() * 2}s` 
                      }} 
                    />
                  ))}
                </>
              ) : budget.tshirtIncome === budget.tshirtExpense ? (
                <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded font-bold text-sm border border-emerald-500/30">$0.00 (Perfect!)</span>
              ) : (
                <span className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded font-bold text-sm border border-rose-500/30">Mismatched: ${(budget.tshirtIncome - budget.tshirtExpense).toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* IRS GUARDRAIL */}
      {isIrsViolation && (
        <div className="washi-tape-yellow p-6 rounded-xl border border-amber-200 mt-8 animate-in slide-in-from-bottom-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-amber-100 p-2 rounded-full text-amber-600 shrink-0 shadow-sm">
              <span className="text-xl">⚖️</span>
            </div>
            <div>
              <h3 className="font-bold text-amber-900 mb-2 handwritten text-2xl">{taxAuthority} Regulatory Flag: Miscellaneous Limit Exceeded</h3>
              <p className="text-sm text-amber-900 mb-3 font-medium">
                You've allocated <strong>{Math.max(miscIncomePct, miscExpensePct).toFixed(1)}%</strong> of your total budget to Miscellaneous Chapter lines. According to {taxEntity}, unclassified miscellaneous line items should stay <strong>under 5%</strong> of your gross financial footprint.
              </p>
              <p className="text-sm text-amber-800 mb-4">
                Dumping too much unspecified money here can trigger an operational audit or delay your annual {taxForm}.
              </p>
              <div className="bg-white/60 p-3 rounded-lg border border-amber-200/60 text-sm text-amber-900">
                <strong>How to fix this:</strong> Try to move some of this money into a more descriptive, pre-approved track (like Account 5040 for Technology or Account 5190 for Chapter Supplies) to ensure clean corporate records!
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4 mt-8 border-t border-stone-200">
        <button onClick={() => dispatch({ type: 'SET_STEP', payload: 2 })} className="px-6 py-2 border rounded-lg font-medium text-stone-600 hover:bg-stone-50">Back</button>
        <button onClick={() => dispatch({ type: 'SET_STEP', payload: 4 })} className="px-6 py-2 bg-rose-600 text-white rounded-lg font-medium shadow-sm hover:bg-rose-700">Continue to Review</button>
      </div>
    </div>
  );
}
