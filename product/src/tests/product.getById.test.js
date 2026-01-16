const request=require('supertest');
const app=require('../app');
const productModel=require('../models/product.model');
const mongoose=require('mongoose');

jest.mock('../services/imagekit.service', () => ({
    uploadImage: jest.fn(async () => ({ url: 'https://ik.mock/x', thumbnail: 'https://ik.mock/t', id: 'file_x' })),
}));

describe('GET /api/products/:id',()=>{
    
    beforeAll(async()=>{
        await productModel.syncIndexes();
    })

    const createProduct = (overrides = {}) => {
        return productModel.create({
            title: overrides.title ?? 'ById Product',
            description: overrides.description ?? 'Desc',
            price: overrides.price ?? { amount: 42, currency: 'USD' },
            seller: overrides.seller ?? new mongoose.Types.ObjectId(),
            images: overrides.images ?? [],
        });
    };

    it('returns 400 for invalid object id',async()=>{
        const res=await request(app).get('/api/products/not_a_valid_id');
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch('Invalid product id.')
    })

    it('returns 404 when product not found',async()=>{
        const id=new mongoose.Types.ObjectId();
        const res=await request(app).get(`/api/products/${id}`);
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch('Product not found.');
    })

    it('returns product when found',async()=>{
        const product=await createProduct({ title: 'Found Product' });
        const res=await request(app).get(`/api/products/${product._id}`);
        expect(res.status).toBe(200);
        expect(res.body?.data?._id).toBe(product._id.toString());
        expect(res.body?.data?.title).toBe('Found Product');
    })
})