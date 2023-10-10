const dbConnection = require("../config/database");
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'public/uploads/artwork') // Set the destination folder for uploaded files
    },
    filename: function (req, file, callback) {
        callback(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`); // Set the file name to be saved
    }
});

const upload = multer({
    storage: storage
});

const insertCart = async (req, res) => {
    const productId = req.body.productid;
    const userId = req.session.user_id;
    const quantity = req.body.qt;
    const artwork = req.file.path.replace('public', '');
    // const specs = req.body.spec;
    const options = req.body.option;
    const price = req.body.total_price;
    const size = req.body.size;

    const selectedData = [size, artwork, price, quantity];

    try {
        await dbConnection.promise().query("INSERT INTO cart_detail SET size = ?, design_file = ?, price = ?, quantity = ?", selectedData)
            .then(async ([row]) => {
                const cart_detail_id = row.insertId;
                dbConnection.query("INSERT INTO cart SET user_id = ?, product_id = ?, cart_detail_id = ?", [userId, productId, cart_detail_id], (error) => {
                    if (error) throw error;
                });
                for (let i = 0; i < options.length; i++) {
                    dbConnection.query('INSERT INTO cart_selected_options SET cart_detail_id = ?, option_id = ?', [cart_detail_id, options[i]], (error) => {
                        if (error) throw error;
                    })
                }
                req.flash('success_msg', 'เพิ่มสินค้าลงตระกร้าแล้ว')
                res.redirect(`/cart`);
            })
    } catch (error) {
        console.log(error);
        return res.redirect(`/product/all`);
    }
};

const updateCart = async (req, res) => {
    // const productId = req.params.productid;
    const cartId = req.params.cartDetailid;
    // const userId = req.session.user_id;
    const quantity = req.body.qt;
    let artwork;
    if (req.file) {
        artwork = req.file.path.replace('public', '');
    }
    const options = req.body.option;
    const price = req.body.total_price;
    const size = req.body.size;

    let selectedData;
    let query;
    if (artwork) {
        query = 'UPDATE cart_detail SET size = ?, design_file = ?, price = ?, quantity = ? WHERE cart_detail_id = ?'
        selectedData = [size, artwork, price, quantity, cartId];
    } else {
        query = 'UPDATE cart_detail SET size = ?, price = ?, quantity = ? WHERE cart_detail_id = ?'
        selectedData = [size, price, quantity, cartId];
    }
    try {
        dbConnection.query(query, selectedData, (error) => {
            if (error) throw error;
        })

        dbConnection.promise().query('SELECT id FROM cart_selected_options WHERE cart_detail_id = ?', cartId).then(([rows]) => {
            for (let i = 0; i < rows.length; i++) {
                dbConnection.query('UPDATE cart_selected_options SET option_id = ? WHERE id = ?', [options[i], rows[i].id], (error) => {
                    if (error) throw error;
                })
            }
        })

        req.flash('success_msg', 'แก้ไขสินค้าในตะกร้าแล้ว')
        res.redirect(`/cart`);

    } catch (error) {
        console.log(error);
        return res.redirect(`/product/all`);
    }
};

const deleteCart = async (req, res) => {
    const id = req.body.id
    try {
        dbConnection.query("UPDATE cart SET deleted_at = CURRENT_TIMESTAMP WHERE cart_id = ?", [id]);
        req.flash("success_msg", 'ลบสินค้าออกจากตระกร้าแล้ว');
        return res.redirect("/cart");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/cart");
    }
}

module.exports = {
    upload: upload,
    insertCart: insertCart,
    updateCart: updateCart,
    deleteCart: deleteCart
}