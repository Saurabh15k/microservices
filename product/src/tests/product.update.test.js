const jwt=require('jsonwebtoken');
const request=require('supertest');
const app=require('../app');
const mongoose=require('mongoose');
const productModel=require('../models/product.model');

jest.mock('../services/imagekit.service',()=>({
    uploadImage: jest.fn(async () => ({ url: 'https://ik.mock/x', thumbnail: 'https://ik.mock/t', id: 'file_x' })),
}));

describe('PUT /api/products/:id',()=>{
    let sellerId1;
    let sellerId2;

    const signToken=(id,role='seller')=>jwt.sign({id,role},process.env.JWT_SECRET_KEY);

    beforeAll(async()=>{
        sellerId1=new mongoose.Types.ObjectId();
        sellerId2=new mongoose.Types.ObjectId();
    })

    const createProduct = (overrides = {}) => {
        return productModel.create({
            title: overrides.title ?? 'To Update',
            description: overrides.description ?? 'Update me',
            price: overrides.price ?? { amount: 10, currency: 'USD' },
            seller: overrides.seller ?? sellerId1,
            images: overrides.images ?? [],
        });
    };

    it('requires authentication (401) when no token provided',async()=>{
        const prod=await createProduct();
        const res=await request(app).put(`/api/products/${prod._id}`);
        expect(res.status).toBe(401);
    })

    it('returns 400 for invalid product id',async()=>{
        const token=signToken(sellerId1.toHexString(),'seller');
        const res=await request(app).put('/api/products/not_a_valid_id')
        .set('Authorization',`Bearer ${token}`);
        expect(res.status).toBe(400);
    })

    it('returns 404 when product not found',async()=>{
        const token=signToken(sellerId1.toHexString(),'seller');
        const fakeId=new mongoose.Types.ObjectId().toHexString();
        const res=await request(app).put(`/api/products/${fakeId}`)
        .set('Authorization',`Bearer ${token}`);
        expect(res.status).toBe(404);
    })

    it('forbids updating another seller\'s product (403)',async()=>{
        const prod=await createProduct({seller:sellerId2});
        const token=signToken(sellerId1.toHexString(),'seller');
        const res=await request(app).put(`/api/products/${prod._id}`)
        .set('Authorization',`Bearer ${token}`)
        .send({title:'Updated'});
        expect(res.status).toBe(403);
    })

    it('updates product successfully',async()=>{
        const prod=await createProduct();
        const token=signToken(sellerId1.toHexString(),'seller');
        const res=await request(app).put(`/api/products/${prod._id}`)
        .set('Authorization',`Bearer ${token}`)
        .send({title:'Updated Title', description:'Updated Desc', price:{amount:20, currency:'USD'}});
        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe('Updated Title');
        expect(res.body.data.description).toBe('Updated Desc');
        expect(res.body.data.price.amount).toBe(20);
        expect(res.body.data.price.currency).toBe('USD');
    })
})
