const Notification = require("../models/Notification");
const { getIO } = require("../socket");

// const sendNotification = async ({
//   userId,
//   title,
//   message,
//   type = "system",
//   link = null,
//   metadata = {},
// }) => {
//   // DB kayıt
//   const notification = await Notification.create({
//     user: userId,
//     title,
//     message,
//     type,
//     link,
//     metadata,
//   });

//   // realtime socket gönder
//   const io = getIO();

//   io.to(userId.toString()).emit("newNotification", notification);

//   return notification;
// };


const sendNotification = async ({
  userId,
  userModel,
  title,
  message,
  type = "system",
  link = null,
  metadata = {},
}) => {
  const notification =
    await Notification.create({
      user: userId,
      userModel,
      title,
      message,
      type,
      link,
      metadata,
    });

  const io = getIO();

  io.to(userId.toString()).emit(
    "newNotification",
    notification
  );

  return notification;
};

module.exports = sendNotification;