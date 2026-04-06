import app from "./app.js";
import connectDB from "./config/database.js";
import dotenv from "dotenv";
dotenv.config();
connectDB();
app.listen(3000,()=>{
    console.log("server is running on port 3000");
})