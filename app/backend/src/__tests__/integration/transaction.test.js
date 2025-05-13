const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../../app'); // Adjust path to your app
const db = require('../../../../db'); // Database connection (adjust path as needed)

describe('Transaction Endpoints', function () {
  let userA, userB;

  // Helper function to create a user
  async function createUser(username, initialBalance) {
    const res = await request(app)
      .post('/users')
      .send({ username, initialBalance }) // Assuming POST /users creates a user with balance
      .expect(201);

    return res.body; // Assuming user data is returned as { id, username, balance }
  }

  // Helper function to get the balance of a user
  async function getBalance(userId) {
    const res = await request(app)
      .get(`/users/${userId}/balance`)
      .expect(200);
    return res.body.balance; // Assuming response is { balance: number }
  }

  // Helper function to initiate a transfer
  async function transferFunds(fromUserId, toUserId, amount) {
    const res = await request(app)
      .post('/transactions')
      .send({ fromUserId, toUserId, amount })
      .expect(200);
    return res.body;
  }

  // Create two fresh users and fund one of them before tests
  beforeEach(async () => {
    userA = await createUser('UserA', 500); // Create UserA with an initial balance of 500
    userB = await createUser('UserB', 0);   // Create UserB with an initial balance of 0
  });

  afterEach(async () => {
    // Clean up test data (you can delete test users from DB if needed)
    await db.query('DELETE FROM transactions');
    await db.query('DELETE FROM users');
  });

  it('should successfully transfer funds and update balances atomically', async function () {
    // Fund UserA directly (via backend script or database if needed)
    const initialBalanceA = await getBalance(userA.id);
    const initialBalanceB = await getBalance(userB.id);

    // Transfer funds from A to B
    await transferFunds(userA.id, userB.id, 100);

    const finalBalanceA = await getBalance(userA.id);
    const finalBalanceB = await getBalance(userB.id);

    // Check balances after transaction
    expect(finalBalanceA).to.equal(initialBalanceA - 100); // A's balance decreased by 100
    expect(finalBalanceB).to.equal(initialBalanceB + 100); // B's balance increased by 100
  });

  it('should rollback transaction on failure (user B does not exist)', async function () {
    // Try to transfer funds to a non-existing user (user ID 999 does not exist)
    const initialBalanceA = await getBalance(userA.id);
    const initialBalanceB = await getBalance(userB.id);

    // Attempt transfer
    const res = await request(app)
      .post('/transactions')
      .send({ fromUserId: userA.id, toUserId: 999, amount: 100 })
      .expect(404); // Expecting HTTP 404 since user B does not exist

    // Assert rollback
    const finalBalanceA = await getBalance(userA.id);
    const finalBalanceB = await getBalance(userB.id);

    // Ensure that neither A's nor B's balance is modified
    expect(finalBalanceA).to.equal(initialBalanceA); // A's balance should remain the same
    expect(finalBalanceB).to.equal(initialBalanceB); // B's balance should remain the same (since user B doesn't exist)
  });
});
