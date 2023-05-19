const jwt = require('jsonwebtoken');

async function verifyToken(req, res, next) {

    const token = req.session.token;
    if (!token)
        return res.render('pages/login')
    try {
        const validToken = jwt.verify(token, process.env.JWT_SECRET);
        if (validToken) {
            req.authenticated = true;
            // res.render('pages/index')
            return next();
        }
    } catch (err) {
        return res.status(400).json({
            error: err
        });
    }
}


module.exports = verifyToken;