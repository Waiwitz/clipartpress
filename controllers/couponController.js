const dbConnection = require("../config/database");

const addCoupon = (req, res) => {
    const couponName = req.body.couponName.trim();
    const couponCode = req.body.couponCode.trim();
    const status = req.body.status;
    const couponType = req.body.couponType;
    const discountValue = req.body.discountValue;
    const minAmount = req.body.minAmount;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const userLimit = req.body.userLimit;
    const couponAmount = req.body.couponAmount;
    const note = req.body.note.trim();

    const couponData = [
        couponName, couponCode, status, couponType, discountValue, minAmount, startDate, endDate, userLimit, couponAmount, note
    ]

    dbConnection.promise().query('INSERT INTO coupon SET coupon_name = ?, coupon_code = ?, status = ?, coupon_type = ?, discount_value = ?, min_amount = ?,' +
        ' start_date = ?, end_date = ?, user_limitUse = ?, coupon_amount = ?, note = ?', couponData, (error) => {
            if (error) throw error;
        })
    req.flash("success_msg", 'เพิ่มคูปองสำเร็จแล้ว');
    return res.redirect("/admin/coupon");
}

const updateCoupon = (req, res) => {
    const couponId = req.body.id
    const couponName = req.body.newCouponName.trim();
    const couponCode = req.body.newCouponCode.trim();
    const status = req.body.newStatus;
    const couponType = req.body.newCouponType;
    const discountValue = req.body.newDiscountValue;
    const minAmount = req.body.newMinAmount;
    const startDate = req.body.newStartDate;
    const endDate = req.body.newEndDate;
    const userLimit = req.body.newUserLimit;
    const couponAmount = req.body.newCouponAmount;
    const note = req.body.newNote.trim();

    console.log(req.body);
    const couponData = [
        couponName, couponCode, status, couponType, discountValue, minAmount, startDate, endDate, userLimit, couponAmount, note, couponId
    ]

    dbConnection.promise().query('UPDATE coupon SET coupon_name = ?, coupon_code = ?, status = ?, coupon_type = ?, discount_value = ?, min_amount = ?,' +
        ' start_date = ?, end_date = ?, user_limitUse = ?, coupon_amount = ?, note = ? WHERE coupon_id = ?', couponData, (error) => {
            if (error) throw error;
        })
    req.flash("success_msg", 'แก้ไขคูปองสำเร็จแล้ว');
    return res.redirect("/admin/coupon");
}

const deleteCoupon = async (req, res) => {
    const id = req.body.coupon_id;
    try {
        dbConnection.query("UPDATE coupon SET deleted_at = CURRENT_TIMESTAMP WHERE coupon_id = ?", [id]);
        req.flash("success_msg", 'ลบคูปองสำเร็จ');
        return res.redirect("/admin/coupon");
    } catch (error) {
        req.flash("errors", error.message);
        return res.redirect("/admin/coupon");
    }
}

module.exports = {
    addCoupon: addCoupon,
    updateCoupon: updateCoupon,
    deleteCoupon: deleteCoupon,
}