/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ChapterStatus {
  COLONY = "COLONY",
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED"
}

export enum OfficerStructure {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  MC = "MC"
}

export enum FacilityType {
  UNHOUSED = "UNHOUSED",
  STORAGE_ONLY = "STORAGE_ONLY",
  SUITE = "SUITE",
  RESIDENTIAL = "RESIDENTIAL"
}

export enum PropertyManager {
  NONE = "NONE",
  HA = "HA",
  FHC = "FHC"
}

export interface BillingGroup {
  id: string;
  groupName: string;
  memberCount: number;
  breakdown: {
    chapterDues: number;
    parlorFee: number;
    roomCharge: number;
    parkingFee: number;
  }
}

export enum UserRole {
  VPF = "VPF", // Vice President Finance (Student)
  FA = "FA",   // Finance Advisor (Volunteer)
  RFC = "RFC", // Regional Finance Committee (Regional Specialist)
  IHQ = "IHQ"  // International HQ Admin
}

export interface GlobalRole {
  role: UserRole;
  scope: string | string[]; // Can be "Region_2", "Nu Delta", or ["Chapter_A", "Chapter_B"]
  displayName: string;
}

export interface UserContext {
  email: string;
  name: string;
  role: UserRole;
  chapter: string; // Active chapter scope for this session
  scope?: string | string[];
  isRfcSpecialist?: boolean; // legacy
  globalRoles?: GlobalRole[];
  requiresIdentitySelection?: boolean;
}

export interface ChapterContract {
  chapter: string;
  fhcRent: number;
  parlorFee: number;
  propertySupport: number;
  storageFee: number;
}

export interface FHCContractedRates {
  chapterId: string;
  fiscalYear: string;
  contractedRates: {
    parlorFeePerMember: number;
    propertySupportFeePerMember: number;
    baseRentHoused: number;
    fhcDamageFee: number;
    houseCapacity: number;
  }
}

export interface AdvisorComment {
  id: string;
  fieldId: string; // The field this comment targets
  author: string;
  text: string;
  timestamp: string;
  resolved: boolean;
}

export interface TShirtOrder {
  id: string;
  description: string;
  quantity: number;
  pricePerUnit: number;
  totalIncome: number;
  totalExpense: number;
}

export interface HistoricalYear {
  year: string; // e.g. "2023-2024"
  recruitmentSpent: number;
  sisterhoodSpent: number;
  philanthropySpent: number;
  totalBudget: number;
}

export interface ChapterBudgetState {
  chapter: string;
  status: ChapterStatus;
  isColony?: boolean;
  year: string; // "2026-2027"
  budgetState: "base" | "revised"; // For post-recruitment revision
  
  // Roster & Setup stats
  officerStructure: OfficerStructure;
  termSystem: "semester" | "quarter";
  facilityType: FacilityType;
  propertyManager: PropertyManager;
  hasStudyAbroad: boolean;
  hasInactives: boolean;
  activeMembers: number;
  newMembersExpected: number;
  contractedBeds: number;
  actualOccupants: number;
  billingGroups: BillingGroup[];
  
  // Locked Sovereign Fees (Hardcoded standards)
  octoberDuesRate: number; // $95
  februaryDuesRate: number; // $95
  insuranceRate: number; // $60 ($30/$30)
  foundingBadgeRate: number; // $150 (Colony only)
  foundingInitiationRate: number; // $50 (Colony only)
  
  // Local Fees
  localOperationsFeeLiveIn: number; // base: $400
  localOperationsFeeLiveOut: number; // base: $550
  localCreditLiveInOffset: number; // Slider value reducing LIVE-IN local fee
  
  // Property / FHC Set Fees
  emptyBedReserveDraw: number;
  emptyBedMemberSurcharge: number; // added to member dues per term
  parlorFee: number;
  propertySupportFee: number;
  fhcDamageFee: number;
  baseRentHoused: number;
  rentExpense: number; // For Account 6010
  
  // Smart Calculators State
  emptyBedSurchargeDistribution: "reserve" | "members" | "split";
  
  // T-Shirt Engine State
  tshirtIncome: number;
  tshirtExpense: number;
  tshirtOrders: TShirtOrder[];
  hasPurchaseFund: boolean;
  
  // Misc Rule State
  miscIncome: number;
  miscExpense: number;
  miscExpenseJustification: string;
  
  // Programming Local Budgets
  recruitmentBudget: number;
  sisterhoodBudget: number;
  philanthropyBudget: number;
  socialBudget: number;
  
  // Overhead & Processing
  processingFee: number;
  processingFeeCardPercentage: number;
  panhellenicDues: number;
  panhellenicCalcMode: 'flat' | 'per-member';
  panhellenicActiveRate: number;
  panhellenicNewMemberRate: number;
  
  // Spend Related Fees (6800)
  spendRelatedFees: number;
  spendRelatedCards: number;
  spendRelatedChecks: number;
  
  // Tech Expense (5040)
  techExpense: number;
  
  // Professional Services (5160)
  professionalServicesExpense: number;
  hasAlumnaCpaVolunteer: boolean;
  isCanadian: boolean;
  
  // LC Visits (5115)
  lcVisitsExpense: number;
  lcMandatoryVisits: number;
  hasFacility: boolean;
  hasMeals: boolean;
  
  // Large Chapter Admin Fee (5000)
  isLargeChapterEligible: boolean;
  largeChapterFee: number;
  
  // Attrition Settings
  attritionFallPercent: number;
  attritionSpringPercent: number;
  
  // Status check & Governance
  draftStage: 'incubator' | 'volunteer_build' | 'drafting' | 'executive_council' | 'submitted' | 'approved' | 'exported';
  ecVoteDate?: string;
  submittedBy?: string;
  submittedAt?: string;
  advisorComments?: AdvisorComment[];
  
  // Compliance
  tax990NCompleted?: boolean;
  
  // Collaboration/Async Flags
  needsInfoFlags: Record<string, { flagged: boolean; note: string }>;
}

export interface CopilotQuery {
  budgetState: ChapterBudgetState;
  question: string;
}

export interface CopilotResponse {
  answer: string;
  warnings: string[];
  balancedStatus: boolean;
}
