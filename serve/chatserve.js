const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app)
const io = require('socket.io')(server);
const userdb = [];
const parser = require("body-parser");
app.use(parser.json());
app.use(parser.urlencoded({extended : true}))

app.post("/login",function (req,res) {
    let data = req.body;
    let hasuser = userdb.find(value => {
        return value.name == data.name&&value.password==data.password
    })
    if(hasuser && hasuser.isconnected != true){
        res.send({
            data:`欢迎回来${data.name}`,
            islogin:true
        });
    }else {
        res.send({
            data:`你需要先注册一个账号或者该账号已经被登录了`,
            islogin:false
        });
    }
});

app.post("/register",function (req,res) {
    let data = req.body;
    let hasuser = userdb.find(value => {
        return value.name == data.name
    })
    if(hasuser){
        res.send({
            data:`该账号已存在，请登录`,
            islogin:false
        });
    }else {
        userdb.push(data);
        res.send({
            data:`注册完成！欢迎您${data.name}`,
            islogin:true
        });
    }
});


server.listen(80, function() {
    console.log('Express server listening on port ' + app.get('port'));
});



// 监听socket连接
io.on('connection', function (socket) {
    // 当某用户连上聊天室socket服务时，给他打个招呼
    console.log("connects"+socket.handshake.query.name);
    let index = userdb.findIndex(value => {
        return value.name == socket.handshake.query.name
    })
    userdb[index].isconnected = true;
    sendToSingle(socket, {
        event: 'greet_from_server',
        data: `你好${socket.handshake.query.name}`
    })
    // 对其他用户给出通知：某某某加入了聊天室
    broadcastAll({
        event: 'new_user_join',
        data: {
            user: socket.handshake.query.name
        }
    })
    // 监听用户发的聊天内容
    socket.on('chat', function (data) {
        // 然后广播给其他用户：某某某说了什么
        broadcastExceptSelf(socket, {
            event: 'new_chat_content',
            data: {
                user: data.name,
                content: data.value,
                class:"otherclass"
            }
        })
    });

    // 监听socket连接断开
    socket.on('disconnect', (reason) => {
        // 广播给其他用户：某某某退出了聊天室
        broadcastExceptSelf(socket, {
            event: 'someone_exit',
            data: {
                user: socket.handshake.query.name
            }
        })
    });
});
// 给当前socket连接单独发消息
function sendToSingle(socket, param) {
    socket.emit('singleMsg', param);
}
// 对所有socket连接发消息
function broadcastAll(param) {
    io.emit('broadcastAll', param)
}
// 对除当前socket连接的其他所有socket连接发消息
function broadcastExceptSelf(socket, param) {
    socket.broadcast.emit('broadcast', param);
}
