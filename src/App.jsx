import { useEffect, useState } from "react";

export default function App() {
  const [page, setPage] = useState("login");
  const [code, setCode] = useState(null);

  const login = () => {
    // Redirect to Google OAuth
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_REDIRECT_URI;
    console.log(redirectUri);
    const scope = "https://www.googleapis.com/auth/calendar";

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  };

  return (
    <div>
      <h1>Google Calendar Assistant</h1>
      <button onClick={login}>Login with Google</button>
    </div>
  );
}
