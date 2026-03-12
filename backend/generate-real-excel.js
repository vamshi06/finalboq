#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { buildExcelBuffer } = require('./src/services/boqExportExcel.service');
const realBoqData = require('./real-boq-data');

async function generateRealExcel() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 GENERATING EXCEL WITH REAL BOQ DATA - 1673 SQFT');
  console.log('='.repeat(80) + '\n');

  try {
    // Display input data summary
    console.log('📊 INPUT DATA SUMMARY:');
    console.log(`   ✓ Project: ${realBoqData.meta.projectType}`);
    console.log(`   ✓ Area: ${realBoqData.meta.areaSqft} sqft`);
    console.log(`   ✓ Total Items: ${realBoqData.boqLines.length}`);
    console.log(`   ✓ Departments: Civil, Plumbing, Electrical, POP, Carpentry, Painting, Miscellaneous\n`);

    // Department breakdown
    const departments = {};
    realBoqData.boqLines.forEach(item => {
      if (!departments[item.dept]) {
        departments[item.dept] = { count: 0, total: 0 };
      }
      departments[item.dept].count++;
      departments[item.dept].total += item.elemantraAmount;
    });

    console.log('📋 DEPARTMENT BREAKDOWN:');
    Object.entries(departments).forEach(([dept, data]) => {
      console.log(`   • ${dept}: ${data.count} items → ₹${data.total.toLocaleString()}`);
    });

    console.log(`\n💰 FINANCIAL SUMMARY:`);
    console.log(`   ✓ Subtotal (Base): ₹${realBoqData.topazSummary.subtotalBase.toLocaleString()}`);
    console.log(`   ✓ Consultation Fees: ₹${realBoqData.topazSummary.consultationFees.toLocaleString()}`);
    console.log(`   ✓ GST (18%): ₹${realBoqData.topazSummary.gstAmount.toLocaleString()}`);
    console.log(`   ✓ Contingency (5%): ₹${realBoqData.topazSummary.contingencyAmount.toLocaleString()}`);
    console.log(`   ✓ Grand Total: ₹${realBoqData.topazSummary.grandTotal.toLocaleString()}`);
    console.log(`   ✓ Cost per Sqft: ₹${realBoqData.topazSummary.costPerSqft.toLocaleString()}\n`);

    console.log('🔄 Generating Excel buffer...');
    const excelBuffer = await buildExcelBuffer(realBoqData);

    if (!excelBuffer) {
      console.error('❌ ERROR: Excel buffer is null/undefined\n');
      process.exit(1);
    }

    console.log('✅ Excel buffer generated successfully!\n');

    // Save to file
    const outputPath = path.join(__dirname, 'real-output.xlsx');
    fs.writeFileSync(outputPath, excelBuffer);

    const fileStats = fs.statSync(outputPath);
    console.log('📁 FILE DETAILS:');
    console.log(`   ✓ File: ${outputPath}`);
    console.log(`   ✓ Size: ${(fileStats.size / 1024).toFixed(2)} KB`);
    console.log(`   ✓ Bytes: ${fileStats.size.toLocaleString()}\n`);

    console.log('='.repeat(80));
    console.log('✅ EXCEL GENERATION SUCCESSFUL!');
    console.log('='.repeat(80));
    console.log('\n🎉 Real Excel file generated: real-output.xlsx');
    console.log('\n📊 Expected Output Structure:');
    console.log('   • Quotation Summary with all departments');
    console.log('   • 17-column professional BOQ table');
    console.log('   • All items grouped by department');
    console.log('   • Professional formatting and calculations');
    console.log('   • RA percentages applied for each item');
    console.log('   • Summary totals and per sqft calculations\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

generateRealExcel();
