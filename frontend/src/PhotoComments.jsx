import { useEffect, useState } from "react";
import API_BASE_URL from "./api";

function PhotoComments({ photoId, currentUserId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  // Controls whether comments are visible
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const loadComments = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(
          `${API_BASE_URL}/api/photo-comments/${photoId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (response.ok) {
          setComments(data.comments || []);
        } else {
          console.error(data);
        }
      } catch (error) {
        console.error("Comments error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (photoId) {
      loadComments();
    }
  }, [photoId]);

  const handleComment = async (event) => {
    event.preventDefault();

    if (!newComment.trim()) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_BASE_URL}/api/photo-comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            user_id: currentUserId,
            photo_id: photoId,
            comment: newComment.trim()
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      setComments((previousComments) => [
        ...previousComments,
        data.comment
      ]);

      setNewComment("");

      // Automatically open comments after posting
      setShowComments(true);

    } catch (error) {
      console.error("Comment error:", error);
      alert("Could not connect to the server.");
    }
  };

  if (loading) {
    return <p>Loading comments...</p>;
  }

  return (
    <div className="photo-comments">

      {/* Comment bubble/count button */}
      <button
        type="button"
        className="comment-toggle"
        onClick={() =>
          setShowComments((previous) => !previous)
        }
      >
        💬 {comments.length}
      </button>

      {/* Comments appear only when button is clicked */}
      {showComments && (
        <div className="comments-popup">

          {comments.length === 0 ? (
            <p className="no-comments">
              No comments yet.
            </p>
          ) : (
            <div className="comments-list">

              {comments.map((comment) => (
                <div
                  className="comment-item"
                  key={comment.id}
                >
                  <p>
                    {comment.comment}
                  </p>
                </div>
              ))}

            </div>
          )}

          <form
            className="comment-form"
            onSubmit={handleComment}
          >
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(event) =>
                setNewComment(event.target.value)
              }
            />

            <button type="submit">
              Send
            </button>
          </form>

        </div>
      )}

    </div>
  );
}

export default PhotoComments;