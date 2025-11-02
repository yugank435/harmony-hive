const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('./config');
const prisma = require('./db');

// Store active connections
const roomConnections = new Map(); // roomId -> Set of WebSocket connections

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });
  
  wss.on('connection', async (ws, req) => {
    console.log('New WebSocket connection attempt');
    
    // Extract token from URL query string
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const roomId = url.searchParams.get('roomId');

    if (!token || !roomId) {
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, jwtSecret);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        ws.close(1008, 'Invalid user');
        return;
      }

      console.log(`User ${user.id} authenticated for room ${roomId}`);

      // Store connection info on WebSocket
      ws.userId = user.id;
      ws.roomId = roomId;

      // Add connection to room - FIXED: Ensure roomId is properly stored
      if (!roomConnections.has(roomId)) {
        roomConnections.set(roomId, new Set());
        console.log(`Created new room entry for room ${roomId}`);
      }
      
      roomConnections.get(roomId).add(ws);
      console.log(`User ${user.id} connected to room ${roomId}`);
      console.log(`Room ${roomId} now has ${roomConnections.get(roomId).size} connections`);

      // Log all current rooms for debugging
      console.log('Current rooms with connections:', Array.from(roomConnections.keys()));

      // Send current room state to new connection
      await sendRoomState(roomId, ws);

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          console.log(`Message from user ${ws.userId} in room ${ws.roomId}:`, data.type);
          await handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        console.log(`WebSocket closing for user ${ws.userId} in room ${ws.roomId}`);
        // Remove connection from room
        if (ws.roomId && roomConnections.has(ws.roomId)) {
          roomConnections.get(ws.roomId).delete(ws);
          console.log(`Removed user ${ws.userId} from room ${ws.roomId}`);
          console.log(`Room ${ws.roomId} now has ${roomConnections.get(ws.roomId).size} connections`);
          
          // Clean up empty rooms
          if (roomConnections.get(ws.roomId).size === 0) {
            roomConnections.delete(ws.roomId);
            console.log(`Removed empty room ${ws.roomId}`);
          }
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error for user', ws.userId, ':', error);
      });

    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close(1008, 'Authentication failed');
    }
  });

  console.log('WebSocket server setup complete');
  return wss;
}

// Handle different types of WebSocket messages
async function handleWebSocketMessage(ws, data) {
  const { type } = data;

  try {
    switch (type) {
      case 'PLAYER_STATE':
        // Broadcast play/pause to all room members
        broadcastToRoom(ws.roomId, {
          type: 'PLAYER_STATE',
          isPlaying: data.isPlaying
        });
        break;
        
      case 'SEEK_TO':
        // Broadcast seek position to all room members
        broadcastToRoom(ws.roomId, {
          type: 'SEEK_TO', 
          currentTime: data.currentTime
        });
        break;
        
      case 'SONG_CHANGED':
        // Broadcast song change to all room members
        broadcastToRoom(ws.roomId, {
          type: 'SONG_CHANGED',
          song: data.song
        });
        break;

      case 'SONG_ENDED':
        // Broadcast song ended to all room members
        broadcastToRoom(ws.roomId, {
          type: 'SONG_ENDED'
        });
        break;

      case 'QUEUE_UPDATE':
        // Client requesting queue refresh
        await sendQueueUpdate(ws.roomId);
        break;
      
      case 'PROGRESS_UPDATE':
        // Broadcast progress update to all room members (except admin)
        broadcastToRoom(ws.roomId, {
          type: 'PROGRESS_UPDATE',
          progress: data.progress,
          duration: data.duration,
          currentTime: data.currentTime
        }, ws.userId); // Exclude the sender (admin)
        break;
      case 'ADMIN_ACTION':
        // Broadcast admin actions
        broadcastToRoom(ws.roomId, {
          type: 'ADMIN_ACTION',
          action: data.action,
          songId: data.songId
        });
        break;
        
      default:
        console.log('Unknown WebSocket message type:', type);
    }
  } catch (error) {
    console.error('Error handling WebSocket message:', error);
  }
}

// Send current room state to a specific connection
async function sendRoomState(roomId, ws) {
  try {
    // Get current queue
    const queue = await prisma.songQueue.findMany({
      where: { roomId: parseInt(roomId) },
      orderBy: { addedAt: 'asc' }
    });

    // Get room info to check if user is admin
    const room = await prisma.room.findUnique({
      where: { id: parseInt(roomId) }
    });

    const isAdmin = room && room.ownerId === ws.userId;

    const roomState = {
      type: 'ROOM_STATE',
      queue: queue,
      isAdmin: isAdmin,
      roomId: parseInt(roomId)
    };

    ws.send(JSON.stringify(roomState));
    console.log(`Sent room state to user ${ws.userId} in room ${roomId}`);
  } catch (error) {
    console.error('Error sending room state:', error);
  }
}

// Send queue update to all room members
async function sendQueueUpdate(roomId) {
  try {
    console.log(`Sending queue update for room ${roomId}`);
    
    const queue = await prisma.songQueue.findMany({
      where: { roomId: parseInt(roomId) },
      orderBy: { addedAt: 'asc' }
    });

    broadcastToRoom(roomId, {
      type: 'QUEUE_UPDATE',
      queue: queue
    });

    console.log(`Sent queue update to room ${roomId}`);
  } catch (error) {
    console.error('Error sending queue update:', error);
  }
}

// Broadcast message to all connections in a room with optional exclusion
function broadcastToRoom(roomId, message, excludeUserId = null) {
  console.log(`Attempting to broadcast to room ${roomId}, message type: ${message.type}`);
  console.log('Available rooms:', Array.from(roomConnections.keys()));
  
  if (!roomConnections.has(roomId)) {
    console.log(`❌ No connections found for room ${roomId}`);
    return;
  }

  const connections = roomConnections.get(roomId);
  console.log(`📡 Broadcasting to ${connections.size} connections in room ${roomId}`);
  
  const messageString = JSON.stringify(message);
  let sentCount = 0;

  connections.forEach((client) => {
    // Skip the excluded user (usually the admin who sent the update)
    if (excludeUserId && client.userId === excludeUserId) {
      console.log(`⏩ Skipping excluded user ${client.userId}`);
      return;
    }
    
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(messageString);
        sentCount++;
        console.log(`✅ Sent message to user ${client.userId} in room ${roomId}`);
      } catch (error) {
        console.error(`❌ Failed to send message to user ${client.userId}:`, error);
      }
    } else {
      console.log(`⚠️  Client not ready, state: ${client.readyState}`);
    }
  });

  console.log(`📊 Successfully sent ${message.type} to ${sentCount}/${connections.size} clients in room ${roomId}`);
}

// Notify room when queue changes (called from HTTP routes)
function notifyQueueUpdate(roomId) {
  console.log(`🔔 HTTP route triggered queue update for room ${roomId}`);
  console.log(`🔍 Checking connections for room ${roomId}...`);
  console.log('All connected rooms:', Array.from(roomConnections.keys()));
  
  if (roomConnections.has(roomId.toString())) {
    console.log(`✅ Room ${roomId} found in connections with ${roomConnections.get(roomId.toString()).size} clients`);
  } else {
    console.log(`❌ Room ${roomId} NOT found in connections`);
  }
  
  sendQueueUpdate(roomId.toString());
}

// Notify room when a song is played (called from HTTP routes)
function notifySongPlayed(roomId, song, progress, isPlaying) {
  try {
    broadcastToRoom(roomId.toString(), {
      type: 'SONG_PLAYED',
      song: song,
      progress: progress,
      isPlaying: isPlaying
    });

    console.log(`Notified room ${roomId} about song played: ${song.title}`);
  } catch (error) {
    console.error('Error in notifySongPlayed:', error);
  }
}

// Notify room that it was closed (owner left/deleted)
function notifyRoomClosed(roomId) {
  try {
    broadcastToRoom(roomId.toString(), {
      type: 'ROOM_CLOSED',
      roomId: parseInt(roomId, 10)
    });
    console.log(`Notified room ${roomId} about closure`);
  } catch (err) {
    console.error('Error notifying room closed:', err);
  }
}

module.exports = {
  setupWebSocket,
  notifyQueueUpdate,
  notifySongPlayed,
  broadcastToRoom,
  notifyRoomClosed
};