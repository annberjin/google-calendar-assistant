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

/**
 * Update an event with a given id.
 * Specify the new title, start and end time, or use the existing values from a previous query if you want to keep them the same.
 */
export async function updateEvent(
  auth,
  eventId,
  title,
  description,
  startDateTime,
  endDateTime,
) {
  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  const res = await calendar.events.update({
    calendarId: "primary",
    eventId: eventId,
    start: {
      dateTime: startDateTime,
    },
    end: {
      dateTime: endDateTime,
    },
    description: description,
    summary: title,
    title: title,
  });

  if (res.status !== 200) {
    return `Error updating event: ${res.statusText}`;
  } else {
    return "Event updated successfully";
  }
}

/**
 * Delete an event with a given id.
 */
export async function deleteEvent(auth, eventId) {
  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  const res = await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });

  if (res.status !== 200) {
    return `Error deleting event: ${res.statusText}`;
  } else {
    return "Event deleted successfully";
  }
}

export async function createEvent(auth, { title, description, start, end }) {
  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  const event = {
    summary: title,
    description: description || "",
    start: {
      dateTime: start, 
    },
    end: {
      dateTime: end,  
    },
  };

  const res = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
  });

  return {
    id: res.data.id,
    title: res.data.summary,
    start: res.data.start?.dateTime,
    end: res.data.end?.dateTime,
    link: res.data.htmlLink,
  };
} 