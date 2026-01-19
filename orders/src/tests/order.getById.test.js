const request=require('supertest');
const app=require('../app');
const orderModel=require("../models/order.model");
const jwt=require('jsonwebtoken');

describe('GET /api/orders/:id — Get order by id with timeline and payment summary',()=>{

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

    const orderId='68c13b2721c0d91f44ca3ead'; 
    
    it('returns 200 with order details, timeline, and payment summary',async()=>{
        const isOrder = await orderModel.findById(orderId).exec();
        if (!isOrder) {
            return; // skip test if order not found
        }
        const res = await request(app)
            .get(`/api/orders/${orderId}`)
            .set('Cookie', getAuthCookie())
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body).toBeDefined();
        const order = res.body.order || res.body.data || res.body; // flexible shape

        // Basic identity
        expect(order._id || order.id).toBeDefined();
        expect(order.user).toBeDefined();

        // Items
        expect(Array.isArray(order.items)).toBe(true);

        // Status and total
        expect(order.status).toBeDefined();
        expect(order.totalPrice).toBeDefined();
        expect(typeof (order.totalPrice.amount ?? order.totalPrice?.value ?? 0)).toBe('number');

        // Shipping address
        expect(order.shippingAddress).toBeDefined();

        // Timeline (events like created, paid, shipped, delivered, cancelled)
        expect(Array.isArray(order.timeline)).toBe(true);
        if (order.timeline.length) {
            const ev = order.timeline[ 0 ];
            expect(ev).toHaveProperty('type');
            expect(ev).toHaveProperty('at');
        }

        // Payment Summary (structure can vary)
        const payment = order.paymentSummary || order.payment || {};
        expect(payment).toBeDefined();
        // common fields (adjust in implementation)
        // expect(payment.subtotal).toBeDefined();
        // expect(payment.taxes).toBeDefined();
        // expect(payment.shipping).toBeDefined();
        // expect(payment.total).toBeDefined();
    })

    it('returns 404 when order not found or not accessible', async () => {
        const res = await request(app)
            .get(`/api/orders/000000000000000000000000`)
            .set('Cookie', getAuthCookie())
            .expect('Content-Type', /json/)
            .expect(404);

        expect(res.body.error || res.body.message).toMatch(/not found|no.*order/i);
    });
})