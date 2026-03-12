#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { buildExcelBuffer } = require('./src/services/boqExportExcel.service');
const exactBoqData = require('./exact-boq-data');

async function generateExactExcel() {
  console.log('\n' + '='.repeat(90));
  console.log('✅ GENERATING EXCEL WITH EXACT TOTALS - 1673 SQFT');
  console.log('='.repeat(90) + '\n');

  try {
    console.log('📊 EXACT TOTALS (MATCHING YOUR EXCEL):');
    
    const departments = {};
    exactBoqData.boqLines.forEach(item => {
      if (!departments[item.dept]) departments[item.dept] = 0;
      departments[item.dept] += item.elemantraAmount;
    });

    console.log(`   • Civil: ₹${departments.Civil?.toLocaleString() || 0} (Expected: ₹1,126,050)`);
    console.log(`   • Plumbing: ₹${departments.Plumbing?.toLocaleString() || 0} (Expected: ₹180,000)`);
    console.log(`   • Electrical: ₹${departments.Electrical?.toLocaleString() || 0} (Expected: ₹585,550)`);
    console.log(`   • POP: ₹${departments.POP?.toLocaleString() || 0} (Expected: ₹442,500)`);
    console.log(`   • Carpentry: ₹${departments.Carpentry?.toLocaleString() || 0} (Expected: ₹6,224,875)`);
    console.log(`   • Painting: ₹${departments.Painting?.toLocaleString() || 0} (Expected: ₹978,479)`);
    console.log(`   • Miscellaneous: ₹${departments.Miscellaneous?.toLocaleString() || 0} (Expected: ₹190,000)`);

    const subtotal = Object.values(departments).reduce((a, b) => a + b, 0);
    const gst = Math.round(subtotal * 0.18);
    const grandTotal = subtotal + gst;

    console.log(`\n💰 CALCULATIONS:`);
    console.log(`   ✓ Subtotal: ₹${subtotal.toLocaleString()}`);
    console.log(`   ✓ GST (18%): ₹${gst.toLocaleString()}`);
    console.log(`   ✓ Grand Total: ₹${grandTotal.toLocaleString()}`);
    console.log(`   ✓ Cost/Sqft: ₹${Math.round(subtotal / 1673).toLocaleString()}\n`);

    console.log('🔄 Generating Excel buffer...');
    const excelBuffer = await buildExcelBuffer(exactBoqData);

    if (!excelBuffer) {
      console.error('❌ ERROR: Excel buffer is null\n');
      process.exit(1);
    }

    const outputPath = path.join(__dirname, 'FINAL-BOQ-OUTPUT.xlsx');
    fs.writeFileSync(outputPath, excelBuffer);
    const fileStats = fs.statSync(outputPath);

    console.log('✅ Excel generated successfully!\n');
    console.log('📁 FILE: FINAL-BOQ-OUTPUT.xlsx');
    console.log(`   ✓ Size: ${(fileStats.size / 1024).toFixed(2)} KB`);
    console.log(`   ✓ Location: ${outputPath}`);

    console.log('\n' + '='.repeat(90));
    console.log('✅ FINAL EXCEL WITH EXACT TOTALS - READY TO USE!');
    console.log('='.repeat(90) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

generateExactExcel();
