import mongoose, { Schema, Types } from "mongoose";

const ConversationSchema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: null },
    isGroup: { type: Boolean, default: false },
    title: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", ConversationSchema);