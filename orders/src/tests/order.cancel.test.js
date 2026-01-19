const request = require("supertest");
const app = require("../app");
const jwt = require('jsonwebtoken');
const orderModel = require("../models/order.model");

describe('POST /api/orders/:id/cancel — Buyer-initiated cancel while rules apply', () => {

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

    beforeEach(async () => {
        await orderModel.deleteMany();
    })
    const orderId = '507f1f77bcf86cd799439012';

    it('cancels a PENDING order and returns updated order', async () => {

        const order = new orderModel({
            _id: orderId,
            user: '69669d46969ccf2d143aff35', // match auth user
            status: 'PENDING',
            items: [
                {
                    product: '507f1f77bcf86cd799439021',
                    quantity: 1,
                    price: { amount: 100, currency: 'USD' },
                },
            ],
            totalPrice: { amount: 100, currency: 'USD' },
            shippingAddress: {
                street: '123 Main St',
                city: 'Metropolis',
                state: 'CA',
                zip: '90210',
                country: 'USA',
            },

        });
        await order.save();

        const res = await request(app)
            .post(`/api/orders/${orderId}/cancel`)
            .set('Cookie', getAuthCookie())
            .expect('Content-Type', /json/)
            .expect(200);


        const orderResponse = res.body.order || res.body.data || res.body;
        expect(orderResponse.status).toMatch(/CANCELLED|CANCELED/i);

    });
    it('returns 409 when order is not cancellable (e.g., SHIPPED or DELIVERED)', async () => {


        const order = new orderModel({
            _id: orderId,
            user: '69669d46969ccf2d143aff35', // match auth user
            status: 'SHIPPED',
            items: [
                {
                    product: '507f1f77bcf86cd799439021',
                    quantity: 1,
                    price: { amount: 100, currency: 'USD' },
                },
            ],
            totalPrice: { amount: 100, currency: 'USD' },
            shippingAddress: {
                street: '123 Main St',
                city: 'Metropolis',
                state: 'CA',
                zip: '90210',
                country: 'USA',
            },
        });
        await order.save();

        const res = await request(app)
            .post(`/api/orders/${orderId}/cancel`)
            .set('Cookie', getAuthCookie())
            .expect('Content-Type', /json/)
            .expect(409);

        expect(res.body.error || res.body.message).toMatch(/cannot|not.*cancell/i);
    });

    it('returns 403 when user is not the owner of the order', async () => {
        const order = new orderModel({
            _id: orderId,
            user: '68bc6369c17579622cbdd9fe',
            items: [],
            status: 'PENDING',
            totalPrice: {
                amount: 0,
                currency: 'USD'
            },
            shippingAddress: {
                street: '123 Main St',
                city: 'Metropolis',
                state: 'NY',
                zip: '10001',
                country: 'USA'
            }
        });

        await order.save();
        const res = await request(app)
            .post(`/api/orders/${orderId}/cancel`)
            .set('Cookie', getAuthCookie({ userId: '507f1f77bcf86cd799439099' }))
            .expect('Content-Type', /json/)
            .expect(403);

        expect(res.body.error || res.body.message).toMatch(/forbidden|not.*allowed/i);
    });
})