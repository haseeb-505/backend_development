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
app.use(cookieParser)

export { app } 