/**
 * ============================================================
 * CONFIDENCE CLOTHING — ERP FILE 1C
 * Sheet Structure Setup & Formatting — Finance Master
 * ============================================================
 * Creates all 6 sheets with proper headers, descriptions,
 * formatting, data validation, and tab colors.
 * ============================================================
 */

/* ───────────────────────────────────────────────────────────
   MASTER SETUP — Creates/formats all File 1C sheets
   ─────────────────────────────────────────────────────────── */
function setupAllSheets_1C(ss) {
  setup1C_SupplierMaster_(ss);
  setup1C_PaymentTermsMaster_(ss);
  setup1C_TaxMaster_(ss);
  setup1C_BankMaster_(ss);
  setup1C_CostCenterMaster_(ss);
  setup1C_AccountMaster_(ss);

  // Delete temp sheet created during old-sheet deletion
  deleteTempSheet_(ss);

  Logger.log('All 6 FILE 1C sheets setup complete.');
}

/* ═══════════════════════════════════════════════════════════
   INDIVIDUAL SHEET SETUP FUNCTIONS — FILE 1C
   ═══════════════════════════════════════════════════════════ */

var TAB_1C = '#1A3A4A'; // Dark Steel for all File 1C sheets

/* ── 01. SUPPLIER_MASTER ── */
function setup1C_SupplierMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1C.SUPPLIER_MASTER);
  var headers = [
    '# Supplier Code', '⚠ Supplier Name', 'Contact Person', 'Phone',
    'Email', 'Address', 'City', 'State', 'Pin Code',
    'GST No', 'PAN', 'MSME Registration',
    '→ Payment Terms', '← Payment Terms Name (Auto)',
    'Bank Name', 'Account No', 'IFSC Code',
    'Credit Period (Days)', 'Supply Category',
    'Status', '⟷ Tags', 'Remarks'
  ];
  var descriptions = [
    'AUTO: SUP-001', 'Vendor / supplier company name', 'Primary contact person',
    'Mobile / landline', 'Email address', 'Street address',
    'City', 'State', 'PIN code',
    'GSTIN number', 'PAN number', 'MSME/Udyam registration',
    'FK → PAYMENT_TERMS_MASTER', 'Auto from payment terms',
    'Supplier bank name', 'Bank account number', 'IFSC code',
    'Days for payment', 'Fabric/Yarn/Trim/Consumable/Packaging/Multiple',
    'Active/Inactive/Blocked', 'Multi-select → TAG_MASTER',
    'Quality notes, pricing history'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1C — SUPPLIER_MASTER — All Vendors & Suppliers',
    headers, descriptions, TAB_1C);

  setValidation_(sheet, 19, ['Fabric', 'Yarn', 'Trim', 'Consumable', 'Packaging', 'Multiple', 'Job Work', 'Other']);
  setValidation_(sheet, 20, ['Active', 'Inactive', 'Blocked']);
}

/* ── 02. PAYMENT_TERMS_MASTER ── */
function setup1C_PaymentTermsMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1C.PAYMENT_TERMS_MASTER);
  var headers = [
    '# PT Code', '⚠ Payment Terms Name', 'Credit Days',
    'Advance %', 'Balance %', 'Description', 'Active'
  ];
  var descriptions = [
    'AUTO: PT-001', 'Short name for payment terms', 'Number of credit days',
    'Advance payment percentage', 'Balance due percentage',
    'Full description of terms', 'Yes/No'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1C — PAYMENT_TERMS_MASTER — Payment Terms',
    headers, descriptions, TAB_1C);

  setValidation_(sheet, 7, ['Yes', 'No']);

  var data = [
    ['PT-001', 'Advance 100%', 0, 100, 0, 'Full payment before dispatch', 'Yes'],
    ['PT-002', 'Cash on Delivery', 0, 0, 100, 'Pay on delivery of goods', 'Yes'],
    ['PT-003', 'Net 15 Days', 15, 0, 100, 'Payment due within 15 days of invoice', 'Yes'],
    ['PT-004', 'Net 30 Days', 30, 0, 100, 'Payment due within 30 days of invoice', 'Yes'],
    ['PT-005', 'Net 45 Days', 45, 0, 100, 'Payment due within 45 days of invoice', 'Yes'],
    ['PT-006', 'Net 60 Days', 60, 0, 100, 'Payment due within 60 days of invoice', 'Yes'],
    ['PT-007', '50% Advance + 50% on Delivery', 0, 50, 50, 'Half upfront, half on delivery', 'Yes'],
    ['PT-008', '30% Advance + 70% Net 30', 30, 30, 70, '30% advance, balance in 30 days', 'Yes'],
    ['PT-009', 'Against Proforma Invoice', 0, 100, 0, 'Payment against PI before dispatch', 'Yes'],
    ['PT-010', 'Net 90 Days', 90, 0, 100, 'Payment due within 90 days', 'Yes']
  ];
  sheet.getRange(4, 1, data.length, data[0].length).setValues(data);
}

/* ── 03. TAX_MASTER ── */
function setup1C_TaxMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1C.TAX_MASTER);
  var headers = [
    '# Tax Code', '⚠ Tax Name', 'Tax Type', 'Rate %',
    'Applicable From', 'Description', 'Active'
  ];
  var descriptions = [
    'AUTO: TAX-001', 'Tax name / label', 'GST/CGST/SGST/IGST/TDS/TCS/Cess',
    'Tax rate percentage', 'DD-MMM-YYYY', 'Full description', 'Yes/No'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1C — TAX_MASTER — Tax Codes & Rates',
    headers, descriptions, TAB_1C);

  setValidation_(sheet, 3, ['GST', 'CGST', 'SGST', 'IGST', 'TDS', 'TCS', 'Cess']);
  setValidation_(sheet, 7, ['Yes', 'No']);

  var data = [
    ['TAX-001', 'GST 5%', 'GST', 5, '01-Jul-2017', 'Garments below ₹1000 MRP', 'Yes'],
    ['TAX-002', 'GST 12%', 'GST', 12, '01-Jul-2017', 'Garments ₹1000+ MRP, yarn, labels', 'Yes'],
    ['TAX-003', 'GST 18%', 'GST', 18, '01-Jul-2017', 'Trims, packaging, zippers, buttons', 'Yes'],
    ['TAX-004', 'GST 28%', 'GST', 28, '01-Jul-2017', 'Luxury goods (rarely used)', 'Yes'],
    ['TAX-005', 'CGST 2.5%', 'CGST', 2.5, '01-Jul-2017', 'Central GST component of 5%', 'Yes'],
    ['TAX-006', 'SGST 2.5%', 'SGST', 2.5, '01-Jul-2017', 'State GST component of 5%', 'Yes'],
    ['TAX-007', 'CGST 6%', 'CGST', 6, '01-Jul-2017', 'Central GST component of 12%', 'Yes'],
    ['TAX-008', 'SGST 6%', 'SGST', 6, '01-Jul-2017', 'State GST component of 12%', 'Yes'],
    ['TAX-009', 'CGST 9%', 'CGST', 9, '01-Jul-2017', 'Central GST component of 18%', 'Yes'],
    ['TAX-010', 'SGST 9%', 'SGST', 9, '01-Jul-2017', 'State GST component of 18%', 'Yes'],
    ['TAX-011', 'IGST 5%', 'IGST', 5, '01-Jul-2017', 'Interstate GST 5%', 'Yes'],
    ['TAX-012', 'IGST 12%', 'IGST', 12, '01-Jul-2017', 'Interstate GST 12%', 'Yes'],
    ['TAX-013', 'IGST 18%', 'IGST', 18, '01-Jul-2017', 'Interstate GST 18%', 'Yes'],
    ['TAX-014', 'TDS 1% (194Q)', 'TDS', 1, '01-Jul-2021', 'TDS on purchase of goods above ₹50L', 'Yes'],
    ['TAX-015', 'TDS 2% (194C)', 'TDS', 2, '01-Jul-2017', 'TDS on contractor/JW payments', 'Yes']
  ];
  sheet.getRange(4, 1, data.length, data[0].length).setValues(data);
}

/* ── 04. BANK_MASTER ── */
function setup1C_BankMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1C.BANK_MASTER);
  var headers = [
    '# Bank Code', '⚠ Bank Name', 'Branch', 'Account No',
    'IFSC Code', 'Account Type', 'Opening Balance (₹)',
    'Contact Person', 'Phone', 'Active', 'Remarks'
  ];
  var descriptions = [
    'AUTO: BNK-001', 'Bank name', 'Branch name / location',
    'Account number', 'IFSC code', 'Current/Savings/OD/CC',
    'Opening balance amount', 'Bank contact', 'Phone',
    'Yes/No', 'Notes'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1C — BANK_MASTER — Company Bank Accounts',
    headers, descriptions, TAB_1C);

  setValidation_(sheet, 6, ['Current', 'Savings', 'Overdraft', 'Cash Credit', 'Fixed Deposit']);
  setValidation_(sheet, 10, ['Yes', 'No']);
}

/* ── 05. COST_CENTER_MASTER ── */
function setup1C_CostCenterMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1C.COST_CENTER_MASTER);
  var headers = [
    '# Cost Center Code', '⚠ Cost Center Name', '→ Department',
    '← Dept Name (Auto)', 'Manager', 'Budget Amount (₹)',
    'Active', 'Notes'
  ];
  var descriptions = [
    'AUTO: CC-001', 'Cost center label', 'FK → DEPARTMENT_MASTER (1B)',
    'Auto from dept', 'Responsible person', 'Annual budget allocation',
    'Yes/No', 'Description'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1C — COST_CENTER_MASTER — Cost Centers',
    headers, descriptions, TAB_1C);

  setValidation_(sheet, 7, ['Yes', 'No']);

  var data = [
    ['CC-001', 'Production', 'DEPT-001', '', '', '', 'Yes', 'All production costs'],
    ['CC-002', 'Quality Control', 'DEPT-002', '', '', '', 'Yes', 'QC expenses'],
    ['CC-003', 'Warehouse', 'DEPT-003', '', '', '', 'Yes', 'Storage, handling costs'],
    ['CC-004', 'Purchase', 'DEPT-004', '', '', '', 'Yes', 'Procurement overhead'],
    ['CC-005', 'Sales & Marketing', 'DEPT-005', '', '', '', 'Yes', 'Sales expenses, marketing'],
    ['CC-006', 'Admin & HR', 'DEPT-007', '', '', '', 'Yes', 'Admin, salaries, HR'],
    ['CC-007', 'Maintenance', 'DEPT-009', '', '', '', 'Yes', 'Machine repair, spares'],
    ['CC-008', 'Job Work', '', '', '', '', 'Yes', 'Outsourced processing costs'],
    ['CC-009', 'Logistics', 'DEPT-010', '', '', '', 'Yes', 'Dispatch, transport'],
    ['CC-010', 'Overheads', '', '', '', '', 'Yes', 'Electricity, rent, misc']
  ];
  sheet.getRange(4, 1, data.length, data[0].length).setValues(data);
}

/* ── 06. ACCOUNT_MASTER ── */
function setup1C_AccountMaster_(ss) {
  var sheet = ss.insertSheet(CONFIG.SHEETS_1C.ACCOUNT_MASTER);
  var headers = [
    '# Account Code', '⚠ Account Name', 'Account Group',
    'Account Type', 'Parent Account', 'Opening Balance (₹)',
    'Active', 'Notes'
  ];
  var descriptions = [
    'AUTO: ACC-001', 'Ledger account name', 'Assets/Liabilities/Income/Expenses',
    'Bank/Cash/Receivable/Payable/Revenue/Expense/Stock/Fixed Asset',
    'Parent account code (if sub-account)', 'Opening balance',
    'Yes/No', 'Description'
  ];

  applyFormat_(sheet,
    'CC ERP FILE 1C — ACCOUNT_MASTER — Chart of Accounts',
    headers, descriptions, TAB_1C);

  setValidation_(sheet, 3, ['Assets', 'Liabilities', 'Income', 'Expenses', 'Equity']);
  setValidation_(sheet, 4, ['Bank', 'Cash', 'Receivable', 'Payable', 'Revenue', 'Expense', 'Stock', 'Fixed Asset', 'Capital']);
  setValidation_(sheet, 7, ['Yes', 'No']);

  var data = [
    ['ACC-001', 'Cash in Hand', 'Assets', 'Cash', '', 0, 'Yes', 'Petty cash and physical cash'],
    ['ACC-002', 'Bank Account - Primary', 'Assets', 'Bank', '', 0, 'Yes', 'Main operating bank account'],
    ['ACC-003', 'Accounts Receivable', 'Assets', 'Receivable', '', 0, 'Yes', 'Customer outstanding dues'],
    ['ACC-004', 'Accounts Payable', 'Liabilities', 'Payable', '', 0, 'Yes', 'Supplier outstanding dues'],
    ['ACC-005', 'Sales Revenue', 'Income', 'Revenue', '', 0, 'Yes', 'Revenue from garment sales'],
    ['ACC-006', 'Job Work Income', 'Income', 'Revenue', '', 0, 'Yes', 'Income from JW services (if any)'],
    ['ACC-007', 'Raw Material Purchase', 'Expenses', 'Expense', '', 0, 'Yes', 'Fabric, yarn, woven purchases'],
    ['ACC-008', 'Trim Purchase', 'Expenses', 'Expense', '', 0, 'Yes', 'Trims and accessories purchase'],
    ['ACC-009', 'Consumable Purchase', 'Expenses', 'Expense', '', 0, 'Yes', 'Dyes, chemicals, needles etc.'],
    ['ACC-010', 'Job Work Expense', 'Expenses', 'Expense', '', 0, 'Yes', 'Printing, embroidery, dyeing charges'],
    ['ACC-011', 'Salary & Wages', 'Expenses', 'Expense', '', 0, 'Yes', 'Employee salaries'],
    ['ACC-012', 'Rent', 'Expenses', 'Expense', '', 0, 'Yes', 'Factory/office rent'],
    ['ACC-013', 'Electricity', 'Expenses', 'Expense', '', 0, 'Yes', 'Power bills'],
    ['ACC-014', 'Transport & Logistics', 'Expenses', 'Expense', '', 0, 'Yes', 'Freight, courier, shipping'],
    ['ACC-015', 'Maintenance & Repairs', 'Expenses', 'Expense', '', 0, 'Yes', 'Machine repair, spares'],
    ['ACC-016', 'GST Input Credit', 'Assets', 'Receivable', '', 0, 'Yes', 'GST ITC balance'],
    ['ACC-017', 'GST Output Liability', 'Liabilities', 'Payable', '', 0, 'Yes', 'GST collected on sales'],
    ['ACC-018', 'TDS Receivable', 'Assets', 'Receivable', '', 0, 'Yes', 'TDS deducted by customers'],
    ['ACC-019', 'Fixed Assets', 'Assets', 'Fixed Asset', '', 0, 'Yes', 'Machinery, furniture, vehicles'],
    ['ACC-020', 'Capital Account', 'Equity', 'Capital', '', 0, 'Yes', 'Owner capital / equity']
  ];
  sheet.getRange(4, 1, data.length, data[0].length).setValues(data);
}
