import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema(
    {

    }, {timestamps: true}
)

export const Video = mongoose.models("Video", videoSchema)