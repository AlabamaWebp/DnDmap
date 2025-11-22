

const io = new (require('socket.io')).Server({cors: "*"});

const host = 'localhost';
const port = 4001;

let clients = [];

io.on('connection', (socket) => {
    console.log(`Client with id ${socket.id} connected`);
    clients.push(socket.id);

    socket.emit('message', "I'm server");

    socket.on('message', (message) =>
        console.log('Message: ', message)
    );

    socket.on('disconnect', () => {
        clients.splice(clients.indexOf(socket.id), 1);
        console.log(
            `Client with id ${socket.id} disconnected`
        );
    });
});
io.listen(port)
console.log(`Server listens http://${host}:${port}`)