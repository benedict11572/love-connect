
import { useEffect, useState } from "react";
import PhotoComments from "./PhotoComments";
import API_BASE_URL from "./api";

function PhotoGallery({
  userId,
  currentUserId,
  highlightedPhotoId
}) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedPhotos, setLikedPhotos] = useState([]);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/photos/${userId}?current_user_id=${currentUserId}`
        );

        const data = await response.json();

        console.log("Gallery response:", data);

        if (response.ok) {
          setPhotos(data.photos || []);

          const alreadyLiked = (data.photos || [])
            .filter(
              (photo) =>
                photo.liked_by_current_user
            )
            .map((photo) => photo.id);

          setLikedPhotos(alreadyLiked);
        } else {
          console.error(data);
        }
      } catch (error) {
        console.error(
          "Gallery error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    if (userId && currentUserId) {
      loadPhotos();
    }
  }, [userId, currentUserId]);

  /*
    Scroll to the photo that was mentioned
    in a notification.
  */
  useEffect(() => {
    if (
      !highlightedPhotoId ||
      photos.length === 0
    ) {
      return;
    }

    const photoElement =
      document.getElementById(
        `photo-${highlightedPhotoId}`
      );

    if (photoElement) {
      setTimeout(() => {
        photoElement.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, 300);
    }
  }, [
    highlightedPhotoId,
    photos
  ]);

  const handleLike = async (photoId) => {
  try {
    const token = localStorage.getItem("access_token");

    const response = await fetch(
      `${API_BASE_URL}/api/photo-like`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: currentUserId,
          photo_id: photoId
        })
      }
    );

    const data = await response.json();

    console.log(
      "Like response:",
      response.status,
      data
    );

    if (!response.ok) {
      alert(data.message);
      return;
    }

    setPhotos(
      (previousPhotos) =>
        previousPhotos.map(
          (photo) =>
            photo.id === photoId
              ? {
                  ...photo,
                  likes: data.likes
                }
              : photo
        )
    );

    setLikedPhotos(
      (previous) => [
        ...previous,
        photoId
      ]
    );

  } catch (error) {
    console.error(
      "Like error:",
      error
    );

    alert(
      "Could not connect to the server."
    );
  }
};


  const handleUnlike = async (photoId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/photo-unlike`,
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            user_id: currentUserId,
            photo_id: photoId
          })
        }
      );

      const data = await response.json();

      console.log(
        "Unlike response:",
        response.status,
        data
      );

      if (!response.ok) {
        alert(data.message);
        return;
      }

      setPhotos(
        (previousPhotos) =>
          previousPhotos.map(
            (photo) =>
              photo.id === photoId
                ? {
                    ...photo,
                    likes: data.likes
                  }
                : photo
          )
      );

      setLikedPhotos(
        (previous) =>
          previous.filter(
            (id) => id !== photoId
          )
      );

    } catch (error) {
      console.error(
        "Unlike error:",
        error
      );

      alert(
        "Could not connect to the server."
      );
    }
  };

  if (loading) {
    return (
      <p>Loading photos...</p>
    );
  }

  if (photos.length === 0) {
    return (
      <p>
        No additional photos yet.
      </p>
    );
  }

  return (
    <div className="photo-gallery">

      {photos.map((photo) => {
        const isLiked =
          likedPhotos.includes(
            photo.id
          );

        const isHighlighted =
          Number(highlightedPhotoId) ===
          Number(photo.id);

        return (
          <div
            id={`photo-${photo.id}`}
            className={`gallery-item ${
              isHighlighted
                ? "highlighted-photo"
                : ""
            }`}
            key={photo.id}
          >

            <img
              src={photo.photo_url}
              alt="Gallery"
            />

            <PhotoComments
              photoId={photo.id}
              currentUserId={
                currentUserId
              }
            />

            {photo.user_id !==
              currentUserId && (
              <button
                type="button"
                className="photo-like-button"
                onClick={() => {
                  if (isLiked) {
                    handleUnlike(
                      photo.id
                    );
                  } else {
                    handleLike(
                      photo.id
                    );
                  }
                }}
              >
                {isLiked
                  ? "❤️"
                  : "♡"}{" "}
                {photo.likes ?? 0}
              </button>
            )}

          </div>
        );
      })}

    </div>
  );
}

export default PhotoGallery;

