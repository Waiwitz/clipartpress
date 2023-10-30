const crypto = require('crypto');
const nodemailer = require('nodemailer');
const dbConnection = require('../config/database');
const bcryptjs = require('bcrypt');
const {
    error
} = require('console');

let identify = async (req, res) => {
    const email = req.body.email;
    try {
        await dbConnection.promise().query('SELECT * FROM users WHERE email = ?', [email])
            .then(async ([row]) => {
                if (row.length > 0) {
                    const token = crypto.randomBytes(20).toString('hex');
                    const exp = new Date(Date.now() + 3600000); // Token expires in 1 hour
                    await dbConnection.promise().query('UPDATE users SET reset_token = ?, reset_token_exp = ? WHERE email = ?', [token, exp, email]).then(([row]) => {
                        // Send password reset email
                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: 'slurpeech@gmail.com', 
                                pass: 'cyoekyuuhppspmmi'
                            }
                        });

                        const mailOptions = {
                            from: 'slurpeech@gmail.com',
                            to: email,
                            subject: 'Password Reset Request',
                            text: `Click the following link to reset your password: http://localhost:3000/resetpassword?token=${token}`
                        };

                        transporter.sendMail(mailOptions, (error) => {
                            if (error) {
                                console.log(error);
                                return res.render('pages/login', {
                                    errors: error
                                });
                            }
                        });

                        res.render('pages/login', {
                            success_msg: ['ระบบส่งลิงค์รีเซ็ทรหัสผ่านไปให้ทางอีเมลของคุณแล้ว']
                        });
                    })
                } else {
                    console.log(row[0]);
                    res.render('pages/forgetpw', {
                        errors: ['ไม่เจออีเมลนี้ในระบบ']
                    });
                }
            })
    } catch (error) {
        console.log(error);
    }
}

let reset = async (req, res) => {
    const password = req.body.password;
    const confirmPw = req.body.confirmPw
    const token = req.query.token;
    // console.log(token);
    try {
        await dbConnection.promise().query('SELECT * FROM users WHERE reset_token = ? AND reset_token_exp > ?', [token, new Date()])
            .then(async ([row]) => {
                if (row.length > 0) {
                    const email = row[0].email;
                    const newPassword = bcryptjs.hashSync(password, 10);
                    if (confirmPw === password) {
                         dbConnection.query('UPDATE users SET password = ?,  reset_token = NULL, reset_token_exp = NULL WHERE email = ?', [newPassword, email]);
                        res.redirect(`/success-reset-password?token=${token}`);
                    } else {
                        req.flash("error_msg", 'รหัสผ่านไม่ตรงกัน กรุณาลองอีกครั้ง');
                        return res.redirect(`/resetpassword?token=${token}`);
                    }
                } else {
                    res.redirect('/');
                }
            });
    } catch (error) {
        res.render('pages/login', {
            errors: error
        });
    }
}

module.exports = {
    identify: identify,
    reset: reset
}