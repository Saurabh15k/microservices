const request=require('supertest')
const app=require('../src/app')
const connectToDB=require('../src/db/db')
const bcrypt=require('bcryptjs')
const userModel=require('../src/models/user.model')

describe('GET /api/auth/logout',()=>{
    beforeAll(async()=>{
        await connectToDB()
    })

    it('clears the auth cookie and returns 200 when logged in',async()=>{
        const password='secret123'
        const hash=await bcrypt.hash(password,10)
        const user=await userModel.create({username:'logout_user',email:'logout@example.com',password:hash,fullName:{firstName:'Logout',lastName:'User'}})

        const loginres=await request(app).post('/api/auth/login')
        .send({ email: 'logout@example.com', password });
        expect(loginres.status).toBe(200)
        const cookies=loginres.headers['set-cookie']
        expect(cookies).toBeDefined()

        const res = await request(app).get('/api/auth/logout').set('Cookie', cookies)
        // ensure status is 200 and cookie cleared
        expect(res.status).toBe(200)
        const setCookie = res.headers['set-cookie'] || []
        const cookiestr = setCookie.join(';')
        expect(cookiestr).toMatch(/token=;/)
        expect(cookiestr.toLowerCase()).toMatch(/expires=/)
    })

    it('is idempotent:returns 200 even without auth cookie',async()=>{
        const res=await request(app).get('/api/auth/logout')
        expect(res.status).toBe(200)
    })
})