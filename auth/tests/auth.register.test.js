const request = require('supertest')
const app = require('../src/app')

describe('POST /api/auth/register', () => {
  it('creates a user and returns 201 with user (no password)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'Jhon_Doe',
        email: 'jdoe@example.com',
        password: 'secret123',
        fullName: { firstName: 'John', lastName: 'Doe' }
      })

    expect(res.status).toBe(201)
    expect(res.body.user).toBeDefined()
    expect(res.body.user.password).toBeUndefined()
  })

  it('rejects duplicate username/email with 409', async () => {
    const payload = {
      username: 'dupuser',
      email: 'jdoe@example.com',
      password: 'secret123',
      fullName: { firstName: 'Dup', lastName: 'user' }
    }

    await request(app).post('/api/auth/register').send(payload).expect(201)

    const res = await request(app).post('/api/auth/register').send(payload)
    expect(res.status).toBe(409)
  })

  it('should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({})

    expect(res.status).toBe(400)
  })
})
