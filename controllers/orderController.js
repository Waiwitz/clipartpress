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

                    let coupon = null;
                    var vat = SumPrice * 7 / 100
                    let shipment_price = 0;
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
                        console.log(SumPrice + ' ' + vat + ' ' + shipment_price);
                        finalPrice = SumPrice + vat + shipment_price;
                        if (couponCode !== null) {
                            await dbConnection.promise().query('SELECT * FROM coupon WHERE coupon_code = ? AND deleted_at is null', couponCode).then(([coupons]) => {
                                coupons.forEach((c) => {
                                    if (c.coupon_type == 'value') {
                                        finalPrice = (SumPrice + vat + shipment_price) - c.discount_value;
                                    } else if (c.coupon_type == 'percent') {
                                        finalPrice = (SumPrice + vat + shipment_price) - ((SumPrice + vat + shipment_price) * c.discount_value / 100);
                                    }
                                    coupon = c.coupon_id

                                });

                            })
                        }
                        dbConnection.promise().query('INSERT INTO orders SET order_date = NOW(), order_status = "waitpay", user_id = ?, coupon_id = ?, address_id = ?, shipment_id = ?, shipment_price = ?', [req.session.user_id, coupon, selectAddress, shipment, shipment_price])
                            .then(([order]) => {
                                const order_id = order.insertId;
                                cartsItem.forEach(async (item) => {
                                    const size = item.size;
                                    const file = item.design_file;
                                    const pid = item.product_id;
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
                                    })

                                    SumPrice += price
                                    SumQty += qty

                                    // รอจ่าย=waitpay รอตรวจสอบ=pending ระหว่างผลิต=process ระหว่างจัดส่ง=ship[ing] ส่งสำเร็จ=success ยกเลิก=cancel
                                    dbConnection.promise().query('INSERT INTO order_product_detail SET size = ?, design_file = ?, price = ?, quantity = ?, product_id = ?, order_id = ?', [size, file, price, qty, pid, order_id])
                                        .then(async ([opd]) => {
                                            const opdId = opd.insertId;
                                            await item.options.forEach(async (option) => {
                                                dbConnection.query('INSERT INTO order_product_options SET opd_id = ?, option_id = ?', [opdId, option.option_id]);
                                            });
                                        });
                                    dbConnection.query('UPDATE cart SET deleted_at = NOW() WHERE cart_id = ?', item.cart_id);
                                });
                                dbConnection.query('INSERT INTO payment SET payment_date = NOW(), paid_date = NULL, amount = ?, slip = NULL, payment_method_id = ?, order_id = ?', [finalPrice, paymentMethod, order_id]);
                                console.log(coupon);
                                console.log(finalPrice);
                                res.redirect(`/myorder/invoices/${order_id}`);
                            });
                    })
                })
        });
}

const changePayment = (req, res) => {
    const oid = req.params.oid;
    const mid = req.params.mid;
    dbConnection.query('UPDATE payment SET payment_method_id = ? WHERE order_id = ?', [mid, oid], (err, results) => {
        if (err) throw err;
    });
    res.json({
        message: 'data updated'
    });
}



const storage_slip = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'public/uploads/slip')
    },
    filename: function (req, file, callback) {
        callback(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage_slip
});

const paid = (req, res) => {
    const oid = req.params.oid;
    const slip = req.file.path.replace('public', ''); 
    dbConnection.query('UPDATE payment SET paid_date = NOW(), slip = ? WHERE order_id = ?',[slip, oid])
}
module.exports = {
    placeOrder: placeOrder,
    changePayment: changePayment
}