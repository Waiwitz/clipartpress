const dbConnection = require("../config/database");
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'public/uploads/product') // Set the destination folder for uploaded files
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
    const name = req.body.jobname;
    const quantity = req.body.quantity;
    const design = req.file.path.replace('public', '');
    const specs = req.body.spec;
    const options = req.body.option;
    const price = req.body.total_price;

    let insertionSuccess = true;


    const data = [name, JSON.stringify(specs), JSON.stringify(options),design, price, quantity, userId, productId];
    try {
        await dbConnection.query("INSERT INTO cart SET printing_name = ? , spec = ?, options = ?, design_file = ?, price = ?, quantity = ?, user_id = ?, product_id = ?", data, (error) => {
            if (error) throw error;
        });
    } catch (error) {
        console.log(error);
        insertionSuccess = false;
        return res.redirect(`/product/all`);
    }


    if (insertionSuccess) {
        return res.send('เพิ่มลงตระกร้าแล้ว');
    } else {
        return res.redirect(`/product/all`);
    }
};

const deleteCart = async (req, res) => {
    const id = req.body.id
    try {
        await dbConnection.query("UPDATE cart SET deleted_at = CURRENT_TIMESTAMP WHERE cart_id = ?", [id]);
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
    deleteCart: deleteCart
}