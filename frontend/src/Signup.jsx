import API_BASE_URL from "./api";
function Signup({ goToProfile }) {
  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = event.target;

    const fullName = form.fullName.value;
    const email = form.email.value;
    const password = form.password.value;

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: fullName,
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Account created successfully ❤️");

      // Send the newly created user to App.jsx
      goToProfile(data.user);

    } catch (error) {
      console.error(error);
      alert("Could not connect to the server.");
    }
  };

  return (
    <div className="signup-page">

      <div className="signup-box">

        <h1>Join Love Connect ❤️</h1>

        <p>Create your account and start meeting new people.</p>

        <form onSubmit={handleSubmit}>

          <label>Full Name</label>
          <input
            type="text"
            name="fullName"
            placeholder="Enter your name"
            required
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Create a password"
            required
          />

          <label>Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            required
          />

          <label>Gender</label>

          <select name="gender" required>
            <option value="">Select your gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <button type="submit">
            Create Account ❤️
          </button>

        </form>

        <p className="login-text">
          Already have an account?

          <button type="button">
            Log In
          </button>
        </p>

      </div>

    </div>
  );
}

export default Signup;

