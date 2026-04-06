import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        require:[true,"user name is required"],
        unique: [true, "username must be unique"]
    },
    email:{
        type: String,
        require:[true,"Email name is required"],
        unique: [true, "Email must be unique"]
    },
    password:{
        type: String,
        require:[true,"Password is required"]
    }
})
const userModel = mongoose.model("users",userSchema);
export default userModel;