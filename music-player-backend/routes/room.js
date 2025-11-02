const express = require("express");
const { validateUser, validateRoom } = require("../middleware");
const router = express.Router();
const prisma = require('../db')
const { notifyQueueUpdate, notifySongPlayed, notifyRoomClosed } = require('../websocket');

// POST /room/create
router.post("/create", validateUser, async (req, res) => {
  const { password } = req.body;

  if(req.user.currentRoomId !== -1)
  {
    return res.status(400).json({
      message: "You are already in another room. Leave it before joining a new one.",
    });
  }

  const room = await prisma.room.create({
    data: {
      ownerId: req.user.id,
      password,
      roomMember: [req.user.id], 
    },
  });

  await prisma.user.update({
    where : {id : req.user.id},
    data : {currentRoomId : room.id}
  });
  res.json({ message: "Room created", room });
});

// POST /room/join
router.post("/join", validateUser, validateRoom, async (req, res) => {
  const room = req.room;
  const user = req.user;
  
    // Check if user is already in another room
  if (user.currentRoomId !== -1 && user.currentRoomId !== room.id) {
    return res.status(400).json({
      message: "You are already in another room. Leave it before joining a new one.",
    });
  }

  if (!room.roomMember.includes(req.user.id)) {
    await prisma.room.update({
      where: { id: room.id },
      data: { roomMember: { push: req.user.id } },
    });
  }

  await prisma.user.update({
      where: { id: req.user.id },
      data: { currentRoomId: req.body.roomId },
    });
  res.json({ message: "Joined room", roomId: room.id });
});

// PUT /room/leave
router.put("/leave", validateUser, async (req, res) => {
  const user = req.user;

  // If the user is not in any room
  if (!user.currentRoomId || user.currentRoomId === -1) {
    return res.status(400).json({ message: "You are not in a room" });
  }

  const room = await prisma.room.findUnique({
    where: { id: user.currentRoomId },
  });

  if (!room) {
    // clean up user's currentRoomId if room no longer exists
    await prisma.user.update({
      where: { id: user.id },
      data: { currentRoomId: -1 },
    });
    return res.status(404).json({ message: "Room not found. Your room state reset." });
  }

  // If the user is the owner -> disband the room
  if (room.ownerId === user.id) {
    try {
      // Get members before deleting for notification/update
      const members = room.roomMember || [];

      // Delete all songs belonging to the room
      await prisma.songQueue.deleteMany({
        where: { roomId: room.id },
      });

      // Delete the room
      await prisma.room.delete({
        where: { id: room.id },
      });

      // Set currentRoomId = -1 for any users who were in that room
      await prisma.user.updateMany({
        where: { currentRoomId: room.id },
        data: { currentRoomId: -1 },
      });

      // Notify via WebSocket that room has been closed
      try {
        notifyRoomClosed(room.id.toString());
      } catch (err) {
        console.error("Error notifying room closed:", err);
      }

      return res.json({
        message: "Room disbanded (owner left). All members removed.",
        roomId: room.id,
        members,
      });
    } catch (err) {
      console.error("Error during owner leave/disband:", err);
      return res.status(500).json({ message: "Server error while disbanding room" });
    }
  }

  // Otherwise, remove the member from the roomMember array and clear their currentRoomId
  try {
    // Update room to remove the user id from roomMember
    const updatedRoom = await prisma.room.update({
      where: { id: room.id },
      data: {
        roomMember: {
          set: (room.roomMember || []).filter((id) => id !== user.id),
        },
      },
    });

    // Update the user
    await prisma.user.update({
      where: { id: user.id },
      data: { currentRoomId: -1 },
    });

    // Notify remaining members of queue (so UI stays in sync)
    try {
      notifyQueueUpdate(room.id.toString());
    } catch (err) {
      console.error("Error notifying queue update after member left:", err);
    }

    return res.json({ message: "User left the room", roomId: room.id, room: updatedRoom });
  } catch (err) {
    console.error("Error during member leave:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


// POST /addsong
router.post("/addsong", validateUser, async (req, res) => {
  try {
    const { ytVideoId, title, channel, thumbnail } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || !user.currentRoomId) {
      return res.status(400).json({ message: "User not in a room" });
    }

    const song = await prisma.songQueue.create({
      data: {
        roomId: user.currentRoomId,
        userId: user.id,
        ytVideoId,
        title,
        channel,
        thumbnail,
      },
    });
    notifyQueueUpdate(user.currentRoomId.toString());
    res.json(song);
  } catch (err) {
    console.error("Error adding song:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /removesong
router.delete("/removesong", validateUser, async (req, res) => {
  try {
    const user = req.user;

    if (user.currentRoomId === -1) {
      return res.status(400).json({ message: "You are not in a room" });
    }

    // Get first song in this room’s queue (earliest addedAt)
    const firstSong = await prisma.songQueue.findFirst({
      where: { roomId: user.currentRoomId },
      orderBy: { addedAt: "asc" },
    });

    if (!firstSong) {
      return res.status(400).json({ message: "Queue is empty" });
    }

    // Delete the first song
    await prisma.songQueue.delete({
      where: { id: firstSong.id },
    });

    // Return the new queue after removal
    const updatedQueue = await prisma.songQueue.findMany({
      where: { roomId: user.currentRoomId },
      orderBy: { addedAt: "asc" },
    });
    
    // Notify all room members about queue update
    notifyQueueUpdate(user.currentRoomId.toString());

    res.json({
      message: "First song removed",
      removedSong: firstSong,
      queue: updatedQueue,
    });
  } catch (err) {
    console.error("Error removing song:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /room/:id //delete the existing room
router.delete("/:id", validateUser, async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { id: Number(req.params.id) },
  });

  if (!room) return res.status(404).json({ message: "Room not found" });
  if (room.ownerId !== req.user.id) {
    return res.status(403).json({ message: "Only owner can delete room" });
  }

  await prisma.room.delete({ where: { id: room.id } });
  res.json({ message: "Room deleted" });
});

// Example call: GET http://localhost:3000/room/details/1002
router.get("/details/:id", async (req, res) => {
  try {
    const roomId = Number(req.params.id);

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) return res.status(404).json({ message: "Room not found" });

    //console.log(`Room found with room id ${roomId}`);

    return res.json({ password: room.password });
  } catch (error) {
    console.error("Error fetching room details:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

//is-admin/${roomId}
router.get("/is-admin/:roomId",validateUser, async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if(room.ownerId == req.user.id)
      return res.json({isAdmin : true})
    else return res.json({isAdmin : false})
  }
  catch(err){
    console.error("Error finding the owner/roomId:", err);
    res.status(500).json({ message: "Server error" });
  }
  
});

//PUT /room/move-to-top
router.put("/move-to-top", validateUser, async (req, res) => {
  try {
    const user = req.user;
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({ message: "Song ID is required" });
    }

    // First, check if user is admin of the room
    const room = await prisma.room.findUnique({
      where: { id: user.currentRoomId },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.ownerId !== user.id) {
      return res.status(403).json({ message: "Only room admin can reorder queue" });
    }

    // Get all songs in the room's queue
    const songs = await prisma.songQueue.findMany({
      where: { roomId: user.currentRoomId },
      orderBy: { addedAt: "asc" },
    });

    if (songs.length === 0) {
      return res.status(404).json({ message: "No songs in queue" });
    }

    // Find the song to move
    const songToMove = songs.find(song => song.id === songId);
    if (!songToMove) {
      return res.status(404).json({ message: "Song not found in queue" });
    }

    // If it's already the first song, no need to move
    if (songs[1].id === songId) {
      return res.json({ 
        message: "Song is already at the top",
        queue: songs 
      });
    }

    // Get the second song's addedAt timestamp, 
    // make the next song to be played, not the current playing song
    const firstSongAddedAt = songs[1].addedAt;
    
    // Set the moved song's addedAt to 1 second before the first song
    const newAddedAt = new Date(firstSongAddedAt.getTime() - 1000);

    // Update the song's addedAt to move it to top
    await prisma.songQueue.update({
      where: { id: songId },
      data: { addedAt: newAddedAt },
    });

    // Fetch the updated queue
    const updatedQueue = await prisma.songQueue.findMany({
      where: { roomId: user.currentRoomId },
      orderBy: { addedAt: "asc" },
    });

    // Notify all room members about queue update
    notifyQueueUpdate(user.currentRoomId.toString());

    res.json({ 
      message: "Song moved to top successfully",
      queue: updatedQueue 
    });

  } catch (err) {
    console.error("Error moving song to top:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/queue", validateUser, async (req, res) => {
  try {
    const roomId = parseInt(req.query.id, 10);
    if (isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }
    const songs = await prisma.songQueue.findMany({
      where: { roomId },
      orderBy: { addedAt: "asc" },
    });

    res.json(songs);
  } catch (err) {
    console.error("Error fetching queue:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
