import net from 'node:net'

// Variables to store clients and channels
let clients = []
const channels = {}

const server = net.createServer((socket) => {
    // variable to store nicknames
    let nickname = ""
    let currentChannel = "general"

    if (!channels[currentChannel]) {
        channels[currentChannel] = []
    }


    channels[currentChannel].push(socket)
    // Send an initial message to the new client
    socket.write('Welcome to the server! First, set your nickname \r')


    // Handle incoming data from the client
    socket.on('data', (data) => {
        const message = data.toString().trim()

        if (!nickname) {
            nickname = message
            clients.push( {socket, nickname})
            console.log(`${nickname} has connected`)
            socket.write(`Nickname set to ${nickname}`)

        // Channel switching with keyword /join
        } else if (message.startsWith("/join ")) {
            console.log("Swithinhg channel")
            // take the 6 first letters off the message
            const channel = message.slice(6).trim()
            if (!channels[channel]) {
                channels[channel] = []
            }
            channels[currentChannel] = channels[currentChannel].filter(client => client !== socket)
            currentChannel = channel
            channels[channel].push(socket)
            socket.write(`Joined channel: ${channel}`)

        // Private message with keyword /private
        } else if (message.startsWith("/private ")) {
            
            /* This handles private messages
            The message consist of 3 parts: 
            0 (command): /private, 1 (target) and 2 (message parts)   
            */     
            const parts = message.split(" ")
            const target = parts[1]
            const privateMessage = parts.slice(2).join(" ")

            const receiver = clients.find(client => client.nickname === target)

            if (receiver) {
                receiver.socket.write(`Private message from ${nickname}: ${privateMessage}`)
        } else {
            socket.write(`User ${target} not found`)
        }
        }
        
        else {
            console.log(`${nickname}: ${message}`)

            channels[currentChannel].forEach(clientSocket => {
                if (clientSocket !== socket) {
                    clientSocket.write(`${nickname}: ${message}`)
                }
            })
        }
        
    })

    // When a client disconnects, remove it from the clients array
    socket.on('end', () => {
        // Remove disconnected client from clients array
        clients = clients.filter(client => client.socket !== socket)
        console.log('A client has disconnected and removed from the clients array.')
    })

    // Handle any client errors
    socket.on('error', (err) => {
        console.error('Error with client connection: ' + err.message)
    })

   
})


server.on('connection', () => {
    console.log('A client has connected!') 
})


server.listen(5454, () => {
    console.log('Echo server listening on port 5454')
})