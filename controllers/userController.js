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
const path = require('path');

let validate = [
    check("username", "กรุณากรอกชื่อผู้ใช้").not().isEmpty().custom((value) => {
        return dbConnection.promise().query("SELECT * FROM users WHERE username = ?", [value])
            .then(([rows]) => {
                if (rows.length > 0) {
                    return Promise.reject('ชื่อนี้ถูกใช้งานแล้ว')
                }
                return true;
            });
    }),
    check("email", "อีเมลนี้ไม่สามารถใช้ได้").isEmail().custom((value) => {
        // generate verification token
        return dbConnection.promise().query("SELECT * FROM users WHERE email = ?", [value]) // เช็คอีเมลใน database
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
    } = req.body;
    let profilePicturePath;
    let query;
    let data;
    if (req.file) {
        profilePicturePath = req.file.path.replace('public', '');
        query = 'UPDATE users SET username = ?, email = ?, picture = ? ,name = ?, telephone = ? WHERE user_id = ?'
        req.session.picture = profilePicturePath;
        data = [username, email, profilePicturePath, name, telephone, req.session.user_id];

    } else {
        query = 'UPDATE users SET username = ?, email = ? ,name = ?, telephone = ? WHERE user_id = ?'
        data = [username, email, name, telephone, req.session.user_id];
    }
    console.log(req.body);

    try {
        dbConnection.query(query, data);
        // return res.render('pages/userprofile', { success_msg: ['แก้ไขโปรไฟล์สำเร็จ'] });
        req.flash("success_msg", 'แก้ไขโปรไฟล์สำเร็จ');
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
        telephone,
        df_address
    } = req.body;
    try {
        dbConnection.promise().query('SELECT * FROM address WHERE user_id = ? AND deleted_at is null', req.session.user_id)
            .then(async ([rows]) => {
                if (rows <= 0) {
                    dbConnection.query("INSERT INTO address SET name = ?, address = ?, province = ?, postcode = ?, telephone = ?, user_id = ?, default_address = 1", [name, address, province, zipcode, telephone, req.session.user_id]);
                } else {
                    if (df_address == '1') {
                        dbConnection.query("UPDATE address SET default_address = 0 WHERE user_id = ?", req.session.user_id);
                        dbConnection.query("INSERT INTO address SET name = ?, address = ?, province = ?, postcode = ?, telephone = ?, user_id = ?, default_address = 1", [name, address, province, zipcode, telephone, req.session.user_id]);
                    } else if (df_address == '' || df_address == null) {
                        dbConnection.query("INSERT INTO address SET name = ?, address = ?, province = ?, postcode = ?, telephone = ?, user_id = ?, default_address = 0", [name, address, province, zipcode, telephone, req.session.user_id]);
                    }
                }
            })
        req.flash("success_msg", 'เพิ่มที่อยู่สำเร็จ');
        return res.redirect("/address");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/address");
    }
}

const editAddress = async (req, res) => {
    const id = req.params.id;
    const {
        new_name,
        new_address,
        new_province,
        new_zipcode,
        new_tel,
        df_address
    } = req.body;
    try {
        if (df_address == '1') {
            await dbConnection.promise().query("UPDATE address SET default_address = 0 WHERE user_id = ?", req.session.user_id).then(async () => {
                dbConnection.promise().query("UPDATE address SET name = ?, address = ?, province = ?, postcode = ?, telephone = ?, default_address = 1 WHERE address_id = ?", [new_name, new_address, new_province, new_zipcode, new_tel, id], (error) => {
                    if (error) throw error;
                });
            })
        } else if (df_address == '' || df_address == null) {
            dbConnection.promise().query("UPDATE address SET name = ?, address = ?, province = ?, postcode = ?, telephone = ?, default_address = 0 WHERE address_id = ?", [new_name, new_address, new_province, new_zipcode, new_tel, id], (error) => {
                if (error) throw error;
            });
        }
        req.flash("success_msg", 'แก้ไขที่อยู่สำเร็จ');
        return res.redirect("/address");
    } catch (error) {
        console.log(error);
        // req.flash("errors", error.message);
        return res.redirect("/address");
    }
}


const deleteAddress = async (req, res) => {
    const id = req.body.addressID;
    try {
        dbConnection.query("UPDATE address SET deleted_at = CURRENT_TIMESTAMP WHERE address_id = ?", [id]);
        req.flash("success_msg", 'ลบที่อยู่สำเร็จ');
        return res.redirect("/address");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/address");
    }
}
const changepassword = async (req, res) => {
    let errorsArr = [];
    let validationErr = validationResult(req);
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
        await dbConnection.promise().query("SELECT * FROM users WHERE user_id = ?", [req.session.user_id])
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

const deleteUser = async (req, res) => {
    const id = req.params.id;
    try {
        dbConnection.query("UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = ?", [id]);
        req.flash("success_msg", 'ลบผู้ใช้สำเร็จ');
        return res.redirect("/admin/member");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/admin/member");
    }
}

const restoreUser = async (req, res) => {
    const id = req.params.id;
    try {
        dbConnection.query("UPDATE users SET deleted_at = NULL WHERE user_id = ?", [id]);
        req.flash("success_msg", 'กู้คืนใช้สำเร็จ');
        return res.redirect("/admin/member");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/admin/member");
    }
}

const closeAccount = (req, res) => {
    const password = req.body.password;
    dbConnection.promise().query("SELECT * FROM users WHERE user_id = ?", [req.session.user_id])
        .then(async ([row]) => {
            try {
                await bcrypt.compare(password, row[0].password).then(compare_result => {
                    if (compare_result) {
                        dbConnection.query('UPDATE users SET deleted_at = now() WHERE user_id = ?', [req.session.user_id]);
                        req.session.destroy(() => {
                            return res.redirect("/login?close=1");
                        })
                    } else {
                        req.flash("errors", 'รหัสผ่านไม่ถูกต้องหรือไม่ตรง');
                        return res.redirect("/userprofile");
                    }
                })
            } catch (error) {
                console.log(error);
                return res.redirect("/");
            }
        })
}



module.exports = {
    validate: validate,
    updateProfile: updateProfile,
    checkInputAddress: checkInputAddress,
    addAddress: addAddress,
    editAddress: editAddress,
    deleteAddress: deleteAddress,
    validatePassword: validatePassword,
    changepassword: changepassword,
    upload_profile: upload_profile,
    deleteUser: deleteUser,
    restoreUser: restoreUser,
    closeAccount: closeAccount
}