const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "participants.userModel",
    },
    userModel: {
      type: String,
      required: true,
      enum: ["User", "CorporateUser"],
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [participantSchema],
      validate: [arr => arr.length >= 2, "En az 2 katılımcı olmalı"],
    },

    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarListing",
      required: true,
      index: true,
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    isGroup: {
      type: Boolean,
      default: false,
    },

    title: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Conversation", conversationSchema);
