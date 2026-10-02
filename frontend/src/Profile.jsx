
import { useState } from "react";

function Profile({ userId, goToHome }) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("");
  const [interests, setInterests] = useState("");
  const [age, setAge] = useState("");

  const [profilePhoto, setProfilePhoto] = useState("");
  const [galleryPhotos, setGalleryPhotos] = useState([]);

  const handleProfilePhoto = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image.");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setProfilePhoto(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleGalleryPhotos = (event) => {
    const files = Array.from(event.target.files);

    const imageFiles = files.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      alert("Please select image files.");
      return;
    }

    imageFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        setGalleryPhotos((previousPhotos) => [
          ...previousPhotos,
          reader.result
        ]);
      };

      reader.readAsDataURL(file);
    });
  };

  const removeGalleryPhoto = (index) => {
    setGalleryPhotos((previousPhotos) =>
      previousPhotos.filter((_, photoIndex) => photoIndex !== index)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!userId) {
      alert("User account not found. Please log in again.");
      return;
    }

    if (Number(age) < 18) {
      alert("You must be 18 or older to use Love Connect.");
      return;
    }

    if (!profilePhoto) {
      alert("Please upload a profile picture.");
      return;
    }

    try {
      // =========================
      // CREATE PROFILE
      // =========================

      const profileResponse = await fetch(
        "http://127.0.0.1:5000/api/profile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: userId,
            full_name: name,
            age: Number(age),
            gender: gender,
            location: location,
            bio: `${bio} Interests: ${interests}`,
            profile_photo: profilePhoto
          })
        }
      );

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        alert(profileData.message);
        return;
      }

      // =========================
      // SAVE GALLERY PHOTOS
      // =========================

      console.log("Gallery photos:", galleryPhotos.length);

for (const photo of galleryPhotos) {
  const photoResponse = await fetch(
    "http://127.0.0.1:5000/api/photos",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: userId,
        photo_url: photo
      })
    }
  );

 const photoData = await photoResponse.json();

console.log("Photo upload response:", photoResponse.status, photoData);

if (!photoResponse.ok) {
  console.error(photoData);
}
}

      alert("Profile and photos saved successfully ❤️");

      if (goToHome) {
        goToHome();
      }

    } catch (error) {
      console.error(error);
      alert("Could not connect to the server.");
    }
  };

  return (
    <div className="profile-page">

      <div className="profile-box">

        <h1>Complete Your Profile ❤️</h1>

        <p>Tell people a little about yourself.</p>

        {/* PROFILE PHOTO */}

        <div className="photo-upload">

          <label>Profile Picture</label>

          <div className="profile-photo-preview">

            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile preview"
              />
            ) : (
              <span>📷</span>
            )}

          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleProfilePhoto}
          />

        </div>

        <form onSubmit={handleSubmit}>

          <label>Full Name</label>

          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <label>Age</label>

          <input
            type="number"
            min="18"
            placeholder="Your age"
            value={age}
            onChange={(event) => setAge(event.target.value)}
            required
          />

          <label>Bio</label>

          <textarea
            placeholder="Tell people about yourself..."
            rows="4"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            required
          ></textarea>

          <label>Location</label>

          <input
            type="text"
            placeholder="e.g. Nairobi"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            required
          />

          <label>Gender</label>

          <select
            value={gender}
            onChange={(event) => setGender(event.target.value)}
            required
          >

            <option value="">
              Select your gender
            </option>

            <option value="male">
              Male
            </option>

            <option value="female">
              Female
            </option>

            <option value="other">
              Other
            </option>

          </select>

          <label>Interests</label>

          <input
            type="text"
            placeholder="e.g. Music, Football, Movies"
            value={interests}
            onChange={(event) => setInterests(event.target.value)}
            required
          />

          {/* GALLERY */}

          <div className="gallery-upload">

            <label>Additional Photos</label>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryPhotos}
            />

            <div className="gallery-preview">

              {galleryPhotos.map((photo, index) => (

                <div
                  className="gallery-photo"
                  key={index}
                >

                  <img
                    src={photo}
                    alt={`Gallery ${index + 1}`}
                  />

                  <button
                    type="button"
                    onClick={() => removeGalleryPhoto(index)}
                  >
                    ✕
                  </button>

                </div>

              ))}

            </div>

          </div>

          <button type="submit">
            Save Profile ❤️
          </button>

        </form>

      </div>

    </div>
  );
}

export default Profile;

