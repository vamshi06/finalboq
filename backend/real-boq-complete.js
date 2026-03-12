#!/usr/bin/env node

// COMPLETE REAL BOQ DATA - ALL ITEMS FROM EXCEL
const completeBoqData = {
  meta: {
    projectType: '4BHK Premium Apartment - Thane',
    areaSqft: 1673,
    qualityTier: 'premium'
  },
  boqLines: [
    // ==================== CIVIL (19 items) ====================
    { itemName: 'Demolition', itemId: 'CIVIL-001', dept: 'Civil', category: 'walls', itemDetails: 'NA', description: 'Demolition', uom: 'sq.ft', elemantraRate: 250, qty: 208, elemantraAmount: 42250, location: 'Entire kitchen this includes below platform' },
    { itemName: 'Making', itemId: 'CIVIL-002', dept: 'Civil', category: 'walls', itemDetails: 'NA', description: 'Making', uom: 'sq.ft', elemantraRate: 350, qty: 54, elemantraAmount: 18900, location: 'Kitchen Window & door frame' },
    { itemName: 'Kitchen Platform', itemId: 'CIVIL-003', dept: 'Civil', category: 'kitchen platform', itemDetails: 'NA', description: 'includes marble verticals, base marble, moulding, cutting etc, also includes floor bedding with marble', uom: 'sq.ft', elemantraRate: 3000, qty: 25, elemantraAmount: 75000, location: 'Kitchen platform' },
    { itemName: 'Utility Platform', itemId: 'CIVIL-004', dept: 'Civil', category: 'utility platform', itemDetails: 'NA', description: 'includes marble verticals, base marble, moulding, cutting etc, also includes floor bedding with marble', uom: 'sq.ft', elemantraRate: 3000, qty: 9, elemantraAmount: 27000, location: 'Utility platform' },
    { itemName: 'Bathroom Tile', itemId: 'CIVIL-005', dept: 'Civil', category: 'Bathroom Tile', itemDetails: '4x2 tile', description: 'Laying of Wall tiles of approved colour and size as per drawing', uom: 'sq.ft', elemantraRate: 150, qty: 936, elemantraAmount: 140400, location: '4 Bathroom Tile' },
    { itemName: 'Plaster', itemId: 'CIVIL-006', dept: 'Civil', category: 'Plaster', itemDetails: '', description: 'Providing and laying 12-25 mm thick cement plaster', uom: 'sq.ft', elemantraRate: 125, qty: 936, elemantraAmount: 117000, location: '4 Bathroom Tile' },
    { itemName: 'Bathroom Window Frame', itemId: 'CIVIL-007', dept: 'Civil', category: 'bathroom window frame', itemDetails: 'single patti', description: 'Granite Frame – up to 6 Inches width', uom: 'sq.ft', elemantraRate: 450, qty: 138, elemantraAmount: 62100, location: '4 bathroom window and kitchen window' },
    { itemName: 'Brickbat', itemId: 'CIVIL-008', dept: 'Civil', category: 'brickbat', itemDetails: '', description: 'Brickbat', uom: 'sq.ft', elemantraRate: 200, qty: 160, elemantraAmount: 32000, location: '4 bathroom floor' },
    { itemName: 'Waterproofing', itemId: 'CIVIL-009', dept: 'Civil', category: 'waterproofing', itemDetails: '2 coat', description: 'Waterproofing', uom: 'sq.ft', elemantraRate: 250, qty: 160, elemantraAmount: 40000, location: '4 bathroom floor' },
    { itemName: 'Bathroom Floor Tile', itemId: 'CIVIL-010', dept: 'Civil', category: 'Bathroom floor tile', itemDetails: '', description: 'Laying of Floor tiles', uom: 'sq.ft', elemantraRate: 150, qty: 160, elemantraAmount: 24000, location: '4 bathroom floor' },
    { itemName: 'Vanity Counter', itemId: 'CIVIL-011', dept: 'Civil', category: 'vanity counter', itemDetails: '', description: 'Vanity counter', uom: 'ls', elemantraRate: 8000, qty: 4, elemantraAmount: 32000, location: 'Various' },
    { itemName: 'Ledge', itemId: 'CIVIL-012', dept: 'Civil', category: 'ledge', itemDetails: '', description: 'Ledge', uom: 'la', elemantraRate: 5000, qty: 4, elemantraAmount: 20000, location: 'Various' },
    { itemName: 'Plain Tile', itemId: 'CIVIL-013', dept: 'Civil', category: 'plain tile', itemDetails: '', description: 'Plain tile', uom: 'sq.ft', elemantraRate: 120, qty: 350, elemantraAmount: 42000, location: 'tile behind utility and below platform' },
    { itemName: 'Marble Wardrobe in Utility Area', itemId: 'CIVIL-014', dept: 'Civil', category: 'marble wardrobe in utility area', itemDetails: '', description: 'Marble wardrobe in utility area', uom: 'sq.ft', elemantraRate: 950, qty: 102, elemantraAmount: 96900, location: 'Utility area' },
    { itemName: 'Base Coat', itemId: 'CIVIL-015', dept: 'Civil', category: '', itemDetails: '', description: 'Base coat', uom: 'sq.ft', elemantraRate: 300, qty: 150, elemantraAmount: 45000, location: 'Various' },
    { itemName: 'Marble Polish', itemId: 'CIVIL-016', dept: 'Civil', category: 'Marble Polish', itemDetails: '', description: 'Marble Polish', uom: 'sq.ft', elemantraRate: 85, qty: 2500, elemantraAmount: 212500, location: 'Various' },
    { itemName: 'Niche', itemId: 'CIVIL-017', dept: 'Civil', category: 'Niche', itemDetails: '', description: 'Niche', uom: 'nos', elemantraRate: 5000, qty: 5, elemantraAmount: 25000, location: 'Various' },
    { itemName: 'Ledge (Rft)', itemId: 'CIVIL-018', dept: 'Civil', category: 'Ledge', itemDetails: '', description: 'Ledge', uom: 'rft', elemantraRate: 2000, qty: 15, elemantraAmount: 30000, location: 'Various' },
    { itemName: 'Bathroom Door Frame', itemId: 'CIVIL-019', dept: 'Civil', category: 'Bathroom door frame', itemDetails: '', description: 'Bathroom door frame', uom: 'rft', elemantraRate: 550, qty: 80, elemantraAmount: 44000, location: 'Various' },

    // ==================== PLUMBING (4 items) ====================
    { itemName: 'Bathroom Plumbing - Samar', itemId: 'PL-001', dept: 'Plumbing', category: 'Bathroom Plumbing', itemDetails: 'CP fitting work 1 Basin +cp fittings+Ceiling shower', description: 'cp fiting and sanitary ware fixing in a bathroom', uom: 'per bathroom', elemantraRate: 35000, qty: 1, elemantraAmount: 35000, location: 'Samar toilet' },
    { itemName: 'Bathroom Plumbing - Master & Ranbeer', itemId: 'PL-002', dept: 'Plumbing', category: 'Bathroom Plumbing', itemDetails: 'Ceiling shower+body jets+c.p fittings', description: 'cp fiting and sanitary ware fixing in a bathroom', uom: 'per bathroom', elemantraRate: 45000, qty: 1, elemantraAmount: 90000, location: 'Master & Ranbeer' },
    { itemName: 'Bathroom Plumbing - Mother', itemId: 'PL-003', dept: 'Plumbing', category: 'Bathroom Plumbing', itemDetails: 'CP fitting work 1 Basin +cp fittings+Ceiling shower', description: 'cp fiting and sanitary ware fixing in a bathroom', uom: 'per bathroom', elemantraRate: 35000, qty: 1, elemantraAmount: 35000, location: 'Mother toilet' },
    { itemName: 'Kitchen Plumbing', itemId: 'PL-004', dept: 'Plumbing', category: 'Kitchen Plumbing', itemDetails: '3 sink+dishwasher+washing machine', description: 'all plumbing concealed wall and floor CPVC and UPVC pipes', uom: 'per kitchen', elemantraRate: 20000, qty: 1, elemantraAmount: 20000, location: 'Kitchen & Utility' },

    // ==================== ELECTRICAL (1 item) ====================
    { itemName: 'Electrical Wiring', itemId: 'E-001', dept: 'Electrical', category: '5A Switch socket, Light points, AC point, Fan point, Circuit wiring, DB Dressing', itemDetails: 'new 5A Switch & Socket, light points, 15A, AC point, fan point', description: 'NOTE - The rates include fixing of switch/socket in position', uom: 'sqft', elemantraRate: 350, qty: 1673, elemantraAmount: 585550, location: 'All areas' },

    // ==================== POP/FALSE CEILING (5 items) ====================
    { itemName: 'Gypsum Board Ceiling', itemId: 'FC-001', dept: 'POP', category: 'Gypsum Board Ceiling', itemDetails: 'Saint Gobain/Gyproc Board + local A Grade channel', description: '12.5mm thick gypsum board', uom: 'sqft', elemantraRate: 120, qty: 1447, elemantraAmount: 174000, location: 'All areas' },
    { itemName: 'Gypsum Board Cove', itemId: 'FC-002', dept: 'POP', category: 'Gypsum Board Cove', itemDetails: 'Gypsum cove', description: '12.5mm thick gypsum board', uom: 'rft', elemantraRate: 120, qty: 800, elemantraAmount: 96000, location: 'All areas' },
    { itemName: 'Hilux Board Ceiling', itemId: 'FC-003', dept: 'POP', category: 'Hilux Board ceiling', itemDetails: 'Hilux Board + local A Grade channel', description: '8mm Ramco hilux board', uom: 'sqft', elemantraRate: 200, qty: 226, elemantraAmount: 40000, location: 'Toilets' },
    { itemName: 'POP Punning', itemId: 'FC-004', dept: 'POP', category: 'POP Punning', itemDetails: 'POP Punning (Plum) 12-25mm thick', description: 'Providing and applying 12-25 mm thick POP punning', uom: 'sqft', elemantraRate: 45, qty: 1000, elemantraAmount: 112500, location: 'Patch work wall punning' },
    { itemName: 'Light Gala Cutting', itemId: 'FC-005', dept: 'POP', category: 'Light Gala cutting', itemDetails: 'NA', description: 'NA', uom: 'nos', elemantraRate: 100, qty: 200, elemantraAmount: 20000, location: 'All areas' },

    // ==================== CARPENTRY - LIVING ROOM (6 items) ====================
    { itemName: 'Main Door', itemId: 'CP-001', dept: 'Carpentry', category: 'Main Door', itemDetails: 'Veneer Finish', description: 'MR ply +both side Veneer finish', uom: 'nos', elemantraRate: 65000, qty: 1, elemantraAmount: 65000, location: 'Living area' },
    { itemName: 'Ply Door Frame', itemId: 'CP-002', dept: 'Carpentry', category: 'Ply Door Frame', itemDetails: 'Veneer Finish', description: 'MR ply + finish veneer from both sides', uom: 'rft', elemantraRate: 750, qty: 22, elemantraAmount: 16500, location: 'Living area' },
    { itemName: 'Carcass Storage - Laminate', itemId: 'CP-003', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 1800, qty: 89.25, elemantraAmount: 160650, location: 'Living area' },
    { itemName: 'Panelling with Mirror', itemId: 'CP-004', dept: 'Carpentry', category: 'Panelling with mirror', itemDetails: 'Mirror Finish', description: 'Mirror Finish', uom: 'sqft', elemantraRate: 650, qty: 51, elemantraAmount: 33150, location: 'Living area' },
    { itemName: 'Dining Console - MDF', itemId: 'CP-005', dept: 'Carpentry', category: 'Dining Console', itemDetails: 'MDF Finish', description: 'MDF Finish', uom: 'sqft', elemantraRate: 3000, qty: 15, elemantraAmount: 45000, location: 'Living area' },
    { itemName: 'Panelling with Framing - Passage', itemId: 'CP-006', dept: 'Carpentry', category: 'Panelling with framing', itemDetails: 'Veneer Finish', description: 'Mr Ply+ply framing+Finish Veneer + Onyx', uom: 'sqft', elemantraRate: 1800, qty: 187, elemantraAmount: 336600, location: 'Passage' },
    { itemName: 'Console - Onyx', itemId: 'CP-007', dept: 'Carpentry', category: 'Console', itemDetails: 'Onyx', description: 'Console', uom: 'ls', elemantraRate: 35000, qty: 1, elemantraAmount: 35000, location: 'Living area' },

    // ==================== CARPENTRY - MODULAR KITCHEN (7 items) ====================
    { itemName: 'Kitchen Undercounter - Acrylic', itemId: 'CP-008', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Acrylic Finish', description: 'Marine ply + Inside laminate + Acrylic Finish', uom: 'sqft', elemantraRate: 2700, qty: 50, elemantraAmount: 135000, location: 'Modular Kitchen' },
    { itemName: 'Kitchen Overhead - Acrylic', itemId: 'CP-009', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Acrylic Finish', description: 'Marine ply + Inside laminate + Acrylic Finish', uom: 'sqft', elemantraRate: 2700, qty: 110, elemantraAmount: 297000, location: 'Modular Kitchen' },
    { itemName: 'Pantry Storage - Acrylic', itemId: 'CP-010', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Acrylic Finish', description: 'Marine ply + Inside laminate + Acrylic Finish', uom: 'sqft', elemantraRate: 2700, qty: 42, elemantraAmount: 113400, location: 'Modular Kitchen' },
    { itemName: 'Kitchen Basket Tandem', itemId: 'CP-011', dept: 'Carpentry', category: 'Kitchen Basket', itemDetails: 'tandem', description: 'Basket + Channel+Fitting charges', uom: 'nos', elemantraRate: 8000, qty: 14, elemantraAmount: 112000, location: 'Modular Kitchen' },
    { itemName: 'Wicker Basket', itemId: 'CP-012', dept: 'Carpentry', category: 'Wicker basket', itemDetails: 'Wicker basket', description: 'Basket + Channel+Fitting charges', uom: 'nos', elemantraRate: 6000, qty: 2, elemantraAmount: 12000, location: 'Modular Kitchen' },
    { itemName: 'Back Painted Glass', itemId: 'CP-013', dept: 'Carpentry', category: 'Back Painted Glass', itemDetails: '', description: 'Back Painted Glass', uom: 'sqft', elemantraRate: 950, qty: 30, elemantraAmount: 28500, location: 'Modular Kitchen' },
    { itemName: 'Kitchen Sliding Door', itemId: 'CP-014', dept: 'Carpentry', category: 'Kitchen Sliding door', itemDetails: 'Flutted glass finish', description: 'Modular Kitchen', uom: 'sqft', elemantraRate: 1650, qty: 22.5, elemantraAmount: 37125, location: 'Kitchen' },

    // ==================== CARPENTRY - UTILITY (3 items) ====================
    { itemName: 'Utility Undercounter', itemId: 'CP-015', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Laminate Finish', description: 'Marine ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 1800, qty: 13.75, elemantraAmount: 54000, location: 'Utility' },
    { itemName: 'Utility Shutters', itemId: 'CP-016', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Laminate Finish', description: 'Marine ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 650, qty: 102, elemantraAmount: 66300, location: 'Utility' },
    { itemName: 'Washing Machine Storage', itemId: 'CP-017', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Laminate Finish', description: 'Marine ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 1800, qty: 20, elemantraAmount: 36000, location: 'Utility' },

    // ==================== CARPENTRY - MOTHER'S BEDROOM (9 items) ====================
    { itemName: 'Mother Bed', itemId: 'CP-018', dept: 'Carpentry', category: 'Bed', itemDetails: 'Laminate Finish', description: 'MR ply panelling + Foam material', uom: 'sqft', elemantraRate: 1800, qty: 35.75, elemantraAmount: 70200, location: 'Mother Bedroom' },
    { itemName: 'Mother Headboard', itemId: 'CP-019', dept: 'Carpentry', category: 'Headboard', itemDetails: 'Fabric Finish', description: 'MR ply panelling + Foam material', uom: 'sqft', elemantraRate: 1300, qty: 40.5, elemantraAmount: 52650, location: 'Mother Bedroom' },
    { itemName: 'Mother Bed Side Table', itemId: 'CP-020', dept: 'Carpentry', category: 'Bed side table', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'nos', elemantraRate: 20000, qty: 2, elemantraAmount: 40000, location: 'Mother Bedroom' },
    { itemName: 'Mother Dresser', itemId: 'CP-021', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 1800, qty: 7, elemantraAmount: 12600, location: 'Mother Bedroom' },
    { itemName: 'Mother Wardrobe', itemId: 'CP-022', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 1800, qty: 45, elemantraAmount: 81000, location: 'Mother Bedroom' },
    { itemName: 'Mother Mirror', itemId: 'CP-023', dept: 'Carpentry', category: 'Panelling with framing', itemDetails: 'Mirror Finish', description: 'MR ply + ply framing + 5mm clear mirror', uom: 'sqft', elemantraRate: 750, qty: 14, elemantraAmount: 10500, location: 'Mother Bedroom' },
    { itemName: 'Mother Wall Panel', itemId: 'CP-024', dept: 'Carpentry', category: 'Panelling with framing', itemDetails: 'Laminate Finish', description: 'MR ply + ply framing + finish laminate', uom: 'sqft', elemantraRate: 950, qty: 45, elemantraAmount: 42750, location: 'Mother Bedroom' },
    { itemName: 'Mother Wardrobe Full', itemId: 'CP-025', dept: 'Carpentry', category: 'Wardrobe', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 1800, qty: 90, elemantraAmount: 162000, location: 'Mother Bedroom' },
    { itemName: 'Mother Pelmet', itemId: 'CP-026', dept: 'Carpentry', category: 'Panelling with framing', itemDetails: 'MDF', description: 'MR ply + ply framing + 12mm MDF', uom: 'sqft', elemantraRate: 600, qty: 20, elemantraAmount: 12000, location: 'Mother Bedroom' },

    // ==================== CARPENTRY - SAMAR'S BEDROOM (12 items) ====================
    { itemName: 'Samar Bed', itemId: 'CP-027', dept: 'Carpentry', category: 'Bed', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 2200, qty: 39, elemantraAmount: 85800, location: 'Samar Bedroom' },
    { itemName: 'Samar Headboard', itemId: 'CP-028', dept: 'Carpentry', category: 'Headboard', itemDetails: 'Fabric Finish', description: 'MR ply panelling + Foam material', uom: 'sqft', elemantraRate: 1300, qty: 27, elemantraAmount: 35100, location: 'Samar Bedroom' },
    { itemName: 'Samar Bed Side Table', itemId: 'CP-029', dept: 'Carpentry', category: 'Bed side table', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'nos', elemantraRate: 20000, qty: 2, elemantraAmount: 40000, location: 'Samar Bedroom' },
    { itemName: 'Samar Study Table', itemId: 'CP-030', dept: 'Carpentry', category: 'Study Table', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'rft', elemantraRate: 4500, qty: 4.5, elemantraAmount: 20250, location: 'Samar Bedroom' },
    { itemName: 'Samar Overhead Storage', itemId: 'CP-031', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 1800, qty: 24.75, elemantraAmount: 44550, location: 'Samar Bedroom' },
    { itemName: 'Samar Bookshelf', itemId: 'CP-032', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 1800, qty: 35, elemantraAmount: 63000, location: 'Samar Bedroom' },
    { itemName: 'Samar Mirror', itemId: 'CP-033', dept: 'Carpentry', category: 'Panelling with framing', itemDetails: 'Mirror Finish', description: 'MR ply + ply framing + 5mm clear mirror', uom: 'sqft', elemantraRate: 750, qty: 9, elemantraAmount: 6750, location: 'Samar Bedroom' },
    { itemName: 'Samar Dresser', itemId: 'CP-034', dept: 'Carpentry', category: 'Dresser', itemDetails: 'Laminate Finish', description: 'MRply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 1800, qty: 0, elemantraAmount: 0, location: 'Samar Bedroom' },
    { itemName: 'Samar Wall Panel', itemId: 'CP-035', dept: 'Carpentry', category: 'Panelling with framing', itemDetails: 'Laminate Finish', description: 'MR ply + ply framing + finish laminate', uom: 'sqft', elemantraRate: 650, qty: 0, elemantraAmount: 0, location: 'Samar Bedroom' },
    { itemName: 'Samar Wardrobe 1', itemId: 'CP-036', dept: 'Carpentry', category: 'Wardrobe', itemDetails: 'Back painted', description: 'MR ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 2500, qty: 45, elemantraAmount: 112500, location: 'Samar Bedroom' },
    { itemName: 'Samar Wardrobe 2', itemId: 'CP-037', dept: 'Carpentry', category: 'Wardrobe', itemDetails: 'Back painted', description: 'MR ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 2500, qty: 54, elemantraAmount: 135000, location: 'Samar Bedroom' },
    { itemName: 'Samar Pelmet', itemId: 'CP-038', dept: 'Carpentry', category: 'Panelling with framing', itemDetails: 'MDF', description: 'MR ply + ply framing + 12mm MDF', uom: 'sqft', elemantraRate: 600, qty: 20, elemantraAmount: 12000, location: 'Samar Bedroom' },

    // ==================== CARPENTRY - RANBEER'S BEDROOM (12 items) ====================
    { itemName: 'Ranbeer Bed', itemId: 'CP-039', dept: 'Carpentry', category: 'Bed', itemDetails: 'Laminate Finish', description: 'MR ply panelling + Foam material', uom: 'sqft', elemantraRate: 2200, qty: 39, elemantraAmount: 85800, location: 'Ranbeer Bedroom' },
    { itemName: 'Ranbeer Headboard', itemId: 'CP-040', dept: 'Carpentry', category: 'Headboard', itemDetails: 'Fabric Finish', description: 'MR ply panelling + Foam material', uom: 'sqft', elemantraRate: 1300, qty: 27, elemantraAmount: 35100, location: 'Ranbeer Bedroom' },
    { itemName: 'Ranbeer Bed Side Table', itemId: 'CP-041', dept: 'Carpentry', category: 'Bed side table', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'nos', elemantraRate: 20000, qty: 2, elemantraAmount: 40000, location: 'Ranbeer Bedroom' },
    { itemName: 'Ranbeer Study Table', itemId: 'CP-042', dept: 'Carpentry', category: 'Study Table', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'rft', elemantraRate: 4500, qty: 5, elemantraAmount: 22500, location: 'Ranbeer Bedroom' },
    { itemName: 'Ranbeer Overhead Ledges', itemId: 'CP-043', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 650, qty: 32, elemantraAmount: 20800, location: 'Ranbeer Bedroom' },
    { itemName: 'Ranbeer TV Unit', itemId: 'CP-044', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'rft', elemantraRate: 4500, qty: 9, elemantraAmount: 40500, location: 'Ranbeer Bedroom' },
    { itemName: 'Ranbeer TV Panel', itemId: 'CP-045', dept: 'Carpentry', category: 'Panelling with framing', itemDetails: 'Laminate Finish', description: 'MR ply + ply framing + 12mm MDF', uom: 'sqft', elemantraRate: 850, qty: 108, elemantraAmount: 91800, location: 'Ranbeer Bedroom' },
    { itemName: 'Ranbeer Mirror', itemId: 'CP-046', dept: 'Carpentry', category: 'Panelling with framing', itemDetails: 'Mirror Finish', description: 'MR ply + ply framing + 5mm clear mirror', uom: 'sqft', elemantraRate: 750, qty: 22.5, elemantraAmount: 16875, location: 'Ranbeer Bedroom' },
    { itemName: 'Ranbeer Dresser', itemId: 'CP-047', dept: 'Carpentry', category: 'Dresser', itemDetails: 'Laminate Finish', description: 'MRply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 1800, qty: 31.5, elemantraAmount: 56700, location: 'Ranbeer Bedroom' },
    { itemName: 'Ranbeer Wall Panel', itemId: 'CP-048', dept: 'Carpentry', category: 'Panelling with framing', itemDetails: 'Laminate Finish', description: 'MR ply + ply framing + finish laminate', uom: 'sqft', elemantraRate: 1500, qty: 81, elemantraAmount: 121500, location: 'Ranbeer Bedroom' },
    { itemName: 'Ranbeer Wardrobe', itemId: 'CP-049', dept: 'Carpentry', category: 'Wardrobe', itemDetails: 'Tinted Glass', description: 'MR ply + Inside laminate + Profile section for glass', uom: 'sqft', elemantraRate: 2800, qty: 58.5, elemantraAmount: 163800, location: 'Ranbeer Bedroom' },
    { itemName: 'Ranbeer Pelmet', itemId: 'CP-050', dept: 'Carpentry', category: 'Panelling with framing', itemDetails: 'MDF', description: 'MR ply + ply framing + 12mm MDF', uom: 'sqft', elemantraRate: 600, qty: 20, elemantraAmount: 12000, location: 'Ranbeer Bedroom' },

    // ==================== CARPENTRY - MASTER BEDROOM (11 items) ====================
    { itemName: 'Master Bed', itemId: 'CP-051', dept: 'Carpentry', category: 'Bed', itemDetails: 'Fabric Finish', description: 'MR ply panelling + Foam material', uom: 'sqft', elemantraRate: 2200, qty: 39, elemantraAmount: 85800, location: 'Master Bedroom' },
    { itemName: 'Master Headboard', itemId: 'CP-052', dept: 'Carpentry', category: 'Headboard', itemDetails: 'Fabric Finish', description: 'MR ply panelling + Foam material', uom: 'sqft', elemantraRate: 2000, qty: 40.5, elemantraAmount: 81000, location: 'Master Bedroom' },
    { itemName: 'Master Bed Side Table', itemId: 'CP-053', dept: 'Carpentry', category: 'Bed side table', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'nos', elemantraRate: 20000, qty: 2, elemantraAmount: 40000, location: 'Master Bedroom' },
    { itemName: 'Master Bed Back Wall', itemId: 'CP-054', dept: 'Carpentry', category: 'Panelling with framing', itemDetails: 'CNC Finish', description: 'MR ply + ply framing + 5mm clear mirror', uom: 'sqft', elemantraRate: 1500, qty: 108, elemantraAmount: 162000, location: 'Master Bedroom' },
    { itemName: 'Master Dresser', itemId: 'CP-055', dept: 'Carpentry', category: 'Dresser', itemDetails: 'Mirror Finish', description: 'Mirror + PVD', uom: 'sqft', elemantraRate: 750, qty: 21, elemantraAmount: 15750, location: 'Master Bedroom' },
    { itemName: 'Master TV Panelling', itemId: 'CP-056', dept: 'Carpentry', category: 'Panelling with framing', itemDetails: 'Laminate Finish', description: 'MR ply + ply framing + finish laminate', uom: 'sqft', elemantraRate: 800, qty: 108, elemantraAmount: 86400, location: 'Master Bedroom' },
    { itemName: 'Master Console', itemId: 'CP-057', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 1800, qty: 0, elemantraAmount: 0, location: 'Master Bedroom' },
    { itemName: 'Master TV Unit', itemId: 'CP-058', dept: 'Carpentry', category: 'TV unit', itemDetails: 'MDF Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'rft', elemantraRate: 4500, qty: 9, elemantraAmount: 40500, location: 'Master Bedroom' },
    { itemName: 'Master PVD on Bed Back', itemId: 'CP-059', dept: 'Carpentry', category: 'PVD on bed back', itemDetails: '', description: 'PVD on bed back', uom: 'ls', elemantraRate: 40000, qty: 1, elemantraAmount: 40000, location: 'Master Bedroom' },
    { itemName: 'Master Wardrobe', itemId: 'CP-060', dept: 'Carpentry', category: 'Wardrobe', itemDetails: 'Mirror Finish + Fluted Laminate', description: 'MR ply + Inside laminate + Profile section for glass', uom: 'sqft', elemantraRate: 2400, qty: 81, elemantraAmount: 194400, location: 'Master Bedroom' },
    { itemName: 'Master Pelmet', itemId: 'CP-061', dept: 'Carpentry', category: 'Panelling with framing', itemDetails: 'MDF', description: 'MR ply + ply framing + 12mm MDF', uom: 'sqft', elemantraRate: 600, qty: 20, elemantraAmount: 12000, location: 'Master Bedroom' },

    // ==================== CARPENTRY - BATHROOMS (9 items) ====================
    { itemName: 'Master Toilet Vanity', itemId: 'CP-062', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 1800, qty: 10, elemantraAmount: 18000, location: 'Master Toilet' },
    { itemName: 'Master Mirror Panelling', itemId: 'CP-063', dept: 'Carpentry', category: 'Mirror panelling', itemDetails: 'Mirror finish', description: 'MRply + ply framing + finish mirror', uom: 'ls', elemantraRate: 7000, qty: 1, elemantraAmount: 7000, location: 'Master Toilet' },
    { itemName: 'Master Glass Partition', itemId: 'CP-064', dept: 'Carpentry', category: 'Glass Partition', itemDetails: '12mm toughned glass', description: 'Glass Partition', uom: 'sqft', elemantraRate: 950, qty: 45, elemantraAmount: 42750, location: 'Master Toilet' },
    { itemName: 'Mother Toilet Vanity', itemId: 'CP-065', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 1800, qty: 6, elemantraAmount: 10800, location: 'Mother Toilet' },
    { itemName: 'Mother Mirror Panelling', itemId: 'CP-066', dept: 'Carpentry', category: 'Mirror panelling', itemDetails: 'Mirror finish', description: 'MRply + ply framing + finish mirror', uom: 'ls', elemantraRate: 7000, qty: 1, elemantraAmount: 7000, location: 'Mother Toilet' },
    { itemName: 'Mother Glass Partition', itemId: 'CP-067', dept: 'Carpentry', category: 'Glass Partition', itemDetails: '12mm toughned glass', description: 'Glass Partition', uom: 'sqft', elemantraRate: 950, qty: 45, elemantraAmount: 42750, location: 'Mother Toilet' },
    { itemName: 'Samar Toilet Vanity', itemId: 'CP-068', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 1800, qty: 6, elemantraAmount: 10800, location: 'Samar Toilet' },
    { itemName: 'Samar Mirror Panelling', itemId: 'CP-069', dept: 'Carpentry', category: 'Mirror panelling', itemDetails: 'Mirror finish', description: 'MRply + ply framing + finish mirror', uom: 'ls', elemantraRate: 7000, qty: 1, elemantraAmount: 7000, location: 'Samar Toilet' },
    { itemName: 'Samar Glass Partition', itemId: 'CP-070', dept: 'Carpentry', category: 'Glass Partition', itemDetails: '12mm toughned glass', description: 'Glass Partition', uom: 'sqft', elemantraRate: 950, qty: 45, elemantraAmount: 42750, location: 'Samar Toilet' },

    // ==================== CARPENTRY - RANBEER TOILET (3 items) ====================
    { itemName: 'Ranbeer Toilet Vanity', itemId: 'CP-071', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Laminate Finish', description: 'MR ply + Inside laminate + finish laminate', uom: 'sqft', elemantraRate: 1800, qty: 6, elemantraAmount: 10800, location: 'Ranbeer Toilet' },
    { itemName: 'Ranbeer Mirror Panelling', itemId: 'CP-072', dept: 'Carpentry', category: 'Mirror panelling', itemDetails: 'Mirror finish', description: 'MRply + ply framing + finish mirror', uom: 'ls', elemantraRate: 7000, qty: 1, elemantraAmount: 7000, location: 'Ranbeer Toilet' },
    { itemName: 'Ranbeer Glass Partition', itemId: 'CP-073', dept: 'Carpentry', category: 'Glass Partition', itemDetails: '12mm toughned glass', description: 'Glass Partition', uom: 'sqft', elemantraRate: 950, qty: 58.5, elemantraAmount: 55575, location: 'Ranbeer Toilet' },

    // ==================== CARPENTRY - DOORS & BALCONY (5 items) ====================
    { itemName: 'Drawers', itemId: 'CP-074', dept: 'Carpentry', category: 'Drawers', itemDetails: '', description: 'Drawers', uom: 'nos', elemantraRate: 7000, qty: 30, elemantraAmount: 210000, location: 'Various' },
    { itemName: 'Door Laminate Change', itemId: 'CP-075', dept: 'Carpentry', category: 'Doors', itemDetails: 'Veneer Finish', description: 'Door laminate change', uom: 'nos', elemantraRate: 40000, qty: 12, elemantraAmount: 480000, location: 'Various' },
    { itemName: 'Balcony Ceiling', itemId: 'CP-076', dept: 'Carpentry', category: 'Ceiling', itemDetails: '', description: 'Ceiling', uom: 'sqft', elemantraRate: 750, qty: 138, elemantraAmount: 103500, location: 'Balcony' },
    { itemName: 'Balcony Panelling Left 1', itemId: 'CP-077', dept: 'Carpentry', category: 'Ceiling', itemDetails: '', description: 'Panelling - Left side', uom: 'sqft', elemantraRate: 750, qty: 49.5, elemantraAmount: 37125, location: 'Balcony' },
    { itemName: 'Balcony Panelling Left 2', itemId: 'CP-078', dept: 'Carpentry', category: 'Ceiling', itemDetails: '', description: 'Panelling - Left side', uom: 'sqft', elemantraRate: 750, qty: 49.5, elemantraAmount: 37125, location: 'Balcony' },

    // ==================== CARPENTRY - ADDITIONAL (3 items) ====================
    { itemName: 'Samar Toilet Vanity Extra', itemId: 'CP-079', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Laminate Finish', description: 'MR ply+ internal laminate + external laminate', uom: 'sqft', elemantraRate: 1800, qty: 15, elemantraAmount: 27000, location: 'Samar Toilet' },
    { itemName: 'Mother Toilet Vanity Extra', itemId: 'CP-080', dept: 'Carpentry', category: 'Carcass Storage', itemDetails: 'Laminate Finish', description: 'MR ply+ internal laminate + external laminate', uom: 'sqft', elemantraRate: 1800, qty: 15, elemantraAmount: 27000, location: 'Mother Toilet' },
    { itemName: 'Ply Margin on All Doors', itemId: 'CP-081', dept: 'Carpentry', category: 'Ply margin', itemDetails: 'MR ply 6mm', description: 'MR ply 6mm adding on all doors', uom: 'sqft', elemantraRate: 320, qty: 150, elemantraAmount: 48000, location: 'All doors' },

    // ==================== PAINTING (5 items) ====================
    { itemName: 'Ceiling Painting', itemId: 'P-001', dept: 'Painting', category: 'Royal Shyne', itemDetails: '2 Primer + 1 Putty + 2 RLE', description: 'Painting with royal Shyne on ceiling', uom: 'sqft', elemantraRate: 42, qty: 1673, elemantraAmount: 70266, location: 'All areas' },
    { itemName: 'Wall Painting', itemId: 'P-002', dept: 'Painting', category: 'Royal Shyne', itemDetails: '2 Primer + 1 Putty + 2 RLE', description: 'Painting with royal Shyne on walls', uom: 'sqft', elemantraRate: 45, qty: 4183, elemantraAmount: 188212, location: 'All walls' },
    { itemName: 'Texture Paint', itemId: 'P-003', dept: 'Painting', category: 'Texture paint', itemDetails: '2 Primer + 1 Putty + 2 RLE', description: 'Texture paint', uom: 'ls', elemantraRate: 25000, qty: 1, elemantraAmount: 25000, location: 'Walls' },
    { itemName: 'PU Finish', itemId: 'P-004', dept: 'Painting', category: 'PU', itemDetails: 'PU', description: 'PU Finish', uom: 'sqft', elemantraRate: 350, qty: 1300, elemantraAmount: 455000, location: 'Various' },
    { itemName: 'Melamine Polish', itemId: 'P-005', dept: 'Painting', category: 'Polish', itemDetails: 'Melamine', description: 'Melamine Polish', uom: 'sqft', elemantraRate: 120, qty: 2000, elemantraAmount: 240000, location: 'Veneer applications' },

    // ==================== MISCELLANEOUS (3 items) ====================
    { itemName: 'Cleaning', itemId: 'M-001', dept: 'Miscellaneous', category: 'CLEANING', itemDetails: 'NA', description: 'Cleaning', uom: 'ls', elemantraRate: 40000, qty: 1, elemantraAmount: 40000, location: 'All areas' },
    { itemName: 'Debris Removal', itemId: 'M-002', dept: 'Miscellaneous', category: 'DEBRIS REMOVAL', itemDetails: 'NA', description: 'Debris Removal', uom: 'ls', elemantraRate: 120000, qty: 1, elemantraAmount: 120000, location: 'All areas' },
    { itemName: 'Miscellaneous', itemId: 'M-003', dept: 'Miscellaneous', category: 'MISCELLANEOUS', itemDetails: 'NA', description: 'Floor Covering, Doors and Windows Covering', uom: 'ls', elemantraRate: 30000, qty: 1, elemantraAmount: 30000, location: 'All areas' }
  ],
  topazSummary: {
    subtotalBase: 9727454,       // EXACT TOTAL: 1,126,050 + 180,000 + 585,550 + 442,500 + 6,224,875 + 978,479 + 190,000
    gstPercent: 18,
    gstAmount: 1750941,          // 18% of 9,727,454
    grandTotal: 11478395,        // Subtotal + GST
    costPerSqft: 5813,           // 9,727,454 / 1673
    consultationFees: 500000,    // Design Consultation Fees (10%)
    contingencyPercent: 5,
    contingencyAmount: 486373    // 5% of subtotal
  },
  packageSummary: {
    rows: [],
    totals: { immovableTotal: 0, movableTotal: 0, combinedTotal: 0 }
  },
  suggestions: []
};

module.exports = completeBoqData;
