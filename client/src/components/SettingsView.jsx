import React from "react";
import UserDetails from "./UserDetails";

function SettingsView() {
  const userData = JSON.parse(localStorage.getItem("user"));
  const spotifyConnected = localStorage.getItem("spotify_access_token");

  return (
    <div>
      <p>Informacje o koncie</p>
      <img src={userData.profileImageUrl} alt="Profile Image"></img>
      <p>Nazwa użytkownika: {userData.username}</p>
      <p>Email: {userData.email}</p>
      {spotifyConnected ? (
        <UserDetails />
      ) : (
        <a href="http://localhost:3001/api/auth/login/spotify">
          Connect Spotify
        </a>
      )}
    </div>
  );
}

export default SettingsView;
