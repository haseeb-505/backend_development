import express from "express";
import cookieParser from "cookie-parser";
import cors from 'cors';


const app = express()

app.use( cors({
    origin: process.env.CORS_ORGING,
    credentials: true
}) 
)

// data handling settings
app.use(express.json(
    {
        limit: "16Kb"
    }
))
// url encoding
app.use(express.urlencoded(
    {
        extended: true,
        limit: "16Kb"
    }
))
// statis assets management
app.use(express.static("public"))
// cookie parser middleware
app.use(cookieParser()) // don't forget to add parenthesis here, otherwise it will throw an error
// this will parse the cookies from the request headers and make it available in the req.cookies object

// routes import 
import userRouter from "./routes/user.routes.js"

// routes declaration
app.use("/api/v1/users", userRouter)




// export app

export { app } 