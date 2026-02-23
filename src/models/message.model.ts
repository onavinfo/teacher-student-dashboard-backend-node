import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true } // createdAt auto
);

export default mongoose.model("Message", MessageSchema);