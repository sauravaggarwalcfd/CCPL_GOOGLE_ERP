/**
 * ============================================================
 * CONFIDENCE CLOTHING — ERP FILE 1B
 * Sheet Structure Setup & Formatting — Factory Master
 * ============================================================
 * Creates all 18 sheets with proper headers, descriptions,
 * formatting, data validation, and tab colors.
 * ============================================================
 */

/* ───────────────────────────────────────────────────────────
   MASTER SETUP — Creates/formats all File 1B sheets
   ─────────────────────────────────────────────────────────── */
function setupAllSheets_1B(ss) {
  setup1B_UserMaster_(ss);
  setup1B_RoleMaster_(ss);
  setup1B_DepartmentMaster_(ss);
  setup1B_DesignationMaster_(ss);
  setup1B_ShiftMaster_(ss);
  setup1B_CustomerMaster_(ss);
  setup1B_ContractorMaster_(ss);
  setup1B_WarehouseMaster_(ss);
  setup1B_StorageBinMaster_(ss);
  setup1B_FactoryMaster_(ss);
  setup1B_MachineMaster_(ss);
  setup1B_MachineCategory_(ss);
  setup1B_AssetMaster_(ss);
  setup1B_MaintenanceSchedule_(ss);
  setup1B_SparePartsMaster_(ss);
  setup1B_ProcessMaster_(ss);
  setup1B_WorkCenterMaster_(ss);
  setup1B_JobworkPartyMaster_(ss);
  setup1B_ItemSupplierRates_(ss);
  setup1B_Presence_(ss);

  // Delete temp sheet created during old-sheet deletion
  deleteTempSheet_(ss);

  Logger.log('All 21 FILE 1B sheets setup complete.');
}

/* ═══════════════════════════════════════════════════════════
   INDIVIDUAL SHEET SETUP FUNCTIONS — FILE 1B
   ═══════════════════════════════════════════════════════════ */

var TAB_1B = '#2C3E50'; // Dark Slate for all File 1B sheets

/* ── 01. USER_MASTER ── */
function setup1B_UserMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.USER_MASTER);
  var headers = [
    '# User ID', 'Full Name', 'Email (Google)', 'Phone',
    '→ Department', '← Dept Name (Auto)', '→ Designation',
    '← Designation Name (Auto)', 'Role', 'Reporting To',
    'Date Joined', 'Status', 'Remarks'
  ];
  var descriptions = [
    'AUTO: USR-001', 'Employee full name', 'Google account email for login',
    'Mobile number', 'FK → DEPARTMENT_MASTER', 'Auto from dept',
    'FK → DESIGNATION_MASTER', 'Auto from designation',
    'SUPER_ADMIN/ADMIN/PURCHASE_MGR/PRODUCTION_MGR/STORE_KEEPER/ACCOUNTS/VIEW_ONLY',
    'Reporting manager User ID', 'DD-MMM-YYYY', 'Active/Inactive', 'Notes'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — USER_MASTER — System Users & Access Roles',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 9, CONFIG.ROLE_LIST);
  setValidation_(sheet, 12, ['Active', 'Inactive']);
}

/* ── 02. DEPARTMENT_MASTER ── */
function setup1B_DepartmentMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.DEPARTMENT_MASTER);
  var headers = [
    '# Dept Code', 'Department Name', 'Head of Department',
    'Location', 'Active', 'Notes'
  ];
  var descriptions = [
    'AUTO: DEPT-001', 'Full department name', 'Department head name',
    'Building/Floor/Area', 'Yes/No', 'Description'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — DEPARTMENT_MASTER — Departments',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 5, ['Yes', 'No']);

  // Pre-populate departments
  var data = [
    ['DEPT-001', 'Production', '', 'Factory Floor', 'Yes', 'Knitting, cutting, sewing'],
    ['DEPT-002', 'Quality Control', '', 'Factory Floor', 'Yes', 'Fabric & garment inspection'],
    ['DEPT-003', 'Warehouse / Stores', '', 'Warehouse', 'Yes', 'Raw material & finished goods storage'],
    ['DEPT-004', 'Purchase', '', 'Office', 'Yes', 'Procurement of RM, trims, consumables'],
    ['DEPT-005', 'Sales & Marketing', '', 'Office', 'Yes', 'Order booking, customer management'],
    ['DEPT-006', 'Accounts & Finance', '', 'Office', 'Yes', 'Billing, payments, GST'],
    ['DEPT-007', 'HR & Admin', '', 'Office', 'Yes', 'Hiring, attendance, compliance'],
    ['DEPT-008', 'Design / Sampling', '', 'Office', 'Yes', 'Product design, sampling'],
    ['DEPT-009', 'Maintenance', '', 'Factory Floor', 'Yes', 'Machine maintenance & repair'],
    ['DEPT-010', 'Dispatch / Logistics', '', 'Warehouse', 'Yes', 'Packing, shipping, transport']
  ];
  sheet.getRange(4, 1, data.length, data[0].length).setValues(data);
}

/* ── 03. DESIGNATION_MASTER ── */
function setup1B_DesignationMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.DESIGNATION_MASTER);
  var headers = [
    '# Designation Code', 'Designation Name', 'Level',
    '→ Department', 'Active', 'Notes'
  ];
  var descriptions = [
    'AUTO: DESG-001', 'Job title', 'Senior/Mid/Junior/Entry',
    'FK → DEPARTMENT_MASTER', 'Yes/No', 'Description'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — DESIGNATION_MASTER — Job Titles',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 3, ['Senior', 'Mid', 'Junior', 'Entry']);
  setValidation_(sheet, 5, ['Yes', 'No']);

  var data = [
    ['DESG-001', 'Managing Director', 'Senior', 'DEPT-007', 'Yes', 'MD / Owner'],
    ['DESG-002', 'Factory Manager', 'Senior', 'DEPT-001', 'Yes', 'Overall factory operations'],
    ['DESG-003', 'Production Supervisor', 'Mid', 'DEPT-001', 'Yes', 'Line supervision'],
    ['DESG-004', 'Machine Operator', 'Entry', 'DEPT-001', 'Yes', 'Knitting machine operator'],
    ['DESG-005', 'QC Inspector', 'Mid', 'DEPT-002', 'Yes', 'Quality checking'],
    ['DESG-006', 'Store Keeper', 'Mid', 'DEPT-003', 'Yes', 'Warehouse management'],
    ['DESG-007', 'Purchase Manager', 'Senior', 'DEPT-004', 'Yes', 'Procurement head'],
    ['DESG-008', 'Accountant', 'Mid', 'DEPT-006', 'Yes', 'Accounts & billing'],
    ['DESG-009', 'Maintenance Technician', 'Mid', 'DEPT-009', 'Yes', 'Machine repair'],
    ['DESG-010', 'Dispatch Incharge', 'Mid', 'DEPT-010', 'Yes', 'Packing & shipping']
  ];
  sheet.getRange(4, 1, data.length, data[0].length).setValues(data);
}

/* ── 04. SHIFT_MASTER ── */
function setup1B_ShiftMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.SHIFT_MASTER);
  var headers = [
    '# Shift Code', 'Shift Name', 'Start Time', 'End Time',
    'Break (Minutes)', 'Working Hours', 'Active', 'Notes'
  ];
  var descriptions = [
    'AUTO: SFT-001', 'Shift label', 'HH:MM format',
    'HH:MM format', 'Total break mins', 'Net working hours',
    'Yes/No', 'Description'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — SHIFT_MASTER — Work Shifts',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 7, ['Yes', 'No']);

  var data = [
    ['SFT-001', 'General Shift', '09:00', '18:00', 60, 8, 'Yes', 'Regular day shift'],
    ['SFT-002', 'Morning Shift', '06:00', '14:00', 30, 7.5, 'Yes', 'Early production shift'],
    ['SFT-003', 'Evening Shift', '14:00', '22:00', 30, 7.5, 'Yes', 'Late production shift'],
    ['SFT-004', 'Night Shift', '22:00', '06:00', 30, 7.5, 'Yes', 'Overnight if needed']
  ];
  sheet.getRange(4, 1, data.length, data[0].length).setValues(data);
}

/* ── 05. CUSTOMER_MASTER ── */
function setup1B_CustomerMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.CUSTOMER_MASTER);
  var headers = [
    '# Customer Code', '⚠ Customer Name', 'Contact Person', 'Phone',
    'Email', 'Address', 'City', 'State', 'GST No', 'PAN',
    '→ Payment Terms', '← Payment Terms Name (Auto)',
    'Credit Limit (₹)', 'Credit Period (Days)', 'Status',
    '⟷ Tags', 'Remarks'
  ];
  var descriptions = [
    'AUTO: CUST-001', 'Company / buyer name', 'Primary contact',
    'Mobile/landline', 'Email address', 'Street address',
    'City', 'State', 'GSTIN', 'PAN number',
    'FK → PAYMENT_TERMS_MASTER (1C)', 'Auto from payment terms',
    'Max credit amount', 'Days allowed', 'Active/Inactive',
    'Multi-select → TAG_MASTER', 'Notes'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — CUSTOMER_MASTER — Buyers & Customers',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 15, ['Active', 'Inactive', 'Blocked']);
}

/* ── 06. CONTRACTOR_MASTER ── */
function setup1B_ContractorMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.CONTRACTOR_MASTER);
  var headers = [
    '# Contractor Code', '⚠ Contractor Name', 'Contact Person', 'Phone',
    'Email', 'Process Type', 'Address', 'City', 'State',
    'GST No', '→ Payment Terms', '← Payment Terms Name (Auto)',
    'Rate Basis', 'Rate Amount (₹)', 'Lead Time (Days)',
    'Active', 'Remarks'
  ];
  var descriptions = [
    'AUTO: CON-001', 'Job work party name', 'Primary contact',
    'Mobile', 'Email', 'Printing/Embroidery/Dyeing/Finishing/Cutting/Sewing',
    'Street address', 'City', 'State', 'GSTIN',
    'FK → PAYMENT_TERMS_MASTER (1C)', 'Auto',
    'Per Piece/Per KG/Per Meter/Lump Sum', '₹ amount',
    'Standard days', 'Active/Inactive', 'Quality notes, capacity'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — CONTRACTOR_MASTER — Job Work Contractors',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 6, ['Printing', 'Embroidery', 'Dyeing', 'Finishing', 'Cutting', 'Sewing', 'Washing', 'Other']);
  setValidation_(sheet, 13, ['Per Piece', 'Per KG', 'Per Meter', 'Lump Sum']);
  setValidation_(sheet, 16, ['Active', 'Inactive']);
}

/* ── 07. WAREHOUSE_MASTER ── */
function setup1B_WarehouseMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.WAREHOUSE_MASTER);
  var headers = [
    '# Warehouse Code', '⚠ Warehouse Name', 'Type', 'Address',
    'Manager', 'Capacity', 'Capacity UOM', 'Active', 'Remarks'
  ];
  var descriptions = [
    'AUTO: WH-001', 'Warehouse label', 'Raw Material/Finished Goods/General/Reject',
    'Location address', 'Warehouse manager name', 'Max capacity value',
    'Sq Ft/Pallets/Units', 'Yes/No', 'Notes'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — WAREHOUSE_MASTER — Warehouse Locations',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 3, ['Raw Material', 'Finished Goods', 'General', 'Reject', 'WIP']);
  setValidation_(sheet, 8, ['Yes', 'No']);

  var data = [
    ['WH-001', 'Main Raw Material Store', 'Raw Material', 'Factory Ground Floor', '', '', 'Sq Ft', 'Yes', 'Fabric, yarn, trims storage'],
    ['WH-002', 'Finished Goods Warehouse', 'Finished Goods', 'Factory First Floor', '', '', 'Sq Ft', 'Yes', 'Ready garments'],
    ['WH-003', 'Reject / Hold Area', 'Reject', 'Factory Ground Floor', '', '', 'Sq Ft', 'Yes', 'QC rejected items'],
    ['WH-004', 'WIP Storage', 'WIP', 'Factory Floor', '', '', 'Sq Ft', 'Yes', 'Work-in-progress items']
  ];
  sheet.getRange(4, 1, data.length, data[0].length).setValues(data);
}

/* ── 08. STORAGE_BIN_MASTER ── */
function setup1B_StorageBinMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.STORAGE_BIN_MASTER);
  var headers = [
    '# Bin Code', '→ Warehouse Code', '← Warehouse Name (Auto)',
    'Bin Name / Label', 'Zone', 'Rack', 'Level', 'Item Type',
    'Active', 'Notes'
  ];
  var descriptions = [
    'AUTO: BIN-001', 'FK → WAREHOUSE_MASTER', 'Auto from warehouse',
    'Physical bin label', 'A/B/C zone', 'Rack number',
    'Shelf level', 'Fabric/Yarn/Trim/Consumable/Packaging/Finished',
    'Yes/No', 'Description'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — STORAGE_BIN_MASTER — Storage Bins within Warehouses',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 8, ['Fabric', 'Yarn', 'Trim', 'Consumable', 'Packaging', 'Finished Goods', 'Mixed']);
  setValidation_(sheet, 9, ['Yes', 'No']);
}

/* ── 09. FACTORY_MASTER ── */
function setup1B_FactoryMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.FACTORY_MASTER);
  var headers = [
    '# Factory Code', '⚠ Factory Name', 'Address', 'City', 'State',
    'Pin Code', 'GST No', 'PAN', 'Contact Person', 'Phone',
    'Email', 'Active', 'Remarks'
  ];
  var descriptions = [
    'AUTO: FAC-001', 'Factory / unit name', 'Street address',
    'City', 'State', 'PIN code', 'GSTIN number', 'PAN number',
    'Factory head', 'Phone number', 'Email', 'Yes/No',
    'Capacity, specialization notes'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — FACTORY_MASTER — Factory Units',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 12, ['Yes', 'No']);

  var data = [
    ['FAC-001', 'Confidence Clothing — Main Unit', '', 'Ludhiana', 'Punjab', '', '', '', 'Saurav Aggarwal', '', '', 'Yes', '12 circular knitting machines']
  ];
  sheet.getRange(4, 1, data.length, data[0].length).setValues(data);
}

/* ── 10. MACHINE_MASTER ── */
function setup1B_MachineMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.MACHINE_MASTER);
  var headers = [
    '# Machine Code', '⚠ Machine Name', '→ Machine Category',
    '← Category Name (Auto)', 'Make / Brand', 'Model',
    'Serial No', 'Diameter (inches)', 'Gauge', 'No. of Feeders',
    'Year Installed', '→ Factory Code', '← Factory Name (Auto)',
    'Location in Factory', 'Status', '⟷ Tags', 'Remarks'
  ];
  var descriptions = [
    'AUTO: MCH-001', 'Machine label', 'FK → MACHINE_CATEGORY',
    'Auto from category', 'Manufacturer', 'Model number',
    'Serial number', 'Machine diameter', 'Needles per inch',
    'Number of feeders', 'Installation year', 'FK → FACTORY_MASTER',
    'Auto from factory', 'Bay/Line/Position',
    'Active/Inactive/Under Maintenance/Decommissioned',
    'Multi-select → TAG_MASTER', 'Capacity, speed notes'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — MACHINE_MASTER — Knitting & Production Machines',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 15, ['Active', 'Inactive', 'Under Maintenance', 'Decommissioned']);
}

/* ── 11. MACHINE_CATEGORY ── */
function setup1B_MachineCategory_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.MACHINE_CATEGORY);
  var headers = [
    '# Category Code', 'Category Name', 'Description', 'Active'
  ];
  var descriptions = [
    'AUTO: MCAT-001', 'Machine type', 'Details about this category', 'Yes/No'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — MACHINE_CATEGORY — Types of Machines',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 4, ['Yes', 'No']);

  var data = [
    ['MCAT-001', 'Circular Knitting Machine', 'Single/double jersey, interlock, rib knitting', 'Yes'],
    ['MCAT-002', 'Flat Knitting Machine', 'Collar, cuff, and rib production', 'Yes'],
    ['MCAT-003', 'Cutting Machine', 'Fabric cutting — band knife, straight knife, round knife', 'Yes'],
    ['MCAT-004', 'Sewing Machine', 'Lockstitch, overlock, flatlock, chain stitch', 'Yes'],
    ['MCAT-005', 'Pressing / Ironing', 'Steam press, flat bed press, form finishing', 'Yes'],
    ['MCAT-006', 'Compactor', 'Fabric compacting / shrinkage control', 'Yes'],
    ['MCAT-007', 'Inspection Machine', 'Fabric inspection table / machine', 'Yes'],
    ['MCAT-008', 'Other', 'Any other machine type', 'Yes']
  ];
  sheet.getRange(4, 1, data.length, data[0].length).setValues(data);
}

/* ── 12. ASSET_MASTER ── */
function setup1B_AssetMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.ASSET_MASTER);
  var headers = [
    '# Asset Code', '⚠ Asset Name', 'Category', '→ Factory Code',
    '← Factory Name (Auto)', 'Location', 'Purchase Date',
    'Purchase Value (₹)', 'Depreciation % / Year', '∑ Current Value (₹)',
    'Warranty Expiry', 'Status', 'Remarks'
  ];
  var descriptions = [
    'AUTO: AST-001', 'Asset description', 'Machine/Furniture/Vehicle/IT/Other',
    'FK → FACTORY_MASTER', 'Auto', 'Physical location',
    'DD-MMM-YYYY', 'Original purchase price', 'Annual depreciation rate',
    'GAS calculated', 'DD-MMM-YYYY', 'Active/Disposed/Under Repair', 'Notes'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — ASSET_MASTER — Company Assets',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 3, ['Machine', 'Furniture', 'Vehicle', 'IT Equipment', 'Other']);
  setValidation_(sheet, 12, ['Active', 'Disposed', 'Under Repair']);
}

/* ── 13. MAINTENANCE_SCHEDULE ── */
function setup1B_MaintenanceSchedule_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.MAINTENANCE_SCHEDULE);
  var headers = [
    '# Schedule Code', '→ Machine Code', '← Machine Name (Auto)',
    'Maintenance Type', 'Frequency', 'Last Done Date', 'Next Due Date',
    'Assigned To', '→ Spare Parts Used', 'Estimated Cost (₹)',
    'Status', 'Notes'
  ];
  var descriptions = [
    'AUTO: MNT-001', 'FK → MACHINE_MASTER', 'Auto from machine',
    'Preventive/Corrective/Overhaul', 'Daily/Weekly/Monthly/Quarterly/Yearly',
    'DD-MMM-YYYY', 'DD-MMM-YYYY', 'Technician name',
    'FK → SPARE_PARTS_MASTER (multi)', 'Estimated maintenance cost',
    'Pending/Completed/Overdue', 'Work done details'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — MAINTENANCE_SCHEDULE — Machine Maintenance',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 4, ['Preventive', 'Corrective', 'Overhaul', 'Emergency']);
  setValidation_(sheet, 5, ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly']);
  setValidation_(sheet, 11, ['Pending', 'Completed', 'Overdue', 'In Progress']);
}

/* ── 14. SPARE_PARTS_MASTER ── */
function setup1B_SparePartsMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.SPARE_PARTS_MASTER);
  var headers = [
    '# Spare Code', '⚠ Spare Part Name', 'Compatible Machines',
    'Part Number', 'UOM', 'Reorder Level', 'Current Stock',
    '→ Supplier Code', '← Supplier Name (Auto)',
    'Cost per Unit (₹)', 'Lead Time (Days)', 'Status', 'Remarks'
  ];
  var descriptions = [
    'AUTO: SPR-001', 'Part description', 'Machine codes (multi-select)',
    'Manufacturer part number', 'PCS/SET/KG', 'Min stock trigger',
    'Available qty', 'FK → SUPPLIER_MASTER (1C)', 'Auto from supplier',
    '₹ per unit', 'Procurement days', 'Active/Inactive/Obsolete', 'Notes'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — SPARE_PARTS_MASTER — Machine Spare Parts',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 5, ['PCS', 'SET', 'KG', 'MTR', 'ROLL']);
  setValidation_(sheet, 12, ['Active', 'Inactive', 'Obsolete']);
}

/* ── 15. PROCESS_MASTER ── */
function setup1B_ProcessMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.PROCESS_MASTER);
  var headers = [
    '# Process Code', '⚠ Process Name', 'Process Type',
    '→ Department', '← Dept Name (Auto)', 'Sequence',
    'Standard Time (min)', 'UOM', 'Active', 'Notes'
  ];
  var descriptions = [
    'AUTO: PRC-001', 'Process step name', 'In-House/Job Work/Both',
    'FK → DEPARTMENT_MASTER', 'Auto from dept', 'Order in production flow',
    'Standard minutes per unit', 'Per PCS/Per KG/Per MTR',
    'Yes/No', 'Description'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — PROCESS_MASTER — Manufacturing Processes',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 3, ['In-House', 'Job Work', 'Both']);
  setValidation_(sheet, 9, ['Yes', 'No']);

  var data = [
    ['PRC-001', 'Knitting', 'In-House', 'DEPT-001', '', 1, '', 'Per KG', 'Yes', 'Circular knitting of fabric'],
    ['PRC-002', 'Dyeing', 'Job Work', 'DEPT-001', '', 2, '', 'Per KG', 'Yes', 'Fabric dyeing — outsourced'],
    ['PRC-003', 'Finishing', 'Job Work', 'DEPT-001', '', 3, '', 'Per KG', 'Yes', 'Compacting, calendering — outsourced'],
    ['PRC-004', 'Cutting', 'In-House', 'DEPT-001', '', 4, '', 'Per PCS', 'Yes', 'Fabric cutting to pattern'],
    ['PRC-005', 'Printing', 'Job Work', 'DEPT-001', '', 5, '', 'Per PCS', 'Yes', 'Screen print, sublimation — outsourced'],
    ['PRC-006', 'Embroidery', 'Job Work', 'DEPT-001', '', 6, '', 'Per PCS', 'Yes', 'Logo/design embroidery — outsourced'],
    ['PRC-007', 'Sewing / Stitching', 'In-House', 'DEPT-001', '', 7, '', 'Per PCS', 'Yes', 'Garment assembly'],
    ['PRC-008', 'Washing', 'Job Work', 'DEPT-001', '', 8, '', 'Per PCS', 'Yes', 'Garment washing — outsourced'],
    ['PRC-009', 'Pressing / Ironing', 'In-House', 'DEPT-001', '', 9, '', 'Per PCS', 'Yes', 'Steam press, finishing'],
    ['PRC-010', 'Quality Check', 'In-House', 'DEPT-002', '', 10, '', 'Per PCS', 'Yes', 'Inline and final inspection'],
    ['PRC-011', 'Packing', 'In-House', 'DEPT-010', '', 11, '', 'Per PCS', 'Yes', 'Folding, tagging, poly bagging'],
    ['PRC-012', 'Dispatch', 'In-House', 'DEPT-010', '', 12, '', 'Per PCS', 'Yes', 'Carton packing, shipping']
  ];
  sheet.getRange(4, 1, data.length, data[0].length).setValues(data);
}

/* ── 16. WORK_CENTER_MASTER ── */
function setup1B_WorkCenterMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.WORK_CENTER_MASTER);
  var headers = [
    '# Work Center Code', '⚠ Work Center Name', '→ Process Code',
    '← Process Name (Auto)', '→ Factory Code', '← Factory Name (Auto)',
    'Location', 'Capacity per Shift', 'Capacity UOM',
    'Active', 'Remarks'
  ];
  var descriptions = [
    'AUTO: WC-001', 'Work center label', 'FK → PROCESS_MASTER',
    'Auto from process', 'FK → FACTORY_MASTER', 'Auto from factory',
    'Bay/Line/Area', 'Output per shift', 'PCS/KG/MTR',
    'Yes/No', 'Equipment, people count'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — WORK_CENTER_MASTER — Work Centers / Stations',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 10, ['Yes', 'No']);
}

/* ── 17. JOBWORK_PARTY_MASTER ── */
function setup1B_JobworkPartyMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.JOBWORK_PARTY_MASTER);
  var headers = [
    '# JW Party Code', '⚠ Party Name', 'Contact Person', 'Phone',
    'Email', 'Address', 'City', 'State', 'GST No',
    'Process Types', '→ Payment Terms', '← Payment Terms Name (Auto)',
    'Rate Basis', 'Rate Amount (₹)', 'Lead Time (Days)',
    'Quality Rating', 'Active', 'Remarks'
  ];
  var descriptions = [
    'AUTO: JWP-001', 'Job work party name', 'Primary contact',
    'Mobile', 'Email', 'Street address', 'City', 'State', 'GSTIN',
    'Dyeing/Printing/Embroidery/Finishing/Washing (multi)',
    'FK → PAYMENT_TERMS_MASTER (1C)', 'Auto',
    'Per Piece/Per KG/Per Meter/Lump Sum', '₹ amount',
    'Standard days', 'A/B/C grade', 'Active/Inactive', 'Capacity, specialization'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — JOBWORK_PARTY_MASTER — Job Work Parties',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 13, ['Per Piece', 'Per KG', 'Per Meter', 'Lump Sum']);
  setValidation_(sheet, 16, ['A', 'B', 'C']);
  setValidation_(sheet, 17, ['Active', 'Inactive']);
}

/* ── 18. ITEM_SUPPLIER_RATES (21 cols — V4 spec) ── */
function setup1B_ItemSupplierRates_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.ITEM_SUPPLIER_RATES);
  var headers = [
    '# Rate Code', '⚠ Item Code', 'Item Master',
    '← Item Name (Auto)', '→ Supplier Code', '← Supplier Name (Auto)',
    'Supplier\'s Item Name', 'Supplier\'s Item Code',
    'Unit Price (excl GST)', 'GST %', '∑ Price incl GST (Auto)',
    'UOM', 'MOQ', 'Lead Time (Days)', 'Priority',
    'Valid From', 'Valid To', '← Last PO Date (Auto)',
    '← Last PO Price (Auto)', 'Active', 'Notes'
  ];
  var descriptions = [
    'AUTO: ISR-00001 (5-digit)', 'FK → any item master', 'TRIM/FABRIC/YARN/WOVEN/CONSUMABLE/PACKAGING',
    'Auto from Item Code + Item Master', 'FK → SUPPLIER_MASTER (1C)', 'Auto from SUPPLIER_MASTER',
    'Supplier\'s catalogue name for POs', 'Supplier\'s own code',
    '₹ per UOM excl GST', '5/12/18', 'Auto: Price × (1 + GST%÷100)',
    'CONE/MTR/PCS/KG/SET/ROLL', 'Minimum order qty', 'PO to factory gate days',
    'Primary/Secondary/Backup/Approved', 'DD-MMM-YYYY', 'Blank = open/active',
    'Auto from PO module', 'Auto from last PO', 'Yes/No',
    'Quality grade, brand restriction'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1B — ITEM_SUPPLIER_RATES — Multi-Supplier Pricing (21 Columns)',
    headers, descriptions, '#004D40'); // Teal tab color

  setValidation_(sheet, 3, ['TRIM', 'FABRIC', 'YARN', 'WOVEN', 'CONSUMABLE', 'PACKAGING']);
  setValidation_(sheet, 12, CONFIG.UOM_LIST);
  setValidation_(sheet, 15, CONFIG.PRIORITY_LIST);
  setValidation_(sheet, 20, ['Yes', 'No']);
}

/* ── 20. ROLE_MASTER ★ NEW V5 ── */
function setup1B_RoleMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.ROLE_MASTER);
  var headers = [
    '🔑 Role Code', 'Role Name', 'Description',
    'Module Access (JSON)', 'Action Rights', 'Export Rights',
    'Field Visibility', 'Active'
  ];
  var descriptions = [
    'AUTO: ROL-001', 'Display name of role',
    'What this role can do',
    'JSON: {"Procurement":true,"Inventory":true,...}',
    'view/create/edit/delete/approve/reject/export/print/import/comment/assign/bulk_edit/override',
    'pdf/sheets/excel/clipboard/print',
    'Fields hidden for this role (JSON)',
    'Yes/No'
  ];
  applyFormat_(sheet,
    'CC ERP FILE 1B — ROLE_MASTER — Role Permission Matrix (V5 RBAC)',
    headers, descriptions, TAB_1B);

  var roleData = [
    ['ROL-001', 'SUPER ADMIN', 'Full access to all 49 sheets and all actions',
     '{"ALL":true}', 'ALL', 'ALL', '{}', 'Yes'],
    ['ROL-002', 'ADMIN', 'All item + factory masters. Read-only finance.',
     '{"Items":true,"Factory":true,"Finance":false}', 'view,create,edit,delete,approve,export,print', 'pdf,sheets,excel,clipboard,print', '{}', 'Yes'],
    ['ROL-003', 'PURCHASE MGR', 'Supplier, ISR, Payment Terms. Read item masters.',
     '{"Procurement":true,"Items":false}', 'view,create,edit,approve,export', 'pdf,sheets,excel,clipboard', '{"WSP":true,"MRP":true}', 'Yes'],
    ['ROL-004', 'PRODUCTION MGR', 'Process, Work Center, Machine. Read items.',
     '{"Production":true,"Items":false}', 'view,create,edit,export', 'pdf,sheets,clipboard', '{"WSP":true,"MRP":true}', 'Yes'],
    ['ROL-005', 'STORE KEEPER', 'Warehouse, Bin, Spare Parts. Read items.',
     '{"Stores":true,"Items":false}', 'view,create,edit', 'pdf,clipboard', '{"WSP":true,"MRP":true}', 'Yes']
  ];
  sheet.getRange(4, 1, roleData.length, roleData[0].length).setValues(roleData);
  setValidation_(sheet, 8, ['Yes', 'No']);
}

/* ── 21. PRESENCE ★ NEW V5 ── */
function setup1B_Presence_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1B.PRESENCE);
  var headers = [
    'Timestamp', 'Email', 'Name', 'Module', 'Page', 'Session ID', 'Action'
  ];
  var descriptions = [
    'Auto: DD-MMM-YYYY HH:mm:ss IST', 'Google account email',
    'Full name from USER_MASTER', 'ERP module (e.g. Items, Procurement)',
    'Page within module', 'Unique session identifier', 'LOGIN / LOGOUT / HEARTBEAT'
  ];
  applyFormat_(sheet,
    'CC ERP FILE 1B — PRESENCE — Active User Session Log (V5 — GAS-written only)',
    headers, descriptions, TAB_1B);

  setValidation_(sheet, 7, ['LOGIN', 'LOGOUT', 'HEARTBEAT']);

  // Protect the sheet — GAS auto-writes only
  var protection = sheet.protect().setDescription('PRESENCE — GAS auto-write only. Do not edit manually.');
  protection.setWarningOnly(true);
}
