const dbConnection = require("../config/database");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');

// -------------------------------

const login = (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        if (!username || !password) {
            return res.render('pages/login', {
                errors: ['กรุณากรอกอีเมลและรหัสผ่าน']
            });
        }
        dbConnection.query('SELECT * FROM users WHERE username = ?', [username])
            .then(async ([row]) => {
                // if (err) throw (err)
                if (!row[0] || row[0].deleted_at !== null) {
                    return res.render('pages/login', {
                        errors: ['ไม่มีผู้ใช้ชื่อนี้']
                    });
                }

                if (row[0].verified == 0) {
                    return res.render('pages/login', {
                        warnings: ['คุณยังไม่ได้ยืนยันอีเมล สามารถยืนยันอีเมลได้จากลิงค์ที่ระบบส่งไป']
                    });
                }
                await bcrypt.compare(password, row[0].password).then(compare_result => {
                        console.log(compare_result)
                        if (compare_result) {

                            req.session.isLoggedIn = true;
                            // req.user = row[0];
                            console.log(req.session.user_id)
                            req.session.user_id = row[0].user_id;
                            req.session.username = row[0].username;
                            req.session.email = row[0].email;
                            req.session.name = row[0].name;
                            req.session.telephone = row[0].telephone;
                            req.session.lineid = row[0].lineid;
                            req.session.picture = row[0].picture;
                            req.session.role = row[0].user_role;
                            req.session.verified = row[0].verified;
                            const id = row[0].user_id;
                            const role = row[0].user_role;
                            console.log(role)

                            const token = jwt.sign({
                                id
                            }, process.env.JWT_SECRET, {
                                expiresIn: 86400
                            })
                            req.session.token = token;
                            // dbConnection.query('SELECT * FROM chats WHERE sender_id = ?' [d])
                            if (role === 1) {
                                res.status(200).redirect("/admin/dashborad");
                            } else {
                                res.status(200).redirect("/");
                            }
  
                            // if (remember) {
                            //     req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
                            // } else {
                            //     req.session.cookie.expires = false; 
                            // }

                        } else {
                            res.render('pages/login', {
                                // currentMenu: 'เข้าสู่ระบบ',
                                errors: ['รหัสผ่านไม่ถูกต้อง']
                            });
                        }
                    })
                    .catch(err => {
                        if (err) throw err;
                    });
            })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Error occured while trying to login'
        });
    }
}


// --------------------------------
let getPageLogin = (req, res) => {
    return res.render("pages/login", {
        currentMenu: 'เข้าสู่ระบบ',
        errors: req.flash("errors"),
        Title: 'Clipart Press',
    });
};


// ---------------------------------

let checkLoggedIn = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.render('pages/login');
    }
    next();
};

let checkLoggedOut = (req, res, next) => {
    if (req.session.isLoggedIn === true) {
        return res.redirect('/');
    }
    next();
};

let postLogOut = (req, res) => {
    req.session.destroy(function (err) {
        return res.redirect("/");
    });
};

module.exports = {
    login: login,
    getPageLogin: getPageLogin,
    checkLoggedIn: checkLoggedIn,
    checkLoggedOut: checkLoggedOut,
    postLogOut: postLogOut,
};