const dbConnection = require("../config/database");
const multer = require('multer');
const path = require('path');

const addType = async (req, res) => {
    const typename = req.body.type_name;
    try {
        if (typename === '') {
            req.flash("errors", 'กรุณาใส่ชื่อประเภท');
            return res.redirect("/typeproduct");
        }
        await dbConnection.query("SELECT * FROM categories WHERE categories_name = ?", [typename])
            .then(async ([row]) => {
                if (row.length > 0) {
                    req.flash("errors", 'มีชื่อประเภทนี้อยู่แล้ว');
                    return res.redirect("/typeproduct");
                } else {
                    await dbConnection.query("INSERT INTO categories SET categories_name = ?", [typename]);
                    req.flash("success_msg", 'เพิ่มประเภทสำเร็จ');
                    return res.redirect("/typeproduct");
                }
            })


    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/typeproduct");
    }
}

const editType = async (req, res) => {
    const id = req.body.categoryID;
    const new_type = req.body.new_type;
    try {
        if (new_type === '') {
            req.flash("errors", 'กรุณาใส่ชื่อประเภท');
            return res.redirect("/typeproduct");
        }
        await dbConnection.query("UPDATE categories SET categories_name = ? WHERE categories_id = ?", [new_type, id]);
        req.flash("success_msg", 'แก้ไขประเภทสำเร็จ');
        return res.redirect("/typeproduct");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/typeproduct");
    }
}


const deleteType = async (req, res) => {
    const id = req.body.categoryID;
    try {
        await dbConnection.query("UPDATE categories SET deleted_at = CURRENT_TIMESTAMP WHERE categories_id = ?", [id]);
        req.flash("success_msg", 'ลบประเภทสำเร็จ');
        return res.redirect("/typeproduct");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/typeproduct");
    }
}


// อัพโหลดรูป

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         if (file.fieldname === "imgproduct") {
//             cb(null, 'public/uploads/product')
//         } else if (file.fieldname === "option_img[0][]") {
//             cb(null, 'public/uploads/option');
//         }
//     },
//     filename: (req, file, cb) => {
//         if (file.fieldname === "profile") {
//             cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
//         } else if (file.fieldname === "natid") {
//             cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
//         }
//     }
// });

// const upload = multer({
//     storage: storage,
//     limits: {
//         fileSize: 1024 * 1024 * 10
//     },
//     fileFilter: (req, file, cb) => {
//         checkFileType(file, cb);
//     }
// }).fields(
//     [{
//             name: 'profile',
//             maxCount: 1
//         },
//         {
//             name: 'natid',
//             maxCount: 1
//         },
//         {
//             name: 'certificate',
//             maxCount: 1
//         }
//     ]
// );

const storage_product = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'public/uploads/product') // Set the destination folder for uploaded files
    },
    filename: function (req, file, callback) {
        callback(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`); // Set the file name to be saved
    }
});

// const storage_option = multer.diskStorage({
//     destination: function (req, file, callback) {
//         callback(null, 'public/uploads/option') // Set the destination folder for uploaded option images
//     },
//     filename: function (req, file, callback) {
//         callback(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`); // Set the file name for option images to be saved
//     }
// });

const upload_product = multer({
    storage: storage_product
});
// const upload_option = multer({
//     storage: storage_option,
//     fileFilter: function (req, file, callback) {
//         if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
//             return callback(new Error('Only image files are allowed!'));
//         }
//         callback(null, true);
//     },
//     limits: {
//         fileSize: 1024 * 1024 * 5 // 5MB
//     }
// }); 


const addProduct = async (req, res) => {
    const {
        product_name,
        categories,
        status,
        discount,
        price_per_unit,
        product_description
    } = req.body;
    const spec_name = req.body.spec_name;
    const sub_options = req.body.sub_options;
    const sub_option_prices = req.body.sub_option_prices;
    const productPic = req.file.path.replace('public', '');
    // const optionPic = req.files && Array.isArray(req.files.option_img) ? req.files.option_img : null;

    try {
        
        await dbConnection.query("INSERT INTO product SET productName = ?, status = ?, picture = ?, discount = ?, price_unit_per = ?, description = ?,categories_id = ?", [product_name, status, productPic, discount, price_per_unit, product_description, categories])
            .then(async ([row]) => {
                const productId = row.insertId;
                for (let i = 0; i < spec_name.length; i++) {

                    const spec = {
                        spec_name: spec_name[i][0],
                        product_id: productId
                    };

                    dbConnection.query("INSERT INTO specification SET ?", [spec])
                        .then(async ([row]) => {
                            const specId = row.insertId;
                            const optionArray = [];
                            for (let j = 0; j < sub_options[i].length; j++) {
                                const option = {
                                    option_name: sub_options[i][j],
                                    // option_img: optionPic && optionPic[j] ? optionPic[j].path : null,
                                    price_per_unit: sub_option_prices[i][j],
                                    spec_id: specId
                                };
                                // if (optionPic[i] && optionPic[i][j]) {
                                //     const optionImgPath = optionPic[i][j].path;
                                //     option.option_img = optionImgPath;
                                // }
                                // optionArray.push(option);
                                dbConnection.query('INSERT INTO options SET ?', option, (error, results, fields) => {
                                    if (error) throw error;
                                });
                            }
                        })
                }
                req.flash("success_msg", 'เพิ่มสินค้าสำเร็จ');
                return res.redirect("/product-list");
            });
    } catch (error) {
        // req.flash("errors", error.message); 
        console.log(error)
        return res.redirect("/addproduct");
    }
}

const updateProduct = async (req, res) => {
    const productId = req.params.id;
    const {
        product_name,
        categories,
        status,
        discount,
        price_per_unit,
        product_description
    } = req.body;
    const specId = req.body.spec_id;
    const spec_name = req.body.spec_name;
    console.log(spec_name)
    const sub_options = req.body.sub_options;
    const sub_option_prices = req.body.sub_option_prices;
    let productPic;
    if (req.file) {
        productPic = req.file.filename;
    }
    // const option_img = req.files.map(file => file.filename)
    try {
        await dbConnection.query("UPDATE product SET productName = ?, status = ?, picture = ?, discount = ?, price_unit_per = ?, description = ?, categories_id = ? WHERE product_id = ?", [product_name, status, productPic, discount, price_per_unit, product_description, categories, productId])
            .then(async () => {
                for (let i = 0; i < spec_name.length; i++) {
                    const spec = {
                        spec_name: spec_name[i][0],
                        product_id: productId
                    };
                    if (spec_name[i] > 0) {
                        // Update existing specification
                        await dbConnection.query("UPDATE specification SET spec_name = ? WHERE product_id = ?", [spec]);
                    } else {
                        // Insert new specification
                        const spec = {
                            spec_name: spec_name[i],
                            product_id: productId
                        };
                        const [row] = await dbConnection.query("INSERT INTO specification SET ?", [spec]);
                        specId = row.insertId;
                    }
                    for (let j = 0; j < sub_options[i].length; j++) {
                        const optionId = sub_options[i][j][1];
                        const option = {
                            option_name: sub_options[i][j],
                            price_per_unit: sub_option_prices[i][j],
                            spec_id: specId
                        };
                        if (optionId) {
                            // Update existing option
                            await dbConnection.query("UPDATE options SET option_name = ?, price_per_unit = ? WHERE option_id = ?", [option.option_name, option.price_per_unit, optionId]);
                        } else {
                            // Insert new option
                            await dbConnection.query('INSERT INTO options SET ?', option);
                        }
                    }
                }
                req.flash("success_msg", 'อัปเดตสินค้าสำเร็จ');
                return res.redirect(`/product-list`);
            });
    } catch (error) {
        req.flash("errors", error.message);
        console.log(error)
        return res.redirect(`/product-list/`);
    }
}


const deleteProduct = async (req, res) => {
    const id = req.body.product_id;
    try {
        await dbConnection.query("UPDATE product SET deleted_at = CURRENT_TIMESTAMP WHERE product_id = ?", [id]);
        req.flash("success_msg", 'ลบสินค้าสำเร็จ');
        return res.redirect("/product-list");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/product-list");
    }
}


const deleteUser = async (req, res) => {
    const id = req.body.user_id;
    try {
        await dbConnection.query("UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = ?", [id]);
        req.flash("success_msg", 'ลบผู้ใช้สำเร็จ');
        return res.redirect("/member");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/member");
    }
}




module.exports = {
    addType: addType,
    editType: editType,
    deleteType: deleteType,
    addProduct: addProduct,
    upload_product: upload_product,
    // upload_option: upload_option,
    updateProduct: updateProduct,
    deleteProduct: deleteProduct,
    deleteUser: deleteUser,
}