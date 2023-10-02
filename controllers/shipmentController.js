const dbConnection = require("../config/database");

const addShipment = (req, res) => {
    const {
        shipment_name,
        shipment_type,
        start_price,
        getStatus,
        qty_min,
        price
    } = req.body;

    let status;
    if (getStatus == null) {
        status = '0';
    } else {
        status = '1';
    }
    try {
        if (shipment_type == 'qty') {
            dbConnection.promise().query('INSERT INTO shipments SET shipment_name = ?, shipment_type = ?, start_price = ?, status = ?', [shipment_name, shipment_type, start_price, status]).then(([shipment]) => {
                const shipmentId = shipment.insertId;
                for (let i = 0; i < qty_min.length; i++) {
                    dbConnection.query('INSERT INTO shipments_price SET qty_min = ?, price = ?, shipment_id = ?', [qty_min[i], price[i], shipmentId]);
                }
            })
        } else if (shipment_type == 'free') {
            dbConnection.promise().query('INSERT INTO shipments SET shipment_name = ?, shipment_type = ?, start_price = ?, status = ?', [shipment_name, shipment_type, start_price, status], (error) => {
                if (error) throw error
            })
        }
        req.flash('success_msg', 'เพิ่มขนส่งสำเร็จ');
        res.redirect('/admin/shipment');
    } catch (error) {
        console.log(error);
        req.flash('errors', 'error');
        res.redirect('/admin/shipment');
    }
};

const updateShipment = (req, res) => {
    const shipmentId = req.params.id;
    const {
        shipment_name,
        shipment_type,
        start_price,
        getStatus,
        sp_id,
        qty_min,
        price,

        new_qty_min,
        new_price,
    } = req.body;

    let status;
    if (getStatus == null) {
        status = '0';
    } else {
        status = '1';
    }
    try {

        if (shipment_type == 'qty') {
            dbConnection.promise().query('UPDATE shipments SET shipment_name = ?, shipment_type = ?, start_price = ?, status = ? WHERE shipment_id = ?', [shipment_name, shipment_type, start_price, status, shipmentId]).then(() => {
                for (let i = 0; i < sp_id.length; i++) {
                    dbConnection.query('UPDATE shipments_price SET qty_min = ?, price = ? WHERE shipment_price_id = ?', [qty_min[i], price[i], sp_id[i]]);
                }

                if ('new_qty_min' in req.body) {
                    for (let s = 0; s < new_qty_min.length; s++) {
                        dbConnection.query('INSERT INTO shipments_price SET qty_min = ?, price = ?, shipment_id = ?', [new_qty_min[s], new_price[s], shipmentId]);
                    }
                }
            })
        } else if (shipment_type == 'free') {
            dbConnection.promise().query('UPDATE shipments SET shipment_name = ?, shipment_type = ?, start_price = ?, status = ? WHERE shipment_id = ?', [shipment_name, shipment_type, start_price, status, shipmentId], (error) => {
                if (error) throw error
            })
        }
   
        req.flash('success_msg', 'แก้ไขขนส่งสำเร็จ');
        res.redirect('/admin/shipment');
    } catch (error) {
        console.log(error);
        req.flash('errors', 'error');
        res.redirect('/admin/shipment');
    }
};

const deleteShipment = (req, res) => {
    const id = req.params.id;
    dbConnection.promise().query('UPDATE shipments SET deleted_at = NOW() WHERE shipment_id = ?', id , (error) => {
        if (error) {
            console.log(error);
            req.flash('errors', 'มีข้อผิดพลาดเกิดขึ้น');
            res.redirect('/admin/shipment');
        };
    })
    req.flash('success_msg', 'ลบขนส่งสำเร็จ');
    res.redirect('/admin/shipment');
}

const deletePrice = (req, res) => {
    const id = req.params.id;
    dbConnection.query('UPDATE shipments_price SET deleted_at = NOW() WHERE shipment_price_id = ?', id , (error) => {
        if (error) throw error
    }) 
    res.json({
        message: 'Data deleted'
    });
}
module.exports = {
    addShipment: addShipment,
    updateShipment: updateShipment,
    deleteShipment: deleteShipment,
    deletePrice: deletePrice
}