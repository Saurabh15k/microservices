const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const path = require('path');
const mongoose = require('mongoose');

jest.mock('../services/imagekit.service', () => ({
    uploadImage: jest.fn(async ({ buffer }) => ({
        url: `https://ik.mock/file`,
        thumbnail: `https://ik.mock/thumb/file`,
        id: `file_id`,
    })),
}));

describe('POST /api/products', () => {
    it('creates a product and uploads images.', async () => {
        const token = jwt.sign({ id: new mongoose.Types.ObjectId().toHexString(), role: 'seller' },
            process.env.JWT_SECRET_KEY);
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${token}`)
            .field('title', 'Test Product')
            .field('description', 'This ia a test product')
            .field('priceAmount', '100')
            .field('priceCurrency', 'USD')
            .attach('images', path.join(__dirname, 'fixtures', 'sample.jpg'));

        expect(res.status).toBe(201);
        expect(res.body?.data?.title).toBe('Test Product');
        expect(res.body?.data?.price?.amount).toBe(100);
        expect(res.body?.data?.images?.length).toBe(1);
        expect(res.body?.data?.images[0]?.url).toContain('https://ik.mock/');
    })

    it('validates required fields.', async () => {
        const token = jwt.sign({ id: new mongoose.Types.ObjectId().toHexString(), role: 'seller' },
            process.env.JWT_SECRET_KEY)
        const res=await request(app).post('/api/products').set('Authorization',`Bearer ${token}`)
        .field('title','X');

        expect(res.status).toBe(400);
    })
})