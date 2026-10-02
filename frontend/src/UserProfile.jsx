
import { useEffect, useState } from "react";
import PhotoGallery from "./PhotoGallery";

function UserProfile({
  userId,
  currentUserId,
  photoId,
  onBack
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:5000/api/profile/${userId}`
        );

        const data = await response.json();

        if (response.ok) {
          setProfile(data.profile);
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error("Profile error:", error);
        alert("Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadProfile();
    }
  }, [userId]);

  if (loading) {
    return <p>Loading profile...</p>;
  }

  if (!profile) {
    return <p>Profile not found.</p>;
  }

  return (
    <div className="user-profile">

      <button
        type="button"
        onClick={onBack}
      >
        ← Back
      </button>

      <div className="user-profile-card">

        {/* Profile photo */}
        <div className="user-profile-image">
          {profile.profile_photo ? (
            <img
              src={profile.profile_photo}
              alt={profile.full_name}
            />
          ) : (
            <span>👤</span>
          )}
        </div>

        {/* Profile information */}
        <h2>
          {profile.full_name}, {profile.age}
        </h2>

        <p>
          📍 {profile.location}
        </p>

        <p>
          {profile.bio}
        </p>

        {/* Photo gallery */}
        <PhotoGallery
          userId={userId}
          currentUserId={currentUserId}
          highlightedPhotoId={photoId}
        />

      </div>

    </div>
  );
}

export default UserProfile;

