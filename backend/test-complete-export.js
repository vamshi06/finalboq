const axios = require('axios');
const fs = require('fs');
const path = require('path');
const exactBoqData = require('./exact-boq-data.js');

const BASE_URL = 'http://localhost:8080/api/boq';
// const BASE_URL = 'https://boq-generator-pcqh.onrender.com/api/boq';

async function testCompleteWorkflow() {
  try {
    console.log('🚀 Starting BOQ Export & AI Suggestions Test\n');

    const boqData = exactBoqData;
    console.log('BOQ Data loaded, total items:', boqData.boqLines?.length || 0);
    console.log('Total amount:', boqData.topazSummary?.subtotalBase);
    console.log('Making request to:', `${BASE_URL}/export/excel\n`);

    // ===== TEST 1: Excel Export =====
    console.log('1️⃣  Testing Excel Export...');
    try {
      const excelResponse = await axios.post(`${BASE_URL}/export/excel?projectName=TestProject`, boqData, {
        responseType: 'arraybuffer',
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
        validateStatus: () => true  // Don't throw on any status code
      });

      console.log('Response status:', excelResponse.status);
      console.log('Response headers:', excelResponse.headers);

      if (excelResponse.status !== 200) {
        const errorText = excelResponse.data?.toString?.() || JSON.stringify(excelResponse.data);
        console.error('Server error:', errorText);
        return;
      }

      const excelFilename = excelResponse.headers['content-disposition']
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || 'test-export.xlsx';

      if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
      const excelPath = path.join('uploads', excelFilename);
      fs.writeFileSync(excelPath, excelResponse.data);
      console.log(`   ✅ Excel exported successfully: ${excelPath}`);
      console.log(`   📊 File size: ${(excelResponse.data.length / 1024).toFixed(2)} KB`);
    } catch (e) {
      console.error('   Excel export error:');
      console.error('   - Code:', e.code);
      console.error('   - Message:', e.message);
      if (e.response) {
        console.error('   - Status:', e.response.status);
        console.error('   - Data:', e.response.data?.toString?.() || e.response.data);
      }
      return;
    }

    // ===== TEST 2: PDF Export =====
    console.log('\n2️⃣  Testing PDF Export...');
    try {
      const pdfResponse = await axios.post(`${BASE_URL}/export/pdf?projectName=TestProject`, boqData, {
        responseType: 'arraybuffer',
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      const pdfFilename = pdfResponse.headers['content-disposition']
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || 'test-export.pdf';

      const pdfPath = path.join('uploads', pdfFilename);
      fs.writeFileSync(pdfPath, pdfResponse.data);
      console.log(`   ✅ PDF exported successfully: ${pdfPath}`);
      console.log(`   📄 File size: ${(pdfResponse.data.length / 1024).toFixed(2)} KB`);
    } catch (e) {
      console.error('   PDF export error:', e.message);
      if (e.response) {
        console.error('   Response status:', e.response.status);
        console.error('   Response data:', e.response.data?.toString?.() || e.response.data);
      }
      return;
    }

    // ===== TEST 3: AI Suggestions =====
    console.log('\n3️⃣  Testing AI Suggestions...');
    try {
      const suggestionsResponse = await axios.post(`${BASE_URL}/suggestions`, boqData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      console.log('   ✅ AI Suggestions generated successfully\n');
      console.log('📋 AI SUGGESTIONS:\n');
      console.log(suggestionsResponse.data.suggestions);

      console.log('\n💰 COST ANALYSIS:\n');
      console.log(JSON.stringify(suggestionsResponse.data.costAnalysis, null, 2));
    } catch (e) {
      console.error('   Suggestions error:', e.message);
      if (e.response) {
        console.error('   Response status:', e.response.status);
        console.error('   Response data:', e.response.data);
      }
      return;
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testCompleteWorkflow();
