import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {

    }, {timestamps: true}
)

export const User = mongoose.models("User", userSchema)