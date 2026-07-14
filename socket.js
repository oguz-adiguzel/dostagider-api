const { Server } = require("socket.io");

let io;

module.exports = {
  init: (server) => {
    io = new Server(server, {
      cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"],
        credentials: true,
      },
    });

    io.on("connection", socket => {
      console.log("🔌 Socket connected:", socket.id);

      socket.on("join", userId => {
        socket.join(userId);
        console.log("👤 Joined room:", userId);
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized");
    }
    return io;
  },
};
