const dbConnection = require("../config/database");

const addPromotion = async (req, res) => {
    const promoName = req.body.promoName.trim();
    const {
        status,
        start,
        end,
        promoType,
        typeValue,
        condition,
        conditionValue,
        product,
    } = req.body;
    const note = req.body.note.trim();
    var promotion = [promoName, promoType, typeValue, condition, conditionValue, status, start, end, note]

    await dbConnection.promise().query('INSERT INTO promotions SET promo_name = ?, promo_type = ?, type_value = ?, promo_condition = ?, min_reach = ?, status = ?, start_date = ?, end_date = ?, note = ?', promotion)
        .then(async ([result]) => {
            const id = result.insertId
            for (let i = 0; i < product.length; i++) {
                const products = {
                    promo_id: id,
                    product_id: product[i]
                }
                dbConnection.promise().query('INSERT INTO product_has_promotion SET ?', products, (error) => {
                    if (error) throw error;
                })
            }
            req.flash("success_msg", 'เพิ่มโปรโมชั่นสำเร็จแล้ว');
            return res.redirect("/admin/promotion");
        })
}

const updatePromotion = async (req, res) => {
    const id = req.params.id
    const promoName = req.body.promoName.trim();
    const {
        status,
        start,
        end,
        promoType,
        typeValue,
        condition,
        conditionValue,
        product,
    } = req.body;
    console.log(id);
    const note = req.body.note.trim();
    var promotion = [promoName, promoType, typeValue, condition, conditionValue, status, start, end, note, id]

    dbConnection.promise().query('UPDATE promotions SET  promo_name = ?, promo_type = ?, type_value = ?, promo_condition = ?, min_reach = ?,' +
        ' status = ?, start_date = ?, end_date = ?, note = ? WHERE promo_id = ?', promotion, (error, rows) => {
            if (error) {
                req.flash("errors", error);
                return res.redirect("/admin/promotion");
            }
        })
    dbConnection.promise().query('SELECT * FROM product_has_promotion WHERE promo_id = ?', [id]).then(async ([rows]) => {
        for (let i = 0; i < product.length; i++) {
            const exist = rows.some(record => record.product_id == product[i] && record.promo_id == id);
            if (exist) {
                dbConnection.promise().query('UPDATE product_has_promotion SET deleted_at = NULL WHERE promo_id = ? AND product_id = ?', [id, product[i]]);
            } else {
                dbConnection.promise().query('INSERT INTO product_has_promotion (promo_id, product_id) VALUES (?, ?)', [id, product[i]], (error) => {
                    if (error) throw error;
                });
            }
            // const existNoncheck = product[i].includes(rows)
            // if (existNoncheck) {
            //     await dbConnection.query('UPDATE product_has_promotion SET deleted_at = CURRENT_TIMESTAMP WHERE promo_id = ? AND product_id = ?', [id, product[i]]);
            // } else {
            //     return
            // } existingProductIds.filter(productId => !productIds.includes(productId)); rows.map(row => row.product_id);
        }
        const pId = rows.map(row => row.product_id); // Extract product_ids from rows
        // Convert the elements in the product array to numbers
        const productIds = product.map(id => parseInt(id, 10));
        const existNoncheck = pId.filter(rowId => !productIds.includes(rowId));
        console.log(existNoncheck);

        for (const uncheck of existNoncheck) {
            dbConnection.promise().query('UPDATE product_has_promotion SET deleted_at = NOW() WHERE promo_id = ? AND product_id = ?', [id, uncheck], (error) => {
                if (error) throw error;
            });
        }
        req.flash("success_msg", 'แก้ไขโปรโมชั่นสำเร็จแล้ว');
        return res.redirect("/admin/promotion");
    })

    // const getNewToPost = product.filter(id => !existProduct.includes(id)); // เช็คหาไอดีที่รับมาว่าไม่ตรงกับที่มี db
    // const productToUpdate = existProduct.filter(id => !product.includes(id)); // ฟิลเตอร์หาไอดีใน db ที่ไม่ตรงกับที่ req

}

const deletePromotion = (req, res) => {
    const id = req.body.promotion_id;
    try {
        dbConnection.promise().query('UPDATE promotions SET deleted_at = NOW() WHERE promo_id = ?', id, (error) => {
            if (error) throw error;
        });
        dbConnection.promise().query('UPDATE product_has_promotion SET deleted_at = NOW() WHERE promo_id = ?', id, (error) => {
            if (error) throw error;
        });
        req.flash("success_msg", 'ลบโปรโมชั่นสำเร็จแล้ว')
        return res.redirect("/admin/promotion");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/admin/promotion");
    }
}


module.exports = {
    addPromotion: addPromotion,
    updatePromotion: updatePromotion,
    deletePromotion: deletePromotion
}