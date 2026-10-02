import React, { useEffect, useState } from "react";
import Signup from "./Signup";
import Login from "./Login";
import Profile from "./Profile";
import Discover from "./Discover";
import Matches from "./Matches";
import Chat from "./Chat";
import Notifications from "./Notifications";
import UserProfile from "./UserProfile";
import Messages from "./Messages";
import AdminPanel from "./AdminPanel";


function App() {
  const [page, setPage] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);

  const [unreadMessages, setUnreadMessages] = useState(0);

  const [viewingUserId, setViewingUserId] = useState(null);
  const [viewingPhotoId, setViewingPhotoId] = useState(null);

  // User we are chatting with
  const [chatUserId, setChatUserId] = useState(null);

  // =========================================
  // CHECK LOGIN WHEN APP STARTS
  // =========================================

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setPage("login");
      setCurrentUser(null);
      return;
    }

    // Keep the token, but we need the user information
    // from the previous login.
    const savedUser = localStorage.getItem("current_user");

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);

        setCurrentUser(user);
        setPage("discover");
      } catch (error) {
        console.error("Could not load saved user:", error);

        localStorage.removeItem("access_token");
        localStorage.removeItem("current_user");

        setCurrentUser(null);
        setPage("login");
      }
    } else {
      // Token exists but user information is missing.
      // Send the user back to login.
      localStorage.removeItem("access_token");
      setCurrentUser(null);
      setPage("login");
    }
  }, []);

  // =========================================
  // LOAD UNREAD MESSAGE COUNT
  // =========================================

  const loadUnreadMessages = async () => {
    if (!currentUser?.id) {
      return;
    }

    const token = localStorage.getItem("access_token");

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/messages/${currentUser.id}/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUnreadMessages(data.unread_count || 0);
      }
    } catch (error) {
      console.error(
        "Unread messages error:",
        error
      );
    }
  };

  // Check for new unread messages every 3 seconds
  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    loadUnreadMessages();

    const interval = setInterval(() => {
      loadUnreadMessages();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [currentUser]);

  // =========================================
  // LOGIN / SIGNUP
  // =========================================

  const handleSignupSuccess = (user) => {
    setCurrentUser(user);

    localStorage.setItem(
      "current_user",
      JSON.stringify(user)
    );

    setPage("profile");
  };


  const handleLoginSuccess = (user) => {
  setCurrentUser(user);

  localStorage.setItem(
    "current_user",
    JSON.stringify(user)
  );

  if (user.is_admin === true) {
    setPage("admin");
  } else {
    setPage("discover");
  }
};



  // =========================================
  // NOTIFICATION PROFILE
  // =========================================

  const handleNotificationProfile = (
    senderId,
    notificationType,
    photoId
  ) => {
    setViewingUserId(senderId);

    if (notificationType === "photo_comment") {
      setViewingPhotoId(photoId);
    } else {
      setViewingPhotoId(null);
    }

    setPage("user-profile");
  };

  // =========================================
  // OPEN CHAT
  // =========================================

  const openChat = (userId) => {
    setChatUserId(userId);
    setPage("chat");
  };

  // =========================================
  // NAVIGATION
  // =========================================

  const goToPage = (newPage) => {
    setPage(newPage);
  };

  return (
    <div>

      {/* ========================= */}
      {/* NAVIGATION */}
      {/* ========================= */}

      {currentUser && (
        <nav className="main-navigation">

          <button
            type="button"
            onClick={() => goToPage("discover")}
          >
            🔍 Discover
          </button>

          <button
            type="button"
            onClick={() => goToPage("matches")}
          >
            ❤️ Matches
          </button>

          <button
            type="button"
            className="messages-nav-button"
            onClick={() => goToPage("messages")}
          >
            💬 Messages

            {unreadMessages > 0 && (
              <span className="message-badge">
                {unreadMessages}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => goToPage("profile")}
          >
            👤 Profile
          </button>

          <button
            type="button"
            onClick={() => goToPage("home")}
          >
            🏠 Home
          </button>

        </nav>
      )}

      {/* ========================= */}
      {/* NOTIFICATIONS */}
      {/* ========================= */}

      {currentUser && (
        <Notifications
          userId={currentUser.id}
          onViewProfile={handleNotificationProfile}
        />
      )}

      {/* ========================= */}
      {/* SIGN UP */}
      {/* ========================= */}

      {page === "signup" && (
        <Signup
          goToProfile={handleSignupSuccess}
        />
      )}

      {page === "admin" && currentUser?.is_admin === true && (
        <AdminPanel />
      )}

      {/* ========================= */}
      {/* LOGIN */}
      {/* ========================= */}

      {page === "login" && (
        <Login
          onLogin={handleLoginSuccess}
        />
      )}

      {/* ========================= */}
      {/* OWN PROFILE */}
      {/* ========================= */}

      {page === "profile" && (
        <Profile
          userId={currentUser?.id}
          goToHome={() => setPage("discover")}
        />
      )}

      {/* ========================= */}
      {/* DISCOVER */}
      {/* ========================= */}

      {page === "discover" && (
        <Discover
          userId={currentUser?.id}
        />
      )}

      {/* ========================= */}
      {/* MATCHES */}
      {/* ========================= */}

      {page === "matches" && (
        <Matches
          userId={currentUser?.id}
          onOpenChat={openChat}
        />
      )}

      {/* ========================= */}
      {/* MESSAGES */}
      {/* ========================= */}

      {page === "messages" && (
        <Messages
          userId={currentUser?.id}
          onOpenChat={openChat}
        />
      )}

      {/* ========================= */}
      {/* CHAT */}
      {/* ========================= */}

      {page === "chat" && (
        <Chat
          currentUserId={currentUser?.id}
          otherUserId={chatUserId}
        />
      )}

      {/* ========================= */}
      {/* OTHER USER PROFILE */}
      {/* ========================= */}

      {page === "user-profile" && (
        <UserProfile
          userId={viewingUserId}
          currentUserId={currentUser?.id}
          photoId={viewingPhotoId}
          onBack={() => {
            setViewingPhotoId(null);
            setPage("discover");
          }}
        />
      )}

      {/* ========================= */}
      {/* HOME */}
      {/* ========================= */}

      {page === "home" && (
        <div>

          <h1>Love Connect ❤️</h1>

          {currentUser && (
            <div>

              <h2>
                Welcome to Love Connect ❤️
              </h2>

              <button
                type="button"
                onClick={() => setPage("discover")}
              >
                Start Discovering 🔍
              </button>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default App;