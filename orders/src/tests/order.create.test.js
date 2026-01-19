const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('POST /api/orders — Create order from current cart', () => {
    const sampleAddress = {
        street: '123 Main St',
        city: 'Metropolis',
        state: 'CA',
        zip: '90210',
        country: 'USA',
    };

    function getAuthCookie({ userId = '69669d46969ccf2d143aff35', extra = { role: "user" } } = {}) {
        const secret = process.env.JWT_SECRET_KEY || 'test-secret';
        const payload = { id: userId, ...extra };
        const token = jwt.sign(payload, secret, { expiresIn: '1h' });
        const cookieName = process.env.JWT_COOKIE_NAME || 'token';
        return [`${cookieName}=${token}`];
    }

    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db-skip-real';
    process.env.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || '4fe25fd54249579682cc363d9972e05fed2a51c9e7a779f31ae4baa02a2198a5';
    process.env.JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || 'token';

    const prod1Id = new mongoose.Types.ObjectId().toString();
    const prod2Id = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        // Mock cart service response
        axios.get.mockImplementation((url) => {
            if (url.includes('/api/cart')) {
                return Promise.resolve({
                    data: {
                        cart: {
                            items: [
                                { productId: prod1Id, quantity: 2 },
                                { productId: prod2Id, quantity: 1 }
                            ]
                        }
                    }
                });
            } else if (url.includes('/api/products/')) {
                const productId = url.split('/').pop();
                if (productId === prod1Id) {
                    return Promise.resolve({
                        data: {
                            data: {
                                _id: prod1Id,
                                title: 'Product 1',
                                price: { amount: 100, currency: 'INR' },
                                stock: 10
                            }
                        }
                    });
                } else if (productId === prod2Id) {
                    return Promise.resolve({
                        data: {
                            data: {
                                _id: prod2Id,
                                title: 'Product 2',
                                price: { amount: 200, currency: 'INR' },
                                stock: 5
                            }
                        }
                    });
                }
            }
            return Promise.reject(new Error('Unknown URL'));
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('creates order from current cart, computes totals, sets status=PENDING, reserves inventory', async () => {
        const res = await request(app)
            .post('/api/orders')
            .set('Cookie', getAuthCookie())
            .send({ shippingAddress: sampleAddress })
            .expect('Content-Type', /json/)
            .expect(201);

        expect(res.body).toBeDefined();
        expect(res.body.order).toBeDefined();
        const { order } = res.body;
        expect(order._id).toBeDefined();
        expect(order.user).toBeDefined();
        expect(order.status).toBe('PENDING');

        // Items copied from priced cart
        expect(Array.isArray(order.items)).toBe(true);
        expect(order.items.length).toBeGreaterThan(0);
        for (const it of order.items) {
            expect(it.product).toBeDefined();
            expect(it.quantity).toBeGreaterThan(0);
            expect(it.price).toBeDefined();
            expect(typeof it.price.amount).toBe('number');
            expect(['USD', 'INR']).toContain(it.price.currency);
        }

        // Totals include taxes + shipping
        expect(order.totalPrice).toBeDefined();
        expect(typeof order.totalPrice.amount).toBe('number');
        expect(['USD', 'INR']).toContain(order.totalPrice.currency);

        // Shipping address persisted
        expect(order.shippingAddress).toMatchObject({
            street: sampleAddress.street,
            city: sampleAddress.city,
            state: sampleAddress.state,
            zip: sampleAddress.zip,
            country: sampleAddress.country,
        });
    })

    it('returns 400 when shipping address is missing/invalid', async () => {
        const res = await request(app)
            .post('/api/orders')
            .set('Cookie', getAuthCookie())
            .send({})
            .expect('Content-Type', /json/)
            .expect(400);

        expect(res.body.errors || res.body.message).toBeDefined();
    })
})