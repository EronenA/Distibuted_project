import * as net from "net"
import readline from "readline"

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const client = net.createConnection({ host: "127.0.0.1", port: 5454 }, () => {
    console.log("Connected to server!")
})

client.on("data", (data) => {
    console.log(data.toString())
})

client.on("error", (err) => {
    console.log(`Error: ${err.message}`)
})

rl.on("line", (input) => {
    if (input === "end") {
        client.end()
        rl.close()
    } else {
        client.write(input)
    }
})
