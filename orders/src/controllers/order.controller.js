const orderModel=require("../models/order.model");
const axios=require("axios");

async function createOrder(req,res) {
    const user=req.user;
    const token=req.cookies?.token || req.headers?.authorization?.split(" ")[1];
    try {
        const cartResponse=await axios.get(`http://localhost:3002/api/cart`,{
            headers:{
                Authorization:`Bearer ${token}`
            }
        })
        
        const products=await Promise.all(cartResponse.data.cart.items.map(async(item)=>{
            return (await axios.get(`http://localhost:3001/api/products/${item.productId}`,{
                headers:{Authorization:`Bearer ${token}`}
            })).data.data
        }))
        let priceAmount=0;

        const orderItems=cartResponse.data.cart.items.map((item,index)=>{
            const product=products.find(p=>p._id === item.productId)
            if(!product.stock || product.stock<item.quantity){
                throw new Error(`Product ${product.title} is out of stock or insufficient stock`)
            }
            const itemTotal=product.price.amount * item.quantity;
            priceAmount +=itemTotal;

            return {
                product:item.productId,
                quantity:item.quantity,
                price:{
                    amount:itemTotal,
                    currency:product.price.currency
                }
            }
        })

        const order=await orderModel.create({
            user:user.id,
            items:orderItems,
            price:{
                amount:priceAmount,
                currency:'INR',
            },
            shippingAddress:{
                street: req.body.shippingAddress.street,
                city: req.body.shippingAddress.city,
                state: req.body.shippingAddress.state,
                zip: req.body.shippingAddress.zip,
                country: req.body.shippingAddress.country,
            }
        })
        res.status(201).json({order})
    } catch (error) {
        console.log(error)
        return res.status()
    }
}

module.exports={
    createOrder,
}