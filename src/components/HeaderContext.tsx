/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { UserContext, UserRole } from "../types";
import { Sparkles, RefreshCw, Layers, Award, Landmark, Building } from "lucide-react";

interface HeaderContextProps {
  session: UserContext;
  onShiftRole: (newRole: UserRole) => void;
  selectedChapter: string;
  onShiftChapter: (newChapter: string) => void;
  triggerRosePetal: () => void;
}

export default function HeaderContext({
  session,
  onShiftRole,
  selectedChapter,
  onShiftChapter,
  triggerRosePetal
}: HeaderContextProps) {
  // Check available roles based on presets
  const isSpecialist = session.email.toLowerCase() === "agd.tanya@gmail.com";
  
  return (
    <header className="relative w-full z-10 bg-white border-b-4 border-journal-buff shadow-md pb-4 pt-4 px-4 sm:px-8">
      {/* Torn Edge Visual Header Accent */}
      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-journal-red via-journal-gold to-journal-green" />
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Branding Node */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-red-100 border-2 border-dashed border-journal-red animate-pulse">
            <span className="text-xl">🌹</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 
                id="app-main-title" 
                className="text-3xl sm:text-4xl font-bold font-heading text-journal-red tracking-tight cursor-pointer hover:scale-105 transition-transform"
                onClick={triggerRosePetal}
              >
                Pearl & Rose Finance
              </h1>
              <span className="text-xs bg-amber-100 text-amber-800 border border-amber-300 font-mono px-1.5 py-0.5 rounded uppercase">
                VPF Co-Pilot
              </span>
            </div>
            <p className="text-xs font-mono text-gray-500 tracking-wider">
              ALPHA GAMMA DELTA &bull; CHRONICLE SECURE SANDBOX
            </p>
          </div>
        </div>

        {/* Dynamic Controls Grid */}
        <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
          {/* Chapter Selector */}
          <div className="flex items-center gap-2 bg-journal-cream px-3 py-1.5 rounded-lg border border-journal-gold/30">
            <Building className="w-4 h-4 text-journal-gold" />
            <label className="text-xs font-mono uppercase text-gray-600 font-bold">Chapter:</label>
            <select
              id="chapter-select"
              value={selectedChapter}
              onChange={(e) => onShiftChapter(e.target.value)}
              className="text-sm font-bold text-journal-dark bg-transparent focus:outline-none border-b border-journal-dark cursor-pointer"
            >
              <option value="Nu Delta">Nu Delta (Active)</option>
              <option value="Kappa Chi">Kappa Chi (Colony)</option>
              <option value="Theta Beta">Theta Beta (Closed)</option>
            </select>
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-journal-dark/20 bg-journal-buff shadow-sm relative overflow-hidden">
            <div className="text-right">
              <p className="text-xs font-semibold leading-tight text-gray-700">{session.name}</p>
              <p className="text-[10px] font-mono font-medium text-journal-red uppercase tracking-wider">{session.role} Workspace</p>
            </div>
            <Landmark className="w-5 h-5 text-journal-red" />
          </div>

          {/* Flexible Context Switcher Menu */}
          <div className="flex items-center gap-1.5 bg-yellow-50 py-1.5 px-3 rounded-lg border-2 border-dashed border-amber-300 washi-tape-yellow">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-heading font-semibold text-amber-800 mr-1.5">Switch Lens:</span>
            <div className="flex gap-1">
              {[UserRole.VPF, UserRole.FA, UserRole.RFC, UserRole.IHQ].map((role) => {
                const isActive = session.role === role;
                // Guard: restrict IHQ and RFC roles if not Tanya or Sarah or IHQ (Simulated for fully unlocked testing exploration)
                return (
                  <button
                    key={role}
                    id={`lens-btn-${role}`}
                    onClick={() => {
                      onShiftRole(role);
                      triggerRosePetal();
                    }}
                    title={`View platform as ${role}`}
                    className={`px-2 py-0.5 text-[11px] font-mono rounded font-bold uppercase transition-all ${
                      isActive
                        ? "bg-journal-dark text-white shadow-sm scale-110"
                        : "bg-white/70 text-gray-600 hover:bg-white hover:text-journal-dark border border-gray-300"
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Advisory Coach Marks based on Chosen Perspective */}
      <div className="mt-2.5 mx-auto w-full bg-amber-50 rounded-md border border-amber-200/50 p-2 text-xs flex items-start gap-2.5 shadow-sm text-journal-dark">
        <Sparkles className="w-4 h-4 text-journal-gold shrink-0 mt-0.5" />
        <p className="font-heading text-[13px] tracking-wide">
          {session.role === UserRole.VPF && (
            <span>✍️ <strong>Student VPF Lens:</strong> You hold the keys to Delta operations! Fill in programming items, run the calculators, check your compliance warnings, and get EC votes.</span>
          )}
          {session.role === UserRole.FA && (
            <span>📖 <strong>Advisor Lens:</strong> Older generational oversight. Verify compliance, leave sticky notes, or download the Archival Excel template, adjust rules offline, then sync back!</span>
          )}
          {session.role === UserRole.RFC && (
            <span>🦅 <strong>Regional Consultant (RFC/FS) Lens:</strong> Review multi-chapter performance. Verify that Sovereign dues flow safely to IHQ and provide mentoring reviews.</span>
          )}
          {session.role === UserRole.IHQ && (
            <span>🔑 <strong>IHQ Admin Lens:</strong> Full data configuration enabled. Ingest master chapter rosters, lock master rental/parlor prices under Master Housing Sheets.</span>
          )}
        </p>
      </div>
    </header>
  );
}
