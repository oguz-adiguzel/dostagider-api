const Conversation = require("../models/Conversation");

exports.createConversation = async (req, res) => {
  try {
    const { targetId, targetModel, listingId } = req.body;
    const { id, role } = req.user;

    // role -> model dönüşümü (controller içinde)
    let userModel = null;
    if (role === "kurumsal") userModel = "CorporateUser";
    if (role === "bireysel") userModel = "User";

    if (!userModel) {
      return res.status(400).json({ message: "Geçersiz kullanıcı rolü" });
    }

    if (!targetId || !targetModel || !listingId) {
      return res.status(400).json({ message: "Eksik bilgi" });
    }

    if (targetId === id) {
      return res.status(400).json({ message: "Kendinle sohbet edemezsin" });
    }

    // 🔹 AYNI İLAN + AYNI KATILIMCILAR VAR MI?
    const existingConversation = await Conversation.findOne({
      isGroup: false,
      listing: listingId,
      participants: {
        $all: [
          { $elemMatch: { user: id, userModel } },
          { $elemMatch: { user: targetId, userModel: targetModel } },
        ],
      },
    });

    if (existingConversation) {
      return res.json(existingConversation);
    }

    // 🔹 YENİ CONVERSATION
    const conversation = await Conversation.create({
      participants: [
        { user: id, userModel },
        { user: targetId, userModel: targetModel },
      ],
      listing: listingId,
    });

    res.status(201).json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Conversation oluşturulamadı" });
  }
};

exports.getMyConversations = async (req, res) => {
  try {
    const { id, role } = req.user;

    // role -> model dönüşümü
    let userModel = null;
    if (role === "kurumsal") userModel = "CorporateUser";
    if (role === "bireysel") userModel = "User";

    if (!userModel) {
      return res.status(400).json({ message: "Geçersiz kullanıcı rolü" });
    }

    const conversations = await Conversation.find({
      participants: {
        $elemMatch: { user: id, userModel },
      },
    })
      // 🔹 İLAN BİLGİSİ (görsel + başlık + sahibi)
      .populate({
        path: "listing",
        select: "baslik gorseller user ilanNo",
      })

      // 🔹 KATILIMCILAR (karşı tarafı göstermek için)
      .populate({
        path: "participants.user",
        select: "isim soyisim galeriAdi email",
      })

      // 🔹 SON MESAJ
      .populate({
        path: "lastMessage",
        select: "content sender senderModel createdAt",
      })
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Conversation listesi alınamadı" });
  }
};

exports.getConversationById = async (req, res) => {
  try {
    const { id: userId, model } = req.user;
    const { id: conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: {
        $elemMatch: { user: userId, userModel: model },
      },
    }).populate("lastMessage");

    if (!conversation) {
      return res.status(404).json({ message: "Conversation bulunamadı" });
    }

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: "Hata oluştu" });
  }
};
