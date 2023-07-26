const express = require('express');
const registerController = require('../controllers/registerController');
const loginController = require('../controllers/loginController');
const userController = require('../controllers/userController')
const adminController = require('../controllers/productsController')
const cart = require('../controllers/cart')
let router = express.Router();
const verifyToken = require('../config/verifyToken');
const dbConnection = require("../config/database");
const resetPassword = require("../controllers/resetPassword");
const optionsController = require("../controllers/optionsController");


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
        dbConnection.query('SELECT * FROM product WHERE deleted_at is null')
            .then(([products]) => {
                res.render('pages/product', {
                    currentMenu: "สินค้า",
                    products: products,
                    currentLink: "allproduct"
                })
            })
    });
    // router.get('/product/categories/:id', (req, res) => {
    //     const categoryId = req.params.id;
    //     dbConnection.query('SELECT * FROM categories WHERE deleted_at is null')
    //         .then(([categories]) => {
    //             dbConnection.query(`SELECT product.*, categories.* FROM product INNER JOIN categories ON product.categories_id = categories.categories_id WHERE product.deleted_at is null AND categories.categories_id = ${categoryId}`)
    //                 .then(([products]) => {
    //                     res.render('pages/product', {
    //                         currentMenu: "สินค้า",
    //                         types: categories,
    //                         products: products,
    //                         currentLink: categories.categories_name
    //                     })
    //                 })

    //         })
    // });

    // หน้ารายละเอียดสินค้าและเลือกสเปค
    router.get('/product/item/:id', (req, res) => {
        const productId = req.params.id;
        dbConnection.query(`SELECT p.*, o.* FROM product p JOIN options o ON JSON_CONTAINS(o.product_id, JSON_ARRAY(?)) WHERE p.product_id = ?`,
                [productId, productId])
            .then(([rows]) => {
                console.log(rows);
                const product = {
                    product_id: rows[0].product_id,
                    productName: rows[0].productName,
                    discount: rows[0].status,
                    picture: rows[0].picture,
                    categories: rows[0].categories,
                    description: rows[0].description
                };

                const options = rows.map(row => {
                    return {
                        option_id: row.option_id,
                        option_name: row.option_name,
                        option_img: row.option_img,
                        price_per_unit: row.price_per_unit,
                        parcel_type: row.parcel_type,
                        description: row.description,
                        product_id: row.product_id
                        // Add other option properties as needed
                    };
                });
                res.render('pages/product_detail', {
                    currentMenu: "",
                    product: product,
                    options: options,
                    currentLink: ""
                })
            })

    });

    router.post('/addtocart', cart.upload.single('designfile'), cart.insertCart)
    router.get('/cart', (req, res) => {
        dbConnection.query(`SELECT c.*, p.* From cart c JOIN product p ON c.product_id = p.product_id ` +
                `WHERE c.user_id = '${req.session.user_id}' AND c.deleted_at IS NULL`)
            .then(([products]) => {
                res.render('pages/cart', {
                    currentMenu: "รถเข็น",
                    cartlist: products,
                    currentLink: ""
                })
            })

    });
    router.post('/deleteCart', cart.deleteCart)

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

    router.get('/konva', (req, res) => {
        res.render('editor/konva', {});
    });

    router.get('/test', (req, res) => {
        res.render('editor/test', {});
    });

    // ---------------------------------------------------------------------------------------------------
    // แอดมิน
    router.get('/admin/product-list', (req, res) => {
        dbConnection.query('SELECT * FROM product WHERE deleted_at is NULL').then(([data]) => {
            // console.log(data)
            res.render('pages/admin/product-list', {
                products: data,
                currentLink: "allproduct"
            })
        })
    });

    // เพิ่มสินค้า 
    router.get('/admin/addproduct', async (req, res) => {
        res.render('pages/admin/addproduct', {
            currentLink: "addproduct"
        })
    });
    router.post("/addproduct", adminController.upload_product.single('imgproduct'), adminController.addProduct);
    router.post("/updateProduct/:id", adminController.upload_product.single('imgproduct'), adminController.updateProduct); //แก้ไขสินค้า


    router.get('/admin/product/edit/:id', async (req, res) => {
        const productId = req.params.id;
        await dbConnection.query('SELECT * FROM product WHERE product_id = ?', productId).then(([rows]) => {
            res.render('pages/admin/editproduct', {
                product: rows[0],
                currentLink: "addproduct"
            })
        })
    });
    // router.get('/admin/product/edit/:id', (req, res) => {
    //     dbConnection.query('SELECT * FROM categories WHERE deleted_at is NULL').then(([categories]) => { // ดึงประเภท
    //         const productId = req.params.id;
    //         dbConnection.query('SELECT * FROM product WHERE product_id = ?', [productId]) // ข้อมูลสินค้า
    //             .then(([resultProduct]) => {
    //                 let product = resultProduct[0];
    //                 dbConnection.query('SELECT * FROM quantity_per_price WHERE product_id = ?', [productId])
    //                     .then(([resultQuantity]) => {
    //                         dbConnection.query('SELECT * FROM specification WHERE product_id = ?', [productId]) // ชื่อสเปค
    //                             .then(([specResults]) => {
    //                                 let specs = [];
    //                                 for (let i = 0; i < specResults.length; i++) {
    //                                     let spec = {
    //                                         spec_id: specResults[i].spec_id,
    //                                         spec_name: specResults[i].spec_name,
    //                                         options: []
    //                                     };
    //                                     const specid = specResults[i].spec_id;
    //                                     dbConnection.query('SELECT * FROM options WHERE deleted_at is NULL').then(([options]) => {
    //                                         dbConnection.query('SELECT so.*, o.* FROM specification_options so JOIN options o ON so.option_id = o.option_id WHERE spec_id = ?', [specid]) // ออฟชั่น
    //                                             .then(([optionSelectResults]) => {
    //                                                 for (let j = 0; j < optionSelectResults.length; j++) {
    //                                                     let option = {
    //                                                         option_id: optionSelectResults[j].option_id,
    //                                                         option_name: optionSelectResults[j].option_name,
    //                                                         price_per_unit: optionSelectResults[j].price_per_unit
    //                                                     };
    //                                                     spec.options.push(option);
    //                                                 }
    //                                                 specs.push(spec);

    //                                                 if (i === specResults.length - 1) {
    //                                                     // console.log(specid)
    //                                                     res.render('pages/admin/editproduct', {
    //                                                         types: categories,
    //                                                         product: product,
    //                                                         quantity: resultQuantity,
    //                                                         specs: specs,
    //                                                         options: options,
    //                                                         optionsSelected: optionSelectResults,
    //                                                         currentLink: "editproduct"
    //                                                     });
    //                                                 }
    //                                                 // res.render('pages/editproduct', {
    //                                                 //     types: type,
    //                                                 //     product: product[0],
    //                                                 //     specs: specs,
    //                                                 //     options: options,
    //                                                 //     currentLink: "editproduct"
    //                                                 // })
    //                                             })
    //                                     });
    //                                 }
    //                             })
    //                     })
    //             })
    //     })
    // });
    router.post("/deleteProduct", adminController.deleteProduct);

    // หน้าประเภท
    router.get('/admin/typeproduct', (req, res) => {
        dbConnection.query('SELECT * FROM categories WHERE deleted_at is NULL').then(([data]) => {
            // console.log(data)
            res.render('pages/admin/typeproduct', {
                types: data,
                currentLink: "typeproduct"
            })
        })
        // res.render('pages/typeproduct',{
        //     currentLink: "typeproduct",
        // })
    });

    // router.post("/addtype", categoriesController.addType) //เพิ่มประเภท
    // router.post("/updateType", categoriesController.editType) //แก้ไขประเภท
    // router.post("/deleteType", categoriesController.deleteType) //แก้ไขประเภท
    // router.get('/typeproduct/:id',(req, res) => {
    //     dbConnection.query('SELECT * FROM categories WHERE categoriesID = ?', [req.params.categoriesID]).then(([data]) => {
    //         res.render('pages/typeproduct', {types : data[0], currentLink: "typeproduct"
    //         })
    //     })
    // });

    //หน้าจัดการตัวเลือกวัสดุ 
    router.get('/admin/options', (req, res) => {
        dbConnection.query('SELECT o.*, p.* FROM options o LEFT JOIN product p ON o.product_id = p.product_id WHERE o.deleted_at IS NULL').then(([option]) => {
            dbConnection.query('SELECT * FROM product WHERE deleted_at is NULL').then(([product]) => {
                res.render('pages/admin/optionValue', {
                    products: product,
                    options: option,
                    currentLink: "option"
                })
            })
        })
    });

    router.get('/admin/options/addoption', (req, res) => {
        dbConnection.query('SELECT * FROM product WHERE deleted_at is NULL').then(([rows]) => {
            res.render('pages/admin/addOption', {
                currentLink: "option",
                products: rows
            })
        })
    });
    router.post('/addoption', optionsController.upload.array('option_img[]'), optionsController.addOptions);
    router.post('/updateOption', optionsController.updateOption);
    router.post('/deleteOption', optionsController.deleteOption);


    // จัดการ user 
    router.get('/admin/member', (req, res) => {
        dbConnection.query('SELECT * FROM users WHERE deleted_at IS NULL AND user_role = 0').then(([rows]) => {
            // console.log(data)
            res.render('pages/admin/member', {
                user: rows,
                currentLink: "member"
            })
        })
    });
    router.post("/deleteUser", adminController.deleteUser);




    // app.get('/chat-history', (req, res) => {
    //     dbConnection.query('SELECT * FROM chats WHERE sender_id = 6 AND recipient_id = 6 ORDER BY created_at ASC', (err, results) => {
    //       if (err) {
    //         return res.status(500).json({ error: 'An error occurred while fetching chat history.' });
    //       }
    //       const chatHistory = results;
    //       res.json(chatHistory); // Send the chat history data as JSON
    //     });
    //   });

    router.get('/chat-history', (req, res) => {
        dbConnection.query('SELECT * FROM chats WHERE sender_id = ? OR recipient_id = ? ORDER BY created_at ASC', [req.session.user_id, req.session.user_id]).then(([rows]) => {
            res.json(rows);
        })
    })

    router.get('/admin/chat-history', (req, res) => {
        const {
            userId
        } = req.query;
        dbConnection.query('SELECT * FROM chats WHERE sender_id = ? OR recipient_id = ? ORDER BY created_at ASC', [userId, userId]).then(([rows]) => {
            res.json(rows);
        })
    })
    // router.get('/admin/chat', (req, res) => {
    //     dbConnection.query('SELECT DISTINCT u.* FROM users u INNER JOIN chats c ON u.user_id = c.sender_id WHERE c.recipient_id = "admin" AND u.deleted_at is NULL').then(([users]) => {
    //         res.render('pages/adminChat', {
    //             currentLink: "chat",
    //             users: users,
    //         })

    //     })
    // })

    router.get('/admin/chat/*', (req, res) => {
        const id = req.params[0];
        dbConnection.query('SELECT DISTINCT u.* FROM users u INNER JOIN chats c ON u.user_id = c.sender_id WHERE c.recipient_id = "admin" AND u.deleted_at is NULL AND u.user_role = 0').then(([users]) => {
            dbConnection.query('SELECT * FROM chats WHERE sender_id = ? OR recipient_id = ? ORDER BY created_at ASC', [id, id]).then(([messages]) => {
                res.render('pages/admin/adminChat', {
                    currentLink: "chat",
                    users: users,
                    messages: messages
                })
            })
        })
    })



    return app.use("/", router);
}
module.exports = Routes;