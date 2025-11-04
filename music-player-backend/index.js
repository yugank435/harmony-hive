const express = require("express")
const cors = require("cors")
const router = require("./routes/index")
const http = require('http');
const { setupWebSocket } = require('./websocket');

const path = require('path')
const app = express();
const server = http.createServer(app);

// Setup WebSocket server
setupWebSocket(server);

app.use(cors())
app.use(express.json())

// API routes first
app.use("/api",router)

// Serve static files from the React app's build folder
app.use(express.static(path.join(__dirname, "build")));

// Catch-all handler: return index.html for all non-API requests
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

server.listen(3000, ()=>{
  console.log("Server is listening on http://localhost:3000")
});

