import { google } from "googleapis";

/**
 Get events within a given time range.
 We have to convert natural language into a timestamp 
 google calendar uses ISO 8601 strings for the timestamps

 auth is the authenticated google client with login and permission
 start - start time 
 end -  end time 
 */

export async function getEvents(auth, start, end) {
  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: start,
    timeMax: end,
    singleEvents: true,
    orderBy: "startTime",
  });

  return res.data.items.map((e) => ({
    title: e.summary,
    start: e.start?.dateTime,
    end: e.end?.dateTime,
  }));
}
