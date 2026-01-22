const paymentModel = require("../models/payment.model");
const axios = require("axios");
const Razorpay = require("razorpay");
const {publishToQueue}=require("../broker/broker.js");

require('dotenv').config();
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});

async function createPayment(req, res) {
    const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];
    try {
        const orderId = req.params.orderId;
        const orderResponse = await axios.get(`http://localhost:3003/api/orders/${orderId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        const price = orderResponse.data.order.totalPrice;
        const order = await razorpay.orders.create(price);
        const payment = await paymentModel.create({
            order: orderId,
            razorpayOrderId: order.id,
            user: req.user.id,
            price: {
                amount: order.amount,
                currency: order.currency
            }
        })
        return res.status(201).json({ message: "Payment initiated", payment });
    } catch (error) {
        console.log("Payment creation error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
}

async function verfiyPayment(req, res) {
    const { razorpayOrderId, paymentId, signature } = req.body;
    const secret = process.env.RAZORPAY_SECRET_KEY;

    try {
        const { validatePaymentVerification } = require('../../node_modules/razorpay/dist/utils/razorpay-utils.js');

        const isValid = validatePaymentVerification({ "order_id": razorpayOrderId, "payment_id": paymentId },
            signature, secret);
        
        if (!isValid) {
            return res.status(400).json({ message: "Invalid signature" });
        }

        const payment = await paymentModel.findOne({ razorpayOrderId, status: "PENDING" });
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        payment.signature = signature;
        payment.paymentId = paymentId;
        payment.status = 'COMPLETED';
        await payment.save();

        await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED",{
            email: req.user.email,
                orderId: payment.order,
                paymentId: payment.paymentId,
                amount: payment.price.amount / 100,
                currency: payment.price.currency,
                fullName: req.user.fullName
        })
        
        res.status(200).json({ message: "Payment verified successfully", payment });
    } catch (error) {
        console.log("Verify payment error:", error);

        await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED",{
            email: req.user.email,
                paymentId: paymentId,
                orderId: razorpayOrderId,
                fullName: req.user.fullName
        })
        return res.status(500).json({ message: "Error verifying payment" })
    }
}

module.exports = {
    createPayment,
    verfiyPayment
}