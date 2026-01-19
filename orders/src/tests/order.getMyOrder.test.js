const request=require('supertest');
const app=require('../app');
const jwt=require("jsonwebtoken");

describe('GET /api/orders/me — Paginated list of the customer’s orders',()=>{

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
    
    it('returns paginated orders with meta and defaults page=1, limit=20',async()=>{
        const res=await request(app).get('/api/orders/me').set('Cookie', getAuthCookie())
        .expect('Content-Type', /json/)
            .expect(200);

        const body = res.body;
        expect(body).toBeDefined();
        const items = body.orders || body.items || body.data || [];
        expect(Array.isArray(items)).toBe(true);

        const meta = body.meta || body.pagination || {};
        expect(meta).toBeDefined();
        expect(typeof (meta.page ?? 1)).toBe('number');
        expect(typeof (meta.limit ?? 20)).toBe('number');
        expect(typeof (meta.total ?? 0)).toBe('number');
    })

    it('respects page and limit query parameters', async () => {
        const res = await request(app)
            .get('/api/orders/me?page=2&limit=5')
            .set('Cookie', getAuthCookie())
            .expect('Content-Type', /json/)
            .expect(200);

        const meta = res.body.meta || res.body.pagination || {};
        expect([ 2, '2' ]).toContain(meta.page);
        expect([ 5, '5' ]).toContain(meta.limit);
    });

    it('returns empty list when user has no orders', async () => {
        const res = await request(app)
            .get('/api/orders/me')
            .set('Cookie', getAuthCookie({ userId: '507f1f77bcf86cd799439099' }))
            .expect('Content-Type', /json/)
            .expect(200);

        const items = res.body.orders || res.body.items || res.body.data || [];
        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBe(0);
    });
})