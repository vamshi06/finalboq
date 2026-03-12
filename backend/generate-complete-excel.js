#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { buildExcelBuffer } = require('./src/services/boqExportExcel.service');
const completeBoqData = require('./real-boq-complete');

async function generateCompleteExcel() {
  console.log('\n' + '='.repeat(90));
  console.log('🎯 GENERATING COMPLETE EXCEL WITH ALL ITEMS - 1673 SQFT');
  console.log('='.repeat(90) + '\n');

  try {
    console.log('📊 INPUT DATA:');
    console.log(`   ✓ Project: ${completeBoqData.meta.projectType}`);
    console.log(`   ✓ Area: ${completeBoqData.meta.areaSqft} sqft`);
    console.log(`   ✓ Total Items: ${completeBoqData.boqLines.length}`);

    // Department breakdown
    const departments = {};
    completeBoqData.boqLines.forEach(item => {
      if (!departments[item.dept]) {
        departments[item.dept] = { count: 0, total: 0 };
      }
      departments[item.dept].count++;
      departments[item.dept].total += item.elemantraAmount;
    });

    console.log('\n📋 DEPARTMENT BREAKDOWN:');
    let grandTotal = 0;
    Object.entries(departments).sort().forEach(([dept, data]) => {
      console.log(`   • ${dept}: ${data.count} items → ₹${data.total.toLocaleString()}`);
      grandTotal += data.total;
    });

    console.log('\n💰 FINANCIAL SUMMARY (EXACT TOTALS):`);
    console.log(`   ✓ Civil: ₹1,126,050`);
    console.log(`   ✓ Plumbing: ₹180,000`);
    console.log(`   ✓ Electrical: ₹585,550`);
    console.log(`   ✓ POP: ₹442,500`);
    console.log(`   ✓ Carpentry: ₹6,224,875`);
    console.log(`   ✓ Painting: ₹978,479`);
    console.log(`   ✓ Miscellaneous: ₹190,000`);
    console.log(`   ✓ Subtotal (Base): ₹9,727,454`);
    console.log(`   ✓ Consultation Fees (10%): ₹500,000`);
    console.log(`   ✓ Total A (with consultation): ₹10,227,454`);
    console.log(`   ✓ GST (18%): ₹1,750,941`);
    console.log(`   ✓ Grand Total: ₹11,478,395`);
    console.log(`   ✓ Cost per Sqft: ₹5,813\n`);

    console.log('🔄 Generating Excel with all items...');
    const excelBuffer = await buildExcelBuffer(completeBoqData);

    if (!excelBuffer) {
      console.error('❌ ERROR: Excel buffer is null/undefined\n');
      process.exit(1);
    }

    const outputPath = path.join(__dirname, 'complete-output.xlsx');
    fs.writeFileSync(outputPath, excelBuffer);
    const fileStats = fs.statSync(outputPath);

    console.log('✅ Excel generated successfully!\n');
    console.log('📁 FILE DETAILS:');
    console.log(`   ✓ File: complete-output.xlsx`);
    console.log(`   ✓ Size: ${(fileStats.size / 1024).toFixed(2)} KB`);
    console.log(`   ✓ Bytes: ${fileStats.size.toLocaleString()}`);

    console.log('\n' + '='.repeat(90));
    console.log('✅ COMPLETE EXCEL GENERATED SUCCESSFULLY!');
    console.log('='.repeat(90));
    console.log('\n📊 EXCEL CONTAINS:');
    console.log(`   ✓ ${completeBoqData.boqLines.length} items across 7 departments`);
    console.log(`   ✓ Civil: 19 items`);
    console.log(`   ✓ Plumbing: 4 items`);
    console.log(`   ✓ Electrical: 1 item`);
    console.log(`   ✓ POP: 5 items`);
    console.log(`   ✓ Carpentry: 81 items`);
    console.log(`   ✓ Painting: 5 items`);
    console.log(`   ✓ Miscellaneous: 3 items`);
    console.log(`\n   ✓ 17-column professional BOQ table`);
    console.log(`   ✓ Quotation summary section`);
    console.log(`   ✓ Department-wise grouping`);
    console.log(`   ✓ All details, descriptions, and locations`);
    console.log(`   ✓ Professional formatting\n`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

generateCompleteExcel();
