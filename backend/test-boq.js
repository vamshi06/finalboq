const http = require('http');

const data = JSON.stringify({
  prompt: "2BHK 900 sqft premium apartment with modular kitchen, false ceiling, AC, and 2 bathrooms"
});

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/boq/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const boq = JSON.parse(responseData);
      console.log('✓ BOQ Generation Successful!');
      console.log(`  Lines: ${boq.boqLines.length}`);
      console.log('\n  BOQ Line Items:');
      boq.boqLines.forEach((line, i) => {
        console.log(`    ${i+1}. ${line.itemName}`);
        console.log(`       Qty: ${line.qty} ${line.uom}, Rate: ₹${line.elemantraRate}`);
        console.log(`       Amount (E): ₹${line.elemantraAmount}, (V): ₹${line.vendorAmount || 0}`);
      });
      console.log(`\n  Subtotal (Elemantra): ₹${boq.topazSummary.subtotalBase}`);
      if (boq.topazSummary.subtotalVendor) {
        console.log(`  Subtotal (Vendor): ₹${boq.topazSummary.subtotalVendor}`);
      }
      console.log(`  GST (18%): ₹${boq.topazSummary.gstAmount}`);
      console.log(`  Total (Elemantra): ₹${boq.topazSummary.grandTotal}`);
      if (boq.topazSummary.grandTotalVendor) {
        console.log(`  Total (Vendor): ₹${boq.topazSummary.grandTotalVendor}`);
      }
      console.log(`  Cost/Sqft: ₹${boq.topazSummary.costPerSqft}`);
      console.log(`  Suggestions: ${boq.suggestions.length}`);
      console.log(`\n✓ Backend is working!`);
    } catch (e) {
      console.error('Error parsing response:', e.message);
      console.log('Response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error.message);
});

req.write(data);
req.end();
