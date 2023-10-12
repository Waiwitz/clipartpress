const {
    check
} = require("express-validator");
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
    const product_description = req.body.product_description.trim();
    const {
        categories,
        status,
    } = req.body;
    const productPic = req.file.path.replace('public', '');

    const {
        unit,
        sizePrice,
        qty,
        qtyPrice
    } = req.body;

    const option_type = req.body.option_type;
    const options = req.body.option;

    try {
        await dbConnection.promise().query('INSERT INTO product SET productName = ?, categories = ?, status = ?, picture = ?, description = ?', [product_name, categories, status, productPic, product_description])
            .then(async ([row]) => {
                const productId = row.insertId;
                for (let i = 0; i < unit.length; i++) {
                    const sizes = {
                        size_unit: unit[i],
                        size_price: sizePrice[i],
                        product_id: productId
                    }
                    dbConnection.promise().query("INSERT INTO pricingTiers_size SET ?", [sizes], (error) => {
                        if (error) throw error;
                    })
                }

                for (let j = 0; j < qty.length; j++) {
                    const qtys = {
                        quantity: qty[j],
                        qty_price: qtyPrice[j],
                        product_id: productId
                    }
                    dbConnection.promise().query("INSERT INTO pricingTiers_qty SET ?", [qtys], (error) => {
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
                // for (let s = 0; s < spec.length; s++) {
                //     const optionsArray = [options[s]];
                //     const options_product = {
                //         product_id: productId,
                //         option_id: JSON.stringify(optionsArray),
                //     };
                //     console.log(JSON.stringify(optionsArray));
                //     dbConnection.query('INSERT INTO product_options SET ?', options_product, (error, results, fields) => {
                //         if (error) throw error;
                //     });
                // }
                console.log(options);
                for (let o = 0; o < option_type.length; o++) {
                    for (let j = 0; j < options[o].length; j++) {
                        console.log(options[o][j]);
                        const options_product = {
                            option_id: options[o][j],
                            product_id: productId,
                        };
                        dbConnection.promise().query('INSERT INTO product_options SET ?', options_product, (error, results, fields) => {
                            if (error) throw error;
                        });
                    }
                }
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
    console.log(req.body);
    const productId = req.params.id;
    const product_name = req.body.product_name.trim();
    const product_description = req.body.product_description.trim();
    const {
        categories,
        status,
    } = req.body;

    let productPic;
    if (req.file) {
        productPic = req.file.path.replace('public', '');
    }

    const {
        sizeId,
        unit,
        sizePrice,
        qtyId,
        qty,
        qtyPrice
    } = req.body;

    const {
        newUnit,
        newSizePrice,
        newQty,
        newQtyPrice
    } = req.body
    const option_type = req.body.option_type;
    const options = req.body.option;

    let queryProduct;
    let arrProduct;
    if (productPic) {
        queryProduct = `UPDATE product SET productName = ?, categories = ?, status = ?, picture = ?, description = ? WHERE product_id = ${productId}`;
        arrProduct = [product_name, categories, status, productPic, product_description];
    } else {
        queryProduct = `UPDATE product SET productName = ?, categories = ?, status = ? ,description = ? WHERE product_id = ${productId}`;
        arrProduct = [product_name, categories, status, product_description];
    }

    try {
        await dbConnection.promise().query(queryProduct, arrProduct)
            .then(async () => {
                for (let i = 0; i < sizeId.length; i++) {
                    const sizes = {
                        size_unit: unit[i],
                        size_price: sizePrice[i]
                    }

                    dbConnection.promise().query(`UPDATE pricingTiers_size SET ? WHERE tierSize_id = ${sizeId[i]} AND product_id = ${productId}`, [sizes], (error) => {
                        if (error) throw error;
                    })

                }

                for (let j = 0; j < qtyId.length; j++) {
                    const qtys = {
                        quantity: qty[j],
                        qty_price: qtyPrice[j]
                    }
                    dbConnection.promise().query(`UPDATE pricingTiers_qty SET ? WHERE tierQty_id = ${qtyId[j]} AND product_id = ${productId}`, [qtys], (error) => {
                        if (error) throw error;
                    })
                }

                // for (let i = 0; i < sizeId.length; i++) {
                //     const sizes = {
                //         width: width[i][0],
                //         height: height[i][0],
                //         size_price: sizePrice[i][0]
                //     }
                //     await dbConnection.query(`UPDATE pricingTiers_size SET ? WHERE tierSize_id = ${sizeId[i][0]} AND product_id = ${productId}`, [sizes], (error) => {
                //         if (error) throw error;
                //     })

                // }

                if ('newUnit' in req.body) {
                    for (let ns = 0; ns < newUnit.length; ns++) {
                        const sizes = {
                            size_unit: newUnit[ns],
                            size_price: newSizePrice[ns],
                            product_id: productId,
                        }
                        dbConnection.query("INSERT INTO pricingTiers_size SET ?", [sizes], (error) => {
                            if (error) throw error;
                        })
                    }
                }

                if ('newQty' in req.body) {
                    for (let nq = 0; nq < newQty.length; nq++) {
                        const qtys = {
                            quantity: newQty[nq],
                            qty_price: newQtyPrice[nq],
                            product_id: productId,

                        }
                        dbConnection.query("INSERT INTO pricingTiers_qty SET ?", [qtys], (error) => {
                            if (error) throw error;
                        })
                    }
                }

                await dbConnection.promise().query('SELECT * FROM product_options WHERE product_id = ?', [productId]).then(async ([rows]) => {
                    for (let i = 0; i < option_type.length; i++) {
                        for (let j = 0; j < options[i].length; j++) {
                            const option_id = options[i][j]
                            const exist = rows.some(record => record.option_id == option_id && record.product_id == productId);
                            // console.log(exist);
                            if (exist) {
                                dbConnection.promise().query('UPDATE product_options SET deleted_at = NULL WHERE option_id = ? AND product_id = ?', [options[i][j], productId]);
                            } else {
                                dbConnection.promise().query('INSERT INTO product_options SET option_id = ?, product_id = ?', [options[i][j], productId], (error) => {
                                    if (error) throw error;
                                });
                            }

                        }
                    }

                    let alloptions = [];
                    for (let o = 0; o < options.length; o++) {
                        alloptions = alloptions.concat(options[o]);
                    }
                    console.log(alloptions);
                    const oId = rows.map(row => row.option_id);
                    const optionIds = alloptions.map(id => parseInt(id, 10));
                    const existNoncheck = oId.filter(rowId => !optionIds.includes(rowId));
                    console.log(existNoncheck);
                    for (const uncheck of existNoncheck) {
                        dbConnection.promise().query('UPDATE product_options SET deleted_at = NOW() WHERE option_id = ? AND product_id = ?', [uncheck, productId], (error) => {
                            if (error) throw error;
                        });
                    }

                })

                // for (let o = 0; o < option_type.length; o++) {
                //     for (let j = 0; j < options[o].length; j++) {
                //         console.log(options[o][j]);
                //         const options_product = {
                //             option_id: options[o][j],
                //             product_id: productId,
                //         };
                //         await dbConnection.query('INSERT INTO product_options SET ?', options_product, (error, results, fields) => {
                //             if (error) throw error;
                //         });
                //     }
                // }
                req.flash("success_msg", 'แก้ไขสินค้าสำเร็จ');
                return res.redirect("/admin/product-list");
            });
    } catch (error) {
        console.log(error)
        return res.redirect("/admin/addproduct");
    }
}


// const updateProduct = async (req, res) => {
//     const productId = req.params.id;
//     console.log(productId);
//     const product_name = req.body.product_name.trim();
//     const product_description = req.body.product_description.trim();

//     const {
//         categories,
//         status,
//         discount,
//         dc_start,
//         dc_end,
//     } = req.body;

//     let productPic;
//     let query;
//     // let queryQt;
//     const {
//         qtId,
//         minqt,
//         priceTier
//     } = req.body;

//     const {
//         newminqt,
//         newpriceTier
//     } = req.body;

//     const {
//         sizeId,
//         minsize,
//         priceSize
//     } = req.body;

//     const {
//         newminsize,
//         newpriceSize
//     } = req.body;

//     const options = req.body.option;
//     const spec = req.body.spec;

//     if (req.file) {
//         productPic = req.file.path.replace('public', '');
//     }

//     if (dc_start == '' && dc_end == '') {
//         if (productPic) {
//             // Use new picture if uploaded
//             query = `UPDATE product SET productName = , categories = ?, status = ?, picture = ?, discount = ?, discount_start = NULL, discount_end = NULL ,description = ? WHERE product_id = ${productId}`;
//         } else {
//             // Keep old picture
//             query = `UPDATE product SET productName = ?, categories = ?, status = ?, discount = ?, discount_start = NULL, discount_end = NULL ,description = ? WHERE product_id = ${productId}`;
//         }
//     } else {
//         if (productPic) {
//             // Use new picture if uploaded
//             query = `UPDATE product SET productName = ?, categories = ?, status = ?, picture = ?, discount = ?, discount_start = ?, discount_end = ? ,description = ? WHERE product_id = ${productId}`;
//         } else {
//             // Keep old picture
//             query = `UPDATE product SET productName = ?, categories = ?, status = ?, discount = ?, discount_start = ?, discount_end = ? ,description = ? WHERE product_id = ${productId}`;
//         }
//     }

//     try {
//         let queryParams;
//         if (dc_start == '' && dc_end == '') {
//             if (productPic) {
//                 // Parameters when updating picture
//                 queryParams = [product_name, categories, status, productPic, discount, product_description, productId];
//             } else {
//                 // Parameters when keeping old picture
//                 queryParams = [product_name, categories, status, discount, product_description, productId];
//             }
//         } else {
//             if (productPic) {
//                 // Parameters when updating picture
//                 queryParams = [product_name, categories, status, productPic, discount, dc_start, dc_end, product_description, productId];
//             } else {
//                 // Parameters when keeping old picture
//                 queryParams = [product_name, categories, status, discount, dc_start, dc_end, product_description, productId];
//             }
//         }
//         await dbConnection.query(query, queryParams)
//             .then(async () => {
//                 for (let k = 0; k < qtId.length; k++) {
//                     const quantity_tier = {
//                         minqt: minqt[k][0],
//                         priceqt: priceTier[k][0],
//                         product_id: productId
//                     };
//                     await dbConnection.query('UPDATE pricingQt_tier SET ? WHERE qtTier_id = ?', [quantity_tier, qtId[k][0]], (error) => {
//                         if (error) throw error;
//                     })
//                     // if (qtId == '') {
//                     //     dbConnection.query("INSERT INTO pricingQt_tier SET ? ON DUPLICATE KEY UPDATE product_id = ?", [quantity_tier, productId], (error) => {
//                     //         if (error) throw error;
//                     //     })
//                     // }
//                     // await dbConnection.query(`UPDATE pricingQt_tier SET ? WHERE qtTier_id = ${qtId[k][0]} AND product_id = ${productId}`, [quantity_tier], (error) => {
//                     //     if (error) throw error;
//                     // })
//                     // await dbConnection.query(`INSERT INTO pricingQt_tier SET ? ON DUPLICATE KEY UPDATE ?`, [quantity_tier, quantity_tier], (error) => {
//                     //     if (error) throw error;
//                     // })
//                 }

//                 if ('newminqt' in req.body) {
//                     for (let j = 0; j < newminqt.length; j++) {
//                         const new_quantity_tier = {
//                             minqt: newminqt[j][0],
//                             // maxqt: newmaxqt[j][0],
//                             priceqt: newpriceTier[j][0],
//                             product_id: productId
//                         };
//                         await dbConnection.query('INSERT INTO pricingQt_tier SET ?', [new_quantity_tier], (error) => {
//                             if (error) throw error;
//                         });
//                     }
//                 }

//                 for (let i = 0; i < sizeId.length; i++) {
//                     const size_tier = {
//                         minSize: minsize[i][0],
//                         pricesize: priceSize[i][0],
//                         product_id: productId
//                     };
//                     await dbConnection.query('UPDATE pricingSize_tier SET ? WHERE sizeTier_id = ?', [size_tier, sizeId[i][0]], (error) => {
//                         if (error) throw error;
//                     })
//                 }

//                 if ('newminsize' in req.body) {
//                     for (let t = 0; t < newminsize.length; t++) {
//                         const new_size_tier = {
//                             minSize: newminsize[t][0],
//                             pricesize: newpriceSize[t][0],
//                             product_id: productId
//                         };
//                         await dbConnection.query('INSERT INTO pricingSize_tier SET ?', [new_size_tier], (error) => {
//                             if (error) throw error;
//                         });
//                     }
//                 }

//                 // for (let s = 0; s < spec.length; s++) {
//                 //     for (let j = 0; j < options[s].length; j++) {
//                 //         const optionId = options[s][j];
//                 //         // Check if the option ID already exists for the product
//                 //         dbConnection.query('SELECT id FROM product_options WHERE product_id = ? AND option_id = ?', [productId, optionId], (error, results, fields) => {
//                 //             if (error) throw error;
//                 //             if (results.length > 0) {
//                 //                 // Update the existing record
//                 //                 const updateQuery = 'UPDATE product_options SET deleted_at = NULL WHERE product_id = ? AND option_id = ?';
//                 //                 dbConnection.query(updateQuery, [productId, optionId], (updateError, updateResults, updateFields) => {
//                 //                     if (updateError) throw updateError;
//                 //                 });
//                 //             } else {
//                 //                 // Insert a new record
//                 //                 const insertQuery = 'INSERT INTO product_options (product_id, option_id) VALUES (?, ?)';
//                 //                 dbConnection.query(insertQuery, [productId, optionId], (insertError, insertResults, insertFields) => {
//                 //                     if (insertError) throw insertError;
//                 //                 });
//                 //             }
//                 //         });
//                 //     }
//                 // }


//                 // for (let s = 0; s < spec.length; s++) {
//                 //     for (let o = 0; o < options.length; o++) {
//                 //         const optionArray = [options[o]];
//                 //         const option = JSON.stringify(optionArray);

//                 //         dbConnection.query('UPDATE product_options SET option_id = ? WHERE id = ? AND product_id = ?', [spec[s] , option[s], productId], (error, results, fields) => {
//                 //             if (error) throw error;
//                 //             // You can perform additional actions after each update here
//                 //         });
//                 //     }

//                 // }




//                 req.flash("success_msg", 'อัปเดตสินค้าสำเร็จ');
//                 return res.redirect(`/admin/product-list`);
//             });
//     } catch (error) {
//         req.flash("errors", error.message);
//         console.log(error)
//         return res.redirect(`/admin/product/edit/${productId}`);
//     }


// }


const deleteProduct = async (req, res) => {
    const id = req.body.product_id;
    try {
        dbConnection.query("UPDATE product SET deleted_at = CURRENT_TIMESTAMP WHERE product_id = ?", [id]);
        req.flash("success_msg", 'ลบสินค้าสำเร็จ');
        return res.redirect("/admin/product-list");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/admin/product-list");
    }
}


const deleteQt = (req, res) => {
    const id = req.params.id;
    dbConnection.query('UPDATE pricingTiers_qty SET deleted_at = CURRENT_TIMESTAMP WHERE tierQty_id = ?', [id], (err, results) => {
        if (err) throw err;
    });
    res.json({
        message: 'Data deleted'
    });
}

const deleteSize = (req, res) => {
    const id = req.params.id;
    dbConnection.query('UPDATE pricingTiers_size SET deleted_at = CURRENT_TIMESTAMP WHERE tierSize_id = ?', [id], (err, results) => {
        if (err) throw err;
    });
    res.json({
        message: 'Data deleted'
    });
}



const deleteUser = async (req, res) => {
    const id = req.body.user_id;
    try {
        dbConnection.query("UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = ?", [id]);
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
    deleteQt: deleteQt,
    deleteSize: deleteSize,
    deleteUser: deleteUser,
}