import { useRef, useState } from "react";

export default function App() {
  const [listening, setListening] = useState(false);
  const audioStreamRef = useRef([]);
  const recorderRef = useRef(null);

  const login = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_REDIRECT_URI;
    console.log(redirectUri);
    const scope = "https://www.googleapis.com/auth/calendar";

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  };

  const transcribe = async (audioBlob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "whisper-1");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer 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`,
        },
        body: formData,
      },
    );
    console.log(response);

    const data = await response.json();
    console.log(data);
    return data.text;
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (event) => {
      audioStreamRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      const audioBlob = new Blob(audioStreamRef.current, {
        type: "audio/webm",
      });
      const key =
        "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";

      const text = await transcribe(audioBlob);

      // Send the text to the backend to process with GPT and manage calendar events
      const response = await fetch("http://localhost:3000/speech", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      console.log("Response from server:", data);
      alert(data.message);
    };

    recorder.start();
    recorderRef.current = recorder;
    setListening(true);
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      setListening(false);
    }
  };

  return (
    <div>
      <h1>Google Calendar Assistant</h1>
      <button onClick={login}>Login with Google</button>
      {listening ? (
        <button onClick={stopRecording}>Stop Recording</button>
      ) : (
        <button onClick={startRecording}>Start Recording</button>
      )}
      {listening && <p>Listening...</p>}
    </div>
  );
}
