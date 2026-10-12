
const GameEngine = require("../services/GameEngine");

module.exports = function registerGameSocket(io) {
  const engine = new GameEngine(io);
  engine.start();

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("place_bet", (data) => engine.placeBet(socket, data));
    socket.on("cash_out",  (data) => engine.cashOut(socket, data));

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};
