/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ChapterBudgetState, ChapterContract, UserRole } from "../types";
import { Lock, Unlock, HelpCircle, Save, Percent, Coins, ChevronRight } from "lucide-react";

interface HousingContractProps {
  budget: ChapterBudgetState;
  contract: ChapterContract;
  userRole: UserRole;
  onUpdateBudget: (updated: Partial<ChapterBudgetState>) => void;
  onSaveMasterHousing: (contract: ChapterContract) => Promise<void>;
  calculatedSummary: any;
  isPreviewMode?: boolean;
}

export default function HousingContract({
  budget,
  contract,
  userRole,
  onUpdateBudget,
  onSaveMasterHousing,
  calculatedSummary,
  isPreviewMode = false
}: HousingContractProps) {
  const [fhcRent, setFhcRent] = useState(contract.fhcRent);
  const [parlorFee, setParlorFee] = useState(contract.parlorFee);
  const [propertySupport, setPropertySupport] = useState(contract.propertySupport);
  const [storageFee, setStorageFee] = useState(contract.storageFee);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isIhq = userRole === UserRole.IHQ;

  const handleSaveIHQ = async () => {
    setIsSaving(true);
    await onSaveMasterHousing({
      chapter: budget.chapter,
      fhcRent: Number(fhcRent),
      parlorFee: Number(parlorFee),
      propertySupport: Number(propertySupport),
      storageFee: Number(storageFee)
    });
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Live calculation of credits & offsets
  const baseLiveInRate = budget.localOperationsFeeLiveIn; 
  const currentCredit = budget.localCreditLiveInOffset;
  const realLiveInRate = Math.max(0, baseLiveInRate - currentCredit);
  const annualCreditImpact = currentCredit * budget.actualOccupants;

  return (
    <div className="torn-card journal-paper p-5 sm:p-6 rounded-lg relative overflow-hidden">
      {/* Torn Paper Header */}
      <div className="torn-header -mx-6 -mt-6 p-4 border-b-2 border-journal-gold/50 flex justify-between items-center bg-zinc-50">
        <div>
          <h2 className="text-2xl font-bold font-heading text-journal-dark">🏡 Sovereign Housing & Lease Locks</h2>
          <p className="text-xs font-mono text-gray-500">IHQ CORPORATE LOCKS &bull; LEASE COMPLIANCE STATUS</p>
        </div>
        <div>
          {isIhq ? (
            <span className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-300 font-mono font-bold px-2.5 py-1 rounded-full uppercase">
              <Unlock className="w-3 h-3" /> IHQ ACTIVE ACCESS
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs bg-red-50 text-red-700 border border-red-300 font-mono font-bold px-2.5 py-1 rounded-full uppercase">
              <Lock className="w-3 h-3" /> CORP LOCK ACTIVE
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* CONTRACT HOUSING LEDGER */}
        <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-200/50 relative">
          <h3 className="text-sm font-mono font-bold uppercase text-amber-800 tracking-wider mb-2 flex items-center gap-1">
            <span>📋 Master FHC Lease Rates</span>
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" title="Values uploaded via master spreadsheets. Read-only for local officers (VPFs)." />
          </h3>
          
          {isPreviewMode && (
            <div className="bg-amber-100/50 text-amber-800 text-[10px] p-2 rounded-md mb-3 border border-amber-200 leading-tight">
              <strong>Preview:</strong> Pulling from 2026-2027 contract. Once your RPM uploads the new master sheet, targets will auto-refresh!
            </div>
          )}

          {budget.status === "COLONY" ? (
            <div className="p-4 bg-white/70 rounded border border-dashed border-amber-300 text-center">
              <p className="font-heading text-lg text-amber-900 leading-tight">🏡 Colony Housing Locked</p>
              <p className="text-xs font-sans text-gray-500 mt-1">Colonies operate in expansion phases. Dynamic housing, rental, and parlor leases are disabled until standard active charter transitions are reached.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-sans text-gray-600">FHC Contract Rent (Per Live-in)</span>
                {isIhq ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">$</span>
                    <input
                      type="number"
                      value={fhcRent}
                      onChange={(e) => setFhcRent(Number(e.target.value))}
                      className="w-20 px-1 py-0.5 text-xs border border-gray-300 rounded font-mono text-right font-bold focus:ring-1 focus:ring-journal-red"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-mono font-bold text-journal-dark bg-white border px-2 py-0.5 rounded cursor-not-allowed">
                    ${contract.fhcRent?.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs font-sans text-gray-600 font-bold">IHQ Chapter Parlor Fee (Monthly)</span>
                {isIhq ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">$</span>
                    <input
                      type="number"
                      value={parlorFee}
                      onChange={(e) => setParlorFee(Number(e.target.value))}
                      className="w-20 px-1 py-0.5 text-xs border border-gray-300 rounded font-mono text-right font-bold focus:ring-1 focus:ring-journal-red"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-mono font-bold text-journal-dark bg-white border px-2 py-0.5 rounded cursor-not-allowed">
                    ${contract.parlorFee?.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs font-sans text-gray-600">Property Corporate Support Rent</span>
                {isIhq ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">$</span>
                    <input
                      type="number"
                      value={propertySupport}
                      onChange={(e) => setPropertySupport(Number(e.target.value))}
                      className="w-20 px-1 py-0.5 text-xs border border-gray-300 rounded font-mono text-right font-bold focus:ring-1 focus:ring-journal-red"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-mono font-bold text-journal-dark bg-white border px-2 py-0.5 rounded cursor-not-allowed">
                    ${contract.propertySupport?.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-sans text-gray-600">Storage / Security support fee</span>
                {isIhq ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">$</span>
                    <input
                      type="number"
                      value={storageFee}
                      onChange={(e) => setStorageFee(Number(e.target.value))}
                      className="w-20 px-1 py-0.5 text-xs border border-gray-300 rounded font-mono text-right font-bold focus:ring-1 focus:ring-journal-red"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-mono font-bold text-journal-dark bg-white border px-2 py-0.5 rounded cursor-not-allowed">
                    ${contract.storageFee?.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Aggregation Output */}
              <div className="flex justify-between items-center font-bold text-sm bg-amber-100/50 p-2 rounded border border-amber-200">
                <span className="font-heading text-base text-amber-950">Combined Lease Sum:</span>
                <span className="font-mono text-amber-900 font-extrabold text-sm">
                  ${(
                    (isIhq ? fhcRent : contract.fhcRent) +
                    (isIhq ? parlorFee : contract.parlorFee) +
                    (isIhq ? propertySupport : contract.propertySupport) +
                    (isIhq ? storageFee : contract.storageFee)
                  ).toFixed(2)} <span className="text-[10px] text-gray-500 text-regular">/ live-in</span>
                </span>
              </div>

              {isIhq && (
                <button
                  id="ihq-save-contracts-btn"
                  onClick={handleSaveIHQ}
                  disabled={isSaving}
                  className="w-full mt-3 flex items-center justify-center gap-1.5 bg-journal-dark text-white font-mono hover:bg-journal-red transition-all cursor-pointer font-bold px-3 py-1.5 rounded-md text-xs shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? "TRANSLATING..." : saveSuccess ? "LEASE LOCKED SUCCESS!" : "COMMIT SOVEREIGN UPDATES"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* IN-HOUSE LOCAL INCENTIVES SLIDER */}
        <div className="bg-yellow-50/50 p-4 rounded-lg border border-dashed border-journal-gold relative">
          <div className="absolute right-3.5 top-3.5 text-xl font-heading text-opacity-40 select-none font-bold text-journal-gold">
            Incentive Engine
          </div>
          <h3 className="text-sm font-mono font-bold uppercase text-yellow-800 tracking-wider mb-2 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-journal-gold" />
            <span>Local Live-In Sister Credit</span>
          </h3>
          <p className="text-xs font-sans text-gray-600 mb-3 leading-relaxed">
            Corporate regulations restrict reducing Parlor Fees or Rent. To encourage younger sisters to occupy vacancies, model a <strong>Local Op Chapter Fee Discount</strong> specifically offset live-in rates.
          </p>

          {budget.status === "COLONY" ? (
            <div className="text-xs text-gray-500 italic p-4 text-center">
              Chapter incentives and local fees discounts are deactivated while Kappa Chi operate in founding phases.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white p-3 rounded border border-journal-gold/20 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-gray-600 font-mono block uppercase">Locked Parlor Cap</span>
                  <span className="text-xs font-heading text-red-700 font-bold block">No Direct Adjustments Allowed</span>
                </div>
                <div className="text-xs text-right font-mono text-gray-500 line-through">
                  ${budget.localOperationsFeeLiveIn}.00
                </div>
              </div>

              {/* Credit Slider */}
              <div className="space-y-1 bg-white p-3.5 rounded border border-journal-gold/30">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-journal-dark">Operations Credit (Slider Discount):</span>
                  <span className="font-mono font-extrabold text-journal-red text-sm">
                    -${budget.localCreditLiveInOffset}
                  </span>
                </div>
                <input
                  type="range"
                  id="local-credit-slider"
                  min="0"
                  max="400"
                  step="25"
                  value={budget.localCreditLiveInOffset}
                  onChange={(e) => onUpdateBudget({ localCreditLiveInOffset: Number(e.target.value) })}
                  className="w-full h-2 rounded-lg cursor-pointer accent-journal-red"
                />
                <div className="flex justify-between text-[10px] font-mono text-gray-500">
                  <span>$0 (No incentive)</span>
                  <span>Max: $400 (Free Local Operations)</span>
                </div>
              </div>

              {/* Output Impact Nodes */}
              <div className="space-y-1.5 bg-amber-50 p-3 rounded-md border border-amber-200">
                <div className="flex justify-between items-center text-xs text-amber-950 font-bold">
                  <span>Adjusted Student Operations Fee:</span>
                  <span className="font-mono">${realLiveInRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-amber-950 border-t border-amber-200 pt-1.5">
                  <span>Annual Chapter Budget Position Shift:</span>
                  <span className="font-mono text-journal-red font-bold">
                    -${annualCreditImpact.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="text-[11px] font-heading text-gray-600 leading-snug flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-journal-red" />
                <span>
                  By offering a credit of <strong>${budget.localCreditLiveInOffset}</strong> to your <strong>{budget.actualOccupants}</strong> live-ins, you have created an operational deficit of <strong>${annualCreditImpact.toLocaleString()}</strong> which your Programming sections (Social, Sisterhood) must resolve.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
