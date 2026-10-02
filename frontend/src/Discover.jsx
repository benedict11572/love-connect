import { useEffect, useState } from "react";
import ProfileCard from "./ProfileCard";

function Discover({ userId }) {
  const [users, setUsers] = useState([]);
  const [liked, setLiked] = useState([]);
  const [passed, setPassed] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get real profiles from Flask
  useEffect(() => {
    const getUsers = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:5000/api/users"
        );

        const data = await response.json();

        if (response.ok) {
          // Don't show the logged-in user
          const otherUsers = data.users.filter(
            (user) => user.user_id !== userId
          );

          setUsers(otherUsers);
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
      getUsers();
    }
  }, [userId]);

  // Like a user
  const handleLike = async (likedUserId) => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/like",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: userId,
            liked_user_id: likedUserId
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      setLiked([...liked, likedUserId]);

      alert(data.message);

    } catch (error) {
      console.error(error);
      alert("Could not connect to the server.");
    }
  };

  // Pass a user
  const handlePass = (userIdToPass) => {
    setPassed([...passed, userIdToPass]);

    // Remove the person from the screen
    setUsers(
      users.filter((user) => user.user_id !== userIdToPass)
    );
  };

  return (
    <div className="discover">

      <p className="section-tag">
        DISCOVER
      </p>

      <h2>
        Meet people who match your vibe
      </h2>

      <p className="section-description">
        Discover interesting people and find someone you connect with.
      </p>

      {loading && (
        <p>Loading profiles...</p>
      )}

      {!loading && users.length === 0 && (
        <p>
          No more profiles to discover ❤️
        </p>
      )}

      <div className="profile-container">

        {users.map((user) => (

         
       <ProfileCard
        key={user.user_id}
        id={user.user_id}
        name={user.full_name}
        age={user.age}
        location={user.location}
        interests={user.bio}
        profilePhoto={user.profile_photo}
        currentUserId={userId}
        onLike={handleLike}
        onPass={handlePass}
       />



        ))}

      </div>

      <div className="activity">

        <h3>
          Your Activity
        </h3>

        <p>
          ❤️ Liked: {liked.length}
        </p>

        <p>
          ✕ Passed: {passed.length}
        </p>

      </div>

    </div>
  );
}

export default Discover;