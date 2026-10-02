import { useState } from "react";
import API_BASE_URL from "./api";

function Login({ onLogin, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email,
            password: password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Login successful ❤️");

      // Save JWT token
      localStorage.setItem(
        "access_token",
        data.access_token
      );

      // Send the logged-in user to App.jsx
      if (onLogin) {
        onLogin(data.user);
      }

    } catch (error) {
      console.error(error);
      alert("Could not connect to the server.");
    }
  };

  return (
    <div className="login-page">

      <div className="login-box">

        <h1>Welcome Back ❤️</h1>

        <p>
          Log in to continue your Love Connect journey.
        </p>

        <form onSubmit={handleSubmit}>

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />

          <button type="submit">
            Log In ❤️
          </button>

        </form>

        <p className="signup-text">
          Don't have an account?

          <button
            type="button"
            onClick={onSignup}
          >
            Sign Up
          </button>

        </p>

      </div>

    </div>
  );
}

export default Login;