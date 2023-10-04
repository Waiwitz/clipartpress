const dbConnection = require('../config/database');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const key = Buffer.from('ef045d157e2df86220ee67ac37132a604f51477fef58fdaac52ed312d97a1538', 'hex')
const iv = Buffer.from('72d78a8a792f98f086bd892600e3638a', 'hex');
const addBank = (req, res) => {
    const {
        bank,
        bankOwnerName,
        bankNumber
    } = req.body

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let number = cipher.update(bankNumber, 'utf8', 'hex');
    number += cipher.final('hex');

    try {
        dbConnection.query('INSERT INTO bank SET bank = ?, number = ?, name = ?', [bank, number, bankOwnerName]).then(() => {
            req.flash('success_msg', 'เพิ่มธนาคารสำเร็จ')
            res.redirect('/admin/payment_method');
        });
    } catch (error) {
        console.log(error);
        req.flash('error', 'มีข้อผิดพลาดเกิดขึ้น')
        res.redirect('/admin/payment_method');
    }

    // res.send(number)
}

const editBank = (req, res) => {
    const id = req.params.id;
    const {
        newBank,
        newBankOwnerName,
        newBankNumber
    } = req.body

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let number = cipher.update(newBankNumber, 'utf8', 'hex');
    number += cipher.final('hex');


    dbConnection.query('UPDATE bank SET bank = ?, number = ?, name = ? WHERE bank_id = ?', [newBank, number, newBankOwnerName, id]).then(() => {
        req.flash('success_msg', 'แก้ไขธนาคารสำเร็จ')
        res.redirect('/admin/payment_method');
    });
    // res.send(number)
}

const deleteBank = (req, res) => {
    const id = req.params.id;
    try {
        dbConnection.query('UPDATE bank SET deleted_at = NOW() WHERE bank_id = ?', id).then(() => {
            req.flash('success_msg', 'ลบธนาคารสำเร็จ')
            res.redirect('/admin/payment_method');
        });
    } catch (error) {
        console.log(error);
        req.flash('errors', 'มีข้อผิดพลาดเกิดขึ้น')
        res.redirect('/admin/payment_method');
    }

    // res.send(number)
}

const promptpay = (req, res) => {
    // const filePath = path.join(__dirname, '../public/json/promptpay.json');
    let data;
    const {
        promptPayType,
        promptpayNumber,
        name,
        status
    } = req.body;

    const ppkey = Buffer.from('a83662c9b5b271e4b9ca58ec4ae7f429dc65500ac7754712a1ac75037affe7b8', 'hex');
    const ppiv = Buffer.from('cfe4c9b8b0518d92cc03130106322533', 'hex');
    const cipher = crypto.createCipheriv('aes-256-cbc', ppkey, ppiv);
    let number = cipher.update(promptpayNumber, 'utf8', 'hex');
    number += cipher.final('hex');

    let getStatus;
    if (status == null) {
        getStatus = '0';
    } else {
        getStatus = '1';
    } 
    data = [number, promptPayType, name, getStatus]

    dbConnection.query(`INSERT INTO promptpay(promptpay_id, number, promptpay_type, name, status) VALUES( 1 , ? , ? , ? , ? ) ON DUPLICATE KEY UPDATE number = VALUES(number), promptpay_type = VALUES(promptpay_type), name = VALUES(name), status = VALUES(status);
    `, data, (err) => {
        if (err) throw err;
    })

    res.json({
        message: 'Data deleted'
    });
    // fs.readFile(filePath, 'utf8', (err, data) => {
    //     if (err) {
    //         console.error(err);
    //         data = [];
    //     } else {
    //         data = JSON.parse(data);
    //     }

    //     data[0].type = promptPayType;
    //     data[0].number = number;
    //     data[0].name = name;
    //     if (status == null) {
    //         data[0].status = '0';
    //     } else {
    //         data[0].status = '1';
    //     }

    //     fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
    //         if (err) {
    //             console.error(err);
    //             return res.status(500).send('Error updating JSON file');
    //         }

    //         console.log('JSON file has been updated.');
    //         res.redirect('/admin/payment_method');
    //     });
    // });
}
module.exports = {
    addBank: addBank,
    editBank: editBank,
    deleteBank: deleteBank,
    promptpay: promptpay,
}