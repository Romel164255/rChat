const messageModel = require("../models/messageModel");

const createMessage = async (data) => {
  return await messageModel.saveMessage(data);
};

const fetchRoomMessages = async (roomId) => {
  return await messageModel.getMessagesByRoom(roomId);
};

module.exports = {
  createMessage,
  fetchRoomMessages,
};