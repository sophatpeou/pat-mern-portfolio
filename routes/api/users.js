const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../../models/User');

// @route POST api/users
// @desc Register User
// @access Public
router.post(
    '/',
    [
        check('name', 'Name is required')
            .not()
            .isEmpty(),
        check('email','Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    ],
        async (req, res) => {
            const errors = validationResult(req);
            if(!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { name, email, password } = req.body;
            try {
                let user = await User.findOne( { email } );
                //if user exist
                if(user) {
                    return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
                }
                //get user avatar
                const avatar = gravatar.url(email, {
                    s: '200',
                    r: 'pg',
                    d: 'mm'
                })

                user = new User({
                    name,
                    email,
                    avatar,
                    password
                });
                //encrypt password
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(password, salt);

                await user.save();

                // return jsonwebtoken
                const payload = {
                    user: {
                        id: user.id
                    }
                }

                jwt.sign(
                    payload,
                    config.get('jwtSecret'),
                    { expiresIn: 360000},
                    (err, token) => { //inside the callback
                        if(err) throw err;
                        res.json({ token });
                    }
                );
                //res.send('User registered');
            } catch(err){
                console.log(err.message);
                res.status(500).send('Server error');
            }
        }
        // console.log(req.body);
);

module.exports = router;