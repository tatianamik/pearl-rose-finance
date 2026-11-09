import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "./server";

describe("POST /agd-budgets/api/copilot", () => {
  it("should return 400 when budgetState is missing", async () => {
    const response = await request(app)
      .post("/agd-budgets/api/copilot")
      .send({
        question: "Please review my budget."
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Budget state is required to evaluate." });
  });

  it("should return 200 and offline copilot response when valid minimal budgetState is provided", async () => {
    // A simplified but valid ChapterBudgetState mock
    const mockBudgetState = {
      chapter: "Nu Delta",
      status: "ACTIVE",
      year: "2026-2027",
      budgetState: "base",
      officerStructure: "A",
      termSystem: "semester",
      facilityType: "RESIDENTIAL",
      propertyManager: "FHC",
      hasStudyAbroad: true,
      hasInactives: true,
      activeMembers: 60,
      newMembersExpected: 15,
      contractedBeds: 20,
      actualOccupants: 14,
      billingGroups: [],
      octoberDuesRate: 95.0,
      februaryDuesRate: 95.0,
      insuranceRate: 60.0,
      foundingBadgeRate: 0,
      foundingInitiationRate: 0,
      localOperationsFeeLiveIn: 400.0,
      localOperationsFeeLiveOut: 550.0,
      localCreditLiveInOffset: 0.0,
      parlorFee: 180.0,
      propertySupportFee: 90.0,
      fhcDamageFee: 100.0,
      baseRentHoused: 143680.0,
      rentExpense: 0.0,
      emptyBedSurchargeDistribution: "reserve",
      emptyBedReserveDraw: 24000.0,
      emptyBedMemberSurcharge: 0.0,
      tshirtIncome: 1200.0,
      tshirtExpense: 1250.0,
      tshirtOrders: [],
      hasPurchaseFund: false,
      miscIncome: 4500.0,
      miscExpense: 3200.0,
      miscExpenseJustification: "",
      recruitmentBudget: 12000.0,
      sisterhoodBudget: 8500.0,
      philanthropyBudget: 6000.0,
      socialBudget: 15000.0,
      processingFee: 1500.0,
      processingFeeCardPercentage: 50,
      panhellenicDues: 2250.0,
      panhellenicCalcMode: "per-member",
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
    };

    const response = await request(app)
      .post("/agd-budgets/api/copilot")
      .send({
        budgetState: mockBudgetState,
        question: "Please review my budget."
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("answer");
    expect(response.body).toHaveProperty("warnings");
    expect(response.body).toHaveProperty("balancedStatus");
    expect(Array.isArray(response.body.warnings)).toBe(true);
    expect(typeof response.body.balancedStatus).toBe("boolean");
  });
});
