// describe('Login Flow', () => {
//   it('should login and land on the dashboard', () => {
//     // Visit the application
//     cy.visit('/');
//     // Fill in the credentials and submit
//     cy.get('input[name="username"]').type('kavin');
//     cy.get('input[name="password"]').type('admin123');
//     cy.get('button[type="submit"]').click();
    
//     // Assert that the user lands on the dashboard
//     cy.url().should('include', '/dashboard');
//     cy.contains('Dashboard').should('be.visible');
//   });
// });

describe('Login Flow', () => {
  it('should login and land on the dashboard', () => {
    cy.visit('/');

    // Wait until the input fields are available
    cy.get('input[name="username"]', { timeout: 10000 }).should('be.visible').type('kavin');
    cy.get('input[name="password"]').should('be.visible').type('admin123');
    cy.get('button[type="submit"]').should('be.visible').click();

    // Assert dashboard page is loaded
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
  });
});
