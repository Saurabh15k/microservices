const { default: mongoose } = require('mongoose');
const productModel = require('../models/product.model');
const { uploadImage } = require('../services/imagekit.service');
const {publishToQueue}=require("../broker/broker");


async function createProduct(req, res) {
    try {
        const { title, description, priceAmount, priceCurrency = 'INR' } = req.body;
        const price = {
            amount: Number(priceAmount),
            currency: priceCurrency
        }
        const seller = req.user.id;
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'At least one image is required' });
        }


        const images = await Promise.all((req.files || []).map(file => uploadImage({ buffer: file.buffer })));
        const product = await productModel.create({
            title, description, price, seller, images
        })

        await Promise.all([
            await publishToQueue("PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED",product),
            await publishToQueue("PRODUCT_NOTIFICATION.PRODUCT_CREATED",{
            email: req.user.email,
            productId: product._id,
            sellerId: seller
        })
        ]);
        
        return res.status(201).json({
            message: 'Product created successfully.',
            data: product
        })
    } catch (error) {
        console.error('Create product error', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getProducts(req, res) {
    try {
        const { q, minprice, maxprice, skip = 0, limit = 20 } = req.query;
        const filter = {};
        if (q) {
            filter.$text = { $search: q };
        }
        if (minprice) {
            filter['price.amount'] = { ...filter['price.amount'], $gte: Number(minprice) };
        }
        if (maxprice) {
            filter['price.amount'] = { ...filter['price.amount'], $lte: Number(maxprice) };
        }

        const products = await productModel.find(filter).skip(Number(skip)).limit(Math.min(Number(limit), 20));

        return res.status(200).json({ data: products });
    } catch (error) {
        console.log('Get products error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getProductById(req,res) {
    try {
        const {id}=req.params;
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({message:'Invalid product id.'})
        }
        const product=await productModel.findById({_id:id});
        if(!product){
            return res.status(404).json({message:"Product not found."})
        }
        return res.status(200).json({
            message:'Product fetched successfully.',
            data:product
        });
    } catch (error) {
        console.log('Get product by id error:',error);
        return res.status(500).json({message:"Internal server errror."})
    }
}

async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid product id.' })
        }
        const product = await productModel.findById({ _id: id });
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' })
        }
        if (product.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: You can only update your own products.' })
        }
        const allowedUpdated = ['title', 'description', 'price'];
        const updates=req.body ?? {};
        for (const key of Object.keys(updates)) {
            if (allowedUpdated.includes(key)) {
                if (key === 'price' && typeof req.body.price === 'object') {
                    if (updates.price.amount !== undefined) {
                        product.price.amount = Number(updates.price.amount);
                    }
                    if (updates.price.currency !== undefined) {
                        product.price.currency = updates.price.currency;
                    }
                } else {
                    product[key] = updates[key];
                }
            }
        }
        await product.save();
        return res.status(200).json({
            message: 'Product updated successfully.',
            data: product
        });
    } catch (error) {
        console.log('Update product error:',error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function deleteProduct(req,res){
    try {
        const {id}=req.params;
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({messgae:"Invalid product id."})
        }
        const product=await productModel.findOne({_id:id});
        if(!product){
            return res.status(404).json({message:"Product not found."})
        }
        if(product.seller.toString() !==req.user.id){
            return res.status(403).json({message:'Forbidden: You can only delete your own products.'})
        }
        await productModel.findOneAndDelete({_id:id});
        return res.status(200).json({message:'Product deleted successfully.'})
    } catch (error) {
        console.log('Delete product error:',error);
        return res.status(500).json({message:"Internal server error."})
    }
}

async function getProductBySeller(req,res) {
    const seller=req.user;
    const {skip=0,limit=20}=req.query;
    const products=await productModel.find({seller:seller.id}).skip(skip).limit(Math.min(limit,20));
    return res.status(200).json({
        message:"Seller's products fetched successfully.",
        data:products
    })
}

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    deleteProduct,
    updateProduct,
    getProductBySeller
}