const {
    error
} = require("console");
const dbConnection = require("../config/database");
const multer = require('multer');
const path = require('path');


// อัพโหลดรูป

const storage_product = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'public/uploads/product')
    },
    filename: function (req, file, callback) {
        callback(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload_product = multer({
    storage: storage_product
});

const addProduct = async (req, res) => {
    const product_name = req.body.product_name.trim();
    const product_description = req.body.description;
    const {
        categories,
        status,
        discount,
        dc_start,
        dc_end,
    } = req.body;
    const productPic = req.file.path.replace('public', '');

    const {
        minqt,
        maxqt,
        priceTier
    } = req.body;

    const {
        minsize,
        priceSize
    } = req.body;

    let query;
    if (dc_start == '' && dc_end == '') {
        query = "INSERT INTO product SET productName = ?, categories = ?, status = ?, picture = ?, discount = ?, discount_start = NULL, discount_end = NULL ,description = ?"
    } else {
        query = "INSERT INTO product SET productName = ?, categories = ?, status = ?, picture = ?, discount = ?, discount_start = ?, discount_end = ? ,description = ?"
    }


    try {
        await dbConnection.query(query, [product_name, categories, status, productPic, discount, dc_start, dc_end, product_description])
            .then(async ([row]) => {
                const productId = row.insertId;
                for (let k = 0; k < minqt.length; k++) {
                    const quantity_tier = {
                        minqt: minqt[k][0],
                        maxqt: maxqt[k][0],
                        priceqt: priceTier[k][0],
                        product_id: productId
                    };
                    await dbConnection.query("INSERT INTO pricingQt_tier SET ?", [quantity_tier], (error) => {
                        if (error) throw error;
                    })

                }

                for (let i = 0; i < minsize.length; i++) {
                    const size_tier = {
                        minsize: minsize[i][0],
                        pricesize: priceSize[i][0],
                        product_id: productId
                    };
                    await dbConnection.query("INSERT INTO pricingSize_tier SET ?", [size_tier], (error) => {
                        if (error) throw error;
                    })

                }

                // for (let i = 0; i < spec_name.length; i++) {
                //     const spec = {
                //         spec_name: spec_name[i][0],
                //         product_id: productId
                //     };
                //     await dbConnection.query("INSERT INTO specification SET ?", [spec])
                //         .then(async ([row]) => {
                //             const specId = row.insertId;
                //             for (let j = 0; j < options[i].length; j++) {
                //                 const option = {
                //                     spec_id: specId,
                //                     option_id: options[i][j],
                //                 };
                //                 dbConnection.query('INSERT INTO specification_options SET ?', option, (error, results, fields) => {
                //                     if (error) throw error;
                //                 });
                //             }
                //         })
                // }
                req.flash("success_msg", 'เพิ่มสินค้าสำเร็จ');
                return res.redirect("/admin/product-list");
            });
    } catch (error) {
        // req.flash("errors", error.message); 
        console.log(error)
        return res.redirect("/admin/addproduct");
    }
}

const updateProduct = async (req, res) => {
    const productId = req.params.id;
    console.log(productId);
    const product_name = req.body.product_name.trim();
    const product_description = req.body.product_description.trim();

    const {
        categories,
        status,
        discount,
        dc_start,
        dc_end,
    } = req.body;

    let productPic;
    let query;
    let queryQt;
    const {
        qtId,
        minqt,
        maxqt,
        priceTier
    } = req.body;

    const {
        newminqt,
        newmaxqt,
        newpriceTier
    } = req.body;

    const {
        sizeId,
        minsize,
        priceSize
    } = req.body;

    const {
        newminsize,
        newpriceSize
    } = req.body;

    if (req.file) {
        productPic = req.file.path.replace('public', '');
    }


    if (dc_start == '' && dc_end == '') {
        if (productPic) {
            // Use new picture if uploaded
            query = `UPDATE product SET productName = , categories = ?, status = ?, picture = ?, discount = ?, discount_start = NULL, discount_end = NULL ,description = ? WHERE product_id = ${productId}`;
        } else {
            // Keep old picture
            query = `UPDATE product SET productName = ?, categories = ?, status = ?, discount = ?, discount_start = NULL, discount_end = NULL ,description = ? WHERE product_id = ${productId}`;
        }
    } else {
        if (productPic) {
            // Use new picture if uploaded
            query = `UPDATE product SET productName = ?, categories = ?, status = ?, picture = ?, discount = ?, discount_start = ?, discount_end = ? ,description = ? WHERE product_id = ${productId}`;
        } else {
            // Keep old picture
            query = `UPDATE product SET productName = ?, categories = ?, status = ?, discount = ?, discount_start = ?, discount_end = ? ,description = ? WHERE product_id = ${productId}`;
        }
    }

    try {
        let queryParams;
        if (dc_start == '' && dc_end == '') {
            if (productPic) {
                // Parameters when updating picture
                queryParams = [product_name, categories, status, productPic, discount, product_description, productId];
            } else {
                // Parameters when keeping old picture
                queryParams = [product_name, categories, status, discount, product_description, productId];
            }
        } else {
            if (productPic) {
                // Parameters when updating picture
                queryParams = [product_name, categories, status, productPic, discount, dc_start, dc_end, product_description, productId];
            } else {
                // Parameters when keeping old picture
                queryParams = [product_name, categories, status, discount, dc_start, dc_end, product_description, productId];
            }
        }
        await dbConnection.query(query, queryParams)
            .then(async () => {
                for (let k = 0; k < qtId.length; k++) {
                    const quantity_tier = {
                        minqt: minqt[k][0],
                        maxqt: maxqt[k][0],
                        priceqt: priceTier[k][0],
                        product_id: productId
                    };
                    await dbConnection.query('UPDATE pricingQt_tier SET ? WHERE qtTier_id = ?', [quantity_tier, qtId[k][0]], (error) => {
                        if (error) throw error;
                    })
                    // if (qtId == '') {
                    //     dbConnection.query("INSERT INTO pricingQt_tier SET ? ON DUPLICATE KEY UPDATE product_id = ?", [quantity_tier, productId], (error) => {
                    //         if (error) throw error;
                    //     })
                    // }
                    // await dbConnection.query(`UPDATE pricingQt_tier SET ? WHERE qtTier_id = ${qtId[k][0]} AND product_id = ${productId}`, [quantity_tier], (error) => {
                    //     if (error) throw error;
                    // })
                    // await dbConnection.query(`INSERT INTO pricingQt_tier SET ? ON DUPLICATE KEY UPDATE ?`, [quantity_tier, quantity_tier], (error) => {
                    //     if (error) throw error;
                    // })
                }

                if ('newminqt' in req.body) {
                    for (let j = 0; j < newminqt.length; j++) {
                        const new_quantity_tier = {
                            minqt: newminqt[j][0],
                            maxqt: newmaxqt[j][0],
                            priceqt: newpriceTier[j][0],
                            product_id: productId
                        };
                        await dbConnection.query('INSERT INTO pricingQt_tier SET ?', [new_quantity_tier], (error) => {
                            if (error) throw error;
                        });
                    }
                }

                for (let i = 0; i < sizeId.length; i++) {
                    const size_tier = {
                        minSize: minsize[i][0],
                        pricesize: priceSize[i][0],
                        product_id: productId
                    };
                    await dbConnection.query('UPDATE pricingSize_tier SET ? WHERE sizeTier_id = ?', [size_tier, sizeId[i][0]], (error) => {
                        if (error) throw error;
                    })
                }

                if ('newminsize' in req.body) {
                    for (let t = 0; t < newminsize.length; t++) {
                        const new_size_tier = {
                            minSize: newminsize[t][0],
                            pricesize: newpriceSize[t][0],
                            product_id: productId
                        };
                        await dbConnection.query('INSERT INTO pricingSize_tier SET ?', [new_size_tier], (error) => {
                            if (error) throw error;
                        });
                    }
                }
                req.flash("success_msg", 'อัปเดตสินค้าสำเร็จ');
                return res.redirect(`/admin/product-list`);
            });
    } catch (error) {
        req.flash("errors", error.message);
        console.log(error)
        return res.redirect(`/admin/product/edit/${productId}`);
    }
}


const deleteProduct = async (req, res) => {
    const id = req.body.product_id;
    try {
        await dbConnection.query("UPDATE product SET deleted_at = CURRENT_TIMESTAMP WHERE product_id = ?", [id]);
        req.flash("success_msg", 'ลบสินค้าสำเร็จ');
        return res.redirect("/admin/product-list");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/admin/product-list");
    }
}


const deleteUser = async (req, res) => {
    const id = req.body.user_id;
    try {
        await dbConnection.query("UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = ?", [id]);
        req.flash("success_msg", 'ลบผู้ใช้สำเร็จ');
        return res.redirect("/admin/member");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/admin/member");
    }
}




module.exports = {
    addProduct: addProduct,
    upload_product: upload_product,
    // upload_option: upload_option,
    updateProduct: updateProduct,
    deleteProduct: deleteProduct,
    deleteUser: deleteUser,
}