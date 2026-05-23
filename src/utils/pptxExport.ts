import pptxgen from 'pptxgenjs';
import { BudgetState } from '../store';

export async function generateBudgetPresentation(budget: BudgetState['budget']) {
  if (!budget) return;

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  // Helper variables
  const totalRevenue = budget.billingGroups.reduce((acc, bg) => acc + (bg.breakdown.chapterDues * bg.memberCount), 0) + budget.miscIncome + budget.tshirtIncome;
  const totalOperations = budget.recruitmentBudget + budget.sisterhoodBudget + budget.socialBudget + budget.philanthropyBudget + budget.miscExpense + budget.techExpense + budget.professionalServicesExpense + budget.lcVisitsExpense + budget.tshirtExpense;

  // Slide 1: Title Slide
  const slide1 = pptx.addSlide();
  slide1.background = { color: 'FFFDF9' }; // Cream
  slide1.addText('Alpha Gamma Delta', { x: '10%', y: '30%', w: '80%', fontSize: 48, bold: true, color: '292524', align: 'center', fontFace: 'Georgia' });
  slide1.addText(`${budget.chapter} Chapter - FY ${budget.year} Budget`, { x: '10%', y: '45%', w: '80%', fontSize: 24, color: 'E11D48', align: 'center', bold: true, fontFace: 'Courier New' });
  slide1.addText('Executive Council Vote', { x: '10%', y: '60%', w: '80%', fontSize: 24, color: '78716C', align: 'center' });
  slide1.addText('Prepared by: VP Finance', { x: '10%', y: '70%', w: '80%', fontSize: 18, color: 'A8A29E', align: 'center', fontFace: 'Courier New' });

  // Slide 2: Roster & Housing Strategy
  const slide2 = pptx.addSlide();
  slide2.background = { color: 'FFFDF9' };
  slide2.addText('Roster & Housing Strategy', { x: '5%', y: '5%', w: '90%', fontSize: 36, bold: true, color: '292524', fontFace: 'Georgia' });
  slide2.addText('Baseline Operational Assumptions', { x: '5%', y: '15%', w: '90%', fontSize: 20, color: 'E11D48', fontFace: 'Courier New', bold: true });

  // Roster Box
  slide2.addShape(pptx.ShapeType.rect, { x: '5%', y: '25%', w: '40%', h: '60%', fill: { color: 'FFFFFF' }, line: { color: 'E7E5E4' } });
  slide2.addText('Roster Mix', { x: '7%', y: '30%', w: '36%', fontSize: 28, bold: true, color: '059669' });
  slide2.addText(`Active Members: ${budget.actualActiveMembers}`, { x: '7%', y: '45%', w: '36%', fontSize: 24, color: '292524' });
  slide2.addText(`New Members: ${budget.actualNewMembers}`, { x: '7%', y: '55%', w: '36%', fontSize: 24, color: '292524' });
  slide2.addText(`Total Roster: ${budget.actualActiveMembers + budget.actualNewMembers}`, { x: '7%', y: '70%', w: '36%', fontSize: 24, color: '059669', bold: true });

  // Housing Box
  slide2.addShape(pptx.ShapeType.rect, { x: '55%', y: '25%', w: '40%', h: '60%', fill: { color: 'FFFFFF' }, line: { color: 'E7E5E4' } });
  slide2.addText('Housing Status', { x: '57%', y: '30%', w: '36%', fontSize: 28, bold: true, color: 'D97706' });
  slide2.addText(`Facility Type: ${budget.facilityType}`, { x: '57%', y: '45%', w: '36%', fontSize: 24, color: '292524' });
  slide2.addText(`Occupancy Target: ${budget.contractedBeds}`, { x: '57%', y: '55%', w: '36%', fontSize: 24, color: '292524' });
  slide2.addText(`Current Live-Ins: ${budget.actualOccupants}`, { x: '57%', y: '70%', w: '36%', fontSize: 24, color: 'D97706', bold: true });

  // Slide 3: The Bottom Line
  const slide3 = pptx.addSlide();
  slide3.background = { color: 'FFFDF9' };
  slide3.addText('The Bottom Line', { x: '5%', y: '5%', w: '90%', fontSize: 36, bold: true, color: '292524', fontFace: 'Georgia' });
  slide3.addText('High-Level Financial Outlook', { x: '5%', y: '15%', w: '90%', fontSize: 20, color: 'E11D48', fontFace: 'Courier New', bold: true });

  // Revenue
  slide3.addShape(pptx.ShapeType.rect, { x: '20%', y: '25%', w: '60%', h: '25%', fill: { color: 'FFFFFF' }, line: { color: 'E7E5E4' } });
  slide3.addText('Projected Local Chapter Revenue', { x: '20%', y: '28%', w: '60%', fontSize: 18, color: '78716C', align: 'center', bold: true });
  slide3.addText(`$${totalRevenue.toLocaleString()}`, { x: '20%', y: '35%', w: '60%', fontSize: 48, color: '292524', align: 'center', fontFace: 'Courier New', bold: true });

  // Operations
  slide3.addShape(pptx.ShapeType.rect, { x: '5%', y: '60%', w: '26%', h: '25%', fill: { color: 'EEF2FF' } });
  slide3.addText('Programming', { x: '5%', y: '65%', w: '26%', fontSize: 16, color: '4F46E5', align: 'center', bold: true });
  slide3.addText(`$${totalOperations.toLocaleString()}`, { x: '5%', y: '72%', w: '26%', fontSize: 28, color: '292524', align: 'center', bold: true });

  // Housing FHC
  slide3.addShape(pptx.ShapeType.rect, { x: '37%', y: '60%', w: '26%', h: '25%', fill: { color: 'FFF1F2' } });
  slide3.addText('Housing / FHC', { x: '37%', y: '65%', w: '26%', fontSize: 16, color: 'E11D48', align: 'center', bold: true });
  slide3.addText('Managed', { x: '37%', y: '72%', w: '26%', fontSize: 28, color: '292524', align: 'center', bold: true });

  // Net Health
  slide3.addShape(pptx.ShapeType.rect, { x: '69%', y: '60%', w: '26%', h: '25%', fill: { color: 'ECFDF5' } });
  slide3.addText('Net Health', { x: '69%', y: '65%', w: '26%', fontSize: 16, color: '059669', align: 'center', bold: true });
  slide3.addText('Balanced', { x: '69%', y: '72%', w: '26%', fontSize: 28, color: '292524', align: 'center', bold: true });

  // Slide 4: Action Required
  const slide4 = pptx.addSlide();
  slide4.background = { color: 'FFFDF9' };
  slide4.addText('EC Vote Required', { x: '10%', y: '20%', w: '80%', fontSize: 48, bold: true, color: '292524', align: 'center', fontFace: 'Georgia' });
  slide4.addText('Formal parliamentary approval', { x: '10%', y: '35%', w: '80%', fontSize: 24, color: 'E11D48', align: 'center', bold: true, fontFace: 'Courier New' });
  
  slide4.addShape(pptx.ShapeType.rect, { x: '20%', y: '50%', w: '60%', h: '20%', fill: { color: 'ECFDF5' }, line: { color: '10B981' } });
  slide4.addText('Budget Balanced & Compliant', { x: '20%', y: '55%', w: '60%', fontSize: 24, color: '059669', align: 'center', bold: true });
  
  slide4.addText('"I move to approve the 2026-2027 Chapter Budget as presented."', { x: '10%', y: '80%', w: '80%', fontSize: 20, color: '78716C', align: 'center', italic: true });

  // Save
  await pptx.writeFile({ fileName: `${budget.chapter}_FY${budget.year}_Budget_Deck.pptx` });
}
