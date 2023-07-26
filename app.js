const express = require('express');
const app = express();
// const passport = require('passport');
require("dotenv").config();
const dbConnection = require("./config/database");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const connectFlash = require('connect-flash');
const session = require('express-session');
const router = require('./routes/routes');
const morgan = require('morgan')
const path = require('path');

// socket.io
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// session
app.use(morgan('dev'));
app.use(cookieParser('secret'));
const sessionExpress = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 86400000 1 day
    }
});
app.use(sessionExpress)

const message = (req, res) => {
    dbConnection.query('SELECT * FROM chats WHERE ')
}

// flash 
app.use(connectFlash());

app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.errors = req.flash('errors');
    res.locals.currentMenu = ''
    res.locals.Title = 'Clipart Press'
    res.locals.message = ''
    next();
});

app.use((req, res, next) => {
    res.locals.login = req.session.isLoggedIn;
    res.locals.session = req.session;
    next();
});

app.use(function (err, req, res, next) {
    console.log(err);
});

io.use((socket, next) => {
    sessionExpress(socket.request, {}, next);
});


// Socket.io connection handling
io.on('connection', (socket) => {
    // const userId = socket.request.session.user_id;

    socket.on('joinRoom', (room) => {
        console.log(`${socket.id} just joined room ${room}`);
        socket.join(room);
        socket.to(room).emit('roomJoined', `${socket.id} just joined the room`);
    });
    console.log(socket.request.session.username + ' connected');

    socket.on('sendMessage', (data) => {
        const { sender, receiver, message } = data;
        console.log(`${socket.request.session.username} posted a message to room ${data.room}: ${data.message}`);
        dbConnection.query('INSERT INTO chats (message, sender_id, recipient_id) VALUES (?, ?, ?)', [message, sender, receiver], (err, result) => {
          if (err) {
            console.error('Error saving message to the database:', err);
            return;
          }
        });
        const newMessage = {
          sender: sender,
          message: data.message,
          room: data.room
        };
        
        socket.to(data.room).emit('newMessage', newMessage); // Emit the message to the admin in the room
      });
      
    //   socket.on('adminMessage', (data) => {
    //     const { sender, receiver, message } = data;
    //     console.log(`Admin posted a message to room ${data.room}: ${data.message}`);
    //     dbConnection.query('INSERT INTO chats (message, sender_id, recipient_id) VALUES (?, ?, ?)', [message, sender, receiver], (err, result) => {
    //       if (err) {
    //         console.error('Error saving message to the database:', err);
    //         return;
    //       }
    //     });
    //     const newMessage = {
    //       sender: sender,
    //       message: data.message,
    //       room: data.room
    //     };
      
    //     io.to(data.room).emit('adminMessage', newMessage); // Emit the message to all users in the room
    //   });
      


    // socket.on("chatMessage", (message) => {
    //     socket.broadcast.to(message.room).emit('newMessage', message);
    // });

    // Leave a room
    socket.on('leaveRoom', (room) => {
        console.log(`${socket.id} has left room ${room}`);

        socket.leave(room);

        socket.to(room).emit('roomLeft', `${socket.id} has left the room`);
    });

    // Disconnect event
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

    // socket.on('message', (message) => {
    //     console.log(`Received message: ${message.text}`);
    //     // Send the message to other users
    //     socket.broadcast.to(message.room).emit('newMessage', {message});
    // });
});

io.of("/admin/chat/*").on("connection", (socket) => {
    // admin users
  });
//   app.post('/send-message', (req, res) => {
//     // Extract the user ID and message from the request body
//     const message_text = req.body;
//     dbConnection.query('SELECT user_id FROM users WHERE user_role = "admin"').then(([admin]) => {
//         dbConnection.query('INSERT INTO chats (message, sender_id, recipient_id) VALUES (?, ?)', [message_text, req.session.user_id, admin_id[0]], (err, result) => {
//             if (err) {
//                 console.error('Error saving message to the database:', err);
//                 return res.status(500).json({
//                     error: 'An error occurred while saving the message.'
//                 });
//             }
//             // Emit the message to the admin
//             io.to('admin').emit('newMessage', message);

//             res.sendStatus(200);
//         });
//     })

// });


router(app)
// app.use("/", require("./routes"));
const port = 3000
server.listen(port, () => {
    console.log(`App listening at port ${port}`)
});