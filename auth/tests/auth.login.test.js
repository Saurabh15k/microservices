const request = require('supertest')
const app = require('../src/app')
const userModel = require('../src/models/user.model')
const bcrypt = require('bcryptjs')

describe('POST /api/auth/login', () => {
    it('logs in existing user with correct credentials and returns token cookie and user (no password)', async () => {
        const password = 'secret123'
        const hash = await bcrypt.hash(password, 10)
        await userModel.create({ username: 'testuser', email: 'test@example.com', password: hash, fullName: { firstName: 'Test', lastName: 'User' } })

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password })

        if (res.status !== 200) console.log('LOGIN FAILED', res.status, res.body, res.headers && res.headers['set-cookie'])

        expect(res.status).toBe(200)
        expect(res.headers['set-cookie']).toBeDefined()
        expect(res.body.user).toBeDefined()
        expect(res.body.user.password).toBeUndefined()
    })

    it('rejects invalid credentials with 401', async () => {
        const password = 'secret123'
        const hash = await bcrypt.hash(password, 10)
        await userModel.create({ username: 'baduser', email: 'bad@example.com', password: hash, fullName: { firstName: 'Bad', lastName: 'User' } })

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'bad@example.com', password: 'wrongpassword' })

        expect(res.status).toBe(401)
    })

    it('returns 400 for missing fields', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({})

        expect(res.status).toBe(400)
    })
})
