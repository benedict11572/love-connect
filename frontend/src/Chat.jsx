import { useEffect, useState } from "react";
import API_BASE_URL from "./api";

function Chat({ currentUserId, otherUserId }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load the person we are chatting with
  const loadProfile = async () => {
    if (!otherUserId) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_BASE_URL}/api/profile/${otherUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setProfile(data.profile);
      } else {
        console.error(data);
      }
    } catch (error) {
      console.error(
        "Load profile error:",
        error
      );
    }
  };

  // Load messages
  const loadMessages = async () => {
    if (!currentUserId || !otherUserId) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_BASE_URL}/api/messages/${currentUserId}/${otherUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages || []);

        // Mark incoming messages as read
       
        await fetch(
          `${API_BASE_URL}/api/messages/${currentUserId}/${otherUserId}/read`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      } else {
        console.error(data);
      }
    } catch (error) {
      console.error(
        "Load messages error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // Load profile and messages
  useEffect(() => {
    if (!currentUserId || !otherUserId) {
      return;
    }

    loadProfile();
    loadMessages();

    // Refresh messages every 3 seconds
    const interval = setInterval(() => {
      loadMessages();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [currentUserId, otherUserId]);

  // Send message
  const handleSend = async (event) => {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_BASE_URL}/api/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            sender_id: currentUserId,
            receiver_id: otherUserId,
            message: message.trim()
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      setMessages((previousMessages) => [
        ...previousMessages,
        data.data
      ]);

      setMessage("");

    } catch (error) {
      console.error(
        "Send message error:",
        error
      );

      alert(
        "Could not connect to the server."
      );
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="chat-page">
        <div className="chat-container">
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">

      <div className="chat-container">

        {/* Chat Header */}
        <div className="chat-header">

          <div className="chat-avatar">

            {profile?.profile_photo ? (
              <img
                src={profile.profile_photo}
                alt={profile.full_name}
              />
            ) : (
              "👤"
            )}

          </div>

          <div>

            <h2>
              {profile
                ? `${profile.full_name}, ${profile.age}`
                : "Loading..."}
            </h2>

            <p>
              {profile?.location
                ? `📍 ${profile.location}`
                : ""}
            </p>

          </div>

        </div>

        {/* Messages */}
        <div className="messages">

          {messages.length === 0 ? (
            <p>
              No messages yet. Say hello! 👋
            </p>
          ) : (
            messages.map((msg) => (

              <div
                key={msg.id}
                className={
                  msg.sender_id === currentUserId
                    ? "message my-message"
                    : "message their-message"
                }
              >

                <p>
                  {msg.message}
                </p>

              </div>

            ))
          )}

        </div>

        {/* Message Form */}
        <form
          className="message-form"
          onSubmit={handleSend}
        >

          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
          />

          <button type="submit">
            Send ❤️
          </button>

        </form>

      </div>

    </div>
  );
}

export default Chat;