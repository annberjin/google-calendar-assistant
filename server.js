import express, { response } from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

dotenv.config();
const app = express();

const PORT = 3000;

// Routes
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  const error = req.query.error;

  if (error) {
    res.send(`<h1>Auth Error</h1><p>${error}</p>`);
    return;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.VITE_GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.VITE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const data = await response.json();

  // Handle errors
  if (!data.access_token) {
    console.log("Error when getting token::", data.error);
    console.log("Description:", data.error_description);
  }
  console.log(data)
  res.redirect(`http://localhost:5173`);
});

app.get("/speech", async (req, res) => {
  const text = req.query.text;
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
