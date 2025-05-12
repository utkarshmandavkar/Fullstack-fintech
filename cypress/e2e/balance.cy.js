describe('Balance Verification', () => {
  it('should verify the balance by comparing with API response', () => {
    // Step 1: Capture displayed balance from UI
    cy.visit('/dashboard');
    cy.get('.balance').invoke('text').then((uiBalanceText) => {
      const uiBalance = parseFloat(uiBalanceText.replace('$', '').trim());

      // Step 2: Call the API to get the balance from the backend
      cy.request('/users/balance').then((response) => {
        const apiBalance = response.body.balance;

        // Step 3: Assert that the balance in UI matches the API response
        expect(uiBalance).to.equal(apiBalance);
      });
    });
  });
});
