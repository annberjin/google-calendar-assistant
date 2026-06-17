import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import cors from "cors";
import {
  deleteEvent,
  getEvents,
  createEvent,
  updateEvent,
} from "./calendar.js";
import { google } from "googleapis";

dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

const PORT = 3000;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI,
);

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
  oauth2Client.setCredentials({
    access_token: data.access_token,
  });

  // Handle errors
  if (!data.access_token) {
    console.log("Error when getting token::", data.error);
    console.log("Description:", data.error_description);
  }

  res.redirect(`http://localhost:5173`);
});

app.get("/speech", async (req, res) => {
  const text = req.query.text;
  console.log(text);

  const input = [{ role: "user", content: text }];
  const tools = [
    {
      type: "function",
      name: "getEvents",
      description: "Get calendar events within a time range.",
      parameters: {
        type: "object",
        properties: {
          start: {
            type: "string",
            description:
              "RFC3339 timestamp with timezone. Example: 2026-06-16T00:00:00Z",
          },
          end: {
            type: "string",
            description:
              "RFC3339 timestamp with timezone. Example: 2026-06-17T00:00:00Z",
          },
        },
        required: ["start", "end"],
        additionalProperties: false,
      },
      strict: true,
    },
    {
      type: "function",
      name: "createEvent",
      description: "Create a new calendar event.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Event name",
          },
          description: {
            type: "string",
            description: "Event details",
          },
          start: {
            type: "string",
            description:
              "Start time as RFC3339 with timezone. Example: 2026-06-16T14:00:00Z",
          },
          end: {
            type: "string",
            description:
              "End time as RFC3339 with timezone. Example: 2026-06-16T15:00:00Z",
          },
        },
        required: ["title", "description", "start", "end"],
        additionalProperties: false,
      },
      strict: true,
    },
    {
      type: "function",
      name: "updateEvent",
      description:
        "Update an existing calendar event. If a field is not being updated, use the existing value from a previous query.",
      parameters: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "Event ID to update",
          },
          title: {
            type: "string",
            description: "New event title",
          },
          description: {
            type: "string",
            description: "New event description",
          },
          startDateTime: {
            type: "string",
            description: "New start time as RFC3339 with timezone",
          },
          endDateTime: {
            type: "string",
            description: "New end time as RFC3339 with timezone",
          },
        },
        required: [
          "eventId",
          "title",
          "description",
          "startDateTime",
          "endDateTime",
        ],
        additionalProperties: false,
      },
      strict: true,
    },
    {
      type: "function",
      name: "deleteEvent",
      description: "Delete a calendar event by ID.",
      parameters: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "Event ID to delete",
          },
        },
        required: ["eventId"],
        additionalProperties: false,
      },
      strict: true,
    },
  ];

  const response = await openai.responses.create({
    model: "gpt-4o",
    instructions:
      "You are a helpful assistant that manages calendar events. Use the provided tools to get, create, update, and delete events based on user requests.",
    tools,
    input,
  });

  // Make the tool call
  for (const item of response.output) {
    if (item.name === "getEvents") {
      const { start, end } = JSON.parse(item.arguments);
      const events = await getEvents(oauth2Client, start, end);

      input.push({
        type: "function_call_output",
        call_id: item.call_id,
        output: JSON.stringify(events),
      });
    } else if (item.name === "createEvent") {
      const { title, description, start, end } = JSON.parse(item.arguments);
      const result = await createEvent(oauth2Client, {
        title,
        description,
        start,
        end,
      });

      input.push({
        type: "function_call_output",
        call_id: item.call_id,
        output: JSON.stringify(result),
      });
    } else if (item.name === "updateEvent") {
      const { eventId, title, description, startDateTime, endDateTime } =
        JSON.parse(item.arguments);
      const result = await updateEvent(oauth2Client, {
        eventId,
        title,
        description,
        startDateTime,
        endDateTime,
      });

      input.push({
        type: "function_call_output",
        call_id: item.call_id,
        output: JSON.stringify(result),
      });
    } else if (item.name === "deleteEvent") {
      const { eventId } = JSON.parse(item.arguments);
      const result = await deleteEvent(oauth2Client, { eventId });

      input.push({
        type: "function_call_output",
        call_id: item.call_id,
        output: JSON.stringify(result),
      });
    }
  }

  input.push(...response.output);


  const status = await openai.responses.create({
    model: "gpt-4o",
    instructions: "Inform the user of the result of a tool call.",
    input,
  });

  res.json({ message: status.output_text });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
