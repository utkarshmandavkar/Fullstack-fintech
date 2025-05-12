const request = require('supertest');
const app = require('../../app'); // your Express app
const db = require('../../db'); // your DB client/ORM
let userA, userB;

describe('Transaction Integration Tests', () => {

  beforeEach(async () => {
    // Clear users and transactions before each test
    await db.query('DELETE FROM transactions');
    await db.query('DELETE FROM users');
  });

  //1. Successful Transfer
  it('should transfer money successfully between two users', async () => {
    // Step 1: Create user A and B
    const resA = await request(app).post('/users').send({ username: 'userA' });
    const resB = await request(app).post('/users').send({ username: 'userB' });
    userA = resA.body.id;
    userB = resB.body.id;

    // Step 2: Fund user A directly
    await db.query('UPDATE accounts SET balance = $1 WHERE user_id = $2', [1000, userA]);

    // Step 3: POST transaction from A → B
    await request(app)
      .post('/transactions')
      .send({ from: userA, to: userB, amount: 200 })
      .expect(200);

    // Step 4: GET balances for both users
    const balanceA = await request(app).get(`/users/balance?id=${userA}`);
    const balanceB = await request(app).get(`/users/balance?id=${userB}`);

    expect(balanceA.body.balance).toBe(800); // 1000 - 200
    expect(balanceB.body.balance).toBe(200); // 0 + 200
  });

  // 2. Rollback on Failure
  it('should rollback transfer if recipient does not exist', async () => {
    // Step 1: Create user A only
    const resA = await request(app).post('/users').send({ username: 'userA' });
    userA = resA.body.id;

    // Step 2: Fund user A
    await db.query('UPDATE accounts SET balance = $1 WHERE user_id = $2', [500, userA]);

    // Step 3: Try sending to non-existent user ID
    const invalidUserId = 9999;
    const res = await request(app)
      .post('/transactions')
      .send({ from: userA, to: invalidUserId, amount: 100 });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/not found/i);

    // Step 4: Confirm user A's balance is unchanged
    const balanceA = await request(app).get(`/users/balance?id=${userA}`);
    expect(balanceA.body.balance).toBe(500);

    // Also optional: make sure no transaction was recorded
    const transactions = await db.query('SELECT * FROM transactions');
    expect(transactions.rows.length).toBe(0);
  });
});
