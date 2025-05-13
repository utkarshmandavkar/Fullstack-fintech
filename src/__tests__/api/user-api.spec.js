const request = require('supertest');
const { expect } = require('chai');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://localhost:3001';

describe('Task 1 API Tests', () => {
  describe('1. SQL Injection Guard', () => {
    it('should reject SQL injection attempt with 400 or 401', async () => {
      const res = await request(BASE_URL)
        .post('/users/login')
        .send({ username: "' OR '1'='1", password: "anything" });

      expect(res.status).to.be.oneOf([400, 401]);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.not.include('stack');
    });
  });

  describe('2. Unauthorized on Missing Token', () => {
    it('should return 401 if token is missing for protected endpoint', async () => {
      const res = await request(BASE_URL).get('/transactions');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
    });
  });

  describe('3. Filter by Type', () => {
    let token;

    before(async () => {
      const loginRes = await request(BASE_URL)
        .post('/users/login')
        .send({ username: 'kavin', password: 'admin123' });
      token = loginRes.body.token;
    });

    it('should return only sent transactions for user', async () => {
      const res = await request(BASE_URL)
        .get('/transactions?type=sent')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      res.body.forEach(tx => {
        expect(tx.sender).to.equal('kavin');
      });
    });
  });

  describe('4. DB Down Error', () => {
    it('should return 500 with graceful message when DB is down', async () => {
      const res = await request(BASE_URL).get('/users/balance');
      expect(res.status).to.equal(500);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.match(/database|error/i);
    });
  });
});
