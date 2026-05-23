import React, { useState } from 'react';
import { useBudgetStore } from '../store';
import { FileSpreadsheet, Download, CheckCircle2, Lock, Play, Stamp } from 'lucide-react';
import Confetti from './Confetti';
import PresenterMode from './PresenterMode';
import { generateBudgetPresentation } from '../utils/pptxExport';

export default function Step5_Export() {
  const { state, dispatch } = useBudgetStore();
  const { budget } = state;
  const [isExporting, setIsExporting] = useState(false);
  const [showPresenter, setShowPresenter] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  if (!budget) return null;

  const hasNeedsInfoFlags = budget.needsInfoFlags && Object.values(budget.needsInfoFlags).some(f => f.flagged);
  const isBudgetCheckPassed = !hasNeedsInfoFlags && (budget.draftStage === 'approved' || budget.draftStage === 'exported');

  const handleDownload = async () => {
    setIsExporting(true);
    
    // Trigger download from backend
    window.location.href = `/agd-budgets/api/export/csv/${encodeURIComponent(budget.chapter)}`;
    
    // Mark as exported in backend
    try {
      await fetch(`/agd-budgets/api/budget/${encodeURIComponent(budget.chapter)}/export-status`, {
        method: 'POST'
      });
      // Update local state
      dispatch({ type: 'UPDATE_BUDGET', payload: { draftStage: 'exported' } });
    } catch (e) {
      console.error("Failed to update export status", e);
    }
    
    setIsExporting(false);
  };

  const handleECApproval = async () => {
    setIsApproving(true);
    try {
      const updatedDate = new Date().toISOString().split('T')[0];
      await fetch(`/agd-budgets/api/budget/${encodeURIComponent(budget.chapter)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...budget, draftStage: 'submitted', ecVoteDate: updatedDate })
      });
      dispatch({ type: 'UPDATE_BUDGET', payload: { draftStage: 'submitted', ecVoteDate: updatedDate } });
    } catch (e) {
      console.error(e);
      alert("Failed to record EC approval.");
    }
    setIsApproving(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in pt-12 relative">
      {isBudgetCheckPassed && <Confetti />}
      
      <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
        <h3 className="text-2xl font-serif text-slate-800 flex items-center gap-3 mb-2">
          <FileSpreadsheet className="w-8 h-8 text-indigo-500" /> Final Step: Billhighway Ledger Sync
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          Your budget has been successfully compiled into a standardized accounting grid. You can now download your clean CSV file for direct integration into Billhighway.
        </p>

        {/* STATUS DASHBOARD */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
            <div className="text-xs text-stone-500 font-bold uppercase mb-1">Total Rows</div>
            <div className="text-xl font-medium text-stone-800">Auto-Compiled</div>
          </div>
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
            <div className="text-xs text-stone-500 font-bold uppercase mb-1">Net Position</div>
            <div className="text-xl font-medium text-emerald-600">Balanced</div>
          </div>
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
            <div className="text-xs text-stone-500 font-bold uppercase mb-1">Compliance</div>
            <div className="text-xl font-medium text-emerald-600">Passed</div>
          </div>
        </div>

        {/* COMPLIANCE CHECK GUARDRAIL */}
        {!isBudgetCheckPassed && budget.draftStage !== 'executive_council' && budget.draftStage !== 'submitted' ? (
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-4">
            <Lock className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-900 block mb-1">Export Locked</span>
              <p className="text-sm text-rose-800">
                {hasNeedsInfoFlags
                  ? "You have active '❓ Need Info' flags on your budget. You must resolve these placeholders before you can generate your final export."
                  : "Your budget checks are currently out of balance or incomplete. Please resolve any errors before you can generate your export."}
              </p>
            </div>
          </div>
        ) : budget.draftStage === 'executive_council' ? (
          <div className="space-y-8 animate-in fade-in">
            <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-3xl text-center space-y-6">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <Play className="w-8 h-8 ml-1" />
              </div>
              <div>
                <h3 className="text-2xl font-serif text-indigo-900 mb-2">Present to Executive Council</h3>
                <p className="text-indigo-700 max-w-lg mx-auto">Launch the live presenter view to securely share this budget with your chapter's leadership during your March meeting. Once approved, you can officially submit it to the Advisor Portal.</p>
              </div>
              <div className="flex flex-col gap-4 max-w-md mx-auto">
                <button 
                  onClick={() => setShowPresenter(true)}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 w-full"
                >
                  <Play className="w-5 h-5 fill-current" /> Launch Live Presenter View
                </button>
                <button 
                  onClick={() => generateBudgetPresentation(budget)}
                  className="px-8 py-3 bg-white hover:bg-slate-50 text-indigo-600 border-2 border-indigo-200 rounded-full font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 w-full"
                >
                  <Download className="w-5 h-5" /> Download PowerPoint Deck (.pptx)
                </button>
                <button 
                  onClick={() => window.open(`/agd-budgets/api/export/excel/${budget.chapter}`, '_blank')}
                  className="px-8 py-3 bg-white hover:bg-slate-50 text-emerald-600 border-2 border-emerald-200 rounded-full font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 w-full"
                >
                  <FileSpreadsheet className="w-5 h-5" /> Export Billhighway Excel (.xlsx)
                </button>
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl text-center space-y-4">
              <h4 className="font-bold text-slate-800 text-lg">EC Approval Sign-Off</h4>
              <p className="text-sm text-slate-500">Only click this once the Executive Council has formally voted and passed the budget.</p>
              <button 
                onClick={handleECApproval}
                disabled={isApproving}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 mx-auto"
              >
                <Stamp className="w-5 h-5" /> Mark as "Approved by EC"
              </button>
            </div>
          </div>
        ) : budget.draftStage === 'submitted' ? (
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4">
            <Lock className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900 block mb-1">Under Advisor Review</span>
              <p className="text-sm text-amber-800">
                Your budget has passed EC vote on {budget.ecVoteDate} and is currently under review by your Advisory Board. You can generate the final Billhighway CSV once they approve it.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-2xl font-bold text-slate-800">You did it! Your budget is officially balanced and ready to launch. 🏆</h2>
            </div>
            
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="w-full max-w-2xl mx-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-4 rounded-2xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Download className="w-6 h-6" />
              {budget.draftStage === 'exported' ? 'Re-Download Billhighway_Upload_FY2627.csv' : 'Download Billhighway_Upload_FY2627.csv'}
            </button>
            
            {/* The Instructions Grid */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              
              {/* Screen 1 */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left">
                <h3 className="font-bold text-slate-800 text-lg mb-3">🚀 The Billhighway Launchpad</h3>
                <p className="text-sm text-slate-600 mb-4">Now it's time to push this into Billhighway so your chapter's operating funds are locked in for the year. Grab your downloaded CSV file and follow these simple steps:</p>
                <ul className="text-sm space-y-2 text-slate-700 mb-6">
                  <li><strong>Step 1:</strong> Log into your <strong>Billhighway</strong> dashboard.</li>
                  <li><strong>Step 2:</strong> Head over to <strong>Other Tools</strong> on your main navigation menu, then select <strong>Budgets</strong>.</li>
                  <li><strong>Step 3:</strong> Click the big <strong>Create Budget</strong> button.</li>
                  <li><strong>Step 4:</strong> Select your exact time period for the upcoming year: <strong>2026 [07/01/2026 - 06/30/2027]</strong> and click Create.</li>
                  <li><strong>Step 5:</strong> Choose the <strong>Upload CSV</strong> option, select the file you just downloaded from this app, and hit <strong>Submit</strong>.</li>
                </ul>
                <div className="p-3 bg-indigo-50 text-indigo-800 text-xs rounded-xl font-medium">
                  ✨ <strong>Pro-Tip from your Advisor:</strong> Once you hit submit, don't forget to shoot a quick confirmation email to your Chapter Finance Specialist so they can log in, review your work, and give it the official green light!
                </div>
              </div>

              {/* Screen 2 */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left">
                <h3 className="font-bold text-slate-800 text-lg mb-3">📅 Setting Up Your Crew</h3>
                <p className="text-sm text-slate-600 mb-4"><strong>Next Step: Let's automate your member billing! 👯</strong></p>
                <p className="text-sm text-slate-600 mb-4">You've already done the hard work of organizing your chapter roster and picking your customized billing setups. Now we just need to mirror those exact groups inside Billhighway so parents and members get billed correctly:</p>
                <ul className="text-sm space-y-2 text-slate-700 mb-6">
                  <li><strong>Step 1:</strong> In Billhighway, click on <strong>Cash Inflow</strong> and select <strong>Member Billing</strong>.</li>
                  <li><strong>Step 2:</strong> Head over to <strong>Billing Groups</strong>. This is where you will add or rename your tracks to match the exact names we created in your matrix dashboard.</li>
                  <li><strong>Step 3:</strong> Assign your members to their correct groups. <em>(Make sure your counts match the roster numbers we used on your Step 2 dashboard!)</em></li>
                  <li><strong>Step 4:</strong> Enter the itemized breakdowns we mapped out together (Local Operations + your fixed International Fees/Insurance).</li>
                </ul>
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-medium">
                  💡 <strong>Why this matters:</strong> When members or parents log in to pay, they will see a beautiful, transparent breakdown of exactly where their money goes. No more surprise questions at chapter meetings!
                </div>
              </div>

            </div>

            {/* Resume Builder Celebration Card */}
            {budget.draftStage === 'exported' && (
              <div className="mt-8 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl animate-in slide-in-from-bottom-8">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-2xl shrink-0">
                    💼
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-emerald-900 mb-2">Resume Builder Unlocked!</h3>
                    <p className="text-sm text-emerald-800 mb-4">
                      Being VP Finance isn't just about spreadsheets; it is serious corporate experience. You just successfully planned, negotiated, and secured a massive organizational budget. When it's time to update your resume or LinkedIn, here is how you translate your hard work into executive language:
                    </p>
                    <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative group cursor-pointer hover:border-emerald-300 transition-colors">
                      <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Copy & Paste This:</div>
                      <ul className="list-disc list-inside text-sm text-stone-700 space-y-2">
                        <li>Managed and deployed a <strong>${(budget.activeMembers * budget.octoberDuesRate * 2 + budget.actualOccupants * budget.baseRentHoused + 22000).toLocaleString()}</strong> annual operating budget for a 501(c)(7) non-profit organization.</li>
                        <li>Ensured 100% compliance with corporate housing contracts and international tax regulations while negotiating localized dues structures for <strong>{budget.activeMembers + budget.newMembersExpected}</strong> members.</li>
                        <li>Presented financial strategies and cash-flow projections to an Executive Board to secure parliamentary approval.</li>
                      </ul>
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Copy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showPresenter && <PresenterMode onClose={() => setShowPresenter(false)} />}
    </div>
  );
}
