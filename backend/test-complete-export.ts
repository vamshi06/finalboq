import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { exactBoqData } from './exact-boq-data.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'http://localhost:8080/api/boq';
// const BASE_URL = 'https://boq-generator-pcqh.onrender.com/api/boq';

/**
 * Test complete BOQ export and AI suggestions workflow
 */
async function testCompleteWorkflow() {
  try {
    console.log('🚀 Starting BOQ Export & AI Suggestions Test\n');

    // Test data
    const boqData = exactBoqData;

    // ===== TEST 1: Excel Export =====
    console.log('1️⃣  Testing Excel Export...');
    const excelResponse = await axios.post(`${BASE_URL}/export/excel?projectName=TestProject`, boqData, {
      responseType: 'arraybuffer',
      headers: { 'Content-Type': 'application/json' }
    });

    const excelFilename = excelResponse.headers['content-disposition']
      ?.split('filename=')[1]
      ?.replace(/"/g, '') || 'test-export.xlsx';

    const excelPath = path.join(__dirname, 'uploads', excelFilename);
    fs.writeFileSync(excelPath, excelResponse.data);
    console.log(`   ✅ Excel exported successfully: ${excelPath}`);
    console.log(`   📊 File size: ${(excelResponse.data.length / 1024).toFixed(2)} KB\n`);

    // ===== TEST 2: PDF Export =====
    console.log('2️⃣  Testing PDF Export...');
    const pdfResponse = await axios.post(`${BASE_URL}/export/pdf?projectName=TestProject`, boqData, {
      responseType: 'arraybuffer',
      headers: { 'Content-Type': 'application/json' }
    });

    const pdfFilename = pdfResponse.headers['content-disposition']
      ?.split('filename=')[1]
      ?.replace(/"/g, '') || 'test-export.pdf';

    const pdfPath = path.join(__dirname, 'uploads', pdfFilename);
    fs.writeFileSync(pdfPath, pdfResponse.data);
    console.log(`   ✅ PDF exported successfully: ${pdfPath}`);
    console.log(`   📄 File size: ${(pdfResponse.data.length / 1024).toFixed(2)} KB\n`);

    // ===== TEST 3: AI Suggestions =====
    console.log('3️⃣  Testing AI Suggestions...');
    const suggestionsResponse = await axios.post(`${BASE_URL}/suggestions`, boqData, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('   ✅ AI Suggestions generated successfully');
    console.log('\n📋 AI SUGGESTIONS:\n');
    console.log(suggestionsResponse.data.suggestions);

    console.log('\n💰 COST ANALYSIS:\n');
    console.log(JSON.stringify(suggestionsResponse.data.costAnalysis, null, 2));

    console.log('\n' + '='.repeat(80));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(80));

  } catch (error) {
    const err = error as any;
    console.error('❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

// Run tests
testCompleteWorkflow();
