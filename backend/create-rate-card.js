const XLSX = require('xlsx');
const path = require('path');

// Create workbook
const wb = XLSX.utils.book_new();

// Civil sheet
const civil = [
  ['Item Name', 'Category', 'UOM', 'Elemantra Rates', 'Vendor Rates'],
  ['Demolition & Debris', 'Demo', 'Sqft', 45, 50],
  ['Flooring - Tile', 'Flooring', 'Sqft', 180, 200],
  ['Concrete Work', 'Civil', 'Sqft', 220, 250],
  ['Plastering', 'Civil', 'Sqft', 35, 40],
];

// Carpentry sheet
const carpentry = [
  ['Item Name', 'Category', 'UOM', 'Elemantra Rates', 'Vendor Rates'],
  ['Modular Kitchen Base', 'Kitchen', 'Rft', 5200, 5800],
  ['Modular Kitchen Wall', 'Kitchen', 'Rft', 4800, 5400],
  ['Kitchen Countertop', 'Kitchen', 'Rft', 2200, 2600],
  ['Wardrobe Internal', 'Wardrobe', 'Sqft', 1300, 1500],
];

// Electrical sheet
const electrical = [
  ['Item Name', 'Category', 'UOM', 'Elemantra Rates', 'Vendor Rates'],
  ['Electrical Points', 'Electrical', 'L.S.', 30000, 35000],
  ['DB/MCB Changes', 'Electrical', 'L.S.', 12000, 14000],
  ['Light Fixture Installation', 'Electrical', 'L.S.', 8000, 10000],
];

// Plumbing sheet
const plumbing = [
  ['Item Name', 'Category', 'UOM', 'Elemantra Rates', 'Vendor Rates'],
  ['Plumbing Works', 'Plumbing', 'Each', 18000, 20000],
  ['Water Supply Pipes', 'Plumbing', 'Rft', 85, 95],
];

// POP sheet
const pop = [
  ['Item Name', 'Category', 'UOM', 'Elemantra Rates', 'Vendor Rates'],
  ['Gypsum Ceiling', 'Ceiling', 'Sqft', 120, 135],
  ['Cove/Profile', 'Ceiling', 'Rft', 220, 250],
];

// Painting sheet
const painting = [
  ['Item Name', 'Category', 'UOM', 'Elemantra Rates', 'Vendor Rates'],
  ['Wall Painting', 'Painting', 'Sqft', 22, 25],
  ['Ceiling Painting', 'Painting', 'Sqft', 18, 20],
];

// Modular Work sheet
const modular = [
  ['Item Name', 'Category', 'UOM', 'Elemantra Rates', 'Vendor Rates'],
  ['Modular Assembly', 'Modular', 'L.S.', 5000, 6000],
];

// Fabrication sheet
const fabrication = [
  ['Item Name', 'Category', 'UOM', 'Elemantra Rates', 'Vendor Rates'],
  ['Metal Fabrication', 'Metal', 'Sqft', 150, 180],
];

// Waterproofing sheet (for bathroom/terrace)
const waterproofing = [
  ['Item Name', 'Category', 'UOM', 'Elemantra Rates', 'Vendor Rates'],
  ['Waterproofing - Bathroom', 'Waterproofing', 'Sqft', 120, 140],
  ['Waterproofing - Terrace', 'Waterproofing', 'Sqft', 150, 180],
];

// Add sheets to workbook
const ws_civil = XLSX.utils.aoa_to_sheet(civil);
const ws_carp = XLSX.utils.aoa_to_sheet(carpentry);
const ws_elec = XLSX.utils.aoa_to_sheet(electrical);
const ws_plumb = XLSX.utils.aoa_to_sheet(plumbing);
const ws_pop = XLSX.utils.aoa_to_sheet(pop);
const ws_paint = XLSX.utils.aoa_to_sheet(painting);
const ws_mod = XLSX.utils.aoa_to_sheet(modular);
const ws_fab = XLSX.utils.aoa_to_sheet(fabrication);
const ws_wp = XLSX.utils.aoa_to_sheet(waterproofing);

XLSX.utils.book_append_sheet(wb, ws_civil, 'Civil');
XLSX.utils.book_append_sheet(wb, ws_carp, 'Carpentry');
XLSX.utils.book_append_sheet(wb, ws_elec, 'Electric');
XLSX.utils.book_append_sheet(wb, ws_plumb, 'Plumbing');
XLSX.utils.book_append_sheet(wb, ws_pop, 'POP');
XLSX.utils.book_append_sheet(wb, ws_paint, 'Painting');
XLSX.utils.book_append_sheet(wb, ws_mod, 'Modular Work');
XLSX.utils.book_append_sheet(wb, ws_fab, 'Fabrication');
XLSX.utils.book_append_sheet(wb, ws_wp, 'Waterproofing');

// Save file
const outputPath = path.join(__dirname, 'Elemantra- Master Rate Card.xlsx');
XLSX.writeFile(wb, outputPath);
console.log(`✓ Rate card created at: ${outputPath}`);
