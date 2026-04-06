import userModel from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import User from "../models/user.model.js";

import { decode } from "punycode";
import { futimesSync } from "fs";



export async function register(req, res) {
    try {
        const { username, email, password } = req.body;
        const isAlreadyRegistered = await userModel.findOne({
            $or: [
                { username },
                { email }
            ]
        });

        if (isAlreadyRegistered) {
            return res.status(409).json({
                message: "Username or Email already exist"
            });
        }
        const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

        const user = await userModel.create({
            username,
            email,
            password: hashedPassword
        });


        const refreshToken = jwt.sign(
            { id: user._id },
            config.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

        const session = await sessionModel.create({
            user: user._id,
            refreshToken: refreshTokenHash,
            userAgent: req.headers["user-agent"],
            ip: req.ip,
            revoked: false
        });

        const accesstoken = jwt.sign({
            id: user._id, sessionID: session._id
        },
            config.JWT_SECRET,
            { expiresIn: "1h" }
        )



        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000  //7day
        });



        res.status(201).json({
            message: "User registerd successfully",
            user: {
                username: user.username,
                email: user.email,
            },
            token: accesstoken,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: error.message
        });
    }
};

export async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const user = await userModel.findOne({ email })
    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
    const isPasswordValid = hashedPassword === user.password;
    if (hashedPassword !== user.password) {
        return res.status(401).json({
            message: "Invalid email or Password"
        })
    }
    const refreshToken = jwt.sign({
        id: user._id
    }, config.JWT_SECRET, {
        expiresIn: "7d"
    }
    )
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const session = await sessionModel.create({
        user: user._id,
        refreshToken: refreshToken,
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    });
    const accessToken = jwt.sign({
        id: user._id,
        sessionID: session._id
    }, config.JWT_SECRET,
        {
            expiresIn: "15m"
        });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 //7days
    });
    res.status(200).json({
        message: "Logged in successfully",
        user: {
            username: user.username,
            email: user.email
        },
        accessToken,
    });
}


export const getME = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "No token" });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);

    } catch (error) {
        console.error(error);
        res.status(401).json({ message: "Invalid token" });
    }
};

export async function refreshToken(req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh token not found"
        });
    }
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET)

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const session = await sessionModel.findOne({
        refreshToken: refreshTokenHash,
        revoked: false
    })
    if (!session) {
        return res.status(401).json({
            message: "Invalid refresh token"
        });
    }

    const accessToken = jwt.sign({
        id: decoded.id
    }, config.JWT_SECRET, {
        expiresIn: "1h"
    })
    const newrefreshToken = jwt.sign({
        id: decoded.id
    }, config.JWT_SECRET, {
        expiresIn: "7d"
    })

    const newrefreshTokenHash = crypto.createHash("sha256").update(newrefreshToken).digest("hex");
    session.refreshTokenHash = newrefreshTokenHash;
    await session.save();

    res.cookie("refreshToken", newrefreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 //7day
    })
    res.status(200).json({
        message: "Access token refreshed successfully",
        accessToken
    });
}

export async function logout(req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(400).json({
            message: "Refresh token not found"
        });
    }
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.findOne({
        refreshToken: refreshTokenHash,
        revoked: false
    })
    if (!session) {
        return res.status(400).json({
            message: "Invalid refresh token"
        })
    }
    session.revoked = true;
    await session.save();

    res.clearCookie("refreshToken")
    res.status(200).json({
        message: "Logged out successfully"
    })
}

export async function logoutall(req, res) {
    try {
        const refreToken = req.cookies.refreshToken;
        if (!refreToken) {
            return res.status(400).json({
                message: "Refresh token not found"
            });
        }
        // verify token safety
        const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
        // revoke all active sessions
        await sessionModel.updateMany(
            {
                user: decoded.id,
                revoked: false
            },
            {
                $set: { revoked: true }
            }
        );
        // clear cookie 
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
            samaSite: "strict"
        });
        return res.status(200).json({
            message: "Logged out from all devices successfully"
        });
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
            error: error.message
        });
    }

}