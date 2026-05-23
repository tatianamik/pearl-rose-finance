import React, { useState, useEffect } from 'react';
import { useBudgetStore } from '../store';
import { CheckCircle, AlertCircle, MessageSquare, ExternalLink, ArrowLeft, ArrowRight, LayoutDashboard, Send, Archive, Download, CalendarClock } from 'lucide-react';

export default function AdvisorPortal() {
  const { state, dispatch } = useBudgetStore();
  const { budget, fhcRates } = state;
  const [viewMode, setViewMode] = useState<'list' | 'chapter'>('list');
  const [chapters, setChapters] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [activeCommentField, setActiveCommentField] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode === 'list') {
      fetch('/agd-budgets/api/chapters')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            let filteredChapters = data.chapters;
            if (state.session?.scope) {
              if (Array.isArray(state.session.scope)) {
                filteredChapters = data.chapters.filter((c: any) => state.session!.scope!.includes(c.chapter));
              } else if (state.session.scope === "Nu Delta") {
                filteredChapters = data.chapters.filter((c: any) => c.chapter === "Nu Delta");
              } else if (state.session.scope.includes("Region")) {
                // Mock Region filtering - normally this would be a backend join
                // For now, if Region 2, just show all mocked chapters
                filteredChapters = data.chapters;
              }
            }
            setChapters(filteredChapters);
          }
        })
        .catch(console.error);
    }
  }, [viewMode]);

  const loadChapter = async (chapterName: string) => {
    try {
      const res = await fetch(`/agd-budgets/api/budget/${encodeURIComponent(chapterName)}`);
      const data = await res.json();
      if (data.success) {
        dispatch({ type: 'SET_BUDGET', payload: data.budget });
        setViewMode('chapter');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (fieldId: string) => {
    if (!commentText.trim() || !budget) return;
    
    try {
      const res = await fetch(`/agd-budgets/api/budget/${encodeURIComponent(budget.chapter)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldId,
          author: state.session?.name || 'Advisor',
          text: commentText
        })
      });
      const data = await res.json();
      if (data.success) {
        dispatch({
          type: 'UPDATE_BUDGET',
          payload: { advisorComments: data.comments }
        });
        setCommentText('');
        setActiveCommentField(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async () => {
    if (!budget) return;
    try {
      const res = await fetch(`/agd-budgets/api/budget/${encodeURIComponent(budget.chapter)}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        dispatch({ type: 'UPDATE_BUDGET', payload: { draftStage: 'approved' } });
        alert("Budget officially approved! Billhighway CSV export is now unlocked for the chapter.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stageIcons: Record<string, string> = {
    'incubator': '🌱 Incubator',
    'volunteer_build': '🧱 Build Phase',
    'drafting': '✍️ Drafting (Early)',
    'executive_council': '🗳️ Pending EC Vote',
    'submitted': '📋 Awaiting Advisor Review',
    'approved': '✅ Approved',
    'exported': '🚀 Billhighway Live'
  };

  const handleMarkTaxCompleted = async (chapter: string) => {
    try {
      const res = await fetch(`/agd-budgets/api/budget/${encodeURIComponent(chapter)}/tax-completed`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setChapters(chapters.map(c => c.chapter === chapter ? { ...c, tax990NCompleted: true } : c));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeChapters = chapters.filter(c => c.status !== 'CLOSED');
  const closedChapters = chapters.filter(c => c.status === 'CLOSED' && !c.tax990NCompleted);

  const chaptersNeedsAttention = activeChapters.filter(c => c.draftStage === 'submitted');
  const chaptersInProgress = activeChapters.filter(c => c.draftStage !== 'submitted' && c.draftStage !== 'approved' && c.draftStage !== 'exported');
  const chaptersDone = activeChapters.filter(c => c.draftStage === 'approved' || c.draftStage === 'exported');

  const PipelineProgress = ({ stage }: { stage: string }) => {
    const stages = ['incubator', 'volunteer_build', 'drafting', 'executive_council', 'submitted', 'approved'];
    const currentIndex = stages.indexOf(stage === 'exported' ? 'approved' : stage);
    
    return (
      <div className="w-full mt-4">
        <div className="flex items-center justify-between relative px-2">
          <div className="absolute top-1/2 left-2 right-2 h-[2px] bg-rose-100 -z-10 -translate-y-1/2"></div>
          {stages.map((s, idx) => (
            <div key={s} className={`w-3.5 h-3.5 rounded-full border-2 ${idx <= currentIndex ? 'bg-rose-100 border-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]' : 'bg-white border-rose-100'} transition-all duration-500`} title={stageIcons[s] || s}></div>
          ))}
        </div>
        <div className="text-center mt-2 text-[10px] uppercase tracking-widest font-bold text-stone-400">
          {stageIcons[stage] || stage}
        </div>
      </div>
    );
  };

  const ChapterCard = ({ ch }: { ch: any }) => (
    <div className="journal-paper p-5 rounded-2xl shadow-sm border border-stone-200 relative group hover:shadow-md transition-shadow">
      {/* Washi tape accent */}
      <div className="washi-tape-pink absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 opacity-80 z-10"></div>
      
      <div className="flex justify-between items-start mt-2">
        <div>
          <h3 className="font-bold text-xl handwritten text-stone-800 tracking-wide">{ch.chapter}</h3>
          {ch.status === 'COLONY' && (
            <span className="text-[9px] uppercase tracking-widest font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full block w-max mt-1">Expansion Mode</span>
          )}
        </div>
        <span className="text-[10px] text-stone-400 font-mono">Last seen: {ch.lastActive || "Just now"}</span>
      </div>

      <PipelineProgress stage={ch.draftStage} />

      <div className="mt-5 space-y-2">
        {ch.health.hasLocalDeficit && (
          <div className="flex items-center gap-2 bg-rose-50 text-rose-800 text-xs px-3 py-1.5 rounded-lg border border-rose-100">
            <AlertCircle className="w-3.5 h-3.5" /> <span className="font-bold">Local Deficit Detected</span>
          </div>
        )}
        {ch.health.hasIncentive && (
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-800 text-xs px-3 py-1.5 rounded-lg border border-indigo-100">
            <span className="text-sm">📢</span> <span className="font-bold">Active Live-In Incentive</span>
          </div>
        )}
        {!ch.health.hasLocalDeficit && !ch.health.hasIncentive && (
          <div className="flex items-center gap-2 bg-stone-50 text-stone-500 text-xs px-3 py-1.5 rounded-lg border border-stone-100">
            <CheckCircle className="w-3.5 h-3.5" /> <span className="font-medium">All clear</span>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button 
          onClick={() => loadChapter(ch.chapter)}
          className={`w-full py-2.5 rounded-xl font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 ${
            ch.draftStage === 'submitted' 
              ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse' 
              : 'bg-white border-2 border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300'
          }`}
        >
          {ch.draftStage === 'submitted' ? (
            <>Review & Sign-Off <ArrowRight className="w-4 h-4" /></>
          ) : (
            <><ExternalLink className="w-4 h-4" /> Spectator Mode</>
          )}
        </button>
      </div>
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div className="max-w-6xl mx-auto p-8 animate-in fade-in space-y-10 relative">
        {/* Subtle decorative background elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-rose-100 rounded-full blur-3xl opacity-40 pointer-events-none -z-10"></div>
        <div className="absolute top-60 left-10 w-48 h-48 bg-amber-100 rounded-full blur-3xl opacity-30 pointer-events-none -z-10"></div>

        <div className="flex items-center gap-4 border-b-2 border-stone-100 pb-6 torn-header">
          <LayoutDashboard className="w-10 h-10 text-rose-500" />
          <div>
            <h1 className="text-4xl font-bold handwritten text-stone-800">Volunteer Support Team (VST)</h1>
            <p className="text-stone-500 font-medium mt-1">
              {state.session?.role === 'RFC' && Array.isArray(state.session.scope) 
                ? 'Finance Specialist Portfolio' 
                : state.session?.role === 'RFC'
                ? 'Regional Dashboard Overview'
                : 'Finance Advisor Workspace'}
            </p>
          </div>
        </div>

        {chaptersNeedsAttention.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-rose-900 border-l-4 border-rose-500 pl-3">Awaiting Your Review</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chaptersNeedsAttention.map(ch => <ChapterCard key={ch.chapter} ch={ch} />)}
            </div>
          </div>
        )}

        {chaptersInProgress.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-stone-700 border-l-4 border-stone-400 pl-3">Currently Drafting</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chaptersInProgress.map(ch => <ChapterCard key={ch.chapter} ch={ch} />)}
            </div>
          </div>
        )}

        {chaptersDone.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-emerald-800 border-l-4 border-emerald-500 pl-3">Approved & Locked</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chaptersDone.map(ch => <ChapterCard key={ch.chapter} ch={ch} />)}
            </div>
          </div>
        )}

        {activeChapters.length === 0 && (
          <div className="text-center py-20 text-stone-400 italic font-serif">
            No active chapters in this view.
          </div>
        )}

        {/* 990-N Reminder */}
        {closedChapters.length > 0 && (
          <div className="bg-rose-50/50 border-2 border-rose-100 rounded-xl p-6 relative overflow-hidden mt-12 transform rotate-1">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Archive className="w-32 h-32 text-rose-900" />
            </div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-white p-3 rounded-full shadow-sm rotate-[-5deg]">
                <CalendarClock className="w-6 h-6 text-rose-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-rose-900 font-bold text-xl handwritten mb-1">Tax Guardrail: Final 990-N Filing Due July 15</h3>
                <p className="text-rose-800 text-sm mb-4 font-medium">You have <strong>{closedChapters.length}</strong> closed chapter(s) that were active for a portion of the current fiscal year. Ensure the short-period IRS Form 990-N e-Postcard is filed to officially close their tax ID.</p>
                
                <div className="space-y-3">
                  {closedChapters.map(ch => (
                    <div key={ch.chapter} className="flex items-center justify-between bg-white border border-rose-100 p-4 rounded-xl shadow-sm hover:shadow-md transition">
                      <div className="font-bold text-rose-950 flex items-center gap-3">
                        <span className="text-lg">{ch.chapter}</span>
                        <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-1 rounded font-mono border border-stone-200">EIN: XX-XXXXXXX</span>
                      </div>
                      <div className="flex gap-3">
                        <a href="https://www.irs.gov/charities-non-profits/annual-electronic-filing-requirement-for-small-exempt-organizations-form-990-n-e-postcard" target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg transition inline-flex items-center gap-1">
                          <ExternalLink className="w-3.5 h-3.5" /> Open IRS Portal
                        </a>
                        <button onClick={() => handleMarkTaxCompleted(ch.chapter)} className="text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-2 rounded-lg transition inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Mark Tax Completed
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Archival Drawer */}
        <div className="mt-12">
          <h2 className="text-lg font-serif text-stone-500 mb-4 flex items-center gap-2"><Archive className="w-5 h-5" /> Archived Regional Assets</h2>
          <div className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="p-4">Chapter Designation</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Final Cycle</th>
                  <th className="p-4 text-right">Available Exports</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-stone-600">
                {closedChapters.map(ch => (
                  <tr key={ch.chapter} className="hover:bg-stone-100 transition">
                    <td className="p-4 font-bold">{ch.chapter}</td>
                    <td className="p-4"><span className="bg-stone-200 text-stone-600 px-2 py-1 rounded text-xs font-bold uppercase">Closed / Inactive</span></td>
                    <td className="p-4 font-mono text-xs">{ch.lastActive || "2024-2025"}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button className="px-3 py-1.5 bg-white border border-stone-300 text-stone-600 hover:bg-stone-50 font-bold rounded-lg transition inline-flex items-center gap-1.5 text-xs shadow-sm">
                        <Download className="w-3.5 h-3.5 text-emerald-600" /> Excel Blueprint
                      </button>
                      <button className="px-3 py-1.5 bg-white border border-stone-300 text-stone-600 hover:bg-stone-50 font-bold rounded-lg transition inline-flex items-center gap-1.5 text-xs shadow-sm">
                        <Download className="w-3.5 h-3.5 text-indigo-600" /> Billhighway CSV
                      </button>
                    </td>
                  </tr>
                ))}
                {closedChapters.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-stone-400 italic">No archived chapters in this region.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Spectator Mode / Chapter View
  if (!budget) return null;

  const isParlorMatch = fhcRates && budget.parlorFee >= fhcRates.contractedRates.parlorFeePerMember;
  const isPropSupportMatch = fhcRates && budget.propertySupportFee >= fhcRates.contractedRates.propertySupportFeePerMember;
  const isDamageMatch = fhcRates && budget.fhcDamageFee >= fhcRates.contractedRates.fhcDamageFee;
  const isRentMatch = fhcRates && budget.baseRentHoused >= fhcRates.contractedRates.baseRentHoused;

  const commentsForParlor = budget.advisorComments?.filter(c => c.fieldId === 'parlorFee') || [];

  return (
    <div className="max-w-4xl mx-auto p-8 animate-in slide-in-from-right-8 space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <button onClick={() => setViewMode('list')} className="text-stone-400 hover:text-stone-800 flex items-center gap-1.5 text-sm font-bold mb-3 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Regional Dashboard
          </button>
          <h1 className="text-3xl font-serif text-stone-800 flex items-center gap-3">
            {budget.chapter} Workspace <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-md font-mono font-bold uppercase tracking-widest border border-amber-200">Spectator Mode</span>
          </h1>
          <p className="text-stone-500 mt-2">Currently observing live drafting session. Drop inline notes to guide the VPF.</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold uppercase text-stone-400 mb-1">Draft Stage</div>
          <div className="text-lg font-bold text-indigo-700">{stageIcons[budget.draftStage]}</div>
        </div>
      </div>

      {budget.draftStage === 'incubator' && (
        <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="font-bold text-indigo-900 mb-1">🌱 Colony Incubator Active</h3>
            <p className="text-sm text-indigo-700">This baseline is protected from student view until you finish standardizing the local fee goals.</p>
          </div>
          <button 
            onClick={async () => {
              await fetch(`/agd-budgets/api/budget/${encodeURIComponent(budget.chapter)}/release`, { method: 'POST' });
              dispatch({ type: 'UPDATE_BUDGET', payload: { draftStage: 'drafting' } });
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm transition"
          >
            Release to Collegiate VPF
          </button>
        </div>
      )}

      {budget.draftStage === 'exported' && (
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div>
            <span className="font-bold block mb-1">Exported & Completed</span>
            The VPF of {budget.chapter} has successfully generated and downloaded their final Billhighway CSV ledger.
          </div>
        </div>
      )}

      {/* FHC Compliance Report Widget */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden relative">
        <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] uppercase font-bold text-stone-400 bg-stone-100 px-2 py-1 rounded-md">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Sync Active
        </div>
        <div className="bg-slate-50 border-b border-stone-200 p-4 font-semibold text-slate-800 flex items-center gap-2">
          📑 FHC Compliance Report
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            
            {/* Parlor Fee Example with Inline Commenting */}
            <div className={`p-4 rounded-lg border flex flex-col gap-3 transition-colors ${isParlorMatch ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-start gap-3">
                {isParlorMatch ? <CheckCircle className="text-emerald-500 mt-0.5 w-5 h-5" /> : <AlertCircle className="text-amber-500 mt-0.5 w-5 h-5" />}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">Parlor Fee</p>
                      <p className="text-xs text-stone-500 mt-1">Budgeted: <span className="font-mono font-bold">${budget.parlorFee}</span> | Contract: ${fhcRates?.contractedRates.parlorFeePerMember}</p>
                    </div>
                    <button 
                      onClick={() => setActiveCommentField(activeCommentField === 'parlorFee' ? null : 'parlorFee')}
                      className="text-stone-400 hover:text-indigo-600 transition p-1.5 hover:bg-white rounded-md"
                      title="Add Inline Note"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Inline Comments Thread */}
                  {(commentsForParlor.length > 0 || activeCommentField === 'parlorFee') && (
                    <div className="mt-4 pt-4 border-t border-amber-200/50">
                      <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">Inline Notes</p>
                      
                      <div className="space-y-2 mb-3">
                        {commentsForParlor.map(c => (
                          <div key={c.id} className="bg-white/60 p-2.5 rounded-lg text-xs border border-amber-100 relative group">
                            <span className="font-bold text-amber-900">{c.author}:</span> <span className="text-stone-700">{c.text}</span>
                            <button className="absolute top-1.5 right-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">Resolve</button>
                          </div>
                        ))}
                      </div>

                      {activeCommentField === 'parlorFee' && (
                        <div className="flex gap-2 animate-in fade-in zoom-in-95">
                          <input 
                            type="text" 
                            autoFocus
                            placeholder="Drop a sticky note for the VPF..." 
                            className="flex-1 text-xs px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddComment('parlorFee') }}
                          />
                          <button 
                            onClick={() => handleAddComment('parlorFee')}
                            className="px-3 py-2 bg-amber-600 text-white text-xs rounded-lg hover:bg-amber-700 font-bold transition shadow-sm"
                          >
                            Post
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border flex items-start gap-3 ${isRentMatch ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              {isRentMatch ? <CheckCircle className="text-emerald-500 mt-0.5 w-5 h-5" /> : <AlertCircle className="text-rose-500 mt-0.5 w-5 h-5" />}
              <div>
                <p className="font-medium text-sm">Total Base Rent Income</p>
                <p className="text-xs text-stone-500 mt-1">Budgeted: <span className="font-mono font-bold">${budget.baseRentHoused}</span> | Contract: ${fhcRates?.contractedRates.baseRentHoused}</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {budget.miscExpenseJustification && (
        <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 overflow-hidden relative">
          <div className="bg-amber-100/50 border-b border-amber-200 p-4 font-semibold text-amber-900 flex items-center gap-2">
            ⚠️ IRS / CRA Miscellaneous Review
          </div>
          <div className="p-6">
            <p className="text-sm text-amber-800 mb-2">
              This chapter exceeded the 5% threshold for unspecified Miscellaneous funds. The VPF provided the following mandatory explanation:
            </p>
            <div className="bg-white p-4 rounded-lg border border-amber-200 text-stone-700 italic text-sm">
              "{budget.miscExpenseJustification}"
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t border-stone-200">
        <button className="px-6 py-2.5 rounded-xl font-bold text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition">
          Generate Exception Report
        </button>
        <button 
          onClick={handleApprove}
          className="px-8 py-2.5 rounded-xl font-bold shadow-sm bg-emerald-600 text-white hover:bg-emerald-700 transition"
        >
          Digitally Approve Budget
        </button>
      </div>
    </div>
  );
}
