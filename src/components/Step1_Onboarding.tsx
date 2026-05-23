import React, { useState, useRef } from 'react';
import { useBudgetStore } from '../store';
import { OfficerStructure, FacilityType, PropertyManager } from '../types';
import { Users, Building, Settings2, CalendarDays, Upload, Loader2 } from 'lucide-react';

export default function Step1_Onboarding() {
  const { state, dispatch } = useBudgetStore();
  const { budget } = state;

  if (!budget) return null;

  const updateBudget = (key: string, value: any) => {
    dispatch({ type: 'UPDATE_BUDGET', payload: { [key]: value } });
  };

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/agd-budgets/api/import/legacy-excel/${budget.chapter}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      if (data.success && data.budget) {
        Object.entries(data.budget).forEach(([key, val]) => {
           dispatch({ type: 'UPDATE_BUDGET', payload: { [key]: val } });
        });
        alert("Legacy data imported successfully!");
      }
    } catch (error) {
      console.error(error);
      alert("Error importing legacy data. Please check the console.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleToggleAttrition = () => {
    // Apply adjustable attrition
    const fallRate = (100 - budget.attritionFallPercent) / 100;
    const springRate = (100 - budget.attritionSpringPercent) / 100;
    
    dispatch({
      type: 'UPDATE_BUDGET',
      payload: {
        activeMembers: Math.floor(budget.activeMembers * fallRate),
        newMembersExpected: Math.floor(budget.newMembersExpected * springRate)
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-4xl handwritten text-stone-800">Chapter Onboarding</h1>
        <p className="text-stone-500 mt-2 font-medium">Let's set up the core structure of your budget for {budget.year}.</p>
      </div>

      {budget.isColony && (
        <div className="washi-tape-yellow p-5 rounded-xl flex items-start gap-4">
          <div className="bg-white/80 p-2 rounded-lg shadow-sm">
            <span className="text-2xl">🌱</span>
          </div>
          <div>
            <h3 className="font-bold text-amber-900 mb-1 handwritten text-xl">Colony Expansion Mode</h3>
            <p className="text-sm text-amber-900 font-medium">This budget is operating in Colony Mode. Founding Badge and Initiation Fees have been pre-injected into the master registry. Standard sovereign lines remain locked.</p>
          </div>
        </div>
      )}

      {budget.draftStage === 'incubator' && (
        <div className="washi-tape-green p-5 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="font-bold text-emerald-900 mb-1 handwritten text-xl">Legacy Data Available</h3>
            <p className="text-sm text-emerald-900 font-medium">Historical Excel data has been detected. Apply legacy configurations?</p>
          </div>
          <div>
            <input 
              type="file" 
              accept=".xlsx,.xlsb,.xls" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition flex items-center gap-2"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? "Importing..." : "Upload Legacy Excel"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <label className="block text-sm font-bold text-stone-700">Country Location</label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="country" 
              checked={!budget.isCanadian} 
              onChange={() => updateBudget('isCanadian', false)}
              className="w-4 h-4 text-rose-600 focus:ring-rose-500"
            />
            <span className="text-sm font-medium text-stone-700">United States</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="country" 
              checked={budget.isCanadian} 
              onChange={() => updateBudget('isCanadian', true)}
              className="w-4 h-4 text-rose-600 focus:ring-rose-500"
            />
            <span className="text-sm font-medium text-stone-700">Canada</span>
          </label>
        </div>
      </div>

      <div className="space-y-6">
        {/* Term Cadence */}
        <div className="journal-paper p-6 rounded-xl">
          <h3 className="font-semibold text-stone-800 flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-rose-500" /> Academic Calendar
          </h3>
          <p className="text-sm text-stone-500 mb-4">How is your academic calendar structured?</p>
          <div className="flex gap-4">
            <button
              onClick={() => dispatch({ type: 'UPDATE_BUDGET', payload: { termSystem: 'semester' } })}
              className={`flex-1 p-4 rounded-lg border-2 text-center transition-colors ${budget.termSystem === 'semester' ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold' : 'border-stone-200 hover:border-stone-300 text-stone-600'}`}
            >
              2 Terms (Semesters)
            </button>
            <button
              onClick={() => dispatch({ type: 'UPDATE_BUDGET', payload: { termSystem: 'quarter' } })}
              className={`flex-1 p-4 rounded-lg border-2 text-center transition-colors ${budget.termSystem === 'quarter' ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold' : 'border-stone-200 hover:border-stone-300 text-stone-600'}`}
            >
              3 Terms (Quarters)
            </button>
          </div>
        </div>

        {/* Basic Details */}
        <div className="journal-paper p-6 rounded-xl">
          <h3 className="font-semibold text-stone-800 flex items-center gap-2 mb-4">
            <Building className="w-5 h-5 text-rose-500" /> Chapter Details
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Chapter Name</label>
              <input type="text" value={budget.chapter} disabled className="w-full bg-stone-50 px-3 py-2 border border-stone-200 rounded-md text-stone-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Fiscal Year</label>
              <input type="text" value={budget.year} disabled className="w-full bg-stone-50 px-3 py-2 border border-stone-200 rounded-md text-stone-500 cursor-not-allowed" />
            </div>
          </div>
        </div>

        {/* Structure */}
        <div className="journal-paper p-6 rounded-xl">
          <h3 className="font-semibold text-stone-800 flex items-center gap-2 mb-4">
            <Settings2 className="w-5 h-5 text-rose-500" /> Executive Structure
          </h3>
          <p className="text-sm text-stone-500 mb-4">Select your chapter's officer structure. This automatically scales the Officer Budgets tab to remove clutter.</p>
          
          <div className="grid grid-cols-4 gap-4">
            {Object.values(OfficerStructure).map(struct => (
              <button
                key={struct}
                onClick={() => dispatch({ type: 'UPDATE_BUDGET', payload: { officerStructure: struct } })}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${budget.officerStructure === struct ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-stone-200 hover:border-stone-300 text-stone-600'}`}
              >
                Structure {struct}
              </button>
            ))}
          </div>
        </div>

        {/* Housing & Facility Information */}
        <div className="journal-paper p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-100">
            <span className="text-xl">🏠</span>
            <h3 className="font-bold text-stone-800">Facility & Housing Model</h3>
          </div>
          <p className="text-sm text-stone-500 mb-4">What type of physical space does your chapter operate or rent?</p>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: FacilityType.UNHOUSED, label: "No Facility", desc: "Completely unhoused." },
              { id: FacilityType.STORAGE_ONLY, label: "Storage Unit Only", desc: "Renting local physical storage for chapter gear." },
              { id: FacilityType.SUITE, label: "Suite / Chapter Room", desc: "A non-residential meeting space or campus suite." },
              { id: FacilityType.RESIDENTIAL, label: "Residential Facility", desc: "A house or dorm floor with live-in member accommodations." }
            ].map(tier => (
              <div 
                key={tier.id}
                onClick={() => dispatch({ type: 'UPDATE_BUDGET', payload: { facilityType: tier.id as FacilityType, propertyManager: tier.id === FacilityType.RESIDENTIAL ? PropertyManager.FHC : PropertyManager.NONE } })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${budget.facilityType === tier.id ? 'border-rose-500 bg-rose-50' : 'border-stone-200 hover:border-stone-300'}`}
              >
                <div className={`font-bold ${budget.facilityType === tier.id ? 'text-rose-800' : 'text-stone-700'}`}>{tier.label}</div>
                <div className={`text-xs mt-1 ${budget.facilityType === tier.id ? 'text-rose-600' : 'text-stone-500'}`}>{tier.desc}</div>
              </div>
            ))}
          </div>

          {budget.facilityType === FacilityType.RESIDENTIAL && (
            <div className="mt-6 p-4 bg-stone-50 border border-stone-200 rounded-lg animate-in fade-in">
              <label className="block text-sm font-bold text-stone-700 mb-3">Is your property managed by the House Association (HA) or the Fraternity Housing Corporation (FHC)?</label>
              <div className="flex gap-4">
                <button
                  onClick={() => dispatch({ type: 'UPDATE_BUDGET', payload: { propertyManager: PropertyManager.FHC } })}
                  className={`flex-1 p-3 rounded-lg border-2 text-center transition-colors ${budget.propertyManager === PropertyManager.FHC ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-stone-200 hover:border-stone-300 text-stone-600'}`}
                >
                  FHC Managed
                </button>
                <button
                  onClick={() => dispatch({ type: 'UPDATE_BUDGET', payload: { propertyManager: PropertyManager.HA } })}
                  className={`flex-1 p-3 rounded-lg border-2 text-center transition-colors ${budget.propertyManager === PropertyManager.HA ? 'border-amber-500 bg-amber-50 text-amber-700 font-bold' : 'border-stone-200 hover:border-stone-300 text-stone-600'}`}
                >
                  HA Managed
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Large Chapter Status */}
        <div className="journal-paper p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-100">
            <span className="text-xl">🏢</span>
            <h3 className="font-bold text-stone-800">Special Administrative Status</h3>
          </div>
          
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={budget.isLargeChapterEligible} 
              onChange={(e) => updateBudget('isLargeChapterEligible', e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500"
            />
            <div className="text-sm">
              <span className="font-bold text-stone-700 block">International Large Chapter Designation</span>
              <span className="text-stone-500 text-xs">Flag this chapter if it has received official notification that it is subject to the Account 5000 Admin Fee for the upcoming fiscal cycle.</span>
            </div>
          </label>
        </div>

        {/* Purchase Fund Check */}
        <div className="journal-paper p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-100">
            <span className="text-xl">🛍️</span>
            <h3 className="font-bold text-stone-800">Billhighway Purchase Fund</h3>
          </div>
          
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={budget.hasPurchaseFund} 
              onChange={(e) => updateBudget('hasPurchaseFund', e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500"
            />
            <div className="text-sm">
              <span className="font-bold text-stone-700 block">Does your chapter operate an approved Billhighway 'Purchase Fund' for merchandise, t-shirts, and optional gear?</span>
              <span className="text-stone-500 text-xs mt-1 block">Leave this UNCHECKED if you don't have a formal purchase fund. The system will activate the T-Shirt Pass-Through Assistant to keep you compliant!</span>
            </div>
          </label>
        </div>

        {/* Members */}
        <div className="journal-paper p-6 rounded-xl">
          <h3 className="font-semibold text-stone-800 flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-rose-500" /> Membership Estimates
          </h3>
          <p className="text-sm text-stone-500 mb-6">Enter your starting roster. Use the automated attrition engine to safely project your budget.</p>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Active Members</label>
              <input 
                type="number" 
                value={budget.activeMembers} 
                onChange={e => dispatch({ type: 'UPDATE_BUDGET', payload: { activeMembers: Number(e.target.value) } })}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Expected New Members</label>
              <input 
                type="number" 
                value={budget.newMembersExpected} 
                onChange={e => dispatch({ type: 'UPDATE_BUDGET', payload: { newMembersExpected: Number(e.target.value) } })}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500" 
              />
            </div>
          </div>

          <div className="p-5 bg-stone-50 rounded-lg border border-stone-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-medium text-sm text-stone-800">Automated Attrition Engine</p>
                <p className="text-xs text-stone-500">Applies drop-off logic to avoid over-budgeting.</p>
              </div>
              <button 
                onClick={handleToggleAttrition}
                className="px-4 py-2 bg-stone-800 text-white text-sm rounded-md shadow-sm hover:bg-stone-700 transition-colors"
              >
                Apply Safe Estimates
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-stone-200">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-2">Fall Drop-off (e.g. {budget.attritionFallPercent}%)</label>
                <input 
                  type="range" min="0" max="25" 
                  value={budget.attritionFallPercent}
                  onChange={e => dispatch({ type: 'UPDATE_BUDGET', payload: { attritionFallPercent: Number(e.target.value) } })}
                  className="w-full accent-rose-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-2">Spring Drop-off (e.g. {budget.attritionSpringPercent}%)</label>
                <input 
                  type="range" min="0" max="25" 
                  value={budget.attritionSpringPercent}
                  onChange={e => dispatch({ type: 'UPDATE_BUDGET', payload: { attritionSpringPercent: Number(e.target.value) } })}
                  className="w-full accent-rose-500" 
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-200">
            <h4 className="font-bold text-stone-800 mb-2">Member Adjustments</h4>
            <p className="text-sm text-stone-500 mb-4">Do you expect any members to study abroad or take an Inactive status during the year?</p>
            <div className="flex gap-8">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={budget.hasStudyAbroad} 
                  onChange={(e) => dispatch({ type: 'UPDATE_BUDGET', payload: { hasStudyAbroad: e.target.checked } })}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="text-sm font-medium text-stone-700">Study Abroad</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={budget.hasInactives} 
                  onChange={(e) => dispatch({ type: 'UPDATE_BUDGET', payload: { hasInactives: e.target.checked } })}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="text-sm font-medium text-stone-700">Inactive Status</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={() => dispatch({ type: 'SET_STEP', payload: 2 })}
          className="px-6 py-2 bg-rose-600 text-white rounded-lg font-medium shadow-sm hover:bg-rose-700 transition-colors"
        >
          Continue to Member Billing
        </button>
      </div>
    </div>
  );
}
