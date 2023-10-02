const {
    validationResult
} = require("express-validator");
const dbConnection = require('../config/database')
const bcryptjs = require('bcrypt');
const {
    check
} = require("express-validator");
const nodemailer = require("nodemailer")
const randtoken = require("rand-token")

const getRegisterPage = (req, res) => {
    return res.render('pages/register', {
        currentMenu: 'สมัครสมาชิก',
        Title: 'Clipart Press',
      });
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'slurpeech@gmail.com',
        pass: 'cyoekyuuhppspmmi'
    }
});


//  ดักช่อง Input
let validateReg = [
    check("username", "กรุณากรอกชื่อผู้ใช้").not().isEmpty().custom((value) => {
        return dbConnection.promise().query("SELECT * FROM users WHERE username = ?", [value])
            .then(([rows]) => {
                if (rows.length > 0) {
                    return Promise.reject('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว')
                }
                return true;
            });
    }),
    check("email", "อีเมลนี้ไม่สามารถใช้ได้").isEmail().custom((value) => {
        // generate verification token
        return dbConnection.promise().query("SELECT * FROM users WHERE email = ?", [value]) // เช็คอีเมลใน database
            .then(([rows]) => {
                if (rows.length > 0) {
                    return Promise.reject('อีเมลนี้ถูกใช้งานแล้ว')
                }
                return true;
            });
    }),
    check("password", "รหัสผ่านต้องมีอย่างน้อย 6 ตัว").isLength({
        min: 6
    }),
    check("confirmpassword", "รหัสผ่านไม่ตรงกัน")
    .custom((value, {
        req
    }) => {
        return value === req.body.password
    }),
    check("name", "กรุณากรอกชื่อ").not().isEmpty().custom((value) => {
        return dbConnection.promise().query("SELECT * FROM users WHERE name = ?", [value])
            .then(([rows]) => {
                if (rows.length > 0) {
                    return Promise.reject('มีชื่อบุลคลนี้ในระบบแล้ว')
                }
                return true;
            });
    }),
    check("telephone", "กรุณากรอกหมายเลขโทรศัพท์").not().isEmpty().custom((value) => {
        return dbConnection.promise().query("SELECT * FROM users WHERE telephone = ?", [value])
            .then(([rows]) => {
                if (rows.length > 0) {
                    return Promise.reject('มีคนใช้เบอร์โทรศัพท์นี้แล้ว')
                }
                return true;
            });
    }),
];



// const checkEmailUser = (email) => {
//     return dbConnection.query("SELECT * FROM users WHERE email = ?", [email])
//         .then(([rows]) => {
//             if (rows.length > 0) {
//                 return Promise.reject('อีเมลนี้ถูกใช้งานแล้ว')
//             }
//             return true;
//         });
// }
const createNewUserController = async (req, res) => {
    let errorsArr = [];
    let validationErr = validationResult(req);
    if (!validationErr.isEmpty()) {
        let errors = Object.values(validationErr.mapped());
        errors.forEach((item) => {
            errorsArr.push(item.msg);
        })
        req.flash("errors", errorsArr);
        return res.redirect("/register");
    }
    // console.log(req.body);

    // สร้าง user
    let newUser = {
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        name: req.body.name,
        telephone: req.body.telephone,
    };

    try {
        createNewUser(newUser);
        return res.redirect("/sucessfulRegister"); 
    } catch (err) {
        req.flash("errors", err);
        // console.log(err)
        return res.redirect("/register");
    }
}

const createNewUser = (user) => {
    return new Promise(async (resolve, reject) => {
        try {
            let data = {
                username: user.username,
                password: bcryptjs.hashSync(user.password, 10),
                email: user.email,
                picture: "/uploads/profile/icons-profile.png",
                name: user.name,
                telephone: user.telephone,
                user_role: 0,
                token: randtoken.generate(20)
            };
            dbConnection.query("INSERT INTO users SET ?", [data]);
            const mailOptions = {
                from: 'slurpeech@gmail.com',
                to: data.email,
                subject: 'Verify your email address',
                text: `คลิกที่ลิ้งค์เพื่อยืนยันอีเมล: http://localhost:3000/verify?email=${data.email}&token=${data.token}`
            };
            transporter.sendMail(mailOptions);
  
        } catch (e) {
            reject(e);
        }
 
    })
};

const verify = async (req, res) => {
    // extract email and token from query parameters
    const email = req.query.email;
    const token = req.query.token;
    try {
        // check if email and token match a user in the database
        const [rows] =  dbConnection.query('SELECT * FROM users WHERE email = ? AND token = ?', [email, token]);
        if (rows.length === 0) {
            // email and token don't match, send error message
            res.status(400).send('Invalid verification link');
            return;
        }

        // update user's status to "verified"
         dbConnection.query('UPDATE users SET verified = true WHERE email = ?', [email]);

        // send success message
        res.status(200).send('Email address verified');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

// login 

// let login = (req, res) => {
//     var username = req.body.username
//     var password = req.body.password

//     if (username && password) {
//         var select = ` SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
//         dbConnection.query(select, function (err, results) {
//             if (results.length > 0) {
//                 req.session.loggedin = true;
//                 req.session.username = username;
//                 res.redirect('/')
//             } else {
//                 req.flash("errors", err);
//                 return res.redirect("/login");
//             }
//         })
//     } else {
//         req.flash("errors", err);
//         return res.redirect("/login");
//     }
// };
module.exports = {
    getRegisterPage: getRegisterPage,
    createNewUserController: createNewUserController,
    validateReg: validateReg,
    verify: verify
}