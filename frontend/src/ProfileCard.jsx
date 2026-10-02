
import PhotoGallery from "./PhotoGallery";

function ProfileCard({
  id,
  name,
  age,
  location,
  interests,
  profilePhoto,
  currentUserId,
  onLike,
  onPass,
}) {
  return (
    <div className="profile-card">

      {/* PROFILE PHOTO */}

      <div className="profile-image">
        {profilePhoto ? (
          <img
            src={profilePhoto}
            alt={`${name}'s profile`}
          />
        ) : (
          <span>👤</span>
        )}
      </div>

      {/* PROFILE INFORMATION */}

      <div className="profile-info">

        <h3>
          {name}, {age}
        </h3>

        <p>
          📍 {location}
        </p>

        <p>
          ❤️ {interests}
        </p>

        {/* ADDITIONAL PHOTOS */}

        <PhotoGallery
          userId={id}
          currentUserId={currentUserId}
        />

        {/* PROFILE ACTIONS */}

        <div className="profile-buttons">

          <button
            className="pass"
            onClick={() => onPass(id)}
          >
            ✕
          </button>

          <button
            className="like"
            onClick={() => onLike(id)}
          >
            ❤️
          </button>

        </div>

      </div>

    </div>
  );
}

export default ProfileCard;

