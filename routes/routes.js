const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const axios = require('axios');
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
const productsController = require('../controllers/productsController');
const couponController = require('../controllers/couponController');
const promotionController = require('../controllers/promotionController');
const orderController = require('../controllers/orderController');
const paymentController = require('../controllers/paymentController');
const shipmentController = require('../controllers/shipmentController');

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
    router.get('/sucessfulRegister', (req, res) => {
        res.render('pages/scRegister', {
            Title: 'Clipart Press',
        });
    });

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
        dbConnection.promise().query('SELECT * FROM users WHERE user_id =?', [req.session.user_id]).then(([data]) => {
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
        dbConnection.promise().query('SELECT * FROM address WHERE user_id = ? AND deleted_at is NULL ORDER BY address.default_address DESC', [req.session.user_id]).then(([data]) => {
            res.render('pages/address', {
                currentMenu: 'ที่อยู่',
                address: data,
                currentLink: "address"
            })
        })
    });
    router.post("/address", userController.checkInputAddress, userController.addAddress)
    router.post("/updateAddress/:id", userController.editAddress)
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
        dbConnection.promise().query('SELECT pm.*, p.*, phm.* FROM promotions pm JOIN product_has_promotion phm ON phm.promo_id = pm.promo_id ' +
            'JOIN product p ON p.product_id = phm.product_id WHERE pm.deleted_at IS null AND phm.deleted_at IS null').then(([promotions]) => {
            dbConnection.promise().query('SELECT s.*, q.* FROM pricingTiers_size s JOIN pricingTiers_qty q ON q.product_id = s.product_id WHERE s.deleted_at IS null || q.deleted_at IS null').then(([priceTiers]) => {
                dbConnection.promise().query('SELECT * FROM product WHERE deleted_at is null')
                    .then(([products]) => {
                        res.render('pages/product', {
                            currentMenu: "สินค้า",
                            products: products,
                            currentLink: "allproduct",
                            promotions: promotions,
                            priceTiers: priceTiers
                        })
                    })
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
    // SELECT o.*, op.* FROM options o JOIN options_product op ON op.option_id = o.option_id WHERE JSON_CONTAINS(op.product_id, JSON_ARRAY(?)) AND o.deleted_at IS NULL
    // `SELECT p.*, o.*, op.* FROM options_product op JOIN options o ON o.option_id = op.option_id JOIN product p ON p.product_id = op.product_id WHERE o.deleted_at IS null AND p.product_id = ?`
    // `SELECT p.*, o.* FROM product p JOIN options o ON JSON_CONTAINS(o.product_id, JSON_ARRAY(?)) WHERE p.product_id = ?`
    //SELECT o.*, po.* FROM options o JOIN product_options po ON JSON_SEARCH(po.option_id, 'all', CAST(o.option_id AS CHAR)) IS NOT NULL WHERE po.product_id = ${productId}
    router.get('/product/item/:id', async (req, res) => {
        const productId = req.params.id;
        await dbConnection.promise().query(`SELECT * FROM product WHERE product_id = ${productId}`)
            .then(async ([row]) => {
                await dbConnection.promise().query(`SELECT po.* , o.* FROM options o JOIN product_options po ON po.option_id = o.option_id WHERE po.product_id = ${productId} AND po.deleted_at IS NULL`, )
                    .then(([rows]) => {
                        // const product = {
                        //     product_id: rows.product_id,
                        //     productName: rows[0].productName,
                        //     discount: rows[0].status,
                        //     picture: rows[0].picture,
                        //     categories: rows[0].categories,
                        //     description: rows[0].description
                        // };
                        const flattenedRows = rows.flat(); // Flatten the rows array
                        const options = flattenedRows.map(row => {
                            return {
                                option_id: row.option_id,
                                option_name: row.option_name,
                                option_img: row.option_img,
                                price_per_unit: row.price_per_unit,
                                option_type: row.option_type,
                                description: row.description,
                                // Add other option properties as needed
                            };
                        });
                        dbConnection.promise().query('SELECT * FROM pricingTiers_size WHERE product_id = ?', [productId]).then(([sizeTiers]) => {
                            dbConnection.promise().query('SELECT * FROM pricingTiers_qty WHERE product_id = ?', [productId])
                                .then(([qtyTiers]) => {
                                    dbConnection.promise().query('SELECT pm.*, p.*, phm.* FROM promotions pm JOIN product_has_promotion phm ON phm.promo_id = pm.promo_id ' +
                                            'JOIN product p ON p.product_id = phm.product_id WHERE pm.deleted_at IS null AND phm.deleted_at IS null AND phm.product_id = ?', productId)
                                        .then(([promotions]) => {
                                            res.render('pages/product_detail', {
                                                currentMenu: "",
                                                product: row[0],
                                                options: options,
                                                sizeTiers: sizeTiers,
                                                qtyTiers: qtyTiers,
                                                promotions: promotions,
                                                currentLink: ""
                                            })
                                        })
                                })
                        });
                    })
            })
    });

    router.post('/addtocart', cart.upload.single('designfile'), cart.insertCart)
    router.get('/cart', verifyToken, (req, res) => {
        // `SELECT c.*, sp.*, o.*, p.*, ohs.* From cart c JOIN selected_product_option sp ON c.selected_option_id = sp.selected_option_id ` +
        // `JOIN options_has_selected ohs ON ohs.selected_option_id = sp.selected_option_id ` +
        // `JOIN options o ON o.option_id = ohs.option_id JOIN product p ON p.product_id = c.product_id ` +
        // `WHERE c.user_id = '${req.session.user_id}' AND c.deleted_at IS NULL`
        dbConnection.promise().query(`SELECT c.*, p.*, cd.*, cso.*, o.* FROM cart c JOIN product p ON p.product_id = c.product_id JOIN cart_detail cd ON cd.cart_detail_id = c.cart_detail_id ` +
                `JOIN cart_selected_options cso ON cso.cart_detail_id = cd.cart_detail_id JOIN options o ON o.option_id = cso.option_id WHERE c.user_id = '${req.session.user_id}' AND c.deleted_at IS NULL`)
            .then(([rows]) => {
                dbConnection.promise().query('SELECT pm.*, p.*, phm.* FROM promotions pm JOIN product_has_promotion phm ON phm.promo_id = pm.promo_id ' +
                        'JOIN product p ON p.product_id = phm.product_id WHERE pm.deleted_at IS null AND phm.deleted_at IS null')
                    .then(([promotions]) => {
                        const cartsItem = [];
                        rows.forEach((row) => {
                            // Check if the cart item already exists in cartsItem array
                            const existingCartItem = cartsItem.find((item) => item.cart_id === row.cart_id);
                            if (existingCartItem) {
                                // Add the option to the existing cart item
                                existingCartItem.options.push({
                                    option_id: row.option_id,
                                    option_name: row.option_name,
                                    option_type: row.option_type
                                });
                            } else {
                                // Create a new cart item and add it to cartsItem array
                                const cartItem = {
                                    cart_id: row.cart_id,
                                    user_id: row.user_id,
                                    product_id: row.product_id,
                                    productName: row.productName,
                                    picture: row.picture,
                                    size: row.size,
                                    quantity: row.quantity,
                                    price: row.price,
                                    options: [{
                                        option_id: row.option_id,
                                        option_name: row.option_name,
                                        option_type: row.option_type
                                    }],
                                };
                                cartsItem.push(cartItem);
                            }
                        });

                        res.render('pages/cart', {
                            currentMenu: "รถเข็น",
                            cartsItem: cartsItem,
                            // options: options,
                            promotions: promotions,
                            currentLink: ""
                        })
                    })
            })
    });

    router.get('/getCoupon', (req, res) => {
        const data = {};
        // 'SELECT cp.*, cu.* FROM coupon cp JOIN users_use_coupon cu ON cu.coupon_id = cp.coupon_id'
        dbConnection.promise().query('SELECT * FROM coupon WHERE deleted_at is null').then(([coupons]) => {
            data.coupons = coupons;
            dbConnection.promise().query('SELECT c.*, o.* FROM coupon c JOIN orders o ON o.coupon_id = c.coupon_id').then(([coupons_used]) => {
                data.coupons_used = coupons_used;
                try {
                    res.json(data)
                } catch (error) {
                    if (error) throw error
                }
            })
        })
    })

    router.get('/editproduct-cart/:productid/:cartid', async (req, res) => {
        const productId = req.params.productid;
        const cartid = req.params.cartid;
        await dbConnection.promise().query(`SELECT * FROM product WHERE product_id = ${productId}`)
            .then(async ([row]) => {
                await dbConnection.promise().query(`SELECT po.* , o.* FROM options o JOIN product_options po ON po.option_id = o.option_id WHERE po.product_id = ${productId} AND po.deleted_at IS NULL`, )
                    .then(([rows]) => {

                        const flattenedRows = rows.flat();
                        const options = flattenedRows.map(row => {
                            return {
                                option_id: row.option_id,
                                option_name: row.option_name,
                                option_img: row.option_img,
                                price_per_unit: row.price_per_unit,
                                option_type: row.option_type,
                                description: row.description,
                            };
                        });


                        dbConnection.promise().query('SELECT * FROM pricingTiers_size WHERE product_id = ?', [productId]).then(([sizeTiers]) => {
                            dbConnection.promise().query('SELECT * FROM pricingTiers_qty WHERE product_id = ?', [productId])
                                .then(([qtyTiers]) => {
                                    dbConnection.promise().query('SELECT pm.*, p.*, phm.* FROM promotions pm JOIN product_has_promotion phm ON phm.promo_id = pm.promo_id ' +
                                            'JOIN product p ON p.product_id = phm.product_id WHERE pm.deleted_at IS null AND phm.deleted_at IS null AND phm.product_id = ?', productId)
                                        .then(([promotions]) => {
                                            dbConnection.promise().query('SELECT o.*, cso.*, cd.*, c.* FROM options o JOIN cart_selected_options cso ON cso.option_id = o.option_id ' +
                                                    'JOIN cart_detail cd ON cd.cart_detail_id = cso.cart_detail_id JOIN cart c ON c.cart_detail_id = cd.cart_detail_id WHERE c.cart_id = ? AND c.product_id = ? AND c.user_id = ?', [cartid, productId, req.session.user_id])
                                                .then(([rows]) => {
                                                    const cartsItem = [];
                                                    rows.forEach((row) => {
                                                        const existingCartItem = cartsItem.find((item) => item.cart_id === row.cart_id);
                                                        if (existingCartItem) {
                                                            existingCartItem.options.push({
                                                                option_id: row.option_id,
                                                                option_name: row.option_name,
                                                                option_type: row.option_type
                                                            });
                                                        } else {
                                                            const cartItem = {
                                                                cart_id: row.cart_id,
                                                                cart_detail_id: row.cart_detail_id,
                                                                user_id: row.user_id,
                                                                product_id: row.product_id,
                                                                productName: row.productName,
                                                                picture: row.picture,
                                                                size: row.size,
                                                                quantity: row.quantity,
                                                                price: row.price,
                                                                design_file: row.design_file,
                                                                options: [{
                                                                    option_id: row.option_id,
                                                                    option_name: row.option_name,
                                                                    option_type: row.option_type
                                                                }],
                                                            };
                                                            cartsItem.push(cartItem);
                                                        }
                                                    });
                                                    if (!req.session.user_id) {
                                                        res.redirect('/')
                                                    } else {
                                                        res.render('pages/editCartProduct', {
                                                            currentMenu: "",
                                                            product: row[0],
                                                            options: options,
                                                            sizeTiers: sizeTiers,
                                                            qtyTiers: qtyTiers,
                                                            promotions: promotions,
                                                            cart_detail: cartsItem,
                                                            currentLink: ""
                                                        })
                                                    }

                                                })
                                        })
                                })
                        });
                    })
            })
    });


    router.post('/updateCart/:cartDetailid', cart.upload.single('designfile'), cart.updateCart)
    router.post('/deleteCart', cart.deleteCart)

    router.get('/checkout', async (req, res) => {
        await dbConnection.promise().query(`SELECT c.*, p.*, cd.*, cso.*, o.* FROM cart c JOIN product p ON p.product_id = c.product_id JOIN cart_detail cd ON cd.cart_detail_id = c.cart_detail_id ` +
                `JOIN cart_selected_options cso ON cso.cart_detail_id = cd.cart_detail_id JOIN options o ON o.option_id = cso.option_id WHERE c.user_id = '${req.session.user_id}' AND c.deleted_at IS NULL`)
            .then(async ([rows]) => {
                await dbConnection.promise().query('SELECT pm.*, p.*, phm.* FROM promotions pm JOIN product_has_promotion phm ON phm.promo_id = pm.promo_id ' +
                        'JOIN product p ON p.product_id = phm.product_id WHERE pm.deleted_at IS null AND phm.deleted_at IS null')
                    .then(async ([promotions]) => {
                        await dbConnection.promise().query('SELECT * FROM address WHERE user_id = ? AND deleted_at is NULL ORDER BY address.default_address DESC', [req.session.user_id]).then(async ([address]) => {
                            const cartsItem = [];
                            rows.forEach((row) => {
                                // Check if the cart item already exists in cartsItem array
                                const existingCartItem = cartsItem.find((item) => item.cart_id === row.cart_id);
                                if (existingCartItem) {
                                    // Add the option to the existing cart item
                                    existingCartItem.options.push({
                                        option_id: row.option_id,
                                        option_name: row.option_name,
                                        option_type: row.option_type
                                    });
                                } else {
                                    // Create a new cart item and add it to cartsItem array
                                    const cartItem = {
                                        cart_id: row.cart_id,
                                        user_id: row.user_id,
                                        product_id: row.product_id,
                                        productName: row.productName,
                                        picture: row.picture,
                                        size: row.size,
                                        quantity: row.quantity,
                                        price: row.price,
                                        options: [{
                                            option_id: row.option_id,
                                            option_name: row.option_name,
                                            option_type: row.option_type
                                        }],
                                    };
                                    cartsItem.push(cartItem);
                                }
                            });
                            await dbConnection.promise().query('SELECT s.*, sp.* FROM shipments s JOIN shipments_price sp ON sp.shipment_id = s.shipment_id WHERE sp.deleted_at IS NULL').then(async ([shipmentsPrice]) => {
                                await dbConnection.promise().query('SELECT * FROM shipments WHERE deleted_at IS NULL').then(async ([shipments]) => {
                                    await dbConnection.promise().query('SELECT * FROM bank WHERE deleted_at IS NULL').then(async ([banks]) => {
                                        await dbConnection.promise().query('SELECT * FROM promptpay WHERE status = 1').then(async ([promptpay]) => {
                                            res.render('pages/checkout', {
                                                currentMenu: "เช็คเอาท์",
                                                cartsItem: cartsItem,
                                                // options: options,
                                                currentLink: "",
                                                address: address,
                                                promotions: promotions,
                                                shipments: shipments,
                                                shipmentsPrice: shipmentsPrice,
                                                banks: banks,
                                                promptpay: promptpay,
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    });
            });
    });

    router.get('/placeOrder/:userid', orderController.placeOrder)
    router.get('/myorder', (req, res) => {
        res.render('pages/myorder', {
            currentMenu: 'รายการที่สั่ง',
            Title: 'Clipart Press || รายการที่สั่ง',
            currentLink: "myorder"
        });
    })
    router.get('/invoices', (req, res) => {
        res.render('pages/invoices', {
            currentMenu: 'รายการที่สั่ง',
            Title: 'Clipart Press || รายการที่สั่ง',
            currentLink: "myorder"
        });
    })
    router.get('/example', (req, res) => {
        res.render('pages/example', {
            currentMenu: 'ตัวอย่างงาน',
            Title: 'Clipart Press || ตัวอย่างงาน',
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
    router.get('/admin/dashborad', (req, res) => {
        res.render('pages/admin/admin_dashborad', {
            currentLink: "dashborad"
        })
    })

    router.get('/admin/product-list', (req, res) => {
        dbConnection.promise().query('SELECT * FROM product WHERE deleted_at is NULL ORDER BY product_id ASC').then(([data]) => {
            // console.log(data)
            res.render('pages/admin/product-list', {
                products: data,
                currentLink: "allproduct"
            })
        })
    });

    // เพิ่มสินค้า 
    router.get('/admin/addproduct', async (req, res) => {
        dbConnection.promise().query('SELECT * FROM options WHERE deleted_at is NULL').then(([rows]) => {
            res.render('pages/admin/addproduct', {
                currentLink: "addproduct",
                options: rows,
            })
        })
    });
    router.post("/addproduct", productsController.upload_product.single('imgproduct'), productsController.addProduct);

    router.get('/admin/product/edit/:id', async (req, res) => {
        const productId = req.params.id;
        dbConnection.promise().query('SELECT * FROM product WHERE product_id = ?', productId).then(([product]) => {
            dbConnection.promise().query('SELECT * FROM pricingTiers_size WHERE product_id = ? AND deleted_at IS NULL', productId).then(([sizeTier]) => {
                dbConnection.promise().query('SELECT * FROM pricingTiers_qty WHERE product_id = ? AND deleted_at IS NULL', productId).then(([qtyTier]) => {
                    dbConnection.promise().query('SELECT po.* , o.* FROM options o JOIN product_options po ON po.option_id = o.option_id WHERE po.product_id = ? AND po.deleted_at IS NULL', productId).then(([op]) => {
                        dbConnection.promise().query('SELECT * FROM options WHERE deleted_at is NULL').then(([options]) => {

                            // rows.forEach((row) => {
                            //     // Check if a size with the same id already exists in sizes
                            //     let size = sizes.find((s) => s.id === row.id);

                            //     if (!size) {
                            //         size = {
                            //             id: row.id,
                            //             width: row.width,
                            //             height: row.height,
                            //             pricingTiers: [],
                            //         };
                            //         sizes.push(size);
                            //     }
                            //     size.pricingTiers.push({
                            //         tier_id: row.tier_id,
                            //         quantity: row.quantity,
                            //         price: row.price,
                            //         size_id: row.size_id,
                            //     });
                            // });

                            res.render('pages/admin/editproduct', {
                                product: product[0],
                                qtyTier: qtyTier,
                                sizeTier: sizeTier,
                                selectedOp: op,
                                options: options,
                                currentLink: "addproduct"
                            })
                        })
                    })
                })
            })
        })
    });
    router.post("/updateProduct/:id", productsController.upload_product.single('imgproduct'), productsController.updateProduct); //แก้ไขสินค้า
    router.delete("/deleteQt/:id", productsController.deleteQt);
    router.delete("/deleteSize/:id", productsController.deleteSize);


    router.post("/deleteProduct/", adminController.deleteProduct);


    //หน้าจัดการตัวเลือกวัสดุ 
    router.get('/admin/options', (req, res) => {
        dbConnection.promise().query('SELECT * FROM options WHERE deleted_at IS NULL ORDER BY option_id ASC').then(([option]) => {
            dbConnection.promise().query('SELECT * FROM product WHERE deleted_at is NULL').then(([product]) => {
                res.render('pages/admin/optionValue', {
                    products: product,
                    options: option,
                    currentLink: "option"
                })
            })
        })
    });

    router.get('/admin/options/addoption', (req, res) => {
        dbConnection.promise().query('SELECT * FROM product WHERE deleted_at is NULL').then(([rows]) => {
            res.render('pages/admin/addOption', {
                currentLink: "option",
                products: rows
            })
        })
    });
    router.post('/addoption', optionsController.upload.array('option_img[]'), optionsController.addOptions);
    router.post('/updateOption', optionsController.updateOption);
    router.post('/deleteOption', optionsController.deleteOption);


    // หน้าจัดการออเดอร์
    router.get('/admin/orders', (req, res) => {
        res.render('pages/admin/order', {
            currentLink: "order"
        })
    })

    // discount
    router.get('/admin/promotion', (req, res) => {
        dbConnection.promise().query('SELECT * FROM promotions WHERE deleted_at IS null').then(([promotions]) => {
            dbConnection.promise().query('SELECT pm.*, p.*, phm.* FROM promotions pm JOIN product_has_promotion phm ON phm.promo_id = pm.promo_id ' +
                'JOIN product p ON p.product_id = phm.product_id WHERE p.deleted_at IS null AND phm.deleted_at IS null').then(([rows]) => {

                const promos = [];

                // rows.forEach((row) => {
                //     let promo = promos.find((p) => p.id === row.id);
                //     if (!promo) {
                //         promo = {
                //             id: row.promo_id,
                //             promo_name: row.promo_name,
                //             promo_type: row.promo_type,
                //             start_date: row.start_date,
                //             end_date: row.end_date,
                //             status: row.status,
                //             product: []
                //         };
                //         promos.push(promo);
                //     }
                //     promo.product.push({
                //         productName: row.productName
                //     });
                // });

                res.render('pages/admin/promotion', {
                    currentLink: "promotion",
                    promotions: promotions,
                    product: rows,
                })
            })
        })
    })

    router.get('/admin/promotion/addpromotion', (req, res) => {
        dbConnection.promise().query('SELECT * FROM product WHERE deleted_at IS NULL').then(([products]) => {
            dbConnection.promise().query('SELECT pm.*, p.*, phm.* FROM promotions pm JOIN product_has_promotion phm ON phm.promo_id = pm.promo_id ' +
                'JOIN product p ON p.product_id = phm.product_id ').then(([rows]) => {
                res.render('pages/admin/addPromotion', {
                    currentLink: "promotion",
                    products: products,
                    promotions: rows
                })
            })
        })
    })
    router.post('/addpromotion', promotionController.addPromotion);


    router.get('/admin/promotion/edit/:id', async (req, res) => {
        const id = req.params.id;
        dbConnection.promise().query('SELECT pm.*, p.*, phm.* FROM promotions pm JOIN product_has_promotion phm ON phm.promo_id = pm.promo_id ' +
                'JOIN product p ON p.product_id = phm.product_id WHERE pm.promo_id = ? AND phm.deleted_at IS null', id)
            .then(([rows]) => {
                dbConnection.promise().query('SELECT * FROM promotions WHERE promo_id = ?', id).then(([promo]) => {
                    dbConnection.promise().query('SELECT * FROM product WHERE deleted_at IS NULL').then(([products]) => {
                        if (promo[0].deleted_at !== null) {
                            req.flash("errors", 'ไม่มีข้อมูลโปรโมชั่นนี้');
                            res.redirect('/admin/promotion')
                        } else {
                            res.render('pages/admin/editPromotion', {
                                currentLink: "promotion",
                                products: products,
                                promotions: rows[0],
                                selectedProduct: rows
                            })
                        }
                    })
                })
            })
    });
    router.post('/updatePromotion/:id', promotionController.updatePromotion);
    router.post('/deletePromotion', promotionController.deletePromotion);

    router.get('/admin/coupon', (req, res) => {
        dbConnection.promise().query('SELECT * FROM coupon WHERE deleted_at IS NULL').then(([rows]) => {
            res.render('pages/admin/coupon', {
                currentLink: "coupon",
                coupons: rows
            })
        })
    })
    router.post('/addcoupon', couponController.addCoupon);
    router.post('/updatecoupon', couponController.updateCoupon);
    router.post('/deleteCoupon', couponController.deleteCoupon);


    router.get('/admin/shipment', (req, res) => {
        dbConnection.promise().query('SELECT * FROM shipments WHERE deleted_at IS NULL').then(([rows]) => {
            res.render('pages/admin/shipment', {
                currentLink: "shipment",
                shipments: rows
            })
        })
    })
    router.get('/admin/shipment/addshipment', (req, res) => {
        res.render('pages/admin/addShipment', {
            currentLink: "shipment",
        })
    })
    router.get('/admin/shipment/editshipment/:id', (req, res) => {
        const id = req.params.id;
        dbConnection.promise().query('SELECT s.*, sp.* FROM shipments s INNER JOIN shipments_price sp ON sp.shipment_id = s.shipment_id WHERE s.shipment_id = ? AND sp.deleted_at IS NULL', id).then(([rows]) => {
            res.render('pages/admin/editShipment', {
                currentLink: "shipment",
                shipments: rows
            })
        })
    })
    router.post('/addshipment', shipmentController.addShipment);
    router.post('/editshipment/:id', shipmentController.updateShipment);
    router.post('/deleteshipment/:id', shipmentController.deleteShipment);
    router.delete('/deleteShipmentPrice/:id', shipmentController.deletePrice);


    router.get('/admin/payment_method', (req, res) => {
        dbConnection.promise().query('SELECT * FROM bank WHERE deleted_at IS NULL').then(([rows]) => {
            const decryptedBanks = [];
            rows.forEach((row) => {
                const key = Buffer.from('ef045d157e2df86220ee67ac37132a604f51477fef58fdaac52ed312d97a1538', 'hex');
                const iv = Buffer.from('72d78a8a792f98f086bd892600e3638a', 'hex');
                var encrypted = row.number;
                const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
                let number = decipher.update(encrypted, 'hex', 'utf8');
                number += decipher.final('utf8');
                const bank = {
                    bank_id: row.bank_id,
                    bank: row.bank,
                    number: number,
                    name: row.name,
                };
                decryptedBanks.push(bank);
            });

            dbConnection.promise().query('SELECT * FROM promptpay').then(([pp]) => {
                const key = Buffer.from('a83662c9b5b271e4b9ca58ec4ae7f429dc65500ac7754712a1ac75037affe7b8', 'hex');
                const iv = Buffer.from('cfe4c9b8b0518d92cc03130106322533', 'hex');
                const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
                let promptpay = pp;

                if (pp.length > 0) {
                    let ppnumber = decipher.update(pp[0].number, 'hex', 'utf8');
                    ppnumber += decipher.final('utf8');
                    promptpay = {
                        promptpay_id: pp[0].promptpay_id,
                        number: ppnumber,
                        type: pp[0].promptpay_type,
                        name: pp[0].name,
                        status: pp[0].status,
                    }
                }


                res.render('pages/admin/payment_method', {
                    currentLink: "payment_method",
                    banks: decryptedBanks,
                    promptpay: promptpay,
                });
            })
            // const filePath = path.join(__dirname, '../public/json/promptpay.json');
            // fs.readFile(filePath, 'utf8', (err, data) => {
            //     let arr;
            //     if (err) {
            //         console.error(err);
            //         arr = [];
            //     } else {
            //         arr = JSON.parse(data);
            //         const key = Buffer.from('a83662c9b5b271e4b9ca58ec4ae7f429dc65500ac7754712a1ac75037affe7b8', 'hex');
            //         const iv = Buffer.from('cfe4c9b8b0518d92cc03130106322533', 'hex');
            //         const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            //         let ppnumber = decipher.update(arr[0].number, 'hex', 'utf8');
            //         ppnumber += decipher.final('utf8');
            //         const promptpay = {
            //             number: ppnumber,
            //             name: arr[0].name,
            //             status: arr[0].status,
            //             type: arr[0].type,
            //         }
            //         res.render('pages/admin/payment_method', {
            //             currentLink: "payment_method",
            //             banks: decryptedBanks,
            //             promptpay: promptpay,
            //         });
            //     }
            // })

        });
    });


    router.post('/addBank', paymentController.addBank)
    router.post('/updateBank/:id', paymentController.editBank)
    router.post('/deleteBank/:id', paymentController.deleteBank)

    router.post('/savePromptPay', paymentController.promptpay)
    // จัดการ user 
    router.get('/admin/member', (req, res) => {
        dbConnection.promise().query('SELECT * FROM users WHERE deleted_at IS NULL AND user_role = 0').then(([rows]) => {
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
        dbConnection.promise().query('SELECT * FROM chats WHERE sender_id = ? OR recipient_id = ? ORDER BY created_at ASC', [req.session.user_id, req.session.user_id]).then(([rows]) => {
            res.json(rows);
        }) 
    })

    router.get('/admin/chat-history', (req, res) => {
        const {
            userId
        } = req.query;
        dbConnection.promise().query('SELECT * FROM chats WHERE sender_id = ? OR recipient_id = ? ORDER BY created_at ASC', [userId, userId]).then(([rows]) => {
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
        dbConnection.promise().query('SELECT DISTINCT u.* FROM users u INNER JOIN chats c ON u.user_id = c.sender_id WHERE c.recipient_id = "admin" AND u.deleted_at is NULL AND u.user_role = 0').then(([users]) => {
            dbConnection.promise().query('SELECT * FROM chats WHERE sender_id = ? OR recipient_id = ? ORDER BY created_at ASC', [id, id]).then(([messages]) => {
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