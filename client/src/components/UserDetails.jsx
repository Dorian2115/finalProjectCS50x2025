import { useState, useEffect } from "react";
import axios from "axios";

function UserDetails() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const [userInfoRes, topArtistsRes] = await Promise.all([
          axios.get("http://127.0.0.1:3001/api/user/information", {
            withCredentials: true,
          }),
          axios.get("http://127.0.0.1:3001/api/user/top-artists", {
            withCredentials: true,
          }),
        ]);
        setUser({
          ...userInfoRes.data,
          top_artists: topArtistsRes.data.items,
        });
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <p>Imię: {user.display_name}</p>
      <p>
        Avatar: <img src={user.images[0]?.url} alt="Avatar" width="100" />
      </p>
      <h3>Ulubieni Artyści</h3>
      {user.top_artists && user.top_artists.length > 0 ? (
        <ul>
          {user.top_artists.slice(0, 5).map((artist) => (
            <li key={artist.id}>{artist.name}</li>
          ))}
        </ul>
      ) : (
        <p>Brak danych o ulubionych artystach.</p>
      )}
    </div>
  );
}

export default UserDetails;
