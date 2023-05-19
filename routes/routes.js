const express = require('express');
const registerController = require('../controllers/registerController');
const loginController = require('../controllers/loginController');
const userController = require('../controllers/userController')
const adminController = require('../controllers/adminController')
const cart = require('../controllers/cart')
let router = express.Router();
const verifyToken = require('../config/verifyToken');
const dbConnection = require("../config/database");
const resetPassword = require("../controllers/resetPassword");


// const initPassportLocal = require('../controllers/passport')
// initPassportLocal()


let Routes = (app) => {

    router.get('/successfulreset', (req, res) => {
        res.render('pages/successResetPw', {
            currentMenu: 'Success Reset Password',
            Title: 'Clipart Press',
        });
    });
    // 
    // router.get('/',loginController.checkLoggedIn,(req, res) => res.render('pages/index', {
    //     title: 'หน้าแรก', username: req.session.username
    // })); 
    router.get('/', (req, res) => {
        res.render('pages/index', {
            currentMenu: 'หน้าแรก',
            Title: 'Clipart Press',
        });
    });

    // สมัครสมาชิก
    router.get("/register", registerController.getRegisterPage, loginController.checkLoggedOut);
    router.post("/register", registerController.validateReg, registerController.createNewUserController);
    router.get("/verify", registerController.verify);
    // เข้าสู่ระบบ
    router.get("/login", loginController.checkLoggedOut, loginController.getPageLogin);
    router.post("/login", loginController.login);
    // router.post('/login',(req,res,next)=>{
    //     passport.authenticate('local',{
    //             successRedirect : '/',
    //             failureRedirect : '/login',
    //             failureFlash : true,
    //         })(req,res,next);
    //      })

    // ออกจากระบบ
    router.get("/logout", loginController.postLogOut);

    // รีเซ็ตรหัสผ่าน
    router.get('/identify', (req, res) => {
        res.render('pages/forgetpw', {
            currentMenu: 'ลืมรหัสผ่าน',
            errors: req.flash("errors"),
            Title: 'Clipart Press',
        });
    });
    router.post("/identify", resetPassword.identify)

    router.get("/resetpassword", (req, res) => {
        const token = req.query.token;
        // console.log(token);
        res.render('pages/resetPw', {
            token,
            errors: req.flash("errors"),
            Title: 'Clipart Press',
        });
    })
    router.post("/resetpassword", resetPassword.reset);

    router.get('/success-reset-password', (req, res) => {
        res.render('pages/successResetPw', {
            errors: req.flash("errors"),
            Title: 'Clipart Press',
        });
    });

    // ผู้ใช้ ************************************************************************
    // แก้ไขโปรไฟล์
    router.get('/userprofile', verifyToken, (req, res) => {
        dbConnection.query('SELECT * FROM users WHERE user_id =?', [req.session.user_id]).then(([data]) => {
            // console.log(data)
            res.render('pages/userprofile', {
                currentMenu: 'โปรไฟล์',
                user: data[0],
                currentLink: "userprofile"
            })
        })
    });
    router.post("/userprofile", userController.upload_profile.single('profilePicture'), userController.updateProfile)

    // ที่อยู่ 
    router.get('/address', verifyToken, (req, res) => {
        dbConnection.query('SELECT * FROM address WHERE user_id = ? AND deleted_at is NULL', [req.session.user_id]).then(([data]) => {
            res.render('pages/address', {
                currentMenu: 'ที่อยู่',
                address: data,
                currentLink: "address"
            })
        })
    });
    router.post("/address", userController.checkInputAddress, userController.addAddress)
    router.post("/updateAddress", userController.editAddress)
    router.post("/deleteAddress", userController.deleteAddress)

    // เปลี่ยนรหัสผ่าน
    router.get('/changepassword', verifyToken, (req, res) => {
        res.render('pages/changepw', {
            currentMenu: 'เปลี่ยนรหัสผ่าน',
            currentLink: "changepw"
        })
    });
    router.post("/changepassword", userController.validatePassword, userController.changepassword)


    // หน้าสินค้าทั้งหมด
    router.get('/product/all/', (req, res) => {
        dbConnection.query('SELECT * FROM categories WHERE deleted_at is null')
            .then(([categories]) => {
                dbConnection.query('SELECT * FROM product WHERE deleted_at is null')
                    .then(([products]) => {
                        res.render('pages/product', {
                            currentMenu: "สินค้า",
                            types: categories,
                            products: products,
                            currentLink: "allproduct"
                        })
                    })

            })
    });
    router.get('/product/categories/:id', (req, res) => {
        const categoryId = req.params.id;
        dbConnection.query('SELECT * FROM categories WHERE deleted_at is null')
            .then(([categories]) => {
                dbConnection.query(`SELECT product.*, categories.* FROM product INNER JOIN categories ON product.categories_id = categories.categories_id WHERE product.deleted_at is null AND categories.categories_id = ${categoryId}`)
                    .then(([products]) => {
                        res.render('pages/product', {
                            currentMenu: "สินค้า",
                            types: categories,
                            products: products,
                            currentLink: categories.categories_name
                        })
                    })

            })
    });

    // หน้ารายละเอียดสินค้าและเลือกสเปค
    router.get('/product/item/:id', (req, res) => {
        const productId = req.params.id;
        dbConnection.query(`SELECT p.*, s.*, o.* FROM product p JOIN specification s ON s.product_id = p.product_id ` +
                `JOIN options o ON o.spec_id = s.spec_id WHERE p.product_id = ${productId}`)
            .then(([products]) => {
                const spec = {};
                const option = {};
                products.forEach((rows) => {
                    if (!spec[rows.spec_name]) {
                        spec[rows.spec_name] = []; // initialize an empty array for this spec if it hasn't been added to the object yet
                    }

                    spec[rows.spec_name].push({
                        spec_id: rows.spec_id,
                        spec_name: rows.spec_name,
                        option_id: rows.option_id,
                        option_name: rows.option_name,
                        option_perPrice: rows.price_per_unit
                    })
                });



                res.render('pages/product_detail', {
                    currentMenu: "",
                    products: products[0],
                    specs: spec,
                    currentLink: ""
                })
            })

    });

    router.post('/addtocart', cart.upload.single('designfile'), cart.insertCart)
    router.get('/cart', (req, res) => {
        dbConnection.query(`SELECT c.*, p.* From cart c JOIN product p ON c.product_id = p.product_id`)
            .then(([products]) => {
                res.render('pages/cart', {
                    currentMenu: "รถเข็น",
                    cartlist: products,
                    currentLink: ""
                })
            })

    });

    router.get('/example', (req, res) => {
        res.render('pages/example', {
            currentMenu: 'ตัวอย่างงาน',
            Title: 'Clipart Press',
            currentLink: "example"
        });
    });

    router.get('/contact', (req, res) => {
        res.render('pages/contact', {
            currentMenu: 'ติดต่อเรา',
            Title: 'Clipart Press',
            currentLink: "contact"
        });
    });
    // ---------------------------------------------------------------------------------------------------
    // แอดมิน
    router.get('/product-list', (req, res) => {
        dbConnection.query('SELECT product.*, categories.categories_name FROM product INNER JOIN categories ON product.categories_id = categories.categories_id' +
            ' WHERE product.deleted_at is NULL').then(([data]) => {
            // console.log(data)
            res.render('pages/product-list', {
                products: data,
                currentLink: "allproduct"
            })
        })
    });

    // เพิ่มสินค้า 
    router.get('/addproduct', (req, res) => {
        dbConnection.query('SELECT * FROM categories WHERE deleted_at is NULL').then(([data]) => {
            // console.log(data)
            res.render('pages/addproduct', {
                types: data,
                currentLink: "addproduct"
            })
        })
    });
    router.post("/addproduct", adminController.upload_product.single('imgproduct'), adminController.addProduct);
    router.post("/updateProduct", adminController.upload_product.single('new_imgproduct'), adminController.updateProduct); //แก้ไขสินค้า

    router.get('/product/edit/:id', (req, res) => {
        dbConnection.query('SELECT * FROM categories WHERE deleted_at is NULL').then(([type]) => { // ดึงประเภท
            const productId = req.params.id;
            dbConnection.query('SELECT * FROM product WHERE product_id = ?', [productId]) // ข้อมูลสินค้า
                .then(([result]) => {
                    let product = result[0];
                    dbConnection.query('SELECT * FROM specification WHERE product_id = ?', [productId]) // ชื่อสเปค
                        .then(([specResults]) => {
                            let specs = [];
                            for (let i = 0; i < specResults.length; i++) {
                                let spec = {
                                    spec_id: specResults[i].spec_id,
                                    spec_name: specResults[i].spec_name,
                                    options: []
                                };
                                const specid = specResults[i].spec_id;
                                dbConnection.query('SELECT * FROM options WHERE spec_id = ?', [specid]) // ออฟชั่น
                                    .then(([optionResults]) => {
                                        for (let j = 0; j < optionResults.length; j++) {
                                            let option = {
                                                option_id: optionResults[j].option_id,
                                                option_name: optionResults[j].option_name,
                                                price_per_unit: optionResults[j].price_per_unit
                                            };
                                            spec.options.push(option);
                                        }
                                        specs.push(spec);

                                        if (i === specResults.length - 1) {
                                            // console.log(specid)
                                            res.render('pages/editproduct', {
                                                types: type,
                                                product: product,
                                                specs: specs,
                                                currentLink: "editproduct"
                                            });
                                        }
                                        // res.render('pages/editproduct', {
                                        //     types: type,
                                        //     product: product[0],
                                        //     specs: specs,
                                        //     options: options,
                                        //     currentLink: "editproduct"
                                        // })
                                    })
                            }
                        })

                })
        })
    });
    router.post("/deleteProduct", adminController.deleteProduct);

    // หน้าประเภท
    router.get('/typeproduct', (req, res) => {
        dbConnection.query('SELECT * FROM categories WHERE deleted_at is NULL').then(([data]) => {
            // console.log(data)
            res.render('pages/typeproduct', {
                types: data,
                currentLink: "typeproduct"
            })
        })
        // res.render('pages/typeproduct',{
        //     currentLink: "typeproduct",
        // })
    });

    router.post("/addtype", adminController.addType) //เพิ่มประเภท
    router.post("/updateType", adminController.editType) //แก้ไขประเภท
    router.post("/deleteType", adminController.deleteType) //แก้ไขประเภท
    // router.get('/typeproduct/:id',(req, res) => {
    //     dbConnection.query('SELECT * FROM categories WHERE categoriesID = ?', [req.params.categoriesID]).then(([data]) => {
    //         res.render('pages/typeproduct', {types : data[0], currentLink: "typeproduct"
    //         })
    //     })
    // });
    router.get('/member', (req, res) => {
        dbConnection.query('SELECT * FROM users WHERE deleted_at is NULL AND user_role = 0').then(([data]) => {
            // console.log(data)
            res.render('pages/member', {
                user: data,
                currentLink: "member"
            })
        })
    });

    router.post("/deleteUser", adminController.deleteUser)

    return app.use("/", router);
}
module.exports = Routes;