import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "../api";
import { getErrorMessage } from "../lib/getErrorMessage";
import { setAuthToken, setRefreshToken } from "../lib/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await loginRequest({ email, password });
      setAuthToken(result.token);
      if (result.refreshToken) {
        setRefreshToken(result.refreshToken);
      }
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-copy">
          <p className="page-eyebrow">Recruiter OS</p>
          <h1>Admin Login</h1>
          <p>Access import workflows, record review, and canonical data management.</p>
        </div>

        <label className="field">
          <span>Email</span>
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
