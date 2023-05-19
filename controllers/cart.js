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

    // for (let i = 0; i < specs.length; i++) {
    //     // const specObj = {
    //     //     [specs[i]]: options[i]
    //     // };
    //     // specObjects.push(specObj);
    // }

    const data = [name, JSON.stringify(specs), JSON.stringify(options), quantity, design, userId, productId];
    try {
        await dbConnection.query("INSERT INTO cart SET printing_name = ? , spec_name = ?, option_name = ?, quantity = ?, design_file = ?, user_id = ?, product_id = ?", data, (error) => {
            if (error) throw error;
        });
        return res.send('เพิ่มลงตระกร้าแล้ว');
    } catch (error) {
        console.log(error);
        return res.redirect(`/product/all`);
    }
};

module.exports = {
    upload: upload,
    insertCart: insertCart,
}