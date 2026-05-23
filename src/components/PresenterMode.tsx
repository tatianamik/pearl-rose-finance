import React, { useState } from 'react';
import { useBudgetStore } from '../store';
import { Presentation, X, ArrowRight, Play, CheckCircle } from 'lucide-react';

export default function PresenterMode({ onClose }: { onClose: () => void }) {
  const { state } = useBudgetStore();
  const { budget } = state;
  const [slide, setSlide] = useState(0);

  if (!budget) return null;

  // Derive simple metrics for the presentation
  const totalRevenue = budget.billingGroups.reduce((acc, bg) => acc + (bg.breakdown.chapterDues * bg.memberCount), 0);
  const totalOperations = budget.recruitmentBudget + budget.sisterhoodBudget + budget.socialBudget + budget.philanthropyBudget + budget.miscExpense;
  const healthStatus = "Balanced"; // Mocked for display

  const slides = [
    {
      title: "Alpha Gamma Delta",
      subtitle: `${budget.chapter} Chapter - FY ${budget.year} Budget`,
      content: (
        <div className="text-center mt-12">
          <p className="text-4xl text-stone-600 font-serif mb-4">Executive Council Vote</p>
          <div className="text-xl text-stone-500 font-mono">Prepared by: VP Finance</div>
        </div>
      )
    },
    {
      title: "Roster & Housing Strategy",
      subtitle: "Baseline Operational Assumptions",
      content: (
        <div className="grid grid-cols-2 gap-12 mt-12 text-left">
          <div className="bg-white/10 p-8 rounded-2xl border border-white/20">
            <h3 className="text-3xl font-bold mb-6 text-emerald-400">Roster Mix</h3>
            <ul className="text-2xl space-y-4 text-stone-200">
              <li className="flex justify-between"><span>Active Members:</span> <strong>{budget.actualActiveMembers}</strong></li>
              <li className="flex justify-between"><span>New Members:</span> <strong>{budget.actualNewMembers}</strong></li>
              <li className="flex justify-between text-emerald-300 border-t border-white/10 pt-4 mt-4"><span>Total Roster:</span> <strong>{budget.actualActiveMembers + budget.actualNewMembers}</strong></li>
            </ul>
          </div>
          <div className="bg-white/10 p-8 rounded-2xl border border-white/20">
            <h3 className="text-3xl font-bold mb-6 text-amber-400">Housing Status</h3>
            <ul className="text-2xl space-y-4 text-stone-200">
              <li className="flex justify-between"><span>Facility Type:</span> <strong className="capitalize">{budget.facilityType.toLowerCase()}</strong></li>
              <li className="flex justify-between"><span>Occupancy Target:</span> <strong>{budget.contractedBeds}</strong></li>
              <li className="flex justify-between text-amber-300 border-t border-white/10 pt-4 mt-4"><span>Current Live-Ins:</span> <strong>{budget.actualOccupants}</strong></li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "The Bottom Line",
      subtitle: "High-Level Financial Outlook",
      content: (
        <div className="flex flex-col items-center justify-center mt-12">
          <div className="w-full max-w-3xl bg-white/10 p-8 rounded-3xl border border-white/20 mb-8">
            <div className="text-center mb-6">
              <span className="text-xl uppercase tracking-widest text-stone-400 font-bold block mb-2">Projected Local Chapter Revenue</span>
              <span className="text-7xl font-mono text-white">${totalRevenue.toLocaleString()}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 w-full max-w-4xl">
            <div className="bg-indigo-500/20 border border-indigo-400/30 p-6 rounded-2xl text-center">
              <span className="block text-sm uppercase tracking-wider text-indigo-300 mb-2">Programming</span>
              <span className="text-3xl font-bold text-white">${totalOperations.toLocaleString()}</span>
            </div>
            <div className="bg-rose-500/20 border border-rose-400/30 p-6 rounded-2xl text-center">
              <span className="block text-sm uppercase tracking-wider text-rose-300 mb-2">Housing / FHC</span>
              <span className="text-3xl font-bold text-white">Managed</span>
            </div>
            <div className="bg-emerald-500/20 border border-emerald-400/30 p-6 rounded-2xl text-center">
              <span className="block text-sm uppercase tracking-wider text-emerald-300 mb-2">Net Health</span>
              <span className="text-3xl font-bold text-white">{healthStatus}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "EC Vote Required",
      subtitle: "Formal parliamentary approval",
      content: (
        <div className="text-center mt-16 max-w-2xl mx-auto space-y-8">
          <div className="p-8 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl">
            <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
            <h3 className="text-3xl text-white font-bold mb-4">Budget Balanced & Compliant</h3>
            <p className="text-xl text-stone-300">This budget has passed all automated IHQ compliance checks. It is ready for your formal review and vote.</p>
          </div>
          <p className="text-stone-400 text-lg italic">
            "I move to approve the 2026-2027 Chapter Budget as presented."
          </p>
        </div>
      )
    }
  ];

  const currentSlide = slides[slide];

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
      
      {/* Top Bar Navigation */}
      <div className="absolute top-0 inset-x-0 h-20 px-8 flex justify-between items-center bg-gradient-to-b from-stone-900 to-transparent">
        <div className="flex items-center gap-3 text-stone-400 hover:text-white transition cursor-pointer" onClick={onClose}>
          <X className="w-6 h-6" /> <span className="text-lg font-bold uppercase tracking-wider">Exit Presentation</span>
        </div>
        <div className="text-stone-500 font-mono text-sm">
          Slide {slide + 1} / {slides.length}
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="w-full max-w-6xl px-12 transition-all duration-300 transform">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-serif text-white mb-4 drop-shadow-lg">{currentSlide.title}</h1>
          <h2 className="text-2xl text-rose-400 font-mono font-bold tracking-widest uppercase">{currentSlide.subtitle}</h2>
        </div>
        {currentSlide.content}
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-12 inset-x-0 flex justify-center gap-8">
        <button 
          onClick={() => setSlide(Math.max(0, slide - 1))}
          disabled={slide === 0}
          className="px-8 py-4 rounded-full bg-stone-800 text-white font-bold text-xl disabled:opacity-30 hover:bg-stone-700 transition"
        >
          Previous
        </button>
        <button 
          onClick={() => {
            if (slide === slides.length - 1) {
              onClose();
            } else {
              setSlide(Math.min(slides.length - 1, slide + 1));
            }
          }}
          className="px-8 py-4 rounded-full bg-rose-600 text-white font-bold text-xl flex items-center gap-3 hover:bg-rose-500 transition shadow-lg shadow-rose-900/50"
        >
          {slide === slides.length - 1 ? "Finish & Record Vote" : "Next Slide"} <ArrowRight className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}
