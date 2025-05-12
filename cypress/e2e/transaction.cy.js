describe('Make & Verify Transaction', () => {
  it('should make a transaction and verify UI and transaction history', () => {
    const sender = 'kavin';
    const recipient = 'xuxameneguel';
    const amount = 50;

    // Step 1: Make a transaction
    cy.request({
      method: 'POST',
      url: '/transactions',
      body: {
        sender,
        recipient,
        amount,
      },
    }).then(() => {
      // Step 2: Verify the new balance in UI after transaction
      cy.visit('/dashboard');
      cy.get('.balance').invoke('text').then((newBalanceText) => {
        const newBalance = parseFloat(newBalanceText.replace('$', '').trim());

        // The new balance should be the previous balance minus the transaction amount
        cy.get('.balance').invoke('text').then((previousBalanceText) => {
          const previousBalance = parseFloat(previousBalanceText.replace('$', '').trim());
          expect(newBalance).to.equal(previousBalance - amount);
        });
      });

      // Step 3: Verify the transaction appears in the "Transaction History"
      cy.get('.transaction-history').should('contain', recipient);
      cy.get('.transaction-history').should('contain', amount.toString());
    });
  });
});
