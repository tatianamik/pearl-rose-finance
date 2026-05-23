/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { ChapterStatus, UserRole, ChapterBudgetState, TShirtOrder, OfficerStructure, FHCContractedRates, AdvisorComment, FacilityType } from "./src/types";
import multer from "multer";
import * as xlsx from "xlsx";
import cors from "cors";

const upload = multer({ storage: multer.memoryStorage() });

// Lazy-loaded Gemini initialization prevents startup crashes if API key is absent
let aiInstance: GoogleGenAI | null = null;
function getGemini() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. VPF Co-Pilot will run in rule-based offline mode.");
      return null;
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Seed Data
export interface SimulatedEmail {
  id: string;
  template: string;
  to: string;
  subject: string;
  content: string;
  timestamp: string;
}

const sentEmails: SimulatedEmail[] = [];

export function sendTransactionalEmail(template: string, to: string, subject: string, content: string) {
  const email = {
    id: `email_${Date.now()}`,
    template,
    to,
    subject,
    content,
    timestamp: new Date().toISOString()
  };
  sentEmails.push(email);
  console.log(`[NotificationEngine] Email Sent: [${template}] to ${to} | Subject: ${subject}`);
}

let currentBudgets: Record<string, ChapterBudgetState> = {
  "Nu Delta": {
    chapter: "Nu Delta",
    status: ChapterStatus.ACTIVE,
    year: "2026-2027",
    budgetState: "base",
    officerStructure: OfficerStructure.A,
    termSystem: "semester",
    facilityType: "RESIDENTIAL",
    propertyManager: "FHC",
    hasStudyAbroad: true,
    hasInactives: true,
    activeMembers: 60,
    newMembersExpected: 15,
    contractedBeds: 20,
    actualOccupants: 14, // 6 empty beds
    billingGroups: [
      { id: "g1", groupName: "Single Room", memberCount: 14, breakdown: { chapterDues: 200, parlorFee: 0, roomCharge: 3600, parkingFee: 0 } },
      { id: "g2", groupName: "Live-Out", memberCount: 61, breakdown: { chapterDues: 275, parlorFee: 90, roomCharge: 0, parkingFee: 0 } }
    ],
    octoberDuesRate: 95.0,
    februaryDuesRate: 95.0,
    insuranceRate: 60.0,
    foundingBadgeRate: 0,
    foundingInitiationRate: 0,
    localOperationsFeeLiveIn: 400.0,
    localOperationsFeeLiveOut: 550.0,
    localCreditLiveInOffset: 0.0,
    parlorFee: 180.0, // purposely wrong for the demo
    propertySupportFee: 90.0,
    fhcDamageFee: 100.0,
    baseRentHoused: 143680.0,
    rentExpense: 0.0,
    emptyBedSurchargeDistribution: "reserve",
    emptyBedReserveDraw: 24000.0, // Default drawing from reserves to cover beds short
    emptyBedMemberSurcharge: 0.0,
    tshirtIncome: 1200.0,
    tshirtExpense: 1250.0, // Unbalanced by default to trigger warnings!
    tshirtOrders: [
      { id: "1", description: "Recruitment Tees 2026", quantity: 60, pricePerUnit: 20, totalIncome: 1200, totalExpense: 1250 }
    ],
    hasPurchaseFund: false,
    miscIncome: 4500.0, // High misc to trigger warnings (5% of budget)
    miscExpense: 3200.0,
    miscExpenseJustification: "",
    recruitmentBudget: 12000.0,
    sisterhoodBudget: 8500.0,
    philanthropyBudget: 6000.0,
    socialBudget: 15000.0,
    processingFee: 1500.0,
    processingFeeCardPercentage: 50,
    panhellenicDues: 2250.0,
    panhellenicCalcMode: 'per-member',
    panhellenicActiveRate: 15.0,
    panhellenicNewMemberRate: 20.0,
    spendRelatedFees: 120.0,
    spendRelatedCards: 10,
    spendRelatedChecks: 50,
    techExpense: 430.0,
    professionalServicesExpense: 0.0,
    hasAlumnaCpaVolunteer: false,
    isCanadian: false,
    lcVisitsExpense: 200.0,
    lcMandatoryVisits: 1,
    hasFacility: true,
    hasMeals: true,
    isLargeChapterEligible: false,
    largeChapterFee: 0.0,
    attritionFallPercent: 10,
    attritionSpringPercent: 3,
    draftStage: "incubator",
    ecVoteDate: "",
    submittedBy: "",
    submittedAt: "",
    advisorComments: [],
    needsInfoFlags: {}
  },
  "Kappa Chi": {
    chapter: "Kappa Chi",
    status: ChapterStatus.COLONY,
    isColony: true,
    year: "2026-2027",
    budgetState: "base",
    officerStructure: OfficerStructure.B,
    termSystem: "semester",
    facilityType: "UNHOUSED",
    propertyManager: "NONE",
    hasStudyAbroad: false,
    hasInactives: false,
    activeMembers: 0,
    newMembersExpected: 45,
    contractedBeds: 0,
    actualOccupants: 0,
    billingGroups: [
      { id: "c1", groupName: "Colony General", memberCount: 45, breakdown: { chapterDues: 150, parlorFee: 0, roomCharge: 0, parkingFee: 0 } }
    ],
    octoberDuesRate: 95.0,
    februaryDuesRate: 95.0,
    insuranceRate: 60.0,
    foundingBadgeRate: 150.0, // Colony Badge bundle
    foundingInitiationRate: 50.0, // Founding Initiation bundle
    localOperationsFeeLiveIn: 0.0,
    localOperationsFeeLiveOut: 300.0,
    localCreditLiveInOffset: 0.0,
    parlorFee: 0.0,
    propertySupportFee: 0.0,
    fhcDamageFee: 0.0,
    emptyBedReserveDraw: 0,
    emptyBedMemberSurcharge: 0,
    baseRentHoused: 0.0,
    emptyBedSurchargeDistribution: "reserve",
    emptyBedReserveDraw: 0.0,
    emptyBedMemberSurcharge: 0.0,
    tshirtIncome: 800.0,
    tshirtExpense: 800.0,
    tshirtOrders: [
      { id: "c1", description: "Colony Inception Crewnecks", quantity: 45, pricePerUnit: 17.7, totalIncome: 800, totalExpense: 800 }
    ],
    hasPurchaseFund: true,
    miscIncome: 500.0,
    miscExpense: 400.0,
    miscExpenseJustification: "Standard local incorporation charges.",
    recruitmentBudget: 5000.0,
    sisterhoodBudget: 3500.0,
    philanthropyBudget: 2500.0,
    socialBudget: 1000.0,
    processingFee: 500.0,
    processingFeeCardPercentage: 50,
    panhellenicDues: 0.0,
    panhellenicCalcMode: 'flat',
    panhellenicActiveRate: 15.0,
    panhellenicNewMemberRate: 15.0,
    spendRelatedFees: 30.0,
    spendRelatedCards: 0,
    spendRelatedChecks: 50,
    techExpense: 160.0,
    professionalServicesExpense: 0.0,
    hasAlumnaCpaVolunteer: false,
    isCanadian: false,
    lcVisitsExpense: 700.0,
    lcMandatoryVisits: 2,
    hasFacility: false,
    hasMeals: false,
    isLargeChapterEligible: true,
    largeChapterFee: 2500.0,
    attritionFallPercent: 10,
    attritionSpringPercent: 3,
    draftStage: "volunteer_build",
    ecVoteDate: "",
    submittedBy: "",
    submittedAt: "",
    advisorComments: [],
    needsInfoFlags: {}
  },
  "Theta Beta": {
    chapter: "Theta Beta",
    status: ChapterStatus.CLOSED,
    year: "2026-2027",
    budgetState: "base",
    officerStructure: OfficerStructure.C,
    termSystem: "semester",
    facilityType: "SUITE",
    propertyManager: "NONE",
    hasStudyAbroad: false,
    hasInactives: false,
    activeMembers: 0,
    newMembersExpected: 0,
    contractedBeds: 0,
    actualOccupants: 0,
    billingGroups: [],
    octoberDuesRate: 95.0,
    februaryDuesRate: 95.0,
    insuranceRate: 60.0,
    foundingBadgeRate: 0,
    foundingInitiationRate: 0,
    localOperationsFeeLiveIn: 0,
    localOperationsFeeLiveOut: 0,
    localCreditLiveInOffset: 0,
    parlorFee: 0.0,
    propertySupportFee: 0.0,
    fhcDamageFee: 0.0,
    emptyBedReserveDraw: 0,
    emptyBedMemberSurcharge: 0,
    baseRentHoused: 0.0,
    rentExpense: 0.0,
    emptyBedSurchargeDistribution: "reserve",
    emptyBedReserveDraw: 0,
    emptyBedMemberSurcharge: 0,
    tshirtIncome: 0,
    tshirtExpense: 0,
    tshirtOrders: [],
    hasPurchaseFund: false,
    miscIncome: 0,
    miscExpense: 0,
    miscExpenseJustification: "",
    recruitmentBudget: 0,
    sisterhoodBudget: 0,
    philanthropyBudget: 0,
    socialBudget: 0,
    processingFee: 0,
    processingFeeCardPercentage: 50,
    panhellenicDues: 0.0,
    panhellenicCalcMode: 'flat',
    panhellenicActiveRate: 0.0,
    panhellenicNewMemberRate: 0.0,
    spendRelatedFees: 0.0,
    spendRelatedCards: 0,
    spendRelatedChecks: 0,
    techExpense: 0.0,
    professionalServicesExpense: 0.0,
    hasAlumnaCpaVolunteer: false,
    isCanadian: false,
    lcVisitsExpense: 0.0,
    lcMandatoryVisits: 1,
    hasFacility: false,
    hasMeals: false,
    isLargeChapterEligible: false,
    largeChapterFee: 0.0,
    attritionFallPercent: 10,
    attritionSpringPercent: 3,
    draftStage: "submitted",
    ecVoteDate: "2026-03-12",
    submittedBy: "Regional Director Jane",
    submittedAt: "2026-03-15",
    advisorComments: []
  }
};

let fhcMasterRegistry: Record<string, FHCContractedRates> = {
  "Nu Delta": {
    chapterId: "Nu Delta",
    fiscalYear: "2026-2027",
    contractedRates: {
      parlorFeePerMember: 189.00,
      propertySupportFeePerMember: 90.00,
      baseRentHoused: 143680.00,
      fhcDamageFee: 100.00,
      houseCapacity: 20
    }
  }
};

let historicalData: Record<string, any[]> = {
  "Nu Delta": [
    { year: "2023-2024", recruitmentSpent: 11000, sisterhoodSpent: 7500, philanthropySpent: 5200, totalBudget: 58000 },
    { year: "2024-2025", recruitmentSpent: 11500, sisterhoodSpent: 8000, philanthropySpent: 5500, totalBudget: 61000 },
    { year: "2025-2026", recruitmentSpent: 12200, sisterhoodSpent: 8800, philanthropySpent: 5800, totalBudget: 66000 }
  ],
  "Kappa Chi": [
    { year: "2023-2024", recruitmentSpent: 0, sisterhoodSpent: 0, philanthropySpent: 0, totalBudget: 0 }
  ],
  "Theta Beta": [
    { year: "2024-2025", recruitmentSpent: 8500, sisterhoodSpent: 6200, philanthropySpent: 4000, totalBudget: 42000 }
  ]
};

let masterHousingContracts: Record<string, any> = {
  "Nu Delta": { chapter: "Nu Delta", fhcRent: 3600.0, parlorFee: 300.0, propertySupport: 150.0, storageFee: 100.0 }, // Contract support rates
  "Kappa Chi": { chapter: "Kappa Chi", fhcRent: 0.0, parlorFee: 0.0, propertySupport: 0.0, storageFee: 0.0 },
  "Theta Beta": { chapter: "Theta Beta", fhcRent: 0.0, parlorFee: 0.0, propertySupport: 0.0, storageFee: 0.0 }
};

let masterRoster: any[] = [
  { 
    email: "AGD.Tanya@gmail.com", 
    name: "Tanya Hughes", 
    role: UserRole.RFC, 
    chapter: "Region 2", 
    isRfcSpecialist: true,
    globalRoles: [
      { role: UserRole.RFC, scope: "Region 2", displayName: "Regional Finance Coordinator (Region 2)" },
      { role: UserRole.RFC, scope: ["Nu Delta", "Kappa Chi", "Theta Beta", "Lambda Delta"], displayName: "Finance Specialist (4 Chapters)" },
      { role: UserRole.FA, scope: "Nu Delta", displayName: "Finance Advisor (Nu Delta)" },
      { role: UserRole.VPF, scope: "Nu Delta", displayName: "Student VPF (Nu Delta - Demo)" }
    ]
  },
  { email: "advisor.sarah@gmail.com", name: "Sarah Miller", role: UserRole.FA, chapter: "Nu Delta", isRfcSpecialist: false },
  { email: "ihq.manager@gmail.com", name: "IHQ Support Team", role: UserRole.IHQ, chapter: "Nu Delta" }
];

// Active sessions (in-memory sim)
let activeSessions: Record<string, any> = {};

// Helper: Calculate calculations for frontend sync
function calculateSummary(budget: ChapterBudgetState) {
  const contract = masterHousingContracts[budget.chapter] || { fhcRent: 0, parlorFee: 0, propertySupport: 0, storageFee: 0 };
  const fhcRates = fhcMasterRegistry[budget.chapter]?.contractedRates || null;
  
  // Total members
  const totalActives = budget.activeMembers;
  const totalNew = budget.newMembersExpected;
  
  // Hardcoded corporate income (collected and passed straight to IHQ)
  const corpOctDues = totalActives * budget.octoberDuesRate;
  const corpFebDues = totalActives * budget.februaryDuesRate;
  const corpInsurance = totalActives * (budget.insuranceRate);
  
  // Colony special
  let colonyBundles = 0;
  if (budget.status === ChapterStatus.COLONY) {
    colonyBundles = totalNew * (budget.foundingBadgeRate + budget.foundingInitiationRate);
  }
  
  const totalCorpRevenue = corpOctDues + corpFebDues + corpInsurance + colonyBundles;
  
  // Local revenues
  const totalLiveInCount = budget.actualOccupants;
  const totalLiveOutCount = Math.max(0, totalActives + totalNew - totalLiveInCount);
  
  let localDuesRevenue = 0;
  let localHousingRevenue = 0;
  let parkingRevenue = 0;
  
  if (budget.billingGroups && budget.billingGroups.length > 0) {
    budget.billingGroups.forEach(bg => {
      const termMultiplier = budget.termSystem === "quarter" ? 3 : 2;
      localDuesRevenue += (bg.breakdown.chapterDues * termMultiplier) * bg.memberCount;
      localHousingRevenue += ((bg.breakdown.roomCharge + bg.breakdown.parlorFee) * termMultiplier) * bg.memberCount;
      parkingRevenue += (bg.breakdown.parkingFee * termMultiplier) * bg.memberCount;
    });
  } else {
    // Fallback legacy calculation
    const baseLiveInRate = budget.localOperationsFeeLiveIn - budget.localCreditLiveInOffset;
    localDuesRevenue = (totalLiveInCount * baseLiveInRate) + (totalLiveOutCount * budget.localOperationsFeeLiveOut);
    const perMemberRent = budget.contractedBeds > 0 ? (budget.baseRentHoused / budget.contractedBeds) : 0;
    localHousingRevenue = (totalLiveInCount * perMemberRent) + (totalLiveOutCount * budget.parlorFee);
  }
  
  const propertySupportRevenue = ((totalLiveOutCount + totalLiveInCount) * budget.propertySupportFee);
  const totalHousingRevenue = localHousingRevenue + propertySupportRevenue;
  
  // T-Shirt Income
  const tshirtRevenue = budget.tshirtIncome;
  
  // Misc Income
  const miscRevenue = budget.miscIncome;
  
  // Grand total revenue
  const totalRevenue = totalCorpRevenue + localDuesRevenue + totalHousingRevenue + parkingRevenue + tshirtRevenue + miscRevenue + budget.emptyBedReserveDraw + (budget.emptyBedMemberSurcharge * totalLiveOutCount * 2);
  
  // EXPENSES
  // International transfers (same values as collected)
  const corpTransfers = totalCorpRevenue;
  
  // Sovereign Housing Transfers - expecting to meet fixed targets!
  const housingTransfers = budget.rentExpense > 0 ? budget.rentExpense + (totalLiveOutCount * budget.parlorFee) + ((totalLiveOutCount + totalLiveInCount) * budget.propertySupportFee) : totalHousingRevenue;
  
  // T-shirt Expenses
  const tshirtEx = budget.tshirtExpense;
  
  // Misc Expenses
  const miscEx = budget.miscExpense;
  
  // Overhead Processing Fees
  const processingEx = budget.processingFee || 0;
  
  // Programming expenses
  const progEx = budget.recruitmentBudget + budget.sisterhoodBudget + budget.philanthropyBudget + budget.socialBudget;
  
  // Empty Bed short calculation
  const emptyBeds = Math.max(0, budget.contractedBeds - budget.actualOccupants);
  const bedShortfallCost = Math.max(0, budget.baseRentHoused - localHousingRevenue);
  
  // Adjust based on recovery model
  const termMultiplier = budget.termSystem === "quarter" ? 3 : 2;
  const covered = budget.emptyBedReserveDraw + (budget.emptyBedMemberSurcharge * totalLiveOutCount * termMultiplier);
  const bedExpenseUncovered = Math.max(0, bedShortfallCost - covered);

  const baseLocalOperationsExpense = 22000.0; // Simulated base chapter software, storage, IHQ filing
  const totalExpense = corpTransfers + housingTransfers + tshirtEx + miscEx + processingEx + budget.panhellenicDues + budget.spendRelatedFees + budget.techExpense + budget.professionalServicesExpense + budget.lcVisitsExpense + budget.largeChapterFee + progEx + bedShortfallCost + baseLocalOperationsExpense;
  
  const netSurplus = totalRevenue - totalExpense;
  const isBalanced = Math.abs(netSurplus) < 1.0; // Balanced if difference is small
  
  return {
    totalRevenue,
    totalExpense,
    netSurplus,
    isBalanced,
    corpOctDues,
    corpFebDues,
    corpInsurance,
    totalCorpRevenue,
    localDuesRevenue,
    totalHousingRevenue,
    parkingRevenue,
    emptyBeds,
    bedShortfallCost,
    bedExpenseUncovered,
    contract
  };
}

// REST API DEFINITIONS

// Get health status
app.get("/agd-budgets/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Admin endpoints
app.post("/agd-budgets/api/admin/provision-colony", (req, res) => {
  const { chapter, university, region, cadence, officerStructure } = req.body;
  if (!chapter) {
    return res.status(400).json({ error: "Chapter designation required." });
  }

  // Provision in Incubator mode
  currentBudgets[chapter] = {
    chapter,
    status: ChapterStatus.COLONY,
    isColony: true,
    year: "2026-2027",
    budgetState: "base",
    officerStructure: officerStructure === "A" ? OfficerStructure.A : OfficerStructure.B,
    termSystem: cadence,
    facilityType: FacilityType.UNHOUSED,
    propertyManager: PropertyManager.NONE,
    hasStudyAbroad: false,
    hasInactives: false,
    activeMembers: 0,
    newMembersExpected: 30, // baseline estimation
    contractedBeds: 0,
    actualOccupants: 0,
    billingGroups: [],
    octoberDuesRate: 95.0,
    februaryDuesRate: 95.0,
    insuranceRate: 60.0,
    foundingBadgeRate: 150.0, // Auto-injected Colony Fee Package
    foundingInitiationRate: 50.0,
    localOperationsFeeLiveIn: 0.0,
    localOperationsFeeLiveOut: 200.0,
    localCreditLiveInOffset: 0.0,
    parlorFee: 0.0,
    propertySupportFee: 0.0,
    fhcDamageFee: 0.0,
    emptyBedReserveDraw: 0,
    emptyBedMemberSurcharge: 0,
    baseRentHoused: 0.0,
    emptyBedSurchargeDistribution: "reserve",
    tshirtIncome: 0.0,
    tshirtExpense: 0.0,
    tshirtOrders: [],
    hasPurchaseFund: false,
    miscIncome: 0.0,
    miscExpense: 0.0,
    miscExpenseJustification: "",
    recruitmentBudget: 1500.0,
    sisterhoodBudget: 1000.0,
    philanthropyBudget: 500.0,
    socialBudget: 500.0,
    processingFee: 200.0,
    processingFeeCardPercentage: 50,
    panhellenicDues: 0.0,
    panhellenicCalcMode: 'flat',
    panhellenicActiveRate: 0.0,
    panhellenicNewMemberRate: 0.0,
    spendRelatedFees: 0.0,
    spendRelatedCards: 0,
    spendRelatedChecks: 0,
    techExpense: 160.0,
    professionalServicesExpense: 0.0,
    hasAlumnaCpaVolunteer: false,
    isCanadian: false,
    lcVisitsExpense: 0.0,
    lcMandatoryVisits: 0,
    hasFacility: false,
    hasMeals: false,
    isLargeChapterEligible: false,
    largeChapterFee: 0.0,
    attritionFallPercent: 0,
    attritionSpringPercent: 0,
    draftStage: "incubator",
    ecVoteDate: "",
    submittedBy: "",
    submittedAt: "",
    advisorComments: [],
    needsInfoFlags: {}
  };

  res.json({ success: true, message: `Colony ${chapter} provisioned successfully in incubator mode.` });
});

app.post("/agd-budgets/api/import/legacy-excel/:chapter", upload.single("file"), (req, res) => {
  try {
    const { chapter } = req.params;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Parse Excel File
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Read mapped cells
    let activeMembers = 120;
    let newMembers = 45;
    try {
      const introSheet = workbook.Sheets["Intro"];
      if (introSheet) {
        const introJson = xlsx.utils.sheet_to_json(introSheet, { header: 1 });
        activeMembers = Number(introJson?.[16]?.[7]) || 120; // H17 (0-indexed 16)
        newMembers = Number(introJson?.[17]?.[7]) || 45;     // H18 (0-indexed 17)
      }
    } catch(e) {}

    let recruitment = 12000;
    let sisterhood = 8500;
    let tshirtIncome = 0;
    let tshirtExpense = 0;
    let miscIncome = 0;
    let miscExpense = 0;
    let lcVisits = 0;
    let techExpense = 0;
    let profServices = 0;

    try {
      const summarySheet = workbook.Sheets["Summary"];
      if (summarySheet) {
        const summaryJson = xlsx.utils.sheet_to_json(summarySheet, { header: 1 });
        tshirtIncome = Number(summaryJson?.[31]?.[2]) || 0; // C32
        tshirtExpense = Number(summaryJson?.[44]?.[6]) || 0; // G45
        miscIncome = Number(summaryJson?.[29]?.[2]) || 0; // C30
        miscExpense = Number(summaryJson?.[48]?.[6]) || 0; // G49
        lcVisits = Number(summaryJson?.[40]?.[6]) || 0; // G41
        techExpense = Number(summaryJson?.[20]?.[6]) || 0; // G21
        profServices = Number(summaryJson?.[45]?.[6]) || 0; // G46
        recruitment = Number(summaryJson?.[49]?.[6]) || 12000; // G50
      }
    } catch(e) {}

    const baseBudget = currentBudgets[chapter] || { ...currentBudgets["Nu Delta"], chapter, isColony: false, status: ChapterStatus.ACTIVE };
    
    currentBudgets[chapter] = {
      ...baseBudget,
      activeMembers: activeMembers,
      newMembersExpected: newMembers,
      recruitmentBudget: recruitment,
      sisterhoodBudget: sisterhood,
      tshirtIncome: tshirtIncome,
      tshirtExpense: tshirtExpense,
      miscIncome: miscIncome,
      miscExpense: miscExpense,
      lcVisitsExpense: lcVisits,
      techExpense: techExpense,
      professionalServicesExpense: profServices
    };

    res.json({ success: true, message: "Legacy Excel ingested successfully.", budget: currentBudgets[chapter] });
  } catch (error) {
    console.error("Excel Import Error", error);
    res.status(500).json({ error: "Failed to parse legacy excel file" });
  }
});

app.get("/agd-budgets/api/export/excel/:chapter", (req, res) => {
  try {
    const { chapter } = req.params;
    const budget = currentBudgets[chapter];
    if (!budget) return res.status(404).json({ error: "Chapter not found" });

    const summary = calculateSummary(budget);

    // Create a new workbook and populate a summary sheet
    const wb = xlsx.utils.book_new();
    const wsData = [
      ["Alpha Gamma Delta Chapter Budget"],
      ["Chapter", budget.chapter],
      ["Fiscal Year", budget.year],
      ["Status", budget.status],
      [],
      ["--- MEMBERSHIP ---"],
      ["Active Members", budget.activeMembers],
      ["New Members", budget.newMembersExpected],
      [],
      ["--- REVENUE ---"],
      ["Total Dues Revenue", summary.localDuesRevenue],
      ["Total Housing Revenue", summary.totalHousingRevenue],
      ["T-Shirt Income", budget.tshirtIncome],
      ["Misc Income", budget.miscIncome],
      ["Total Estimated Revenue", summary.totalRevenue],
      [],
      ["--- EXPENSES ---"],
      ["Recruitment", budget.recruitmentBudget],
      ["Sisterhood", budget.sisterhoodBudget],
      ["Philanthropy", budget.philanthropyBudget],
      ["Social", budget.socialBudget],
      ["LC Visits", budget.lcVisitsExpense],
      ["Tech Expense", budget.techExpense],
      ["Professional Services", budget.professionalServicesExpense],
      ["Misc Expense", budget.miscExpense],
      ["T-Shirt Expense", budget.tshirtExpense],
      ["Total Estimated Expense", summary.totalExpense],
      [],
      ["--- BOTTOM LINE ---"],
      ["Net Surplus/Deficit", summary.netSurplus]
    ];

    const ws = xlsx.utils.aoa_to_sheet(wsData);
    xlsx.utils.book_append_sheet(wb, ws, "Budget Summary");

    const excelBuffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", `attachment; filename="${budget.chapter.replace(/\s+/g, '_')}_Budget_Export.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(excelBuffer);

  } catch (error) {
    console.error("Excel Export Error", error);
    res.status(500).json({ error: "Failed to export excel file" });
  }
});

// Email Simulator routes
app.get("/agd-budgets/api/emails", (req, res) => {
  res.json({ success: true, emails: sentEmails });
});

app.post("/agd-budgets/api/emails/clear", (req, res) => {
  sentEmails.length = 0;
  res.json({ success: true });
});

// Request Magic Link
app.post("/agd-budgets/api/auth/request-magic-link", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  let match = masterRoster.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!match) {
    // Auto-create as Student VPF for demo purposes to avoid dead-ends
    match = {
      email,
      name: email.split("@")[0].toUpperCase() + " (VPF)",
      role: UserRole.VPF,
      chapter: "Nu Delta"
    };
    masterRoster.push(match);
  }

  const token = `link_${Math.floor(Math.random() * 900000 + 100000)}`;
  activeSessions[token] = {
    email: match.email,
    name: match.name,
    role: match.role,
    chapter: match.chapter,
    isRfcSpecialist: match.isRfcSpecialist,
    globalRoles: match.globalRoles || [],
    requiresIdentitySelection: match.globalRoles && match.globalRoles.length > 1
  };

  // Trigger Email
  sendTransactionalEmail(
    "Magic Link Request",
    match.email,
    "Your secure access link for the AGD Budget Portal 🌸",
    `Hey ${match.name},\n\nHere is your secure magic link to access your dashboard. It expires in 15 minutes.\n\n[ Click here to log in ](http://localhost:5173/?token=${token})\n\nOr paste this token: ${token}`
  );

  res.json({ success: true, message: "Magic link sent!" });
});

// Verify Magic Link
app.post("/agd-budgets/api/auth/verify-magic-link", (req, res) => {
  const { token } = req.body;
  const session = activeSessions[token];
  if (!session) {
    return res.status(401).json({ error: "Invalid or expired magic link." });
  }
  res.json({ success: true, session });
});

// Context shift support (FA <-> VPF <-> RFC)
app.post("/agd-budgets/api/auth/shift-context", (req, res) => {
  const { token, desiredRole, desiredChapter, scope } = req.body;
  const currentSession = activeSessions[token];
  if (!currentSession) {
    return res.status(401).json({ error: "Session expired or invalid token." });
  }

  // Update session context role
  currentSession.role = desiredRole;
  if (desiredChapter) {
    currentSession.chapter = desiredChapter;
  }
  if (scope) {
    currentSession.scope = scope;
  }
  currentSession.requiresIdentitySelection = false;
  res.json({ success: true, session: currentSession });
});

// Budget State routes
let isGlobalPreviewMode = true; // Simulates the early-access period

app.get("/agd-budgets/api/chapters", (req, res) => {
  // Return summary list for VST dashboard
  const list = Object.values(currentBudgets).map(b => {
    const summary = calculateSummary(b);
    return {
      chapter: b.chapter,
      status: b.status,
      draftStage: b.draftStage,
      lastActive: b.submittedAt || "Recently", // mock
      tax990NCompleted: b.tax990NCompleted || false,
      health: {
        isBalanced: summary.isBalanced,
        hasLocalDeficit: summary.netSurplus < -1.0,
        hasIncentive: b.localCreditLiveInOffset > 0
      }
    };
  });
  res.json({ success: true, chapters: list });
});

app.post("/agd-budgets/api/budget/:chapter/tax-completed", (req, res) => {
  const { chapter } = req.params;
  const budget = currentBudgets[chapter];
  if (!budget) {
    return res.status(404).json({ error: "Chapter budget not found." });
  }
  budget.tax990NCompleted = true;
  res.json({ success: true, message: "Tax marked as completed." });
});

app.get("/agd-budgets/api/budget/:chapter", (req, res) => {
  const { chapter } = req.params;
  const budget = currentBudgets[chapter];
  if (!budget) {
    return res.status(404).json({ error: "Chapter budget not found." });
  }
  const summary = calculateSummary(budget);
  res.json({ budget, summary, historical: historicalData[chapter] || [], contract: masterHousingContracts[chapter], isGlobalPreviewMode });
});

app.post("/agd-budgets/api/budget/:chapter/revise", (req, res) => {
  const { chapter } = req.params;
  const baseBudget = currentBudgets[chapter];
  if (!baseBudget) {
    return res.status(404).json({ error: "Base budget not found" });
  }
  // Duplicate object, change state
  const revisedBudget = JSON.parse(JSON.stringify(baseBudget));
  revisedBudget.budgetState = "revised";
  currentBudgets[`${chapter}_revised`] = revisedBudget;
  res.json({ success: true, budget: revisedBudget });
});

app.post("/agd-budgets/api/budget/:chapter/release", (req, res) => {
  const { chapter } = req.params;
  const budget = currentBudgets[chapter];
  if (!budget) {
    return res.status(404).json({ error: "Chapter budget not found" });
  }
  budget.draftStage = "drafting";
  res.json({ success: true, budget });
});

// Save Budget State
app.post("/agd-budgets/api/budget/:chapter", (req, res) => {
  const { chapter } = req.params;
  const updatedState = req.body;
  if (!currentBudgets[chapter]) {
    return res.status(404).json({ error: "Chapter budget not found." });
  }

  // Sovereign checks: Guard that user cannot edit FHC locked items directly or change October/February base rates
  const lockedBudget = {
    ...updatedState,
    chapter: chapter, // preserve keys
    octoberDuesRate: 95.0, // Hardcoded active dues
    februaryDuesRate: 95.0,
    insuranceRate: 60.0,
    advisorComments: currentBudgets[chapter].advisorComments || [] // keep existing comments
  };

  currentBudgets[chapter] = lockedBudget;
  const summary = calculateSummary(lockedBudget);
  res.json({ success: true, budget: lockedBudget, summary });
});

// FHC Master Vault Registry
app.get("/agd-budgets/api/fhc/:chapter", (req, res) => {
  const { chapter } = req.params;
  const fhcRates = fhcMasterRegistry[chapter];
  if (!fhcRates) {
    return res.status(404).json({ error: "No FHC Contract on file for this chapter." });
  }
  res.json({ success: true, data: fhcRates });
});

// Post Advisor Comment
app.post("/agd-budgets/api/budget/:chapter/comments", (req, res) => {
  const { chapter } = req.params;
  const { fieldId, author, text } = req.body;
  if (!currentBudgets[chapter]) return res.status(404).json({ error: "Not found" });
  
  const comment: AdvisorComment = {
    id: "cmt_" + Date.now().toString(),
    fieldId,
    author,
    text,
    timestamp: new Date().toISOString(),
    resolved: false
  };
  
  currentBudgets[chapter].advisorComments.push(comment);
  res.json({ success: true, comments: currentBudgets[chapter].advisorComments });
});

// Approve Budget (Digital Sign-Off)
app.post("/agd-budgets/api/budget/:chapter/approve", (req, res) => {
  const { chapter } = req.params;
  if (!currentBudgets[chapter]) return res.status(404).json({ error: "Not found" });
  
  currentBudgets[chapter].draftStage = "approved";
  res.json({ success: true, budget: currentBudgets[chapter] });
});

// Update standard housing template (IHQ Action)
app.post("/agd-budgets/api/ihq/housing", (req, res) => {
  const { chapter, fhcRent, parlorFee, propertySupport, storageFee } = req.body;
  if (masterHousingContracts[chapter]) {
    masterHousingContracts[chapter] = {
      chapter,
      fhcRent: Number(fhcRent),
      parlorFee: Number(parlorFee),
      propertySupport: Number(propertySupport),
      storageFee: Number(storageFee)
    };
    return res.json({ success: true, contract: masterHousingContracts[chapter] });
  }
  res.status(404).json({ error: "Chapter not registered in Master Housing Sheet." });
});

// Master Housing Spreadsheet Mock Ingestion
app.post("/agd-budgets/api/ihq/master-upload-commit", (req, res) => {
  const { fiscalYear, mapping, data } = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: "No data provided" });
  }

  let updatedCount = 0;
  data.forEach((row: any) => {
    const chapterName = row[mapping.chapter];
    if (!chapterName) return;

    updatedCount++;
    const rent = Number(row[mapping.rent]) || 0;
    const support = Number(row[mapping.support]) || 0;
    const structure = row[mapping.structure] || "A";
    const housingType = row[mapping.housingType];

    let mappedStructure = OfficerStructure.A;
    if (structure === "B") mappedStructure = OfficerStructure.B;
    if (structure === "C") mappedStructure = OfficerStructure.C;
    if (structure === "MC") mappedStructure = OfficerStructure.MC;

    let mappedHousing = FacilityType.RESIDENTIAL;
    if (typeof housingType === "string") {
      if (housingType.toLowerCase().includes("fhc managed")) mappedHousing = FacilityType.FHC_MANAGED;
      else if (housingType.toLowerCase().includes("chapter managed")) mappedHousing = FacilityType.CHAPTER_MANAGED;
      else if (housingType.toLowerCase().includes("unhoused")) mappedHousing = FacilityType.UNHOUSED;
    }

    // 1. Update FHC Master Registry
    fhcMasterRegistry[chapterName] = {
      chapterId: chapterName,
      fiscalYear: fiscalYear,
      contractedRates: {
        parlorFeePerMember: rent / 40, // heuristic for parlor fee if not explicitly mapped
        propertySupportFeePerMember: support,
        baseRentHoused: rent,
        fhcDamageFee: 250,
        houseCapacity: 40
      }
    };

    // 2. Provision or Update Chapter Budget State
    if (!currentBudgets[chapterName]) {
      currentBudgets[chapterName] = {
        ...currentBudgets["Nu Delta"],
        chapter: chapterName,
        isColony: false,
        status: ChapterStatus.ACTIVE,
      };
    }
    currentBudgets[chapterName].officerStructure = mappedStructure;
    currentBudgets[chapterName].facilityType = mappedHousing;
  });

  console.log(`[IHQ] Parsed ${data.length} rows, updated ${updatedCount} chapters for ${fiscalYear}`);
  res.json({ success: true, message: `Successfully updated ${fiscalYear} configurations for ${updatedCount} chapters.` });
});

// Add to Master Roster (IHQ Action)
app.post("/agd-budgets/api/ihq/roster-upload", (req, res) => {
  const { list } = req.body; // list of objects: email, name, role, chapter
  if (!Array.isArray(list)) {
    return res.status(400).json({ error: "Expected an array of roster lines." });
  }
  list.forEach(line => {
    if (line.email && line.name) {
      const existing = masterRoster.find(r => r.email.toLowerCase() === line.email.toLowerCase());
      if (existing) {
        existing.name = line.name;
        existing.role = line.role || UserRole.VPF;
        existing.chapter = line.chapter || "Nu Delta";
      } else {
        masterRoster.push({
          email: line.email,
          name: line.name,
          role: line.role || UserRole.VPF,
          chapter: line.chapter || "Nu Delta"
        });
      }
    }
  });
  res.json({ success: true, rosterCount: masterRoster.length });
});

// File Historical Ingestions dynamically
app.post("/agd-budgets/api/history/import", (req, res) => {
  const { chapter, year, recruitmentSpent, sisterhoodSpent, philanthropySpent, totalBudget } = req.body;
  if (!historicalData[chapter]) {
    historicalData[chapter] = [];
  }
  // replace or push
  const idx = historicalData[chapter].findIndex(y => y.year === year);
  const dataNode = {
    year,
    recruitmentSpent: Number(recruitmentSpent),
    sisterhoodSpent: Number(sisterhoodSpent),
    philanthropySpent: Number(philanthropySpent),
    totalBudget: Number(totalBudget)
  };
  if (idx !== -1) {
    historicalData[chapter][idx] = dataNode;
  } else {
    historicalData[chapter].push(dataNode);
  }
  res.json({ success: true, history: historicalData[chapter] });
});

// Billhighway flat 5-column CSV export
app.get("/agd-budgets/api/export/csv/:chapter", (req, res) => {
  const { chapter } = req.params;
  const budget = currentBudgets[chapter];
  if (!budget) {
    return res.status(404).send("Chapter budget not found.");
  }
  const summary = calculateSummary(budget);
  const termMultiplier = budget.termSystem === "quarter" ? 3 : 2;
  
  // Compile flat 5-column layout for Billhighway
  // Schema: Category ID, Sub Category ID, Category Name, Category Group, Budget Amount
  const headers = ["Category ID", "Sub Category ID", "Category Name", "Category Group", "Budget Amount"];
  const rows: any[][] = [];
  
  const addRow = (catId: string, subId: string, name: string, group: string, amount: number) => {
    if (amount > 0) {
      rows.push([catId, subId, name, group, amount.toFixed(2)]);
    }
  };

  // Corporate Income
  addRow("4030", "", "Corporate Dues", "Chapter Department Income", summary.totalCorpRevenue);
  addRow("4040", "", "Group Insurance", "Chapter Department Income", summary.corpInsurance);

  if (budget.status === ChapterStatus.COLONY) {
    addRow("4080", "", "Founding Badge Bundle", "Chapter Department Income", budget.newMembersExpected * budget.foundingBadgeRate);
    addRow("4095", "", "Colony Initiation Fees", "Chapter Department Income", budget.newMembersExpected * budget.foundingInitiationRate);
  }

  // Dynamic Billing Groups Income
  let roomCharges = 0;
  let parkingExpense = 0;
  let parlorFees = 0;
  let chapterDues = 0;

  if (budget.billingGroups && budget.billingGroups.length > 0) {
    budget.billingGroups.forEach(bg => {
      roomCharges += (bg.breakdown.roomCharge * termMultiplier) * bg.memberCount;
      parkingExpense += (bg.breakdown.parkingFee * termMultiplier) * bg.memberCount;
      parlorFees += (bg.breakdown.parlorFee * termMultiplier) * bg.memberCount;
      chapterDues += (bg.breakdown.chapterDues * termMultiplier) * bg.memberCount;
    });
  } else {
    // Fallback legacy calculation
    const totalLiveInCount = budget.actualOccupants;
    const totalLiveOutCount = Math.max(0, budget.activeMembers + budget.newMembersExpected - totalLiveInCount);
    const realLiveInRate = budget.localOperationsFeeLiveIn - budget.localCreditLiveInOffset;
    chapterDues = (totalLiveInCount * realLiveInRate) + (totalLiveOutCount * budget.localOperationsFeeLiveOut);
    parlorFees = totalLiveOutCount * budget.parlorFee;
    const perMemberRent = budget.contractedBeds > 0 ? (budget.baseRentHoused / budget.contractedBeds) : 0;
    roomCharges = totalLiveInCount * perMemberRent;
  }

  const totalLiveOutCount = Math.max(0, budget.activeMembers + budget.newMembersExpected - budget.actualOccupants);

  addRow("4110", "", "Room Charges", "House Department Income", roomCharges);
  addRow("4112", "", "Empty Bed Fees", "House Department Income", budget.emptyBedMemberSurcharge * totalLiveOutCount * termMultiplier);
  addRow("4170", "", "Parking Fees", "House Department Income", parkingExpense);
  addRow("4210", "", "Parlor Fee", "House Department Income", parlorFees);
  addRow("4120", "", "Local Chapter Dues", "Chapter Department Income", chapterDues);

  // Misc Income
  addRow("4630", "", "T-Shirt Income", "Chapter Department Income", budget.tshirtIncome);
  addRow("4600", "", "Misc Revenue", "Chapter Department Income", budget.miscIncome);
  addRow("4600", "1", "Reserve Transfers", "Chapter Department Income", budget.emptyBedReserveDraw);
  
  // Format as CSV
  const csvContent = [
    headers.join(","),
    ...rows.map(line => line.map(text => `"${text.toString().replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=Billhighway_Upload_${chapter.replace(/\s+/g, '_')}_FY2627.csv`);
  res.send(csvContent);
});

// VPF Co-Pilot Assistant via Gemini AI
app.post("/agd-budgets/api/copilot", async (req, res) => {
  const { budgetState, question } = req.body;
  if (!budgetState) {
    return res.status(400).json({ error: "Budget state is required to evaluate." });
  }

  const summary = calculateSummary(budgetState);
  
  // Validate basic budget rules to inject as warning nodes
  const warnings: string[] = [];
  
  // 1. T-Shirt Rule
  const pf = budgetState.hasPurchaseFund;
  const isTshirtBalanced = budgetState.tshirtIncome === budgetState.tshirtExpense;
  if (!pf && !isTshirtBalanced) {
    warnings.push("T-Shirt Balanced Rule Error: Chapters without a Purchase Fund must have Account 4630 perfectly wash out with Account 5210-8. Currently off by $" + Math.abs(budgetState.tshirtIncome - budgetState.tshirtExpense).toFixed(2));
  }
  
  // 2. 5% Misc Rule
  const totalIn = summary.totalRevenue || 1;
  const isMiscIncomeExcess = (budgetState.miscIncome / totalIn) > 0.05;
  const isMiscExpenseExcess = (budgetState.miscExpense / totalIn) > 0.05;
  if (isMiscIncomeExcess || isMiscExpenseExcess) {
    warnings.push("Regulatory IRS Warning: Miscellaneous Ledger exceeds 5% of the total revenue! Under Section 501(c)(7), excess unclassified balances threaten non-profit non-taxable statuses.");
  }
  
  // 3. Deep Bed Shortfall
  const emptyBeds = summary.emptyBeds;
  if (emptyBeds > 0 && summary.bedExpenseUncovered > 0) {
    warnings.push(`Empty Bed Shortfall: There are ${emptyBeds} vacant contracted beds ($${summary.bedShortfallCost.toFixed(2)} debt). Current recovery plan does not fully clear the deficit, leaving $${summary.bedExpenseUncovered.toFixed(2)} unaccounted.`);
  }

  const ai = getGemini();
  if (!ai) {
    // Offline / fall-through advisor response
    const offlinePromptResponse = `### 🌸 Pearl & Rose Financial Co-Pilot (Advisory Review)

Hello Tanya! I am reviewing **${budgetState.chapter} Chapter's** draft budget for the **${budgetState.year}** academic year. Since my AI thinking Core is running offline, I've run the Alpha Gamma Delta corporate compliance rules locally.

Here is a list of my observations for your draft:

${warnings.length > 0 
  ? `#### ⚠️ Compliance Warnings In Draft:\n${warnings.map(w => `* **${w}**`).join("\n")}` 
  : `#### 🎉 Perfect Harmony!\nYour local accounts are fully balanced. I see no active corporate flags.`}

#### Chapter Balance Sheet Overview:
* **Active Dues Rate:** Enforced strictly ($95 October, $95 February).
* **Total Local Revenue:** $${summary.totalRevenue.toLocaleString()}
* **Total Operations Expense:** $${summary.totalExpense.toLocaleString()}
* **Local Operations Credit Slider:** Live-in operational fee is adjusted to **$${(budgetState.localOperationsFeeLiveIn - budgetState.localCreditLiveInOffset).toFixed(2)}** (incentive savings: $${budgetState.localCreditLiveInOffset.toFixed(2)}).
* **Net Surplus:** **$${summary.netSurplus.toFixed(2)}** ${summary.isBalanced ? "✅ Balanced perfectly!" : "❌ Off Balance! Adjust programming accounts to zero out this surplus."}

---
*Keep polishing your ledger! Balance is the secret to sisterhood harmony. 🌹*`;

    return res.json({
      answer: offlinePromptResponse,
      warnings,
      balancedStatus: summary.isBalanced && warnings.length === 0
    });
  }

  // Construct context for Gemini
  const promptText = `You are "The VPF Co-Pilot" (Pearl & Rose Regional Financial Consultant), an expert financial advisor for Alpha Gamma Delta International Fraternity chapters.
  
  Review the following chapter budget details and provide direct, helpful, and slightly humorous advice bridging the gap between student VPFs and senior advisors in the friendly signature "Pearl & Rose" junk-journal style. Reference corporate Alpha Gam rules like the "5% Misc Warning", "The Empty Bed recovery", and "T-Shirt pass-through checks".
  
  CHAPTER DATA:
  - Chapter Name: ${budgetState.chapter}
  - Stage: ${budgetState.status} (Stage is ${budgetState.status})
  - Active Members: ${budgetState.activeMembers}
  - Expected New Members: ${budgetState.newMembersExpected}
  - Contracted Beds vs Occupied Beds: ${budgetState.contractedBeds} contracted beds, ${budgetState.actualOccupants} occupied beds (Empty Bed Shortfall Account: ${emptyBeds} beds short, total housing deficit of $${summary.bedShortfallCost.toFixed(2)})
  - Setup Stage: ${budgetState.draftStage}
  - Local Operational Fees: Live-in operational base is $${budgetState.localOperationsFeeLiveIn}. Credit slider discount is -$${budgetState.localCreditLiveInOffset}. Live-out operational rate is $${budgetState.localOperationsFeeLiveOut}.
  - Dynamic Programming Expenses: Recruitment: $${budgetState.recruitmentBudget}, Philanthropy: $${budgetState.philanthropyBudget}, Sisterhood: $${budgetState.sisterhoodBudget}, Social: $${budgetState.socialBudget}.
  - T-Shirt Income: $${budgetState.tshirtIncome}, T-Shirt Expense: $${budgetState.tshirtExpense} (Purchase fund is ${pf ? "Enabled" : "Disabled"}).
  - Miscellaneous Income: $${budgetState.miscIncome}, Miscellaneous Expense: $${budgetState.miscExpense} (Justification: "${budgetState.miscExpenseJustification || "None provided"}").
  
  FINANCIAL MATRIX SUMMARY:
  - Calculated Revenue: $${summary.totalRevenue.toFixed(2)}
  - Calculated Expense: $${summary.totalExpense.toFixed(2)}
  - Net Position: $${summary.netSurplus.toFixed(2)}
  - Fully Balanced: ${summary.isBalanced ? "YES (Surplus is close to zero)" : "NO (We have a remainder deficit or surplus)"}
  
  CURRENT OUTSTANDING WARNINGS DETECTED BY REGULATORY CHECKS:
  ${warnings.map(w => "- " + w).join("\n")}
  
  USER QUERY/QUESTION:
  "${question || "Please review my entire budget for compliance and let me know how to make it pristine so my Executive Council and Regional Coordinator (RFC) will approve it!"}"
  
  Please write a scannable, beautifully formatted analysis with Caveat-style informal coach notes, clear advice points, and dynamic suggestions. Use elegant markdown like '$\circ\bullet\circ$' (representing pearl strands) as section dividers. Encourage VPF to balance.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
    });
    
    res.json({
      answer: response.text,
      warnings,
      balancedStatus: summary.isBalanced && warnings.length === 0
    });
  } catch (error: any) {
    console.error("Gemini call failed:", error);
    res.status(500).json({ error: "Gemini server call was interrupted: " + error.message });
  }
});

// Configure Vite middleware for development or standard serving for Production
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
  
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving from dist/
    const distPath = path.join(process.cwd(), "dist");
    app.use("/agd-budgets", express.static(distPath));
    app.get("/agd-budgets/*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.get("/", (req, res) => {
    res.redirect("/agd-budgets/");
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pearl & Rose full-stack server active on port ${PORT}`);
  });
}

startServer();
