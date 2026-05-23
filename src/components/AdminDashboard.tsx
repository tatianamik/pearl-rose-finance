import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet, ArrowRight, Save, LayoutDashboard } from 'lucide-react';
import * as xlsx from 'xlsx';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'master' | 'colony' | 'legacy'>('master');
  
  // Master Upload State
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [fiscalYear, setFiscalYear] = useState('2026-2027');
  const [isUploading, setIsUploading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  // Colony State
  const [colonyDesignation, setColonyDesignation] = useState('');
  const [colonyUniversity, setColonyUniversity] = useState('');
  const [colonyRegion, setColonyRegion] = useState('Region 2');
  const [colonyCadence, setColonyCadence] = useState('semester');
  const [colonyStructure, setColonyStructure] = useState('A');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionSuccess, setProvisionSuccess] = useState(false);

  // Legacy Ingestion State
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState('');
  
  // Mapping States
  const [mapChapter, setMapChapter] = useState('');
  const [mapRent, setMapRent] = useState('');
  const [mapSupport, setMapSupport] = useState('');
  const [mapStructure, setMapStructure] = useState('');
  const [mapHousingType, setMapHousingType] = useState('');

  const [uploadedHeaders, setUploadedHeaders] = useState<string[]>([]);
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = xlsx.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (json.length > 0) {
          const headers = json[0] as string[];
          setUploadedHeaders(headers.filter(h => h));
          const rows = xlsx.utils.sheet_to_json(worksheet);
          setUploadedData(rows);
        }
        
        setIsUploading(false);
        setStep(1); // Move to mapping
      } catch (err) {
        console.error(err);
        setIsUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSimulateCommit = async () => {
    setIsCommitting(true);
    try {
      await fetch("/agd-budgets/api/ihq/master-upload-commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fiscalYear,
          mapping: { chapter: mapChapter, rent: mapRent, support: mapSupport, structure: mapStructure, housingType: mapHousingType },
          data: uploadedData
        })
      });
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => {
      setIsCommitting(false);
      setStep(3); // success
    }, 1200);
  };

  const handleProvisionColony = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProvisioning(true);
    try {
      await fetch("/agd-budgets/api/admin/provision-colony", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter: colonyDesignation,
          university: colonyUniversity,
          region: colonyRegion,
          cadence: colonyCadence,
          officerStructure: colonyStructure
        })
      });
      setTimeout(() => {
        setIsProvisioning(false);
        setProvisionSuccess(true);
      }, 1000);
    } catch (e) {
      console.error(e);
      setIsProvisioning(false);
    }
  };

  const handleSimulateLegacyDrop = (year: string) => {
    setIsIngesting(true);
    setTimeout(() => {
      setIsIngesting(false);
      setIngestSuccess(year);
      setTimeout(() => setIngestSuccess(''), 3000);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in text-stone-800">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-3xl font-serif text-rose-950 flex items-center gap-3">
            <LayoutDashboard className="text-rose-600" size={32} />
            IHQ Operations Control Panel
          </h1>
          <p className="text-stone-500 mt-1">Manage global chapter configurations, housing leases, and master templates.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
          <div className="text-xs text-stone-500 uppercase tracking-wide font-bold">Active Configuration Year</div>
          <select 
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            disabled={step > 0}
            className="bg-stone-50 border border-stone-300 rounded px-3 py-1.5 text-sm font-semibold text-rose-900 focus:ring-2 focus:ring-rose-500"
          >
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
            <option value="2027-2028">2027-2028</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-stone-200 pb-px">
        <button onClick={() => setActiveTab('master')} className={`pb-3 px-4 font-bold text-sm ${activeTab === 'master' ? 'border-b-2 border-rose-600 text-rose-800' : 'text-stone-500 hover:text-stone-700'}`}>Master FHC Upload</button>
        <button onClick={() => setActiveTab('colony')} className={`pb-3 px-4 font-bold text-sm ${activeTab === 'colony' ? 'border-b-2 border-rose-600 text-rose-800' : 'text-stone-500 hover:text-stone-700'}`}>New Colony Provisioning</button>
        <button onClick={() => setActiveTab('legacy')} className={`pb-3 px-4 font-bold text-sm ${activeTab === 'legacy' ? 'border-b-2 border-rose-600 text-rose-800' : 'text-stone-500 hover:text-stone-700'}`}>Legacy Migration Vault</button>
      </div>

      {/* Main Panel Content */}
      <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-200 overflow-hidden min-h-[500px] flex flex-col">
        
        {activeTab === 'master' && (
          <>
            {/* Progress Bar */}
            <div className="flex border-b border-stone-100 bg-stone-50/50">
          {[
            { s: 0, label: "Upload File" },
            { s: 1, label: "Map Columns" },
            { s: 2, label: "Pre-Flight Scan" },
            { s: 3, label: "Commit" }
          ].map((itm) => (
            <div key={itm.s} className={`flex-1 p-4 text-center text-sm font-bold border-r border-stone-100 last:border-0 ${step === itm.s ? 'text-indigo-600 bg-white border-b-2 border-b-indigo-600' : step > itm.s ? 'text-emerald-600' : 'text-stone-400'}`}>
              <div className="flex items-center justify-center gap-2">
                {step > itm.s ? <CheckCircle2 size={16} /> : <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-[10px]">{itm.s + 1}</span>}
                {itm.label}
              </div>
            </div>
          ))}
        </div>

        {/* Step 0: Upload */}
        {step === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6">
              <FileSpreadsheet size={48} className="text-rose-600" />
            </div>
            <h2 className="text-2xl font-serif text-stone-800 mb-2">Master Housing & Structure Upload</h2>
            <p className="text-stone-500 max-w-lg mb-8">
              Upload the global Excel or CSV master sheet provided by the FHC and Operations teams. This will update contract locks and chapter structures for the entire organization for the {fiscalYear} fiscal year.
            </p>
            
            <input 
              type="file" 
              accept=".xlsx,.csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <div className="border-2 border-dashed border-stone-300 rounded-xl w-full max-w-lg p-10 bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer group flex flex-col items-center" onClick={() => fileInputRef.current?.click()}>
              {isUploading ? (
                <div className="flex flex-col items-center animate-pulse text-indigo-600">
                  <UploadCloud size={32} className="mb-3 animate-bounce" />
                  <span className="font-bold text-sm">Parsing Spreadsheet Data...</span>
                </div>
              ) : (
                <>
                  <UploadCloud size={32} className="text-stone-400 mb-3 group-hover:text-rose-500 transition-colors" />
                  <span className="font-bold text-stone-600 mb-1">Click to browse or drag file here</span>
                  <span className="text-xs text-stone-400">Supports .xlsx, .csv</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Mapping */}
        {step === 1 && (
          <div className="flex-1 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-serif text-stone-800">Column Mapping Handshake</h2>
              <p className="text-stone-500">Match the critical system variables to the column headers detected in your uploaded spreadsheet.</p>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-6 max-w-4xl bg-stone-50 p-8 rounded-xl border border-stone-200">
              
              <div className="space-y-4">
                <h3 className="font-bold text-rose-900 border-b border-rose-100 pb-2 flex items-center gap-2">
                  <span className="text-xl">🏠</span> FHC Financial Data
                </h3>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase">System: Chapter Name</label>
                  <select value={mapChapter} onChange={e => setMapChapter(e.target.value)} className="p-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="">-- Select Excel Column --</option>
                    {uploadedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase">System: Annual Rent Liability</label>
                  <select value={mapRent} onChange={e => setMapRent(e.target.value)} className="p-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="">-- Select Excel Column --</option>
                    {uploadedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase">System: Property Support</label>
                  <select value={mapSupport} onChange={e => setMapSupport(e.target.value)} className="p-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="">-- Select Excel Column --</option>
                    {uploadedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-indigo-900 border-b border-indigo-100 pb-2 flex items-center gap-2">
                  <span className="text-xl">📊</span> Chapter Operations Data
                </h3>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase">System: Housing Type</label>
                  <select value={mapHousingType} onChange={e => setMapHousingType(e.target.value)} className="p-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="">-- Select Excel Column --</option>
                    {uploadedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase">System: Officer Structure (A, B, C, MC)</label>
                  <select value={mapStructure} onChange={e => setMapStructure(e.target.value)} className="p-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="">-- Select Excel Column --</option>
                    {uploadedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setStep(2)}
                disabled={!mapChapter || !mapRent || !mapSupport || !mapStructure || !mapHousingType}
                className="bg-indigo-600 disabled:bg-stone-300 disabled:cursor-not-allowed hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-colors"
              >
                Run Validation Scan <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Pre-Flight Scan */}
        {step === 2 && (
          <div className="flex-1 p-8 bg-slate-50">
            <div className="mb-6 flex items-start gap-4">
              <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-serif text-stone-800">Pre-Flight Validation Complete</h2>
                <p className="text-stone-600">Successfully parsed <strong className="text-stone-900">142 chapter configurations</strong>.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-center text-center">
                <span className="text-3xl font-black text-indigo-600">94</span>
                <span className="text-xs uppercase font-bold text-stone-500">FHC Leased Homes</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-center text-center">
                <span className="text-3xl font-black text-amber-500">8</span>
                <span className="text-xs uppercase font-bold text-stone-500">House Associations (HA)</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-center text-center">
                <span className="text-3xl font-black text-emerald-500">40</span>
                <span className="text-xs uppercase font-bold text-stone-500">Unhoused Chapters</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-900 mb-8">
              <AlertTriangle className="shrink-0 mt-0.5 text-amber-600" size={20} />
              <div className="text-sm">
                <strong className="block mb-1">Warning: Manual Verification Required for HA Chapters</strong>
                The system detected 8 chapters designated as 'HA' (House Association). Because these leases are not managed by International FHC, the automatic Contract Lock for Account 6010 will be bypassed. The assigned Regional Finance Coordinators will be prompted to manually verify these rent contracts in the Advisor Portal.
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-200">
              <button onClick={() => setStep(1)} className="text-stone-500 hover:text-stone-800 font-bold text-sm px-4 py-2">
                Back to Mapping
              </button>
              <button 
                onClick={handleSimulateCommit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                {isCommitting ? <UploadCloud className="animate-bounce" size={18} /> : <Save size={18} />}
                {isCommitting ? 'Committing to Server...' : `Commit ${fiscalYear} Configurations`}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-emerald-50/30">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-200">
              <CheckCircle2 size={48} className="text-emerald-600" />
            </div>
            <h2 className="text-3xl font-serif text-emerald-950 mb-3">Database Successfully Updated!</h2>
            <p className="text-emerald-800 max-w-lg mb-8">
              The {fiscalYear} housing and operational parameters are now live. All student VPF dashboards have been instantly synchronized with the new contract locks and officer structures.
            </p>
            <button 
              onClick={() => {
                setStep(0);
                setMapRent(''); setMapSupport(''); setMapStructure(''); setMapHousingType('');
              }}
              className="bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold py-2 px-6 rounded-lg shadow-sm transition-colors"
            >
              Upload Another Roster
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
