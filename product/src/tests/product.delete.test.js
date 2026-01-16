const request=require('supertest');
const jwt=require('jsonwebtoken');
const app=require('../app');
const mongoose=require('mongoose');
const productModel = require('../models/product.model');

jest.mock('../services/imagekit.service', () => ({
    uploadImage: jest.fn(async () => ({ url: 'https://ik.mock/x', thumbnail: 'https://ik.mock/t', id: 'file_x' })),
}));

describe('POST /api/products/:id (SELLER',()=>{
    let sellerId1;
    let sellerId2;

    const signToken=(id,role='seller')=>jwt.sign({id,role},process.env.JWT_SECRET_KEY);

    beforeAll(async()=>{
        sellerId1=new mongoose.Types.ObjectId();
        sellerId2=new mongoose.Types.ObjectId();
    })

    const createProduct=(overrides={})=>{
        return productModel.create({
            title: overrides.title ?? 'To Delete',
            description: overrides.description ?? 'Delete me',
            price: overrides.price ?? { amount: 10, currency: 'USD' },
            seller: overrides.seller ?? sellerId1,
            images: overrides.images ?? [],
        })
    }

    it('requires authentication (401) when no token provided',async()=>{
        const prod=await createProduct();
        const res=await request(app).delete(`/api/products/${prod._id}`)
        expect(res.status).toBe(401);
    })

    it('returns 400 for invalid product id',async()=>{
        const token=signToken(sellerId1.toHexString(),'seller');
        const res=await request(app).delete('/api/products/not_a_valid_id')
        .set('Authorization',`Bearer ${token}`);
        expect(res.status).toBe(400);
    })

    it('returns 404 when product not found',async()=>{
        const token=signToken(sellerId1.toHexString(),'seller');
        const fakeId=new mongoose.Types.ObjectId().toHexString();
        const res=await request(app).delete(`/api/products/${fakeId}`)
        .set('Authorization',`Bearer ${token}`);
        expect(res.status).toBe(404);
    })

    it("forbids deleting another seller's product (403)",async()=>{
        const prod=await createProduct({seller:sellerId2});
        const token=signToken(sellerId1.toHexString(),'seller');
        const res=await request(app).delete(`/api/products/${prod._id}`)
        .set('Authorization',`Bearer ${token}`);
        expect(res.status).toBe(403);
    })

    it('deletes product and returns 200 with confirmation',async()=>{
        const prod=await createProduct({seller:sellerId1});
        const token=signToken(sellerId1.toHexString(),'seller');
        const res=await request(app).delete(`/api/products/${prod._id}`)
        .set('Authorization',`Bearer ${token}`);
        expect(res.status).toBe(200)
        expect(res.body.message || res.body.data).toBeDefined();

        const found = await productModel.findById(prod._id);
        expect(found).toBeNull();
    })
})