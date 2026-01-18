const cartModel = require('../models/cart.model');

async function addItemToCart(req, res) {
    const { productId, quantity } = req.body;
    const user = req.user;

    let cart = await cartModel.findOne({ user: user.id });
    if (!cart) {
        cart = new cartModel({ user: user.id, items: [] })
    }
    const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (existingItemIndex >= 0) {
        cart.items[existingItemIndex].quantity += quantity;
    } else {
        cart.items.push({ productId, quantity });
    }
    await cart.save();
    res.status(200).json({
        message: 'Item added to cart successfully.',
        cart
    })
}

async function updateItemQuantity(req, res) {
    const { productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;

    const cart = await cartModel.findOne({ user: user.id });
    if (!cart) {
        return res.status(404).json({ message: 'Cart not found.' });
    }
    const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (existingItemIndex < 0) {
        return res.status(404).json({ message: 'Item not found' });
    }
    cart.items[existingItemIndex].quantity = quantity;
    await cart.save();
    return res.status(200).json({
        message: 'Item updated successfully.',
        cart
    })
}

async function getCart(req, res) {
    const user = req.user;

    let cart = await cartModel.findOne({ user: user.id });
    if (!cart) {
        cart = new cartModel({ user: user.id, items: [] });
        await cart.save();
    }

    res.status(200).json({
        message: "Cart retrived successfully.",
        cart,
        totals: {
            itemCount: cart.items.length,
            totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0)
        }
    })
}

module.exports = {
    addItemToCart,
    updateItemQuantity,
    getCart
}