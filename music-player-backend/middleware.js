const jwt = require("jsonwebtoken");
const prisma = require('./db')
const { jwtSecret } = require("./config");

async function validateUser(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) return res.status(401).json({ message: "Invalid user" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

async function validateRoom(req, res, next) {
  const { roomId, password } = req.body;
  const room = await prisma.room.findUnique({ where: { id: Number(roomId) } });

  if (!room) return res.status(404).json({ message: "Room not found" });
  if (password && room.password !== password) {
    return res.status(403).json({ message: "Incorrect password" });
  }

  req.room = room;
  next();
}

module.exports = { validateUser, validateRoom };
