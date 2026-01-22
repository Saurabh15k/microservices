const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redis = require('../db/redis');
const {publishToQueue}=require("../broker/broker");

async function registerUser(req, res) {
    try {
        const { username, email, password, fullName: { firstName, lastName },role } = req.body;

        const isUserExists = await userModel.findOne({
            $or: [{ username }, { email }]
        });
        if (isUserExists) {
            return res.status(409).json({
                message: "User with given email and username already exists."
            })
        };
        const hashPassword = await bcrypt.hash(password, 10);
        const user = await userModel.create({
            username,
            email,
            password: hashPassword,
            fullName: { firstName, lastName },
            role: role || 'user'
        });

        publishToQueue("AUTH_NOTIFICATION.USER_CREATED",{
            id: user._id,
            username: user.username,
            email: user.email,
            fullName:{
                firstName:firstName,
                lastName:lastName
            }
        })

        const token = jwt.sign({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            fullName:user.fullName
        }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000
        });

        const userToReturn = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
            addresses: user.addresses
        }

        return res.status(201).json({ message: 'User registered successfully.', user: userToReturn });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error.'
        })
    }
};

async function loginUser(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await userModel.findOne({ email }).select('+password')

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000
        });

        const userToReturn = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
            addresses: user.addresses
        };

        return res.status(200).json({ message: 'User loggedIn successfully.', user: userToReturn });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}

async function getCurrentUser(req, res) {
    return res.status(200).json({
        message: 'Current user fecthed successfully.',
        user: req.user
    })
}

async function logoutUser(req, res) {
    const { token } = req.cookies || {}
    if (token) {
        try {
            await redis.set(`blacklist:${token}`, 'true', 'EX', 24 * 60 * 60)
        } catch (err) {
            console.error('Failed to blacklist token in redis:', err)
        }
    }
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
    })
    return res.status(200).json({ message: "User logged out successfully." })
}

async function getUserAddresses(req, res) {
    const id = req.user.id
    try {
        const user = await userModel.findById(id).select('addresses')
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        return res.status(200).json({
            message: "User addresses fecthed successfully.",
            addresses: user.addresses
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}

async function addUserAddresses(req,res){
    const id=req.user.id
    const {street,city,state,zip,country,isDefault}=req.body
    const user=await userModel.findOneAndUpdate({_id:id},{
        $push:{
            addresses:{street,city,state,zip,country,isDefault:isDefault || false}
        }
    },{new:true})
    if(!user){
        return res.status(404).json({message:'User not found.'})
    }
    return res.status(201).json({
        message:'Address added successfully.',
        address:user.addresses[user.addresses.length-1]
    })
}

async function deleteUserAddresses(req,res) {
    try {
        const id = req.user.id;
        const { addressId } = req.params;

        const addressOwner = await userModel.findOne({ _id: id, 'addresses._id': addressId });
        if (!addressOwner) {
            return res.status(404).json({ message: 'Address not found.' });
        }

        const user = await userModel.findOneAndUpdate(
            { _id: id },
            { $pull: { addresses: { _id: addressId } } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const stillExists = user.addresses.some(addr => addr._id.toString() === addressId);
        if (stillExists) {
            return res.status(500).json({ message: 'Failed to delete address.' });
        }

        return res.status(200).json({
            message: 'Address deleted successfully.',
            addresses: user.addresses
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    getUserAddresses,
    addUserAddresses,
    deleteUserAddresses
};