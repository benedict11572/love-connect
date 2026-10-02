import { useEffect, useState } from "react";

function Messages({ userId, onOpenChat }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `http://127.0.0.1:5000/api/conversations/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setConversations(data.conversations || []);
      } else {
        console.error(data);
      }
    } catch (error) {
      console.error("Conversations error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      return;
    }

    loadConversations();

    // Refresh conversations every 3 seconds
    const interval = setInterval(() => {
      loadConversations();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="messages-page">
        <div className="messages-container">
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-container">

        <h1>💬 Messages</h1>

        {conversations.length === 0 ? (
          <div className="no-conversations">
            <p>No conversations yet ❤️</p>

            <p>
              Start chatting with one of your matches.
            </p>
          </div>
        ) : (
          <div className="conversation-list">

            {conversations.map((conversation) => (

              <div
                key={conversation.user_id}
                className="conversation-card"
                onClick={() =>
                  onOpenChat(conversation.user_id)
                }
              >

                {/* Profile picture */}
                <div className="conversation-avatar">

                  {conversation.profile_photo ? (
                    <img
                      src={conversation.profile_photo}
                      alt={conversation.full_name}
                    />
                  ) : (
                    "👤"
                  )}

                </div>

                {/* Conversation information */}
                <div className="conversation-info">

                  <h3>
                    {conversation.full_name}
                  </h3>

                  <p>
                    {conversation.last_message}
                  </p>

                </div>

                {/* Unread badge */}
                {conversation.unread_count > 0 && (
                  <span className="conversation-unread-badge">
                    {conversation.unread_count}
                  </span>
                )}

              </div>

            ))}

          </div>
        )}

      </div>
    </div>
  );
}

export default Messages;