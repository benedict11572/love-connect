import { useEffect, useState } from "react";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      // Load users
      const response = await fetch(
        "http://127.0.0.1:5000/api/admin/users",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Could not load users."
        );
        return;
      }

      const loadedUsers = data.users || [];

      setUsers(loadedUsers);

      const total = loadedUsers.reduce(
        (sum, user) =>
          sum + (user.photo_count || 0),
        0
      );

      setTotalPhotos(total);

      // Load uploaded photos
      const photosResponse = await fetch(
        "http://127.0.0.1:5000/api/admin/photos",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const photosData =
        await photosResponse.json();

      if (!photosResponse.ok) {
        setError(
          photosData.message ||
          "Could not load photos."
        );
        return;
      }

      setPhotos(photosData.photos || []);

    } catch (error) {
      console.error(error);
      setError(
        "Could not connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="admin-page">

      <div className="admin-container">

        <header className="admin-header">
          <div>
            <p className="admin-label">
              LOVE CONNECT
            </p>

            <h1>
              Admin Panel 🛡️
            </h1>

            <p>
              Manage your platform from anywhere.
            </p>
          </div>
        </header>

        <section className="admin-stats">

          <div className="admin-stat-card">
            <span>👥</span>

            <div>
              <strong>
                {users.length}
              </strong>

              <p>
                Total Users
              </p>
            </div>
          </div>

          <div className="admin-stat-card">
            <span>📸</span>

            <div>
              <strong>
                {totalPhotos}
              </strong>

              <p>
                Photos
              </p>
            </div>
          </div>

          <div className="admin-stat-card">
            <span>🟢</span>

            <div>
              <strong>
                —
              </strong>

              <p>
                Activity
              </p>
            </div>
          </div>

        </section>

        <section className="admin-section">

          <div className="admin-section-header">
            <div>
              <h2>
                Registered Users
              </h2>

              <p>
                Users currently registered on
                Love Connect.
              </p>
            </div>

            <button
              type="button"
              onClick={loadUsers}
              className="admin-refresh-button"
            >
              ↻ Refresh
            </button>
          </div>

          {loading && (
            <p className="admin-message">
              Loading users...
            </p>
          )}

          {error && (
            <p className="admin-error">
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            users.length === 0 && (
              <p className="admin-message">
                No users found.
              </p>
            )}

          {!loading &&
            !error &&
            users.length > 0 && (
              <div className="admin-users">

                {users.map((user) => (
                  <div
                    className="admin-user-card"
                    key={user.id}
                  >

                    <div className="admin-user-avatar">
                      👤
                    </div>

                    <div className="admin-user-info">

                      <h3>
                        {user.username}
                      </h3>

                      <p>
                        {user.email}
                      </p>

                      <small>
                        User ID: {user.id}
                      </small>

                      <small>
                        📸 Photos:{" "}
                        {user.photo_count}
                      </small>

                    </div>

                    {user.is_admin && (
                      <span className="admin-badge">
                        ADMIN
                      </span>
                    )}

                  </div>
                ))}

              </div>
            )}

        </section>

        {/* Uploaded Photos */}

        <section className="admin-section">

          <div className="admin-section-header">

            <div>
              <h2>
                Uploaded Photos
              </h2>

              <p>
                Photos uploaded by Love Connect users.
              </p>
            </div>

          </div>

          {!loading &&
            !error &&
            photos.length === 0 && (
              <p className="admin-message">
                No photos uploaded yet.
              </p>
            )}

          {!loading &&
            !error &&
            photos.length > 0 && (
              <div className="admin-photos">

                {photos.map((photo) => (
                  <div
                    className="admin-photo-card"
                    key={photo.id}
                  >

                    <img
                      src={photo.photo_url}
                      alt={`Uploaded by ${photo.username}`}
                    />

                    <div className="admin-photo-info">

                      <h3>
                        {photo.username}
                      </h3>

                      <p>
                        {photo.email}
                      </p>

                      <small>
                        Photo ID: {photo.id}
                      </small>

                    </div>

                  </div>
                ))}

              </div>
            )}

        </section>

      </div>

    </div>
  );
}

export default AdminPanel;