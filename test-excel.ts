import * as xlsx from "xlsx";
const wb = xlsx.readFile("/Users/tanyahughes/Downloads/agd-budgets/Alpha Omicron 2026-2027 Budget.xlsx");
console.log("Sheet Names:", wb.SheetNames);
const sheetName = wb.SheetNames[0];
const ws = wb.Sheets[sheetName];
console.log("Sheet 1 Sample:");
const json = xlsx.utils.sheet_to_json(ws, { header: 1 });
for(let i=0; i<30; i++) {
  console.log(`Row ${i}:`, json[i]);
}
