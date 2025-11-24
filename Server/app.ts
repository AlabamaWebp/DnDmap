

const io = new (require('socket.io')).Server({cors: "*"});

const host = 'localhost';
const port = 4001;

let clients: any[] = [];
let data = {}
io.on('connection', (socket: any) => {
    console.log(`Client with id ${socket.id} connected`);
    clients.push(socket.id);

    socket.emit('message', data);

    socket.on('message', (message: any) =>
        console.log('Message: ', message)
    );

    socket.on('start', (data1: any) =>
        data = data1
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
