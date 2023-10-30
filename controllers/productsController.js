const {
    check
} = require("express-validator");
const dbConnection = require("../config/database");
const multer = require('multer');
const path = require('path');
const {
    error
} = require("console");

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
        // sizePrice,
        qty,
        qtyPrice
    } = req.body;

    const option_type = req.body.option_type;
    const options = req.body.option;

    try {
        await dbConnection.promise().query('INSERT INTO product SET productName = ?, categories = ?, status = ?, picture = ?, description = ?', [product_name, categories, status, productPic, product_description])
            .then(async ([row]) => {
                const productId = row.insertId
                const sizesArr = [];
                const qtyArr = [];
                for (let o = 0; o < option_type.length; o++) {
                    for (let j = 0; j < options[o].length; j++) {
                        console.log(options[o][j]);
                        const options_product = {
                            option_id: options[o][j],
                            product_id: productId,
                        };
                        await dbConnection.promise().query('INSERT INTO product_options SET ?', options_product, (error, results, fields) => {
                            if (error) throw error;
                        });
                    }
                }
                for (let i = 0; i < unit.length; i++) {
                    const sizes = {
                        size_unit: unit[i],
                        // size_price: sizePrice[i],
                        product_id: productId
                    }
                    await dbConnection.promise().query("INSERT INTO pricingTiers_size SET ?", [sizes]).then(async ([sizes]) => {
                        const sizeId = sizes.insertId;
                        sizesArr.push(sizeId)
                    })
                }
                for (let q = 0; q < qty.length; q++) {
                    const qtys = {
                        quantity: qty[q],
                        product_id: productId
                    }
                    await dbConnection.promise().query("INSERT INTO pricingTiers_qty SET ?", [qtys]).then(async ([qtyRow]) => {
                        const id = qtyRow.insertId;
                        qtyArr.push(id)
                    })
                }

                for (let s = 0; s < qtyArr.length; s++) {
                    for (let j = 0; j < qtyPrice[s].length; j++) {
                        const price = {
                            price: qtyPrice[s][j],
                            tierQty_id: qtyArr[s],
                            size_id: sizesArr[j]
                        };
                        dbConnection.query("INSERT INTO pricingTiers_Price SET ?", [price])
                    }
                }

                // for (let j = 0; j < qty.length; j++) {
                //     const qtys = {
                //         quantity: qty[j],
                //         qty_price: qtyPrice[j],
                //         product_id: productId
                //     }
                //     dbConnection.promise().query("INSERT INTO pricingTiers_qty SET ?", [qtys], (error) => {
                //         if (error) throw error;
                //     })
                // }
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
                // console.log(options);

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
        qtyId,
        qty,
        qtyPriceId,
        qtyPrice
    } = req.body;

    const {
        newUnit,
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
                // for (let i = 0; i < sizeId.length; i++) {
                //     const sizes = {
                //         size_unit: unit[i],
                //         size_price: sizePrice[i]
                //     }

                //     dbConnection.promise().query(`UPDATE pricingTiers_size SET ? WHERE tierSize_id = ${sizeId[i]} AND product_id = ${productId}`, [sizes], (error) => {
                //         if (error) throw error;
                //     })

                // }
                const sizesArr = [];
                const qtyArr = [];
                for (let i = 0; i < sizeId.length; i++) {
                    if (sizeId[i] != "0") {
                        await dbConnection.promise().query("UPDATE pricingTiers_size SET size_unit = ? WHERE size_id = ?", [unit[i], sizeId[i]], (error) => {
                            if (error) {
                                console.log(error);
                                return res.redirect("/admin/product-list");
                            }
                        })
                        sizesArr.push(sizeId[i])
                    } else if (sizeId[i] == "0") {
                        const sizes = {
                            size_unit: unit[i],
                            // size_price: sizePrice[i],
                            product_id: productId
                        }
                        await dbConnection.promise().query("INSERT INTO pricingTiers_size SET ?", [sizes]).then(async ([sizes]) => {
                            const id = sizes.insertId;
                            sizesArr.push(id)
                        })
                    }

                }
                for (let j = 0; j < qtyId.length; j++) {
                    if (qtyId[j] != "0") {
                        dbConnection.promise().query('UPDATE pricingTiers_qty SET quantity = ? WHERE tierQty_id = ?', [qty[j], qtyId[j]], (error) => {
                            if (error) {
                                console.log(error);
                                return res.redirect("/admin/product-list");
                            }
                        });
                        qtyArr.push(qtyId[j])
                    } else if (qtyId[j] == "0") {
                        const qtys = {
                            quantity: qty[j],
                            product_id: productId
                        }
                        await dbConnection.promise().query("INSERT INTO pricingTiers_qty SET ?", [qtys]).then(async ([qtyRow]) => {
                            const id = qtyRow.insertId;
                            qtyArr.push(id)
                        })
                    }
                }

                for (let s = 0; s < qtyArr.length; s++) {
                    for (let k = 0; k < qtyPrice[s].length; k++) {
                        if (qtyPriceId[s][k] === "0") {
                            const price = {
                                price: qtyPrice[s][k],
                                tierQty_id: qtyArr[s],
                                size_id: sizesArr[k]
                            };
                            dbConnection.query("INSERT INTO pricingTiers_Price SET ?", [price])
                        } else if (qtyPriceId[s][k] != "0") {
                            dbConnection.promise().query('UPDATE pricingTiers_Price SET price = ? WHERE tierPrice_id = ?', [qtyPrice[s][k], qtyPriceId[s][k]], (error) => {
                                if (error) {
                                    console.log(error);
                                    return res.redirect("/admin/product-list");
                                }
                            })
                        }
                    }
                };
                // newQtyPrice

                // if ('newUnit' in req.body) {
                //     for (let i = 0; i < newUnit.length; i++) {
                //         const sizes = {
                //             size_unit: newUnit[i],
                //             // size_price: sizePrice[i],
                //             product_id: productId
                //         } 
                //         await dbConnection.promise().query("INSERT INTO pricingTiers_size SET ?", [sizes]).then(async ([sizes]) => {
                //             const sizeId = sizes.insertId;
                //             sizesArr.push(sizeId)
                //         })
                //     }
                // }
                // if ('newQty' in req.body) {
                //     for (let q = 0; q < newQty.length; q++) {
                //         const qtys = {
                //             quantity: newQty[q],
                //             product_id: productId
                //         }
                //         await dbConnection.promise().query("INSERT INTO pricingTiers_qty SET ?", [qtys]).then(async ([qtyRow]) => {
                //             const id = qtyRow.insertId;
                //             qtyArr.push(id)
                //         })
                //     }
                // }
                // if ('newQtyPrice' in req.body) {
                //     for (let s = 0; s < sizesArr.length; s++) {
                //         for (let j = 0; j < newQtyPrice[s].length; j++) {
                //             const price = {
                //                 price: newQtyPrice[s][j],
                //                 tierQty_id: qtyArr[j],
                //                 size_id: sizesArr[s]
                //             };
                //             dbConnection.query("INSERT INTO pricingTiers_Price SET ?", [price])
                //         }
                //     }
                // }

                // if ('newQty' in req.body) {
                //     for (let nq = 0; nq < newQty.length; nq++) {
                //         const qtys = {
                //             quantity: newQty[nq],
                //             qty_price: newQtyPrice[nq],
                //             product_id: productId,

                //         }
                //         dbConnection.query("INSERT INTO pricingTiers_qty SET ?", [qtys], (error) => {
                //             if (error) throw error;
                //         })
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
    dbConnection.query('UPDATE pricingTiers_Price SET deleted_at = CURRENT_TIMESTAMP WHERE tierQty_id = ?', [id], (err, results) => {
        if (err) throw err;
    });
    res.json({
        message: 'Data deleted'
    });
}

const deleteSize = (req, res) => {
    const id = req.params.id;
    dbConnection.query('UPDATE pricingTiers_size SET deleted_at = CURRENT_TIMESTAMP WHERE size_id = ?', [id], (err, results) => {
        if (err) throw err;
    });
    dbConnection.query('UPDATE pricingTiers_Price SET deleted_at = CURRENT_TIMESTAMP WHERE size_id = ?', [id], (err, results) => {
        if (err) throw err;
    });
    // dbConnection.promise().query('SELECT tierPrice_id FROM pricingTiers_Price WHERE deleted_at IS NULL AND size_id = ?', id).then(([rows]) => {
    //     rows.forEach((item) => {
    //         dbConnection.query('UPDATE pricingTiers_Price SET deleted_at = CURRENT_TIMESTAMP WHERE tierPrice_id = ?', [item.tierPrice_id], (err, results) => {
    //             if (err) throw err;
    //         });
    //     });

    // })

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