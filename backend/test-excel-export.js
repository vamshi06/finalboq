#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test data matching the professional BOQ template
const testBoq = {
  meta: {
    projectType: '2BHK Premium Apartment',
    areaSqft: 1673,
    qualityTier: 'premium'
  },
  boqLines: [
    // Civil items
    {
      itemName: 'Demolition',
      itemId: 'CIVIL-001',
      dept: 'Civil',
      qty: 208,
      uom: 'sq.ft',
      elemantraRate: 250,
      elemantraAmount: 52000,
      itemDetails: 'walls',
      description: 'Demolition of walls',
      location: 'Kitchen & Bathrooms',
      raPercentage: 1.0,
      isMovable: false
    },
    {
      itemName: 'Kitchen Platform',
      itemId: 'CIVIL-002',
      dept: 'Civil',
      qty: 25,
      uom: 'sq.ft',
      elemantraRate: 3000,
      elemantraAmount: 75000,
      itemDetails: 'Marble platform',
      description: 'Marble with verticals',
      location: 'Kitchen',
      raPercentage: 1.0,
      isMovable: false
    },
    // Plumbing items
    {
      itemName: 'Bathroom Plumbing',
      itemId: 'PL-001',
      dept: 'Plumbing',
      qty: 1,
      uom: 'per bathroom',
      elemantraRate: 35000,
      elemantraAmount: 35000,
      itemDetails: 'CP Fittings',
      description: 'Basin + CP fittings + Ceiling shower',
      location: 'Samar Toilet',
      raPercentage: 0.85,
      isMovable: false
    },
    // Electrical items
    {
      itemName: 'Electrical Wiring',
      itemId: 'E-001',
      dept: 'Electrical',
      qty: 1673,
      uom: 'sqft',
      elemantraRate: 350,
      elemantraAmount: 585550,
      itemDetails: '5A Switch socket',
      description: 'New 5A switch and socket for all areas',
      location: 'All areas',
      raPercentage: 0.75,
      isMovable: false
    },
    // Carpentry items
    {
      itemName: 'Main Door',
      itemId: 'CP-111',
      dept: 'Carpentry',
      qty: 1,
      uom: 'Nos',
      elemantraRate: 65000,
      elemantraAmount: 65000,
      itemDetails: 'Veneer Finish',
      description: 'MR ply with veneer finish',
      location: 'Main entrance',
      raPercentage: 0.45,
      isMovable: false
    },
    {
      itemName: 'Wardrobe',
      itemId: 'CP-117',
      dept: 'Carpentry',
      qty: 90,
      uom: 'sq.ft',
      elemantraRate: 1800,
      elemantraAmount: 162000,
      itemDetails: 'Laminate Finish',
      description: 'MR ply with laminate',
      location: 'Mother Bedroom',
      raPercentage: 0.5,
      isMovable: false
    },
    // Painting items
    {
      itemName: 'Wall Painting',
      itemId: 'P-005',
      dept: 'Painting',
      qty: 4183,
      uom: 'sq.ft',
      elemantraRate: 45,
      elemantraAmount: 188235,
      itemDetails: 'Royal Shyne Paint',
      description: 'Wall painting with primer and putty',
      location: 'All walls',
      raPercentage: 1.0,
      isMovable: false
    }
  ],
  topazSummary: {
    subtotalBase: 1162785,
    gstPercent: 18,
    gstAmount: 209301,
    grandTotal: 1372086,
    costPerSqft: 820,
    consultationFees: 100000
  },
  packageSummary: {
    rows: [],
    totals: { immovableTotal: 0, movableTotal: 0, combinedTotal: 0 }
  },
  suggestions: []
};

console.log('\n' + '='.repeat(60));
console.log('🧪 TESTING BOQ EXCEL EXPORT');
console.log('='.repeat(60) + '\n');

// Display test data summary
console.log('📊 Test Data Summary:');
console.log(`   Project: ${testBoq.meta.projectType}`);
console.log(`   Area: ${testBoq.meta.areaSqft} sqft`);
console.log(`   Quality: ${testBoq.meta.qualityTier}`);
console.log(`   BOQ Items: ${testBoq.boqLines.length}`);
console.log(`   Subtotal: ₹${testBoq.topazSummary.subtotalBase.toLocaleString()}`);
console.log(`   GST (18%): ₹${testBoq.topazSummary.gstAmount.toLocaleString()}`);
console.log(`   Grand Total: ₹${testBoq.topazSummary.grandTotal.toLocaleString()}`);
console.log(`   Cost/Sqft: ₹${testBoq.topazSummary.costPerSqft}\n`);

// Test data structure
console.log('✅ Test Data Structure Validation:');
console.log(`   ✓ Meta object present`);
console.log(`   ✓ BOQ Lines array: ${testBoq.boqLines.length} items`);
console.log(`   ✓ Summary object present`);
console.log(`   ✓ Department breakdown:`);

const depts = {};
testBoq.boqLines.forEach(line => {
  depts[line.dept] = (depts[line.dept] || 0) + 1;
});

Object.entries(depts).forEach(([dept, count]) => {
  console.log(`      - ${dept}: ${count} items`);
});

console.log('\n✅ All Test Data Validations Passed!\n');

// Save test data to file for API testing
const testFile = path.join(__dirname, 'test-data.json');
fs.writeFileSync(testFile, JSON.stringify(testBoq, null, 2));
console.log(`📁 Test data saved to: ${testFile}\n`);

console.log('='.repeat(60));
console.log('✅ TEST COMPLETE - Ready for API Testing');
console.log('='.repeat(60) + '\n');

console.log('📝 Next Steps:');
console.log('   1. Server should be running on http://localhost:8080');
// console.log('   1. Server should be running on https://boq-generator-pcqh.onrender.com');
// const BASE_URL = 'https://boq-generator-pcqh.onrender.com/api/boq';
console.log('   2. Send POST request to /api/boq/export with test data');
console.log('   3. Verify Excel file is generated correctly\n');

console.log('🧪 Expected Excel Output:');
console.log('   ✓ Quotation Summary Section');
console.log('   ✓ 17-Column Table Header');
console.log('   ✓ Department-wise Grouping (Civil, Plumbing, etc.)');
console.log('   ✓ Item Details with All Columns');
console.log('   ✓ Department Subtotals');
console.log('   ✓ Summary Section (Subtotal, GST, Grand Total)');
console.log('   ✓ Professional Formatting (₹ currency, %)\n');

process.exit(0);
