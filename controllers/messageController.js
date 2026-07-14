const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { getIO } = require("../socket");

// exports.sendMessage = async (req, res) => {
//   try {
//     const { conversationId, content } = req.body;
//     const { id, role } = req.user;

//     let senderModel = null;
//     if (role === "kurumsal") senderModel = "CorporateUser";
//     if (role === "bireysel") senderModel = "User";

//     if (!senderModel) {
//       return res.status(400).json({ message: "Geçersiz kullanıcı" });
//     }

//     const message = await Message.create({
//       conversationId,
//       sender: id,
//       senderModel,
//       content,
//     });

//     // 🔹 Conversation güncelle
//     const conversation = await Conversation.findByIdAndUpdate(
//       conversationId,
//       {
//         lastMessage: message._id,
//         updatedAt: new Date(),
//       },
//       { new: true },
//     ).populate("participants.user");

//     // 🔹 Socket emit
//     const io = getIO();

//     conversation.participants.forEach((p) => {
//       const receiverId =
//         typeof p.user === "object" ? p.user._id.toString() : p.user.toString();

//       if (receiverId !== id.toString()) {
//         console.log("📤 newMessage emit →", receiverId);

//         io.to(receiverId).emit("newMessage", {
//           _id: message._id,
//           conversationId,
//           sender: id,
//           senderModel,
//           content,
//           createdAt: message.createdAt,
//         });
//       }
//     });

//     res.status(201).json(message);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Mesaj gönderilemedi" });
//   }
// };



exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const { id, role } = req.user;

    let senderModel = null;
    if (role === "kurumsal") senderModel = "CorporateUser";
    if (role === "bireysel") senderModel = "User";

    if (!senderModel) {
      return res.status(400).json({ message: "Geçersiz kullanıcı" });
    }

    const message = await Message.create({
      conversationId,
      sender: id,
      senderModel,
      content,
    });

    // 🔹 Conversation güncelle ve alt modelleri doldur
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: message._id,
        updatedAt: new Date(),
      },
      { new: true }
    ).populate("participants.user listing"); // listing modelini de dolduruyoruz ki frontend'de kırılmasın

    // 🔹 Socket emit
    const io = getIO();

    conversation.participants.forEach((p) => {
      const participantId = typeof p.user === "object" ? p.user._id.toString() : p.user.toString();

      // 1. 📢 Sol menünün anlık güncellenmesi için (Her iki tarafa da gitmeli)
      io.to(participantId).emit("conversationUpdated", conversation);

      // 2. ✉️ Mesajın ekrana düşmesi için (Her iki tarafa da gönderiyoruz)
      console.log("📤 newMessage emit →", participantId);
      io.to(participantId).emit("newMessage", {
        _id: message._id,
        conversationId,
        sender: id,
        senderModel,
        content,
        createdAt: message.createdAt,
      });
    });

    // İsteği yapan frontend'e de cevabı dönüyoruz (Zaten yukarda socket'ten de beslenecek)
    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Mesaj gönderilemedi" });
  }
};



exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { id, role } = req.user;

    // role -> model dönüşümü (controller içinde)
    let userModel = null;
    if (role === "kurumsal") userModel = "CorporateUser";
    if (role === "bireysel") userModel = "User";

    if (!userModel) {
      return res.status(400).json({ message: "Geçersiz kullanıcı rolü" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Yetki kontrolü
    const conversation = await Conversation.exists({
      _id: conversationId,
      participants: {
        $elemMatch: { user: id, userModel },
      },
    });

    if (!conversation) {
      return res.status(403).json({ message: "Yetkisiz" });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name email");

    res.json(messages.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Mesajlar alınamadı" });
  }
};
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { id, model } = req.user;

    await Message.updateMany(
      {
        conversationId,
        isRead: false,
        sender: { $ne: id },
      },
      { $set: { isRead: true } },
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Okundu güncellenemedi" });
  }
};
