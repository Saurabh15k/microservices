const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require('jsonwebtoken');
const agent = require("../agent/agent");

async function initSocketServer(httpServer) {
    const io = new Server(httpServer, {});

    io.use((socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
        if (!cookies.token) {
            return next(new Error("Authentication error:No token provided."));
        }
        try {
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET_KEY);
            socket.user = decoded;
            socket.token = cookies.token;
            next();
        } catch (error) {
            return next(new Error("Authentication error:No token provided."));
        }
    });

    io.on("connection", (socket) => {
        console.log("A user is connected.")

        socket.on("message", async (data) => {
            try {
                const agentResponse = await agent.invoke({
                    messages: [{
                        role: "user",
                        content: data
                    }]
                }, {
                    metadata: {
                        token: socket.token
                    }
                });

                const messages = agentResponse && agentResponse.messages;
                if (!messages || messages.length === 0) {
                    console.error("Agent returned no messages", agentResponse);
                    socket.emit("ai-response", "Sorry, I couldn't generate a response.");
                    return;
                }

                const lastMessage = messages[messages.length - 1];
                console.log(lastMessage.content);
                socket.emit("ai-response", lastMessage.content);
            } catch (err) {
                console.error("Error invoking agent:", err);
                socket.emit("ai-error", { error: err.message || 'Agent invocation failed' });
            }
        })
    })
}

module.exports = initSocketServer;