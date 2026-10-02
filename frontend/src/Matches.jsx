
import { useEffect, useState } from "react";

function Matches({ userId, onOpenChat }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getMatches = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:5000/api/matches/${userId}`
        );

        const data = await response.json();

        console.log("Matches response:", data);

        if (response.ok) {
          setMatches(data.matches || []);
        } else {
          alert(data.message);
        }

      } catch (error) {
        console.error(error);
        alert("Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      getMatches();
    }
  }, [userId]);

  return (
    <div className="matches-page">

      <div className="matches-box">

        <h1>Your Matches ❤️</h1>

        <p>
          People you've connected with will appear here.
        </p>

        {loading && (
          <p>Loading your matches...</p>
        )}

        {!loading && matches.length === 0 && (
          <p>
            You don't have any matches yet. ❤️
          </p>
        )}

        {!loading &&
          matches.map((match) => (

            <div
              className="match-card"
              key={match.match_id}
            >

              <div className="match-image">
                👤
              </div>

              <div className="match-info">

                <h2>
                  {match.full_name}, {match.age}
                </h2>

                <p>
                  📍 {match.location}
                </p>

                <p>
                  ❤️ {match.bio}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    console.log(
                      "Opening chat with:",
                      match.user_id
                    );

                    onOpenChat(match.user_id);
                  }}
                >
                  💬 Start Chat
                </button>

              </div>

            </div>

          ))}

      </div>

    </div>
  );
}

export default Matches;

