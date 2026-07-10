const Notification = require("../models/Notification");
const sendNotification = require("../utils/sendNotification");

const addNotification = async (req, res) => {
  try {
    const {
      users,
      title,
      message,
      type,
      link,
    } = req.body;

    // validation
    if (
      !users ||
      !Array.isArray(users) ||
      users.length === 0
    ) {
      return res.status(400).json({
        message:
          "Kullanıcı listesi zorunludur.",
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        message:
          "Başlık ve mesaj zorunludur.",
      });
    }

    // bildirim gönder
    for (const user of users) {
      await sendNotification({
        userId: user.userId,
        userModel: user.userModel,
        title,
        message,
        type: type || "admin",
        link: link || "",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Bildirimler başarıyla gönderildi.",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message:
        "Bildirim gönderilirken hata oluştu.",
    });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Bildirimler çekildi",
      notifications,
    });
  } catch (error) {
    console.log("error", error);
    res
      .status(500)
      .json({ message: "Bildirimler çekilirken hata oluştu", error });
  }
};

const readNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, {
      isRead: true,
    });

    res.json({
      message: "Bildirim okundu olarak işaretlendi",
      success: true,
    });
  } catch (error) {
    console.log("error", error);
    res
      .status(500)
      .json({ message: "Bildirimler çekilirken hata oluştu", error });
  }
};

const allNotificationDelete = async (req, res) => {
  try {
    const delNotifications = await Notification.deleteMany({
      user: req.user.id,
      isRead: true,
    });
    res.status(200).json({
      message: "Okunmuş bildirimler silindi",
    });
  } catch (error) {
    console.log("error", error);
    res
      .status(500)
      .json({ message: "Bildirimler silinirken hata oluştu", error });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        message: "Bildirim bulunamadı",
      });
    }

    res.status(200).json({
      message: "Bildirim silindi",
    });
  } catch (error) {
    console.log("error", error);

    res.status(500).json({
      message: "Bildirim silinirken hata oluştu",
      error,
    });
  }
};

module.exports = {
  addNotification,
  getNotifications,
  readNotification,
  allNotificationDelete,
  deleteNotification
};
