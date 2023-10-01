const dbConnection = require("../config/database");

const placeOrder = (req, res) => { 
    const product_id = JSON.parse(req.body.product_id);
    const {
        coupon_code,
        selectAddress 
    } = req.body
    dbConnection.query(`SELECT c.*, p.*, cd.*, cso.*, o.* FROM cart c JOIN product p ON p.product_id = c.product_id JOIN cart_detail cd ON cd.cart_detail_id = c.cart_detail_id ` +
            `JOIN cart_selected_options cso ON cso.cart_detail_id = cd.cart_detail_id JOIN options o ON o.option_id = cso.option_id WHERE c.user_id = '${9}' AND c.deleted_at IS NULL`)
        .then(([rows]) => {
            dbConnection.query('SELECT pm.*, p.*, phm.* FROM promotions pm JOIN product_has_promotion phm ON phm.promo_id = pm.promo_id ' +
                    'JOIN product p ON p.product_id = phm.product_id WHERE pm.deleted_at IS null AND phm.deleted_at IS null')
                .then(([promotions]) => {
                    let qty;
                    let price;
                    let SumPrice = 0; 
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

                    cartsItem.forEach((item) => {
                        qty = item.quantity
                        price = item.price
                        const findPromo = promotions.some(row => row.product_id == item.product_id) // หาว่าสินค้ามีโปรโมชั่นไหม

                        promotions.forEach((promo) => {
                            if (findPromo) {
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
                        })

                        console.log(item.length);
                        SumPrice += price
                    });
                    var vat = SumPrice * 7 / 100
                
                    res.send(`${vat}`)
                })
        });
}

module.exports = {
    placeOrder: placeOrder
}