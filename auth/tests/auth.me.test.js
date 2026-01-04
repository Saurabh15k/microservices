const connectToDB = require('../src/db/db')
const request = require('supertest')
const app = require('../src/app')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const userModel = require('../src/models/user.model')

describe('GET /api/auth/me', () => {
    beforeAll(async () => {
        await connectToDB()
    })

    it('return 401 when no auth cookie is provided', async () => {
        const res = await request(app).get('/api/auth/me')
        expect(res.status).toBe(401)
    })

    it('return 401 for invalid token in cookie', async () => {
        const fakeToken = jwt.sign({ id: '000000000000000000000000' }, 'wrong_secret')
        const res = await request(app).get('/api/auth/me').set('Cookie', ['token=${fakeToken}'])
        expect(res.status).toBe(401)
    })

    it('return 200 and current user when valid token cookie is present', async () => {
        const password = 'Secret123!'
        const hash = await bcrypt.hash(password, 10)
        const user = await userModel.create({
            username: 'me_user',
            email: 'me@example.com',
            password: hash,
            fullName: { firstName: 'Me', lastName: 'User' }
        })

        const loginres = await request(app).post('/api/auth/login')
            .send({ email: 'me@example.com', password })
        expect(loginres.status).toBe(200)
        const setCookie = loginres.headers['set-cookie']
        expect(setCookie).toBeDefined()

        const res = await request(app).get('/api/auth/me').set('Cookie', setCookie)
        expect(res.status).toBe(200)
        expect(res.body.user).toBeDefined()
        expect(res.body.user.id).toBe(user._id.toString())
        expect(res.body.user.email).toBe('me@example.com')
        expect(res.body.user.username).toBe('me_user');
    })
})