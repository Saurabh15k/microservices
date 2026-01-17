const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const cartModel=require('../models/cart.model');

jest.mock('../models/cart.model.js', () => {
    function mockGenerateObjectId() {
        return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
    const carts = new Map();
    class CartMock {
        constructor({ user, items }) {
            this._id = mockGenerateObjectId();
            this.user = user;
            this.items = items || [];
        }
        static async findOne(query) {
            return carts.get(query.user) || null;
        }
        async save() {
            carts.set(this.user, this);
            return this;
        }
    }
    CartMock.__reset = () => carts.clear();
    return CartMock;
});

function generateObjectId() {
    return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function signToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
}

const endpoint = '/api/cart/items';

describe('POST /api/cart/items',()=>{
    const userId = generateObjectId();
    const productId = generateObjectId();

    beforeEach(() => {
        cartModel.__reset();
    });

    it('creates new cart and adds first item',async()=>{
        const token=signToken({id:userId,role:'user'});
        const res=await request(app).post(endpoint).set('Authorization',`Bearer ${token}`)
        .send({productId,quantity:2});

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Item added to cart successfully.');
        expect(res.body.cart).toBeDefined();
        expect(res.body.cart.items).toHaveLength(1);
        expect(res.body.cart.items[ 0 ]).toMatchObject({ productId, quantity: 2 });
    })

    it('increments quantity when item already exists',async()=>{
        const token=signToken({id:userId,role:'user'});
        await request(app).post(endpoint).set('Authorization',`Bearer ${token}`)
        .send({productId,quantity:2});

        const res=await request(app).post(endpoint).set('Authorization', `Bearer ${token}`)
            .send({ productId, quantity: 3 });

        expect(res.status).toBe(200);
        expect(res.body.cart.items).toHaveLength(1);
        expect(res.body.cart.items[ 0 ]).toMatchObject({ productId, quantity: 5 });
    })

    it('validation error for invalid productId',async()=>{
        const token=signToken({id:userId,role:'user'});
        const res = await request(app)
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: 'invalid-id', quantity: 1 });

        expect(res.status).toBe(400);
        expect(res.body.errors).toBeDefined();
        const messages = res.body.errors.map(e => e.msg);
        expect(messages).toContain('Invalid Product ID format');
    })

    it('validation error for non-positive qty',async()=>{
        const token = signToken({ id: userId, role: 'user' });
        const res = await request(app)
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: productId, quantity: 0 });

        expect(res.status).toBe(400);
        expect(res.body.errors).toBeDefined();
        const messages = res.body.errors.map(e => e.msg);
        expect(messages).toContain('Quantity must be a positive integer');
    })

    it('401 when no token provided', async () => {
        const res = await request(app)
            .post(endpoint)
            .send({ productId, quantity: 1 });
        expect(res.status).toBe(401);
        expect(res.body.message).toMatch("Unauthorized: No token provided");
    });

    it('403 when role not allowed', async () => {
        const token = signToken({ id: userId, role: 'admin' }); // role admin not in [user]
        const res = await request(app)
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send({ productId, quantity: 1 });
        expect(res.status).toBe(403);
    });

    it('401 when token invalid', async () => {
        const res = await request(app)
            .post(endpoint)
            .set('Authorization', 'Bearer invalid.token.here')
            .send({ productId, quantity: 1 });
        expect(res.status).toBe(401);
    });
})

