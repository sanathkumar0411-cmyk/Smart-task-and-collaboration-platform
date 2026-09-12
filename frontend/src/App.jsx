import { useState } from "react";
import "./App.css";

function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("Saving...");

    try {
      const response = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("✅ Data saved to MongoDB!");

        setName("");
        setEmail("");
      } else {
        setMessage("❌ Failed to save data.");
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Cannot connect to the backend.");
    }
  };

  return (
    <div className="container">
      <h1>STACP</h1>

      <h2>Save User</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button type="submit">
          Save to MongoDB
        </button>
      </form>

      <p>{message}</p>
    </div>
  );
}

export default App;
