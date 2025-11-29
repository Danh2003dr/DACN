describe('Drug Lifecycle E2E Tests', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('input[name="identifier"]').type(Cypress.env('TEST_USERNAME') || 'admin');
    cy.get('input[name="password"]').type(Cypress.env('TEST_PASSWORD') || 'admin123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should complete full drug lifecycle', () => {
    // Step 1: Navigate to Drugs page
    cy.visit('/drugs');
    cy.contains('Danh sách Thuốc').should('be.visible');

    // Step 2: Create new drug
    cy.contains('button', 'Thêm mới').click();
    cy.get('input[name="name"]').type('E2E Test Drug');
    cy.get('input[name="activeIngredient"]').type('Test Ingredient');
    cy.get('input[name="dosage"]').type('100mg');
    cy.get('input[name="form"]').type('Viên nén');
    cy.get('input[name="batchNumber"]').type(`BATCH_E2E_${Date.now()}`);
    cy.get('input[name="productionDate"]').type('2024-01-01');
    cy.get('input[name="expiryDate"]').type('2026-01-01');
    cy.contains('button', 'Lưu').click();

    // Step 3: Verify drug appears in list
    cy.contains('E2E Test Drug').should('be.visible');

    // Step 4: View drug details
    cy.contains('E2E Test Drug').click();
    cy.contains('Thông tin chi tiết').should('be.visible');

    // Step 5: Navigate to Supply Chain
    cy.visit('/supply-chain');
    cy.contains('Chuỗi cung ứng').should('be.visible');
  });

  it('should scan QR code and verify drug', () => {
    // Navigate to QR Scanner
    cy.visit('/qr-scanner');
    cy.contains('Quét mã QR').should('be.visible');

    // Note: Actual QR scanning requires camera access
    // This test verifies the page loads correctly
    cy.get('button').contains('Quét').should('be.visible');
  });

  it('should display dashboard with statistics', () => {
    cy.visit('/dashboard');
    cy.contains('Dashboard').should('be.visible');
    
    // Check for stats cards
    cy.contains('Tổng số thuốc').should('be.visible');
    cy.contains('Người dùng').should('be.visible');
  });
});

