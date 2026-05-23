import React, { useEffect, useState } from "react";
import { BudgetProvider, useBudgetStore, useAutoSave } from "./store";
import { UserRole } from "./types";
import Sidebar from "./components/Sidebar";
import Step1_Onboarding from "./components/Step1_Onboarding";
import Step2_MemberBilling from "./components/Step2_MemberBilling";
import Step3_OfficerBudgets from "./components/Step3_OfficerBudgets";
import Step4_BudgetCheck from "./components/Step4_BudgetCheck";
import Step5_Export from "./components/Step5_Export";
import Step0_Dashboard from "./components/Step0_Dashboard";
import AdvisorPortal from "./components/AdvisorPortal";
import AdminDashboard from "./components/AdminDashboard";
import LoginScreen from "./components/LoginScreen";
import EmailSimulatorWidget from "./components/EmailSimulatorWidget";
import IdentityGateway from "./components/IdentityGateway";
import { Loader2, CloudUpload, AlertCircle, ChevronDown, Repeat } from "lucide-react";

// The inner app that has access to context
function AppContent() {
  const { state, dispatch } = useBudgetStore();
  useAutoSave(); // Attach global background sync engine

  const [syncStatus, setSyncStatus] = React.useState<'synced' | 'syncing'>('synced');

  // Listen for auto-save events
  useEffect(() => {
    const handleSync = () => {
      setSyncStatus('syncing');
      setTimeout(() => setSyncStatus('synced'), 1500);
    };
    window.addEventListener('budget-auto-saved', handleSync);
    return () => window.removeEventListener('budget-auto-saved', handleSync);
  }, []);

  // Initial fetch simulation
  useEffect(() => {
    async function loadData() {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (token) {
          // Verify magic link
          const authRes = await fetch("/agd-budgets/api/auth/verify-magic-link", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
          const authData = await authRes.json();
          if (authData.success) {
            dispatch({ type: 'SET_SESSION', payload: authData.session });
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else {
          // For prototype: auto-login if no session exists (or uncomment to force login screen)
          // dispatch({ type: 'SET_SESSION', payload: { email: 'vpf@agd.org', name: 'Tanya', role: UserRole.VPF, chapter: 'Nu Delta' } });
        }

        // Fetch budget and FHC
        const [budgetRes, fhcRes] = await Promise.all([
          fetch("/agd-budgets/api/budget/Nu%20Delta"),
          fetch("/agd-budgets/api/fhc/Nu%20Delta")
        ]);
        
        const budgetData = await budgetRes.json();
        const fhcData = await fhcRes.json();

        dispatch({ type: 'SET_BUDGET', payload: budgetData.budget });
        if (budgetData.isGlobalPreviewMode !== undefined) {
          dispatch({ type: 'SET_PREVIEW_MODE', payload: budgetData.isGlobalPreviewMode });
        }
        if (fhcData.success) {
          dispatch({ type: 'SET_FHC_RATES', payload: fhcData.data });
        }
      } catch (e) {
        console.error(e);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load initial data.' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    loadData();
  }, [dispatch]);

  // Handle Role Switching for demo purposes
  const toggleRole = () => {
    if (!state.session) return;
    let newRole = UserRole.VPF;
    if (state.session.role === UserRole.VPF) newRole = UserRole.FA;
    else if (state.session.role === UserRole.FA) newRole = UserRole.IHQ;
    dispatch({ type: 'SET_SESSION', payload: { ...state.session, role: newRole } });
  };

  if (state.isLoading || !state.budget) {
    return (
      <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center flex-col gap-4 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        <p className="font-serif italic text-lg">Loading Pearl & Rose Vault...</p>
      </div>
    );
  }

  if (!state.session) {
    return (
      <>
        <LoginScreen />
        <EmailSimulatorWidget />
      </>
    );
  }

  if (state.session.requiresIdentitySelection) {
    return (
      <>
        <IdentityGateway />
        <EmailSimulatorWidget />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans text-stone-800">
      
      {/* Preview Mode Banner */}
      {state.isGlobalPreviewMode && (
        <div className="bg-amber-100 text-amber-900 border-b border-amber-200 px-6 py-2.5 text-sm font-medium flex items-center justify-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <p>
            <strong className="font-bold">🔮 Preview Mode:</strong> You are planning early! The international fees loaded are from 2026-2027. International Council will lock the new rates in late January.
          </p>
        </div>
      )}

      {/* Top Nav Bar */}
      <nav className="h-14 torn-header flex items-center justify-between px-6 shrink-0 z-10 shadow-sm relative">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌸</span>
          <span className="handwritten text-3xl text-rose-900 mt-1">Pearl & Rose</span>
          <span className="ml-2 px-2 py-0.5 bg-stone-100/80 text-stone-600 text-[10px] font-bold rounded uppercase tracking-widest border border-stone-200/50 shadow-sm">VPF Co-Pilot</span>
        </div>
        <div className="flex items-center gap-4 relative group">
          {/* Cloud Sync Indicator */}
          {state.session?.role === UserRole.VPF && (
            <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${syncStatus === 'syncing' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <CloudUpload className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-bounce' : ''}`} />
              {syncStatus === 'syncing' ? 'Saving...' : 'Saved to Cloud'}
            </div>
          )}

          {/* The Workspace Switcher */}
          {state.session?.globalRoles && state.session.globalRoles.length > 1 ? (
            <div className="relative">
              <button className="flex items-center gap-2 text-sm bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-xl transition-colors font-medium cursor-pointer">
                <span className="truncate max-w-[200px]">Active Workspace: {state.session.globalRoles.find(r => r.role === state.session?.role && JSON.stringify(r.scope) === JSON.stringify(state.session?.scope))?.displayName || state.session.name}</span>
                <ChevronDown className="w-4 h-4 text-stone-400" />
              </button>
              
              {/* Dropdown Menu (Hover) */}
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden transform origin-top-right">
                <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 text-xs font-bold uppercase tracking-wider text-stone-500">
                  Switch Workspace
                </div>
                <div className="py-2">
                  {state.session.globalRoles.map((r, i) => {
                    const isActive = r.role === state.session?.role && JSON.stringify(r.scope) === JSON.stringify(state.session?.scope);
                    return (
                      <button 
                        key={i}
                        onClick={async () => {
                          dispatch({ type: 'SET_LOADING', payload: true });
                          try {
                            const res = await fetch("/agd-budgets/api/auth/shift-context", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ token: sessionStorage.getItem('agd_token') || 'demo_token', desiredRole: r.role, scope: r.scope })
                            });
                            const data = await res.json();
                            if (data.success) {
                              dispatch({ type: 'SET_SESSION', payload: data.session });
                            }
                          } catch(e) {
                            console.error(e);
                          }
                          dispatch({ type: 'SET_LOADING', payload: false });
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center justify-between transition-colors ${isActive ? 'bg-stone-50 pointer-events-none' : ''}`}
                      >
                        <div>
                          <div className={`font-bold text-sm ${isActive ? 'text-indigo-600' : 'text-stone-700'}`}>{r.displayName}</div>
                        </div>
                        {!isActive && <Repeat className="w-4 h-4 text-stone-400" />}
                      </button>
                    )
                  })}
                </div>
                <div className="border-t border-stone-100 p-2">
                  <button onClick={() => {
                    sessionStorage.removeItem('agd_token');
                    window.location.reload();
                  }} className="w-full text-left px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    Log out entirely
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm hidden sm:block">
              Logged in as <strong className="text-stone-700">{state.session?.name}</strong> ({state.session?.role})
            </div>
          )}
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Render Advisor Portal OR VPF Wizard */}
        {state.session?.role === UserRole.IHQ ? (
          <div className="flex-1 overflow-y-auto bg-stone-100">
            <AdminDashboard />
          </div>
        ) : state.session?.role === UserRole.FA || state.session?.role === UserRole.RFC ? (
          <div className="flex-1 overflow-y-auto">
            <AdvisorPortal />
          </div>
        ) : (
          <>
            {/* VPF Wizard Area */}
            <div className="flex-1 overflow-y-auto relative">
              
              {/* Wizard Step Progress Header */}
              <div className="sticky top-0 torn-header shadow-sm p-4 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                  {[
                    { num: 1, label: "📋 The Vibe Check" },
                    { num: 2, label: "👯 Roster & Squad Goals" },
                    { num: 3, label: "💳 The Cash Inflow Matrix" },
                    { num: 4, label: "🛠️ Officer Operations Fuel" },
                    { num: 5, label: "🚀 Billhighway Launchpad" }
                  ].map((step) => (
                    <div key={step.num} className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${state.currentStep === step.num ? 'bg-rose-600 text-white shadow-md' : state.currentStep > step.num ? 'bg-rose-200 text-rose-800' : 'bg-stone-200 text-stone-400'}`}>
                          {step.num}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider hidden md:block ${state.currentStep === step.num ? 'text-rose-900' : state.currentStep > step.num ? 'text-rose-700' : 'text-stone-400'}`}>
                          {step.label}
                        </span>
                      </div>
                      {step.num < 5 && <div className="w-6 h-px bg-stone-300 ml-1" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Wizard Steps */}
              <div className="pb-24">
                {state.currentStep === 0 && <Step0_Dashboard />}
                {state.currentStep === 1 && <Step1_Onboarding />}
                {state.currentStep === 2 && <Step2_MemberBilling />}
                {state.currentStep === 3 && <Step3_OfficerBudgets />}
                {state.currentStep === 4 && <Step4_BudgetCheck />}
                {state.currentStep === 5 && <Step5_Export />}
              </div>
            </div>

            {/* VPF Gamified Sidebar */}
            {state.currentStep < 5 && <Sidebar />}
          </>
        )}
      </div>
      <EmailSimulatorWidget />
    </div>
  );
}

// Wrapper to provide context
export default function App() {
  return (
    <BudgetProvider>
      <AppContent />
    </BudgetProvider>
  );
}
