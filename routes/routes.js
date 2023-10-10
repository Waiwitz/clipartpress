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

const QRCode = require('qrcode')
const generatePayload = require('promptpay-qr');
const { Chart } = require('chart.js');


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
        dbConnection.promise().query('SELECT pm.*, p.*, phm.* FROM promotions pm JOIN product_has_promotion phm ON phm.promo_id = pm.promo_id ' +
            'JOIN product p ON p.product_id = phm.product_id WHERE pm.deleted_at IS null AND phm.deleted_at IS null AND now() < pm.end_date ').then(([promotions]) => {
            dbConnection.promise().query('SELECT s.*, q.* FROM pricingTiers_size s JOIN pricingTiers_qty q ON q.product_id = s.product_id WHERE s.deleted_at IS null || q.deleted_at IS null').then(([priceTiers]) => {
                dbConnection.promise().query('SELECT * FROM product WHERE deleted_at is null')
                    .then(([products]) => {
                        res.render('pages/index', {
                            currentMenu: 'หน้าแรก',
                            Title: 'Clipart Press',
                            products: products,
                            promotions: promotions,
                            priceTiers: priceTiers
                        });
                    })
            })
        })
    });
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
        });
    });
    router.post("/changepassword", userController.validatePassword, userController.changepassword)


    // หน้าสินค้าทั้งหมด
    router.get('/product/all/', (req, res) => {
        dbConnection.promise().query('SELECT pm.*, p.*, phm.* FROM promotions pm JOIN product_has_promotion phm ON phm.promo_id = pm.promo_id ' +
            'JOIN product p ON p.product_id = phm.product_id WHERE pm.deleted_at IS null AND phm.deleted_at IS null AND now() < pm.end_date ').then(([promotions]) => {
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
                                            'JOIN product p ON p.product_id = phm.product_id WHERE pm.deleted_at IS null AND phm.deleted_at IS null AND phm.product_id = ? AND now() < pm.end_date ', productId)
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
            dbConnection.promise().query('SELECT * FROM orders WHERE order_status != "cancel"').then(([coupons_used]) => {
                data.orders = coupons_used;
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
                                            'JOIN product p ON p.product_id = phm.product_id WHERE pm.deleted_at IS null AND phm.deleted_at IS null AND phm.product_id = ? AND now() < pm.end_date ', productId)
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
                                    await dbConnection.promise().query('SELECT * FROM payment_method WHERE deleted_at is null').then(async ([payment_method]) => {
                                        res.render('pages/checkout', {
                                            currentMenu: "เช็คเอาท์",
                                            cartsItem: cartsItem,
                                            // options: options,
                                            currentLink: "",
                                            address: address,
                                            promotions: promotions,
                                            shipments: shipments,
                                            shipmentsPrice: shipmentsPrice,
                                            payment_method: payment_method,
                                        })
                                    })
                                })
                            })
                        })
                    });
            });
    });
    router.post('/placeOrder', orderController.placeOrder)

    router.get('/myorder', verifyToken, (req, res) => {
        dbConnection.promise().query('SELECT ors.*, opd.*, p.* ,opo.*, o.* FROM orders ors JOIN order_product_detail opd ON opd.order_id = ors.order_id JOIN product p ON p.product_id = opd.product_id ' +
            'JOIN order_product_options opo ON opo.opd_id = opd.opd_id JOIN options o ON o.option_id = opo.option_id WHERE ors.user_id = ?', req.session.user_id).then(async ([orders]) => {
            const orderItem = [];
            orders.forEach((rows) => {
                const existingOrder = orderItem.find((item) => item.order_id === rows.order_id);
                if (existingOrder) {
                    if (!existingOrder.order_detail) {
                        existingOrder.order_detail = [];
                    }
                    const existingOrderDetail = existingOrder.order_detail.find(
                        (detail) => detail.opd_id === rows.opd_id
                    );

                    if (existingOrderDetail) {
                        existingOrderDetail.options.push({
                            option_id: rows.option_id,
                            option_name: rows.option_name,
                            option_type: rows.option_type,
                        });
                    } else {
                        existingOrder.order_detail.push({
                            opd_id: rows.opd_id,
                            size: rows.size,
                            design_file: rows.design_file,
                            price: rows.price,
                            quantity: rows.quantity,
                            product_id: rows.product_id,
                            productName: rows.productName,
                            picture: rows.picture,
                            options: [{
                                option_id: rows.option_id,
                                option_name: rows.option_name,
                                option_type: rows.option_type,
                            }, ],
                        });
                    }
                } else {
                    const item = {
                        order_id: rows.order_id,
                        order_date: rows.order_date,
                        shipment_price: rows.shipment_price,
                        order_status: rows.order_status,
                        discount: rows.discount,
                        coupon_id: rows.coupon_id,
                        user_id: rows.user_id,
                        order_detail: [{
                            opd_id: rows.opd_id,
                            size: rows.size,
                            design_file: rows.design_file,
                            price: rows.price,
                            quantity: rows.quantity,
                            product_id: rows.product_id,
                            productName: rows.productName,
                            picture: rows.picture,
                            options: [{
                                option_id: rows.option_id,
                                option_name: rows.option_name,
                                option_type: rows.option_type,
                            }, ],
                        }, ],
                    };
                    orderItem.push(item);
                };
            });
            res.render('pages/myorder', {
                currentMenu: 'รายการที่สั่ง',
                Title: 'Clipart Press || รายการที่สั่ง',
                currentLink: "myorder",
                orders: orderItem,
            });
        });
    });
    router.get('/myorder/invoices/:id', async (req, res) => {
        const order_id = req.params.id;
        await dbConnection.promise().query('SELECT ors.*, opd.*, p.* ,opo.*, o.*, pm.* FROM orders ors JOIN order_product_detail opd ON opd.order_id = ors.order_id JOIN product p ON p.product_id = opd.product_id ' +
            'JOIN order_product_options opo ON opo.opd_id = opd.opd_id JOIN options o ON o.option_id = opo.option_id JOIN payment_method pm ON pm.payment_method_id = ors.payment_method_id WHERE ors.order_id = ?', order_id).then(async ([orders]) => {
            const orderItem = [];
            await dbConnection.promise().query('SELECT co.*, ors.order_id FROM cancelOrder co JOIN orders ors ON co.order_id = ors.order_id WHERE co.order_id = ?', order_id).then(async ([cancel]) => {


                orders.forEach((rows) => {
                    const existingOrder = orderItem.find((item) => item.order_id === rows.order_id);
                    if (existingOrder) {
                        // Check if 'order_detail' exists on the existing order, and initialize it if not
                        if (!existingOrder.order_detail) {
                            existingOrder.order_detail = [];
                        }

                        // Check if there's an existing order detail with the same opd_id
                        const existingOrderDetail = existingOrder.order_detail.find(
                            (detail) => detail.opd_id === rows.opd_id
                        );

                        if (existingOrderDetail) {
                            // If an existing order detail with the same opd_id is found,
                            // add the option to that existing detail
                            existingOrderDetail.options.push({
                                option_id: rows.option_id,
                                option_name: rows.option_name,
                                option_type: rows.option_type,
                            });
                        } else {
                            // If no existing order detail with the same opd_id is found,
                            // create a new order detail and add it to the existing order
                            existingOrder.order_detail.push({
                                opd_id: rows.opd_id,
                                size: rows.size,
                                design_file: rows.design_file,
                                price: rows.price,
                                quantity: rows.quantity,
                                product_id: rows.product_id,
                                productName: rows.productName,
                                picture: rows.picture,
                                options: [{
                                    option_id: rows.option_id,
                                    option_name: rows.option_name,
                                    option_type: rows.option_type,
                                }, ],
                            });
                        }
                    } else {
                        const item = {
                            order_id: rows.order_id,
                            order_date: rows.order_date,
                            shipment_price: rows.shipment_price,
                            order_status: rows.order_status,
                            discount: rows.discount,
                            coupon_id: rows.coupon_id,
                            user_id: rows.user_id,
                            payment_method_id: rows.payment_method_id,
                            method_type: rows.method_type,
                            order_detail: [{
                                opd_id: rows.opd_id,
                                size: rows.size,
                                design_file: rows.design_file,
                                price: rows.price,
                                quantity: rows.quantity,
                                product_id: rows.product_id,
                                productName: rows.productName,
                                picture: rows.picture,
                                options: [{
                                    option_id: rows.option_id,
                                    option_name: rows.option_name,
                                    option_type: rows.option_type,
                                }, ],
                            }, ],
                        };
                        orderItem.push(item);
                    }
                });
                await dbConnection.promise().query('SELECT pm.*, ors.order_id FROM payment pm JOIN orders ors ON pm.order_id = ors.order_id WHERE ors.order_id = ?', order_id).then(async ([payment]) => {
                    await dbConnection.promise().query('SELECT s.*, sh.*, ors.order_id FROM ship_address s JOIN orders ors ON s.order_id = ors.order_id JOIN shipments sh ON sh.shipment_id = s.shipment_id WHERE ors.order_id = ?', order_id).then(async ([shipment]) => {
                        await dbConnection.promise().query('SELECT c.*, ors.coupon_id FROM coupon c JOIN orders ors ON c.coupon_id = ors.coupon_id').then(async ([coupon]) => {
                            await dbConnection.promise().query('SELECT * FROM payment_method WHERE deleted_at IS NULL').then(([payment_method]) => {
                                if (orderItem.length === 0) { //|| orderItem[0].user_id !== req.session.user_id
                                    res.redirect('/')
                                } else {
                                    const key = Buffer.from('ef045d157e2df86220ee67ac37132a604f51477fef58fdaac52ed312d97a1538', 'hex');
                                    const iv = Buffer.from('72d78a8a792f98f086bd892600e3638a', 'hex');
                                    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
                                    let number = '';
                                    var Arr = [];
                                    payment_method.forEach((method) => {
                                        if (method.payment_method_id === orders[0].payment_method_id) {
                                            number = decipher.update(method.number, 'hex', 'utf8');
                                            number += decipher.final('utf8')
                                            let Select = {
                                                payment_method_id: method.payment_method_id,
                                                method_type: method.method_type,
                                                method_name: method.method_name,
                                                number: number,
                                                name: method.name,
                                                statusPayment: method.statusPayment
                                            };
                                            Arr.push(Select)
                                        }
                                    });

                                    var SumPrice = 0
                                    var finalPrice = 0
                                    orderItem[0].order_detail.forEach((order) => {
                                        SumPrice += order.price
                                    })
                                    var vat = SumPrice * 7 / 100;
                                    let imgQr;
                                    // if (orderItem[0].coupon_id !== null) {
                                    //     coupon.forEach((c) => {
                                    //         if (c.coupon_type == 'value') {
                                    //             finalPrice = (SumPrice + vat + orderItem[0].shipment_price) - c.discount_value;
                                    //         } else if (c.coupon_type == 'percent') {
                                    //             finalPrice = (SumPrice + vat + orderItem[0].shipment_price) - ((SumPrice + vat + shipment_price) * c.discount_value / 100);
                                    //         }
                                    //         coupon = c.coupon_id
                                    //     });
                                    // } else {
                                    //     finalPrice = (SumPrice + vat + orderItem[0].shipment_price);
                                    // }

                                    const amount = parseFloat(finalPrice)
                                    const payload = generatePayload(number, {
                                        amount
                                    });
                                    const options = {
                                        color: {
                                            dark: '#000',
                                            light: '#fff'
                                        }
                                    }
                                    QRCode.toDataURL(payload, options, (err, url) => {
                                        if (err) {
                                            console.log('generate fail')
                                            return;
                                        }
                                        imgQr = url;
                                        res.render('pages/invoices', {
                                            currentMenu: 'รายการที่สั่ง',
                                            Title: 'Clipart Press || รายการที่สั่ง',
                                            currentLink: "myorder",
                                            orders: orderItem,
                                            payment: payment,
                                            shipment: shipment,
                                            coupon: coupon,
                                            qrcode: imgQr,
                                            payment_method: payment_method,
                                            selectmethod: Arr,
                                            cancel: cancel,
                                        });
                                    });
                                };
                            });
                        });
                    });
                });
            });
        });
    });
    router.post('/changepayment/:oid/:mid', orderController.changePayment)
    router.post("/uploadslip/:oid/:amount/:method", orderController.upload.single("slip"), orderController.paid);
    router.post("/cancelorder/:oid", orderController.cancel);
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
        dbConnection.promise().query('SELECT ors.*, opd.*, p.* ,opo.*, o.*, u.name FROM orders ors JOIN order_product_detail opd ON opd.order_id = ors.order_id JOIN product p ON p.product_id = opd.product_id ' +
            'JOIN order_product_options opo ON opo.opd_id = opd.opd_id JOIN options o ON o.option_id = opo.option_id JOIN users u ON u.user_id = ors.user_id').then(async ([orders]) => {
            const orderItem = [];
            orders.forEach((rows) => {
                const existingOrder = orderItem.find((item) => item.order_id === rows.order_id);
                if (existingOrder) {
                    if (!existingOrder.order_detail) {
                        existingOrder.order_detail = [];
                    }
                    const existingOrderDetail = existingOrder.order_detail.find(
                        (detail) => detail.opd_id === rows.opd_id
                    );

                    if (existingOrderDetail) {
                        existingOrderDetail.options.push({
                            option_id: rows.option_id,
                            option_name: rows.option_name,
                            option_type: rows.option_type,
                        });
                    } else {
                        existingOrder.order_detail.push({
                            opd_id: rows.opd_id,
                            size: rows.size,
                            design_file: rows.design_file,
                            price: rows.price,
                            quantity: rows.quantity,
                            product_id: rows.product_id,
                            productName: rows.productName,
                            picture: rows.picture,
                            options: [{
                                option_id: rows.option_id,
                                option_name: rows.option_name,
                                option_type: rows.option_type,
                            }, ],
                        });
                    }
                } else {
                    const item = {
                        order_id: rows.order_id,
                        order_date: rows.order_date,
                        shipment_price: rows.shipment_price,
                        order_status: rows.order_status,
                        coupon_id: rows.coupon_id,
                        user_id: rows.user_id,
                        userfullname: rows.name,
                        order_detail: [{
                            opd_id: rows.opd_id,
                            size: rows.size,
                            design_file: rows.design_file,
                            price: rows.price,
                            quantity: rows.quantity,
                            product_id: rows.product_id,
                            productName: rows.productName,
                            picture: rows.picture,
                            options: [{
                                option_id: rows.option_id,
                                option_name: rows.option_name,
                                option_type: rows.option_type,
                            }, ],
                        }, ],
                    };
                    orderItem.push(item);
                };
            });
            dbConnection.promise().query('SELECT p.*, pm.*, ors.*, u.name FROM payment p JOIN payment_method pm ON pm.payment_method_id = p.payment_method_id ' +
                'JOIN orders ors ON ors.order_id = p.order_id JOIN users u ON u.user_id = ors.user_id').then(([payments]) => {
                res.render('pages/admin/admin_dashborad', {
                    currentLink: "dashborad",
                    Title: 'Clipart Press || แดชบอร์ด',
                    payments: payments,
                    orders: orderItem,
                })
            });
        });
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


    router.post("/deleteProduct/", productsController.deleteProduct);


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
        dbConnection.promise().query('SELECT ors.*, opd.*, p.* ,opo.*, o.*, u.name FROM orders ors JOIN order_product_detail opd ON opd.order_id = ors.order_id JOIN product p ON p.product_id = opd.product_id ' +
            'JOIN order_product_options opo ON opo.opd_id = opd.opd_id JOIN options o ON o.option_id = opo.option_id JOIN users u ON u.user_id = ors.user_id').then(async ([orders]) => {
            const orderItem = [];
            orders.forEach((rows) => {
                const existingOrder = orderItem.find((item) => item.order_id === rows.order_id);
                if (existingOrder) {
                    if (!existingOrder.order_detail) {
                        existingOrder.order_detail = [];
                    }
                    const existingOrderDetail = existingOrder.order_detail.find(
                        (detail) => detail.opd_id === rows.opd_id
                    );

                    if (existingOrderDetail) {
                        existingOrderDetail.options.push({
                            option_id: rows.option_id,
                            option_name: rows.option_name,
                            option_type: rows.option_type,
                        });
                    } else {
                        existingOrder.order_detail.push({
                            opd_id: rows.opd_id,
                            size: rows.size,
                            design_file: rows.design_file,
                            price: rows.price,
                            quantity: rows.quantity,
                            product_id: rows.product_id,
                            productName: rows.productName,
                            picture: rows.picture,
                            options: [{
                                option_id: rows.option_id,
                                option_name: rows.option_name,
                                option_type: rows.option_type,
                            }, ],
                        });
                    }
                } else {
                    const item = {
                        order_id: rows.order_id,
                        order_date: rows.order_date,
                        shipment_price: rows.shipment_price,
                        order_status: rows.order_status,
                        coupon_id: rows.coupon_id,
                        user_id: rows.user_id,
                        userfullname: rows.name,
                        orderdate: rows.created_at,
                        order_detail: [{
                            opd_id: rows.opd_id,
                            size: rows.size,
                            design_file: rows.design_file,
                            price: rows.price,
                            quantity: rows.quantity,
                            product_id: rows.product_id,
                            productName: rows.productName,
                            picture: rows.picture,
                            options: [{
                                option_id: rows.option_id,
                                option_name: rows.option_name,
                                option_type: rows.option_type,
                            }, ],
                        }, ],
                    };
                    orderItem.push(item);
                };
            });
            res.render('pages/admin/order', {
                Title: 'Clipart Press || ออเดอร์',
                currentLink: "order",
                orders: orderItem,
            });
        });
    })
    router.post('/updateOrder/:id', orderController.updateOrder);
    router.get('/admin/order/:id', async (req, res) => {
        const order_id = req.params.id;
        await dbConnection.promise().query('SELECT ors.*, opd.*, p.* ,opo.*, o.* FROM orders ors JOIN order_product_detail opd ON opd.order_id = ors.order_id JOIN product p ON p.product_id = opd.product_id ' +
            'JOIN order_product_options opo ON opo.opd_id = opd.opd_id JOIN options o ON o.option_id = opo.option_id WHERE ors.order_id = ?', order_id).then(async ([orders]) => {
            const orderItem = [];
            await dbConnection.promise().query('SELECT co.*, ors.order_id FROM cancelOrder co JOIN orders ors ON co.order_id = ors.order_id WHERE co.order_id = ?', order_id).then(async ([cancel]) => {


                orders.forEach((rows) => {
                    const existingOrder = orderItem.find((item) => item.order_id === rows.order_id);
                    if (existingOrder) {
                        // Check if 'order_detail' exists on the existing order, and initialize it if not
                        if (!existingOrder.order_detail) {
                            existingOrder.order_detail = [];
                        }

                        // Check if there's an existing order detail with the same opd_id
                        const existingOrderDetail = existingOrder.order_detail.find(
                            (detail) => detail.opd_id === rows.opd_id
                        );

                        if (existingOrderDetail) {
                            // If an existing order detail with the same opd_id is found,
                            // add the option to that existing detail
                            existingOrderDetail.options.push({
                                option_id: rows.option_id,
                                option_name: rows.option_name,
                                option_type: rows.option_type,
                            });
                        } else {
                            // If no existing order detail with the same opd_id is found,
                            // create a new order detail and add it to the existing order
                            existingOrder.order_detail.push({
                                opd_id: rows.opd_id,
                                size: rows.size,
                                design_file: rows.design_file,
                                price: rows.price,
                                quantity: rows.quantity,
                                product_id: rows.product_id,
                                productName: rows.productName,
                                picture: rows.picture,
                                options: [{
                                    option_id: rows.option_id,
                                    option_name: rows.option_name,
                                    option_type: rows.option_type,
                                }, ],
                            });
                        }
                    } else {
                        const item = {
                            order_id: rows.order_id,
                            order_date: rows.order_date,
                            shipment_price: rows.shipment_price,
                            order_status: rows.order_status,
                            discount: rows.discount,
                            coupon_id: rows.coupon_id,
                            user_id: rows.user_id,
                            orderdate: rows.created_at,
                            tracking_number: rows.tracking_number,
                            order_detail: [{
                                opd_id: rows.opd_id,
                                size: rows.size,
                                design_file: rows.design_file,
                                price: rows.price,
                                quantity: rows.quantity,
                                product_id: rows.product_id,
                                productName: rows.productName,
                                picture: rows.picture,
                                options: [{
                                    option_id: rows.option_id,
                                    option_name: rows.option_name,
                                    option_type: rows.option_type,
                                }, ],
                            }, ],
                        };
                        orderItem.push(item);
                    }
                });

                await dbConnection.promise().query('SELECT pm.*, ors.order_id FROM payment pm JOIN orders ors ON pm.order_id = ors.order_id WHERE ors.order_id = ?', order_id).then(async ([payment]) => {
                    await dbConnection.promise().query('SELECT s.*, sh.*, ors.order_id FROM ship_address s JOIN orders ors ON s.order_id = ors.order_id JOIN shipments sh ON sh.shipment_id = s.shipment_id WHERE ors.order_id = ?', order_id).then(async ([shipment]) => {
                        await dbConnection.promise().query('SELECT c.*, ors.coupon_id FROM coupon c JOIN orders ors ON c.coupon_id = ors.coupon_id').then(async ([coupon]) => {
                            await dbConnection.promise().query('SELECT * FROM payment_method').then(async ([payment_method]) => {
                                if (orderItem.length === 0) { //|| orderItem[0].user_id !== req.session.user_id
                                    res.redirect('/')
                                } else {
                                    const key = Buffer.from('ef045d157e2df86220ee67ac37132a604f51477fef58fdaac52ed312d97a1538', 'hex');
                                    const iv = Buffer.from('72d78a8a792f98f086bd892600e3638a', 'hex');
                                    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
                                    let number = '';
                                    var Arr = [];
                                    payment_method.forEach((method) => {
                                        if (method.payment_method_id === orders[0].payment_method_id) {
                                            number = decipher.update(method.number, 'hex', 'utf8');
                                            number += decipher.final('utf8')
                                            let Select = {
                                                payment_method_id: method.payment_method_id,
                                                method_type: method.method_type,
                                                method_name: method.method_name,
                                                number: number,
                                                name: method.name,
                                            };
                                            Arr.push(Select)
                                        }
                                    });
                                    console.log(Arr);
                                    var SumPrice = 0
                                    var finalPrice = 0
                                    orderItem[0].order_detail.forEach((order) => {
                                        SumPrice += order.price
                                    })
                                    var vat = SumPrice * 7 / 100;
                                    let imgQr;
                                    // if (orderItem[0].coupon_id !== null) {
                                    //     coupon.forEach((c) => {
                                    //         if (c.coupon_type == 'value') {
                                    //             finalPrice = (SumPrice + vat + orderItem[0].shipment_price) - c.discount_value;
                                    //         } else if (c.coupon_type == 'percent') {
                                    //             finalPrice = (SumPrice + vat + orderItem[0].shipment_price) - ((SumPrice + vat + shipment_price) * c.discount_value / 100);
                                    //         }
                                    //         coupon = c.coupon_id
                                    //     });
                                    // } else {
                                    //     finalPrice = (SumPrice + vat + orderItem[0].shipment_price);
                                    // }

                                    const amount = parseFloat(finalPrice)
                                    const payload = generatePayload(number, {
                                        amount
                                    });
                                    const options = {
                                        color: {
                                            dark: '#000',
                                            light: '#fff'
                                        }
                                    }
                                    QRCode.toDataURL(payload, options, (err, url) => {
                                        if (err) {
                                            console.log('generate fail')
                                            return;
                                        }
                                        imgQr = url;
                                        res.render('pages/admin/orderDetail', {
                                            Title: `Clipart Press || ออเดอร์ #${order_id}`,
                                            currentLink: "order",
                                            orders: orderItem,
                                            payment: payment,
                                            shipment: shipment,
                                            coupon: coupon,
                                            qrcode: imgQr,
                                            paymentSelect: Arr,
                                            cancel: cancel,
                                        });
                                    });
                                };
                            });
                        });
                    });
                });
            });
        });
    });

    router.get('/admin/payment', (req, res) => {
        dbConnection.promise().query('SELECT p.*, pm.*, ors.*, u.name FROM payment p JOIN payment_method pm ON pm.payment_method_id = p.payment_method_id ' +
            'JOIN orders ors ON ors.order_id = p.order_id JOIN users u ON u.user_id = ors.user_id').then(([payments]) => {
            res.render('pages/admin/payment', {
                Title: 'Clipart Press || แจ้งชำระเงิน',
                currentLink: "payment",
                payments: payments,
            });
        });
    });
    router.post('/updatePaymentStatus/:id/:status', paymentController.updatePaymentStatus);
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
                    Title: 'Clipart Press || จัดการโปรโมชั่น',
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
                    Title: 'Clipart Press || เพิ่มโปรโมชั่น',
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
                                Title: 'Clipart Press || แก้ไขโปรโมชั่น',
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
                Title: 'Clipart Press || คูปอง',
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
                Title: 'Clipart Press || ขนส่ง',
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
                Title: 'Clipart Press || แก้ไขขนส่ง',
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
        dbConnection.promise().query('SELECT * FROM payment_method WHERE deleted_at IS NULL').then(([rows]) => {
            const decrypted = [];
            rows.forEach((row) => {
                const key = Buffer.from('ef045d157e2df86220ee67ac37132a604f51477fef58fdaac52ed312d97a1538', 'hex');
                const iv = Buffer.from('72d78a8a792f98f086bd892600e3638a', 'hex');
                var encrypted = row.number;
                const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
                let number = decipher.update(encrypted, 'hex', 'utf8');
                number += decipher.final('utf8');
                let method = {
                    payment_method_id: row.payment_method_id,
                    method_type: row.method_type,
                    method_name: row.method_name,
                    number: number,
                    name: row.name,
                    statusPayment: row.status,
                };
                decrypted.push(method);
            });
            res.render('pages/admin/payment_method', {
                Title: 'Clipart Press || การชำระเงิน',
                currentLink: "payment_method",
                payment_method: decrypted,
            });
        });
    });


    router.post('/addmethod', paymentController.addmethod)
    router.post('/updatemethod/:id', paymentController.editmethod)
    router.post('/deletemethod/:id', paymentController.deletemethod)

    // จัดการ user 
    router.get('/admin/member', (req, res) => {
        dbConnection.promise().query('SELECT * FROM users WHERE user_role = 0').then(([rows]) => {
            // console.log(data)
            res.render('pages/admin/member', {
                user: rows,
                currentLink: "member"
            })
        })
    });
    router.post("/deleteUser", userController.deleteUser);




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