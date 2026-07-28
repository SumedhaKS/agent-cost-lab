import express, { type Request, type Response } from "express"

const app = express()

app.get('/health-check', (req: Request, res: Response) => {
    return res.json({ message: "Good" })
})

app.listen(3000, () => console.log("Server running successfully"))