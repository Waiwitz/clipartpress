const dbConnection = require("../config/database");
const multer = require('multer');
const path = require('path');

const placeOrder = (req, res) => {
    // const product_id = JSON.parse(req.body.product_id);
    const {
        couponCode,
        selectAddress,
        shipment,
        paymentMethod
    } = req.body
    dbConnection.promise().query(`SELECT c.*, p.*, cd.*, cso.*, o.* FROM cart c JOIN product p ON p.product_id = c.product_id JOIN cart_detail cd ON cd.cart_detail_id = c.cart_detail_id ` +
            `JOIN cart_selected_options cso ON cso.cart_detail_id = cd.cart_detail_id JOIN options o ON o.option_id = cso.option_id WHERE c.user_id = '${req.session.user_id}' AND c.deleted_at IS NULL`)
        .then(([rows]) => {
            dbConnection.promise().query('SELECT pm.*, p.*, phm.* FROM promotions pm JOIN product_has_promotion phm ON phm.promo_id = pm.promo_id ' +
                    'JOIN product p ON p.product_id = phm.product_id WHERE pm.deleted_at IS null AND phm.deleted_at IS null')
                .then(([promotions]) => {
                    let price;
                    let qty
                    let SumPrice = 0;
                    let SumQty = 0
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
                    cartsItem.forEach(async (item) => {
                        qty = item.quantity
                        price = item.price
                        const findPromo = promotions.some(row => row.product_id == item.product_id) // หาว่าสินค้ามีโปรโมชั่นไหม
                        promotions.forEach((promo) => {
                            if (findPromo) {
                                if (new Date() >= promo.start_date && new Date() <= promo.end_date) {
                                    if (promo.promo_type == 'giveaway' && promo.promo_condition == 'value') { // แถมเมื่อย้อนสั่งซื้อถึง
                                        if (item.price >= promo.min_reach) {
                                            qty = item.quantity + promo.type_value
                                        }
                                    } else if (promo.promo_type == 'giveaway' && promo.promo_condition == 'qty') { // แถมเมื่อซื้อถึงชิ้น
                                        if (item.quantity >= promo.min_reach) {
                                            qty = item.quantity + promo.type_value
                                        }
                                    } else if (promo.promo_type == 'discount' && promo.promo_condition == 'value') { //ลดเมื่อยอดถึง
                                        if (item.price >= promo.min_reach) {
                                            price = item.price - (item.price * promo.type_value / 100)
                                        }
                                    } else if (promo.promo_type == 'discount' && promo.promo_condition == 'qty') { // ลดเมื่อซื้อถึง
                                        if (item.quantity >= promo.min_reach) {
                                            price = item.price - (item.price * promo.type_value / 100)
                                        }
                                    }
                                }
                            }
                            SumPrice += price
                            SumQty += qty
                        })
                    });
                    let coupon = null;
                    var vat = SumPrice * 7 / 100
                    let shipment_price = 0;
                    let discount = 0;
                    let finalPrice = 0
                    dbConnection.promise().query('SELECT s.*, sp.* FROM shipments s JOIN shipments_price sp ON sp.shipment_id = s.shipment_id WHERE s.shipment_id = ?', shipment).then(async ([rows]) => {
                        rows.forEach((row) => {
                            if (row.shipment_type == 'free') {
                                shipment_price = 0;
                            } else if (row.shipment_type == 'qty') {
                                if (SumQty < row.qty_min) {
                                    shipment_price = row.start_price;
                                } else if (SumQty >= row.qty_min) {
                                    shipment_price = row.price;
                                }
                            }
                        });
                        console.log('ค่าส่ง' + shipment_price);
                        if (couponCode !== null) {
                            await dbConnection.promise().query('SELECT * FROM coupon WHERE coupon_code = ? AND deleted_at is null', couponCode).then(([coupons]) => {
                                coupons.forEach((c) => {
                                    if (c.coupon_type == 'value') {
                                        discount = c.discount_value;
                                    } else if (c.coupon_type == 'percent') {
                                        discount = (SumPrice + vat + shipment_price) * c.discount_value / 100;
                                    }
                                    coupon = c.coupon_id
                                });
                            })
                        }
                        dbConnection.promise().query('INSERT INTO orders SET order_date = NOW(), order_status = "waitpay", discount = ?, user_id = ?, coupon_id = ?, shipment_price = ?, payment_method_id = ?', [discount, req.session.user_id, coupon, shipment_price, paymentMethod])
                            .then(([order]) => {
                                const order_id = order.insertId;
                                dbConnection.promise().query('SELECT * FROM address WHERE address_id = ?', selectAddress).then(([address]) => {
                                    const nameShip = address[0].name;
                                    const shipaddress = address[0].address;
                                    const province = address[0].province;
                                    const postcode = address[0].postcode;
                                    const telephone = address[0].telephone;
                                    dbConnection.query('INSERT INTO ship_address SET shipment_id = ?, order_id = ?, name = ?, address = ?, province = ?, postcode = ?, telephone = ?', [shipment, order_id, nameShip, shipaddress, province, postcode, telephone]);
                                });
                                cartsItem.forEach(async (item) => {
                                    const size = item.size;
                                    const file = item.design_file;
                                    const pid = item.product_id;
                                    // รอจ่าย=waitpay รอตรวจสอบ=pending ระหว่างผลิต=produce ระหว่างจัดส่ง=ship[ing] ส่งสำเร็จ=success ยกเลิก=cancel
                                    dbConnection.promise().query('INSERT INTO order_product_detail SET size = ?, design_file = ?, price = ?, quantity = ?, product_id = ?, order_id = ?', [size, file, item.price, item.quantity, pid, order_id])
                                        .then(async ([opd]) => {
                                            const opdId = opd.insertId;
                                            await item.options.forEach(async (option) => {
                                                dbConnection.query('INSERT INTO order_product_options SET opd_id = ?, option_id = ?', [opdId, option.option_id]);
                                            });
                                        });
                                    dbConnection.query('UPDATE cart SET deleted_at = NOW() WHERE cart_id = ?', item.cart_id);
                                });
                                console.log(coupon);
                                res.redirect(`/myorder/invoices/${order_id}`);

                            });
                    })
                })
        });
}

const changePayment = (req, res) => {
    const oid = req.params.oid;
    const mid = req.params.mid;
    dbConnection.promise().query('UPDATE orders SET payment_method_id = ? WHERE order_id = ?', [mid, oid], (err, results) => {
        console.log(err);
        if (err) throw err;
    });
    res.json({
        message: 'data updated'
    });
}


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/slip');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage
});

const paid = (req, res) => {
    const oid = req.params.oid;
    const amount = req.params.amount;
    const paymentMethod = req.params.method;
    const slip = req.file.path.replace('public', '');
    console.log(slip);
    const date = req.body.dateTf;
    dbConnection.query('UPDATE orders SET order_status = "pending" WHERE order_id = ?', oid);
    dbConnection.query('INSERT INTO payment SET paid_date = ?, amount = ?, slip = ?, payment_method_id = ?, payment_status = "pending" ,order_id = ?', [date, amount, slip, paymentMethod, oid]);
    // dbConnection.promise().query('UPDATE payment SET paid_date = ?, amount = ? ,slip = ? WHERE order_id = ?', [date, amount, slip, oid], (err) => {
    //     if (err) throw err;
    // });
    res.json({
        message: 'data updated'
    });
}

const cancel = (req, res) => {
    const oid = req.params.oid;
    const reason = req.body.reason;
    dbConnection.promise().query('UPDATE orders SET order_status = "cancel" WHERE order_id = ?', [oid], (err) => {
        if (err) throw err;
    });
    dbConnection.promise().query('INSERT INTO cancelOrder SET reason = ?, order_id = ?', [reason, oid], (err) => {
        if (err) throw err;
    });
    res.redirect(`/myorder/invoices/${oid}`);
}

const updateOrder = (req, res) => {
    const oid = req.params.id;
    const {
        statusOrder,
        trackingNumber
    } = req.body
    console.log(req.body);
    dbConnection.promise().query('UPDATE orders SET order_status = ?, tracking_number = ? WHERE order_id = ?', [statusOrder, trackingNumber, oid], (err, results) => {
        console.log(err);
        if (err) throw err;
    });
    req.flash('success_msg', 'แก้ไขออเดอร์สำเร็จ')
    res.redirect(`/admin/order/${oid}`);
}

module.exports = {
    placeOrder: placeOrder,
    changePayment: changePayment,
    upload: upload,
    paid: paid,
    cancel: cancel,
    updateOrder: updateOrder
}