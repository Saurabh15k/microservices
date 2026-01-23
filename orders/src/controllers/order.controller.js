const orderModel = require("../models/order.model");
const axios = require("axios");
const {publishToQueue}=require("../broker/broker");

async function createOrder(req, res) {
    const user = req.user;
    const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];
    try {
        const cartResponse = await axios.get(`http://localhost:3002/api/cart`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const products = await Promise.all(cartResponse.data.cart.items.map(async (item) => {
            return (await axios.get(`http://localhost:3001/api/products/${item.productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })).data.data
        }))
        let priceAmount = 0;

        const orderItems = cartResponse.data.cart.items.map((item, index) => {
            const product = products.find(p => p._id === item.productId)
            if (!product.stock || product.stock < item.quantity) {
                throw new Error(`Product ${product.title} is out of stock or insufficient stock`)
            }
            const itemTotal = product.price.amount * item.quantity;
            priceAmount += itemTotal;

            return {
                product: item.productId,
                quantity: item.quantity,
                price: {
                    amount: itemTotal,
                    currency: product.price.currency
                }
            }
        })

        const order = await orderModel.create({
            user: user.id,
            items: orderItems,
            totalPrice: {
                amount: priceAmount,
                currency: 'INR',
            },
            status: 'PENDING',
            shippingAddress: {
                street: req.body.shippingAddress.street,
                city: req.body.shippingAddress.city,
                state: req.body.shippingAddress.state,
                zip: req.body.shippingAddress.zip,
                country: req.body.shippingAddress.country,
            }
        })

        await publishToQueue("ORDER_SELLER_DASHBOARD.ORDER_CREATED",order);
        res.status(201).json({ order })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

async function getMyOrders(req, res) {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const [orders, totalOrders] = await Promise.all([
            orderModel.find({ user: user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            orderModel.countDocuments({ user: user.id })
        ])
        return res.status(200).json({
            message: "Your orders fetched successfully",
            orders,
            meta: {
                total: totalOrders,
                page,
                limit
            }
        })
    } catch (error) {
        console.log("Get my orders error:", error);
        return res.status(500).json("Internal server error")
    }
}

async function getOrderById(req, res) {
    const user = req.user;
    const orderId = req.params.id;
    try {
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" })
        }
        if (order.user.toString() !== user.id) {
            return res.status(403).json({ message: "Forbidden: You do not have access to this order" });
        }
        res.status(200).json({
            message: "Order fetched successfully",
            order
        })
    } catch (error) {
        console.log("Get order by ID error:", error);
        return res.status(500).json({ message: "Internal server error" })
    }
}

async function cancelOrderById(req, res) {
    const user = req.user;
    const orderId = req.params.id;
    try {
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" })
        }
        if (order.user.toString() !== user.id) {
            return res.status(403).json({ message: "Forbidden: You do not have access to this order" });
        }
        if (order.status !== 'PENDING') {
            return res.status(409).json({ message: "Order cannot be cancelled at this stage" });
        }
        order.status = 'CANCELLED';
        await order.save();
        return res.status(200).json({
            message: "Order cancelled successfully",
            order
        })
    } catch (error) {
        console.log("Cancel order error:", error);
        return res.status(500).json({ message: "Internal server error" })
    }
}

async function updateOrderAddress(req, res) {
    try {
        const user = req.user;
        const orderId = req.params.id;
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.user.toString() !== user.id) {
            return res.status(403).json({ message: "Forbidden: You do not have access to this order" });
        }
        if (order.status !== 'PENDING') {
            return res.status(409).json({ message: "Address update is not allowed at this stage" })
        }
        order.shippingAddress = {
            street:req.body.shippingAddress.street,
            city:req.body.shippingAddress.city,
            state:req.body.shippingAddress.state,
            zip:req.body.shippingAddress.zip,
            country:req.body.shippingAddress.country,
        };
        await order.save();
        return res.status(200).json({
            message:"Order address updated successfully",
            order
        })
    } catch (error) {
        console.log("Update order address error:", error);
        return res.status(500).json({ message: "Internal server error" })
    }
}

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrderById,
    updateOrderAddress
}