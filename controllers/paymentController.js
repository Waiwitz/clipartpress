const dbConnection = require('../config/database');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const key = Buffer.from('ef045d157e2df86220ee67ac37132a604f51477fef58fdaac52ed312d97a1538', 'hex')
const iv = Buffer.from('72d78a8a792f98f086bd892600e3638a', 'hex');
const addmethod = (req, res) => {
    const {
        methodType,
        methodName,
        ownerName,
        number,
        status
    } = req.body

    let getMethodName = methodName;
    if (methodName === undefined) {
        getMethodName = "promptpay"
    }

    let getstatus = status;
    if (status === undefined) {
        getstatus = 0
    }
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let cnumber = cipher.update(number, 'utf8', 'hex');
    cnumber += cipher.final('hex');

    try {
        dbConnection.promise().query('INSERT INTO payment_method SET number = ?, method_type = ?, method_name = ?, name = ?, status = ?', [cnumber, methodType, getMethodName, ownerName, getstatus]).then(() => {
            req.flash('success_msg', 'เพิ่มช่องการทำชำระสำเร็จ')
            res.redirect('/admin/payment_method');
        });
    } catch (error) {
        console.log(error);
        req.flash('error', 'มีข้อผิดพลาดเกิดขึ้น')
        res.redirect('/admin/payment_method');
    }

    // res.send(number)
}

const editmethod = (req, res) => {
    const id = req.params.id;
    const {
        NewMethodType,
        NewMethodName,
        NewOwnerName,
        NewNumber,
        newstatus
    } = req.body

    let getMethodName = NewMethodName;
    if (NewMethodName === undefined) {
        getMethodName = "promptpay"
    }
    let getstatus = newstatus;
    if (newstatus == null) {
        getstatus = "0"
    }

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let cnumber = cipher.update(NewNumber, 'utf8', 'hex');
    cnumber += cipher.final('hex');


    try {
        dbConnection.promise().query('UPDATE payment_method SET number = ?, method_type = ?, method_name = ?, name = ?, status = ? WHERE payment_method_id = ?', [cnumber, NewMethodType, getMethodName, NewOwnerName, getstatus, id]).then(() => {
            req.flash('success_msg', 'แก้ไขช่องการทำชำระสำเร็จ')
            res.redirect('/admin/payment_method');
        });
    } catch (error) {
        console.log(error);
        req.flash('error', 'มีข้อผิดพลาดเกิดขึ้น')
        res.redirect('/admin/payment_method');
    }
    // res.send(number)
}

const deletemethod = (req, res) => {
    const id = req.params.id;
    try {
        dbConnection.promise().query('UPDATE payment_method SET deleted_at = NOW() WHERE payment_method_id = ?', id).then(() => {
            req.flash('success_msg', 'ลบสำเร็จ')
            res.redirect('/admin/payment_method');
        });
    } catch (error) {
        console.log(error);
        req.flash('errors', 'มีข้อผิดพลาดเกิดขึ้น')
        res.redirect('/admin/payment_method');
    }

    // res.send(number)
};


module.exports = {
    addmethod: addmethod,
    editmethod: editmethod,
    deletemethod: deletemethod,
}