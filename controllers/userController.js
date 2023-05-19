const dbConnection = require("../config/database");
const {
    check
} = require("express-validator");
const {
    body,
    validationResult
} = require("express-validator");
const bcrypt = require('bcrypt');
const multer = require('multer');

let validate = [
    check("username", "กรุณากรอกชื่อผู้ใช้").not().isEmpty().custom((value) => {
        return dbConnection.query("SELECT * FROM users WHERE username = ?", [value])
            .then(([rows]) => {
                if (rows.length > 0) {
                    return Promise.reject('ชื่อนี้ถูกใช้งานแล้ว')
                }
                return true;
            });
    }),
    check("email", "อีเมลนี้ไม่สามารถใช้ได้").isEmail().custom((value) => {
        // generate verification token
        return dbConnection.query("SELECT * FROM users WHERE email = ?", [value]) // เช็คอีเมลใน database
            .then(([rows]) => {
                if (rows.length > 0) {
                    return Promise.reject('อีเมลนี้ถูกใช้งานแล้ว')
                }
                return true;
            });
    }),
    check("name", "กรุณากรอกชื่อ").not().isEmpty(),
    check("telephone", "กรุณากรอกหมายเลขโทรศัพท์").not().isEmpty()
];

let checkInputAddress = [
    check("name", "กรุณากรอกชื่อ").not().isEmpty(),
    check("address", "กรุณากรอกที่อยู่").not().isEmpty(),
    check("province", "กรุณากรอกจังหวัด").not().isEmpty(),
    check("zipcode", "กรุณากรอกรหัสไปรษณีย์").not().isEmpty(),
    check("telephone", "กรุณากรอกหมายเลขโทรศัพท์").not().isEmpty()
];

let validatePassword = [
    check("newPassword", "รหัสผ่านต้องมีอย่างน้อย 6 ตัว").isLength({
        min: 6
    }),
    check("confirmPassword", "รหัสผ่านไม่ตรง")
    .custom((value, {
        req
    }) => {
        return value === req.body.newPassword
    }),
];

const updateProfile = async (req, res) => {
    let errorsArr = [];
    let validationErr = await validationResult(req);
    if (!validationErr.isEmpty()) {
        let errors = Object.values(validationErr.mapped());
        errors.forEach((item) => {
            errorsArr.push(item.msg);
        });
        req.flash("errors", errorsArr);
        return res.redirect("/userprofile");
    }

    const {
        username,
        email,
        name,
        telephone,
        lineid
    } = req.body;
    const profilePicturePath = req.file.path.replace('public', '');

  
    try {
        const data = [username, email, profilePicturePath, name, telephone, lineid, req.session.user_id];
        await dbConnection.query('UPDATE users SET username = ?, email = ?, picture = ? ,name = ?, telephone = ?, lineid = ? WHERE user_id = ?', data);
        // return res.render('pages/userprofile', { success_msg: ['แก้ไขโปรไฟล์สำเร็จ'] });
        req.flash("success_msg", 'แก้ไขโปรไฟล์สำเร็จ');
        req.session.picture = profilePicturePath;
        return res.redirect("/userprofile");

    } catch (err) {
        req.flash("errors", err);
        return res.redirect("/userprofile");
    }
};

const addAddress = async (req, res) => {
    let errorsArr = [];
    let validationErr = await validationResult(req);
    if (!validationErr.isEmpty()) {
        let errors = Object.values(validationErr.mapped());
        errors.forEach((item) => {
            errorsArr.push(item.msg);
        });
        req.flash("errors", errorsArr);
        return res.redirect("/address");
    }
    const {
        name,
        address,
        province,
        zipcode,
        telephone
    } = req.body;
    try {

        await dbConnection.query("INSERT INTO address SET name = ?, address = ?, province = ?, postcode = ?, telephone = ?, user_id = ?", [name, address, province, zipcode, telephone, req.session.user_id]);
        req.flash("success_msg", 'เพิ่มที่อยู่สำเร็จ');
        return res.redirect("/address");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/address");
    }
}

const editAddress = async (req, res) => {
    const id = req.body.addressID;
    const {
        new_name,
        new_address,
        new_province,
        new_zipcode,
        new_tel
    } = req.body;
    try {
        await dbConnection.query("UPDATE address SET name = ?, address = ?, province = ?, postcode = ?, telephone = ? WHERE address_id = ?", [new_name, new_address, new_province, new_zipcode, new_tel, id]);
        req.flash("success_msg", 'แก้ไขที่อยู่สำเร็จ');
        return res.redirect("/address");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/address");
    }
}


const deleteAddress = async (req, res) => {
    const id = req.body.addressID;
    try {
        await dbConnection.query("UPDATE address SET deleted_at = CURRENT_TIMESTAMP WHERE address_id = ?", [id]);
        req.flash("success_msg", 'ลบที่อยู่สำเร็จ');
        return res.redirect("/address");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/address");
    }
}
const changepassword = async (req, res) => {
    let errorsArr = [];
    let validationErr = await validationResult(req);
    if (!validationErr.isEmpty()) {
        let errors = Object.values(validationErr.mapped());
        errors.forEach((item) => {
            errorsArr.push(item.msg);
        });
        req.flash("errors", errorsArr);
        return res.redirect("/changepassword");
    }
    const {
        currentPassword,
        newPassword
    } = req.body;

    let data = bcrypt.hashSync(newPassword, 10)
    try {
        await dbConnection.query("SELECT * FROM users WHERE user_id = ?", [req.session.user_id])
            .then(async ([row]) => {
                await bcrypt.compare(currentPassword, row[0].password).then(compare_result => {
                    console.log(compare_result)
                    if (compare_result) {
                        dbConnection.query('UPDATE users SET password = ? WHERE user_id = ?', [data, req.session.user_id]);
                        req.flash("success_msg", 'เปลี่ยนรหัสผ่านสำเร็จ');
                        return res.redirect("/changepassword");
                    } else {
                        res.render('pages/changepw', {
                            errors: ['รหัสผ่านไม่ถูกต้อง']
                        });
                    }
                })
            })

    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/changepassword");
    }
}

// อัพโหลดรูป
const storage_profile = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/profile') // Set the destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Set the file name to be saved
    }
});
const upload_profile = multer({
    storage: storage_profile
});
 



module.exports = {
    validate: validate,
    updateProfile: updateProfile,
    checkInputAddress: checkInputAddress,
    addAddress: addAddress,
    editAddress:editAddress,
    deleteAddress: deleteAddress,
    validatePassword: validatePassword,
    changepassword: changepassword,
    upload_profile: upload_profile
}