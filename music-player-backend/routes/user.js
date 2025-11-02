const express = require("express");
const zod = require("zod");
const jwt = require("jsonwebtoken");
const  prisma = require("../db"); 
const { jwtSecret } = require("../config");
const { validateUser} = require("../middleware");

const router = express.Router();

// Validation Schemas
const signupSchema = zod.object({
  name: zod.string().optional(),
  email: zod.email(),
  password: zod.string().min(6)
});

const signinSchema = zod.object({
  email: zod.email(),
  password: zod.string()
});

// POST /user/signup
router.post("/signup", async (req, res) => {
  const body = req.body;
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }
  const { email } = req.body;
  console.log(`The email entered is ${email}`)

  console.log(`The object keys logged are ${Object.keys(prisma)}`);

  const existing = await prisma.user.findUnique({
    where: { email }
  });


  if (existing) {
    return res.status(400).json({ message: "Email already taken" });
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: body.password 
    }
  });

  const token = jwt.sign({ userId: user.id }, jwtSecret);

  res.status(201).json({
    message: "User created successfully",
    token
  });
});

// POST /user/signin
router.post("/signin", async (req, res) => {
  const parsed = signinSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ userId: user.id }, jwtSecret);

  res.json({ token });
});

// PUT /user (update user profile)
router.put("/", validateUser, async (req, res) => {
  const { name, password } = req.body;

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { name, password }
  });

  res.json({
    message: "Updated successfully",
    user: updated
  });
});

// GET /user (get current user info)
router.get("/", validateUser, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  delete user.password;
  res.json(user);
});

// GET /user/current-room
router.get("/current-room", validateUser, async (req, res) => {
  try {

    const roomId = req.user.currentRoomId === undefined || req.user.currentRoomId === -1
      ? null
      : req.user.currentRoomId;
    
    return res.json({ roomId });
  } catch (err) {
    console.error("Error fetching current room:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
