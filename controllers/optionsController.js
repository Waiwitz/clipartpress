const dbConnection = require("../config/database");
const multer = require('multer');
const path = require('path');

const addOptions = (req, res) => {
    const optionName = req.body.option;
    const price = req.body.option_price;
    const optionPic = req.files.map(file => file.path.replace('public', ''));
    const parcel = req.body.option_parcel;
    const des = req.body.option_des;
    const product = req.body.product;
    const productArray = [];
    console.log(req.body)

    try {

        for (let i = 0; i < optionName.length; i++) {
            const productIdArray = [product[i]];
            const option = {
                option_name: optionName[i],
                option_img: optionPic[i],
                price_per_unit: price[i],
                parcel_type: parcel[i],
                description: des[i],
                product_id: JSON.stringify(productIdArray)
            };

            dbConnection.query('INSERT INTO options SET ?', option, (error, results, fields) => {
                if (error) throw error;
            });
        }
        req.flash("success_msg", 'เพิ่มสำเร็จ');
        return res.redirect("/admin/options");
    } catch (error) {
        console.log(error)
        return res.redirect("/admin/options/addoption");
    }
}

const storage_option = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'public/uploads/option') // Set the destination folder for uploaded files
    },
    filename: function (req, file, callback) {
        callback(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`); // Set the file name to be saved
    }
});

const upload = multer({
    storage: storage_option
});


const updateOption = async (req, res) => {
    const id = req.body.option_id;
    const optionName = req.body.option;
    const price = req.body.option_price;
    const parcel = req.body.option_parcel;
    const des = req.body.option_des;
    const productSelect = req.body.product;
    const product = JSON.stringify(productSelect)

    let optionPic;
    let query;
    if (req.file) {
        optionPic = req.file.path.replace('public', '');
        query = 'UPDATE options SET option_name = ?, option_img = ?, price_per_unit = ?, parcel_type = ?, description = ?, product_id = ? WHERE option_id = ?'
        data = [optionName, optionPic, price, parcel, des, id]
    } else {
        query = 'UPDATE options SET option_name = ?, price_per_unit = ?, parcel_type = ?, description = ?, product_id = ? WHERE option_id = ?'
        data = [optionName, price, parcel, des, id]
    }
    try {
        await dbConnection.query(query, data, (error) => {
            if (error) throw error;
        });
        req.flash("success_msg", 'แก้ไขสำเร็จ');
        return res.redirect("/admin/options");
    } catch (error) {
        req.flash("errors", error);
        return res.redirect("/admin/options");
    }
}

const deleteOption = async (req, res) => {
    const id = req.body.option_id;
    try {
        await dbConnection.query("UPDATE options SET deleted_at = CURRENT_TIMESTAMP WHERE option_id = ?", [id]);
        req.flash("success_msg", 'ลบตัวเลือกสินค้าสำเร็จ');
        return res.redirect("/options");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/options");
    }
}


module.exports = {
    addOptions: addOptions,
    upload: upload,
    updateOption: updateOption,
    deleteOption: deleteOption
}