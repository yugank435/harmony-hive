const express = require("express")
const cors = require("cors")
const router = require("./routes/index")
const http = require('http');
const { setupWebSocket } = require('./websocket');


const app = express();
const server = http.createServer(app);

// Setup WebSocket server
setupWebSocket(server);

app.use(cors())
app.use(express.json())

app.use("/",router)

server.listen(3000, ()=>{
  console.log("Server is listening on http://localhost:3000")
});

