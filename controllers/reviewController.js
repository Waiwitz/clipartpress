const dbConnection = require("../config/database");

const postReview = (req, res) => {
    const order_id = req.params.id
    const {
        rating,
        detail
    } = req.body
    dbConnection.promise().query("SELECT opd.order_id, p.* FROM product p JOIN order_product_detail opd ON opd.product_id = p.product_id WHERE opd.order_id = ?", order_id)
        .then(([products]) => {
            dbConnection.promise().query("SELECT * FROM reviews WHERE order_id = ?", products[0].order_id).then(([reviews]) => {
                const productStore = [];
                for (let i = 0; i < products.length; i++) {
                    const findreview = reviews.find(row => row.order_id == products[0].order_id);
                    if (!findreview && !productStore.includes(products[i].product_id)) {
                        dbConnection.query("INSERT INTO reviews SET review_date = now(), rate = ?, detail = ?, order_id = ?, product_id = ?, user_id = ?",
                            [rating, detail, order_id, products[i].product_id, req.session.user_id]);

                        productStore.push(products[i].product_id);

                        req.flash('success_msg', 'ให้คะแนนสินค้าเรียบร้อยแล้ว');
                        res.redirect(`/myorder/`);
                    } else if (findreview) {
                        dbConnection.query("UPDATE reviews SET rate = ?, detail = ?",
                            [rating, detail]);
                        req.flash('success_msg', 'แก้ไขคะแนนสินค้าเรียบร้อยแล้ว');
                        res.redirect(`/myorder/`);
                    }
                }
            })
        })
        .catch(error => {
            console.log(error);
            res.redirect(`/myorder/review/${order_id}`);
        });
}

module.exports = {
    postReview: postReview,
}