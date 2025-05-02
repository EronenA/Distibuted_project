import net from 'node:net'
import fs from 'fs'

// Load questions at startup
const questions = JSON.parse(fs.readFileSync('./questions.json'))

let clients = []
const rooms = {}  // { roomName: { host, sockets, scores, gameInProgress, currentQuestionIndex } }

const server = net.createServer((socket) => {
    let nickname = ""
    let currentRoom = ""

    socket.write("Welcome! Set your nickname:\n")

    socket.on('data', (data) => {
        const message = data.toString().trim()

        // Set nickname
        if (!nickname) {
            nickname = message
            clients.push({ socket, nickname })
            socket.write(`Nickname set to ${nickname}. Use /host or /join [room]\n`)
            return
        }

        // Host a new room
        if (message.startsWith("/host ")) {
            const roomName = message.split(" ")[1]
            rooms[roomName] = {
                host: nickname,
                sockets: [socket],
                scores: {},
                gameInProgress: false,
                currentQuestionIndex: 0,
                answers: {} // nickname => answer
            }
            currentRoom = roomName
            socket.write(`Hosting room: ${roomName}. Type /start to begin quiz.\n`)
            return
        }

        // Join a room
        // Join or create a room
if (message.startsWith("/join ")) {
    const roomName = message.split(" ")[1]

    if (!roomName) {
        socket.write("❗ Please provide a room name. Usage: /join myroom\n")
        return
    }

    if (!rooms[roomName]) {
        // Auto-create room if it doesn't exist
        rooms[roomName] = {
            host: nickname,
            sockets: [],
            scores: {},
            gameInProgress: false,
            currentQuestionIndex: 0,
            answers: {}
        }
        socket.write(`✅ Created and joined room: ${roomName}\n`)
    } else {
        socket.write(`✅ Joined existing room: ${roomName}\n`)
    }

    rooms[roomName].sockets.push(socket)
    currentRoom = roomName
    return
}


        // Start the quiz (only host can)
        if (message === "/start") {
            const room = rooms[currentRoom]
            if (room.host !== nickname) {
                socket.write("Only the host can start the quiz.\n")
                return
            }
            room.gameInProgress = true
            room.currentQuestionIndex = 0
            room.scores = {}
            room.answers = {}
            sendQuestionToRoom(currentRoom)
            return
        }

        // Answer handling
        if (rooms[currentRoom]?.gameInProgress) {
            const room = rooms[currentRoom]
            room.answers[nickname] = message

            if (Object.keys(room.answers).length === room.sockets.length) {
                evaluateAnswers(currentRoom)
            }
            return
        }

        // Normal message
        if (!currentRoom) {
            socket.write("Please /host or /join a room first.\n")
            return
        }

        // Broadcast message
        rooms[currentRoom].sockets.forEach(clientSocket => {
            if (clientSocket !== socket) {
                clientSocket.write(`${nickname}: ${message}\n`)
            }
        })
    })

    socket.on('end', () => {
        clients = clients.filter(c => c.socket !== socket)
        Object.values(rooms).forEach(room => {
            room.sockets = room.sockets.filter(s => s !== socket)
        })
    })

    socket.on('error', (err) => {
        console.error(`Error: ${err.message}`)
    })
})

function sendQuestionToRoom(roomName) {
    const room = rooms[roomName]
    const questionObj = questions[room.currentQuestionIndex]

    const choicesFormatted = questionObj.choices
        .map((choice, index) => `${String.fromCharCode(97 + index)}) ${choice}`)
        .join('\n')

    const formatted = `
📣 Question ${room.currentQuestionIndex + 1}: ${questionObj.question}
${choicesFormatted}
(Type your answer: a, b, c, or d)
    `
    room.answers = {}

    room.sockets.forEach(s => {
        s.write(formatted + '\n')
    })
}

function evaluateAnswers(roomName) {
    const room = rooms[roomName]
    const question = questions[room.currentQuestionIndex]
    const correctIndex = question.choices.findIndex(c => c === question.answer)
    const correctLetter = String.fromCharCode(97 + correctIndex) // a/b/c/d

    room.sockets.forEach(clientSocket => {
        const player = clients.find(c => c.socket === clientSocket)
        const answer = room.answers[player.nickname]?.toLowerCase()
        const isCorrect = answer === correctLetter

        if (isCorrect) {
            room.scores[player.nickname] = (room.scores[player.nickname] || 0) + 1
        }

        clientSocket.write(`${player.nickname}, your answer: ${answer} - ${isCorrect ? "✅ Correct" : "❌ Incorrect"}\n`)
    })

    room.currentQuestionIndex++

    if (room.currentQuestionIndex < questions.length) {
        sendQuestionToRoom(roomName)
    } else {
        room.sockets.forEach(s => {
            s.write("\n🎉 Quiz Over! Final Scores:\n")
            for (const [nick, score] of Object.entries(room.scores)) {
                s.write(`${nick}: ${score}\n`)
            }
        })
        room.gameInProgress = false
    }
}


server.listen(5454, () => {
    console.log('Quiz game server running on port 5454')
})
