
import { useEffect, useState } from "react";
import API_BASE_URL from "./api";

function Notifications({ userId, onViewProfile }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Notification error:", error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${userId}/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error("Unread notification error:", error);
    }
  };

  useEffect(() => {
    if (!userId) {
      return;
    }

    loadNotifications();
    loadUnreadCount();

    const interval = setInterval(() => {
      loadNotifications();
      loadUnreadCount();
    }, 10000);

    return () => clearInterval(interval);
  }, [userId]);

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        setNotifications((previous) =>
          previous.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  is_read: true
                }
              : notification
          )
        );

        setUnreadCount((previous) =>
          Math.max(previous - 1, 0)
        );
      }
    } catch (error) {
      console.error("Mark read error:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${userId}/read-all`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        setNotifications((previous) =>
          previous.map((notification) => ({
            ...notification,
            is_read: true
          }))
        );

        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Mark all read error:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.sender_id && onViewProfile) {
      onViewProfile(
        notification.sender_id,
        notification.type,
        notification.photo_id
      );
    }
  };

  return (
    <div className="notifications-container">

      {/* Notification button */}
      <button
        type="button"
        className="notification-button"
        onClick={handleOpenNotifications}
      >
        🔔

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification panel */}
      {showNotifications && (
        <div className="notification-panel">

          <div className="notification-header">
            <h3>Notifications</h3>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="no-notifications">
              No notifications yet ❤️
            </p>
          ) : (
            <div className="notification-list">

              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    notification.is_read
                      ? "read"
                      : "unread"
                  }`}
                  onClick={() =>
                    handleNotificationClick(notification)
                  }
                >

                  <div className="notification-content">

                    {/* Sender photo */}
                    {notification.sender_photo ? (
                      <img
                        src={notification.sender_photo}
                        alt={notification.sender_name}
                        className="notification-avatar"
                      />
                    ) : (
                      <div className="notification-avatar-placeholder">
                        👤
                      </div>
                    )}

                    <div className="notification-text">

                      {/* Notification message */}
                      <p>
                        <strong>
                          {notification.sender_name}
                        </strong>{" "}

                        {notification.type === "photo_like"
                          ? "liked your photo ❤️"
                          : notification.type === "photo_comment"
                          ? "commented on your photo 💬"
                          : notification.type === "match"
                          ? "matched with you! ❤️💕"
                          : notification.message}
                      </p>

                      {/* Comment text */}
                      {notification.type === "photo_comment" && (
                        <p className="notification-comment">
                          "{notification.message}"
                        </p>
                      )}

                      {/* Date */}
                      <small>
                        {new Date(
                          notification.created_at
                        ).toLocaleString()}
                      </small>

                    </div>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default Notifications;




