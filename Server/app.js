var host = "localhost";
var io = new (require("socket.io").Server)({ cors: "*", host: host });
var port = 4001;
var clients = [];
var data = {};

io.on("connection", function (socket) {
  socket.emit("start", data);

  socket.on("all", function (dataAll) {
    data = dataAll;
    io.emit("all", dataAll);
  });

  socket.on("start", function (dataStart) {
    data = dataStart;
    io.emit("start", data);
    console.log("start", data);
  });

  socket.on("newTyman", function (tyman) {
    data.tyman.push(tyman);
    socket.broadcast.emit("newTyman", data.tyman);
  });
  socket.on("deleteTyman", function (tyman) {
    data.tyman.filter(tyman);
    let index = data.tyman.indexOf(tyman);
    data.tyman.splice(index, 1);
    socket.broadcast.emit("deleteTyman", data.tyman);
  });

  socket.on("updateFiguresPos", function () {});
  console.log("Client with id ".concat(socket.id, " connected"));
  clients.push(socket.id);
  socket.on("disconnect", function () {
    clients.splice(clients.indexOf(socket.id), 1);
    console.log("Client with id ".concat(socket.id, " disconnected"));
  });
});
io.listen(port);
console.log("Server listens http://".concat(host, ":").concat(port));
