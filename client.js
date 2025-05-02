import * as net from "net"
import readline from "readline"

// Use of readline for reading client input and output
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const client = net.createConnection({
    
    host: "127.0.0.1",
    port: 5454
    }, () => {
    console.log("Connected")
} 
)


client.on("data", (data) => {
    console.log(data.toString())
    if (data.toString().includes("set your nickname:")) {
        rl.question("Enter your nickname: ", (nickname) => {
            client.write(nickname)
            
        })
    }
})

client.on("error", (err) => {
    console.log(`Error occured: ${err.message}`)
})


const sendMessage = (message) => {
    client.write(message)
}


rl.on("line", (input) => {

    if (input === "end") {
        // For disconnecting typing "end" will trigger it
        client.end()
        rl.close()
    } else {
    sendMessage(input)
    }
})