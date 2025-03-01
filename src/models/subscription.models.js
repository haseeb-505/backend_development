import mongoose, { Schema } from 'mongoose';

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User", // one who subscribes
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User", // one whose channel or who is being subscribed
    }
},{timestamps: true});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);