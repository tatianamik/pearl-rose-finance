import React from 'react';
import { useBudgetStore } from '../store';
import { Shield, Map, LayoutDashboard, Calculator } from 'lucide-react';
import { GlobalRole, UserRole } from '../types';

export default function IdentityGateway() {
  const { state, dispatch } = useBudgetStore();
  const { session } = state;

  if (!session || !session.globalRoles || session.globalRoles.length === 0) return null;

  const handleSelectRole = async (roleObj: GlobalRole) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token') || sessionStorage.getItem('agd_token') || 'demo_token';
      
      const res = await fetch("/agd-budgets/api/auth/shift-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          desiredRole: roleObj.role,
          scope: roleObj.scope
        })
      });
      
      const data = await res.json();
      if (data.success) {
        dispatch({ type: 'SET_SESSION', payload: data.session });
        sessionStorage.setItem('agd_token', token);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to shift context.");
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  const getIcon = (role: UserRole) => {
    if (role === UserRole.IHQ) return <Shield className="w-8 h-8 text-indigo-500" />;
    if (role === UserRole.RFC) return <Map className="w-8 h-8 text-indigo-500" />;
    if (role === UserRole.FA) return <LayoutDashboard className="w-8 h-8 text-indigo-500" />;
    return <Calculator className="w-8 h-8 text-indigo-500" />;
  };

  const getDescription = (roleObj: GlobalRole) => {
    if (roleObj.role === UserRole.RFC && typeof roleObj.scope === 'string' && roleObj.scope.includes('Region')) {
      return "Oversee your Specialists, track regional heatmaps, and audit the broad submission pipeline.";
    }
    if (roleObj.role === UserRole.RFC && Array.isArray(roleObj.scope)) {
      return `Directly review and manage your ${roleObj.scope.length} assigned specialist chapters.`;
    }
    if (roleObj.role === UserRole.FA) {
      return "Jump right into co-pilot mode with the student VPF to look at local dues and empty bed setups.";
    }
    return "Enter student workspace.";
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-rose-200 text-2xl">
            👑
          </div>
          <h2 className="text-3xl font-serif text-stone-800">Choose Your Workspace</h2>
          <p className="text-stone-500 mt-2">Good morning, {session.name.split(' ')[0]}. Which lens are you looking through today?</p>
        </div>

        <div className="grid gap-4">
          {session.globalRoles.map((r, i) => (
            <button
              key={i}
              onClick={() => handleSelectRole(r)}
              className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left flex items-start gap-6 group"
            >
              <div className="bg-stone-50 p-4 rounded-xl group-hover:bg-indigo-50 transition-colors">
                {getIcon(r.role)}
              </div>
              <div className="flex-1 mt-1">
                <h3 className="font-bold text-lg text-stone-800 mb-1 group-hover:text-indigo-900">{r.displayName}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">
                  {getDescription(r)}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0">
                  Enter Portal &rarr;
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
