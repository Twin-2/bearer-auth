'use strict';

require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')


const userSchema = (sequelize, DataTypes) => {
    const model = sequelize.define('User', {
        username: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false, },
        role: { type: DataTypes.ENUM('user', 'writer', 'editor', 'admin'), required: true, defaultValue: 'user' },
        token: {
            type: DataTypes.VIRTUAL,
            get() {
                return jwt.sign({ username: this.username }, process.env.API_SECRET);
            }
        },
        capabilities: {
            type: DataTypes.VIRTUAL,
            get() {
                const acl = {
                    user: ['read'],
                    writer: ['read', 'create'],
                    editor: ['read', 'create', 'update'],
                    admin: ['read', 'create', 'update', 'delete']
                };
                return acl[this.role];
            }
        }
    });

    model.beforeCreate(async (user) => {
        let hashedPass = await bcrypt.hash(user.password, 10);
        user.password = hashedPass;
    });

    // Basic AUTH: Validating strings (username, password) 
    model.authenticateBasic = async function (username, password) {
        const user = await this.findOne({ where: { username } })
        const valid = await bcrypt.compare(password, user.password)
        if (valid) { return user; }
        throw new Error('Invalid User');
    }

    // Bearer AUTH: Validating a token
    model.authenticateWithToken = async function (token) {
        try {
            const parsedToken = await jwt.verify(token, process.env.API_SECRET);
            const user = this.findOne({ where: { username: parsedToken.username } })
            if (user) { return user; }
            throw new Error("User Not Found");
        } catch (e) {
            throw new Error(e.message)
        }
    }

    return model;
}

module.exports = userSchema;