// src/__tests__/api/api.spec.ts
import request from 'supertest';
import { expect } from 'chai';
import app from '../../app'; // Adjust path to your Express app
import { execSync } from 'child_process';

describe('API Tests', () => {

  describe('1. SQL Injection Guard - POST /users/login', () => {
    it('should reject SQL injection attempt', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({ username: "' OR '1'='1", password: "anything" });

      expect(res.status).to.be.oneOf([400, 401]);
      expect(res.text || res.body.message).to.not.include('stack');
    });
  });

  describe('2. Unauthorized Access - GET /transactions without token', () => {
    it('should return 401 for missing auth token', async () => {
      const res = await request(app)
        .get('/transactions');

      expect(res.status).to.equal(401);
      expect(res.body.message || res.text).to.match(/unauthorized/i);
    });
  });

  describe('3. Filter by Type - GET /transactions?type=sent', () => {
    let authToken: string;

    before(async () => {
      // Replace this with real login/signup flow
      const loginRes = await request(app)
        .post('/users/login')
        .send({ username: "testuser", password: "password" });

      authToken = loginRes.body.token;
    });

    it('should return only sent transactions', async () => {
      const res = await request(app)
        .get('/transactions?type=sent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      res.body.forEach(tx => {
        expect(tx.sender).to.equal('testuser'); // replace 'testuser' with dynamic value if needed
      });
    });
  });

  describe('4. DB Down Handling - graceful error', () => {
    before(() => {
      try {
        execSync('docker-compose stop ng_db'); // stops the DB container
      } catch (err) {
        console.error("Failed to stop DB:", err);
      }
    });

    it('should return 500 and not crash when DB is down', async () => {
      const res = await request(app)
        .get('/users/balance');

      expect(res.status).to.equal(500);
      expect(res.body.message || res.text).to.match(/(db|database|error)/i);
      expect(res.text).to.not.include('stack');
    });

    after(() => {
      try {
        execSync('docker-compose start ng_db'); // restart DB for further tests
      } catch (err) {
        console.error("Failed to start DB:", err);
      }
    });
  });

});
