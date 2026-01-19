const request = require('supertest');
const app = require("../app");
const jwt = require("jsonwebtoken");
const orderModel = require("../models/order.model");

describe('PATCH /api/orders/:id/address — Update delivery address prior to payment capture', () => {

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

    const orderId = '696df4ea74a57728a2fc765c';

    const newAddress = {
        street: '456 Second St',
        city: 'Gotham',
        state: 'NY',
        zip: '10001',
        country: 'USA',
    };

    it('updates shipping address and returns updated order', async () => {

        const order = await orderModel.create({
            _id: orderId,
            user: '69669d46969ccf2d143aff35', // match auth user
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

        const res = await request(app)
            .patch(`/api/orders/${orderId}/address`)
            .set('Cookie', getAuthCookie())
            .send({ shippingAddress: newAddress })
            .expect('Content-Type', /json/)
            .expect(200);




        const orderResponse = res.body.order || res.body.data || res.body;
        console.log(orderResponse.shippingAddress);
        expect(orderResponse.shippingAddress).toMatchObject({
            street: newAddress.street,
            city: newAddress.city,
            state: newAddress.state,
            zip: newAddress.zip,
            country: newAddress.country,
        });
    });

    it('returns 409 when address update is not allowed (e.g., after capture/shipping)', async () => {

        const order = await orderModel.create({
            _id: orderId,
            user: '69669d46969ccf2d143aff35', // match auth user
            items: [],
            status: 'SHIPPED',
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

        const res = await request(app)
            .patch(`/api/orders/${orderId}/address`)
            .set('Cookie', getAuthCookie())
            .send({ shippingAddress: newAddress })
            .expect('Content-Type', /json/)
            .expect(409);

        expect(res.body.error || res.body.message).toMatch(/not.*allowed|cannot/i);
    });

    it('returns 400 when address is invalid', async () => {
        const order = await orderModel.create({
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
                country: 'USA'
            }
        });

        const res = await request(app)
            .patch(`/api/orders/${orderId}/address`)
            .set('Cookie', getAuthCookie())
            .send({ shippingAddress: { city: 'Nowhere' } })
            .expect('Content-Type', /json/)
            .expect(400);

        expect(res.body.errors || res.body.message).toBeDefined();
    });
})