import React, { useState } from "react";
import { Link } from "react-router-dom";

const axios = require("axios");

export default function Login(props) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState(null);

  const onSubmit = (e) => {
    e.preventDefault();
    console.log(name);

    const userData = {
      name: name,
      password: password,
    };

    axios
      .post(`/login`, userData)
      .then((res) => {
        localStorage.setItem("jwtToken", res.data.token);
        window.location.href = "/auction";
      })
      .catch((error) => {
        if (error.response) {
          setErrors(error.response.data); // => the response payload
        }
      });
  };

  return (
    <div className="container">
      <form onSubmit={onSubmit} style={{ marginTop: "100px" }}>
        <h1>Login</h1>

        <div className="row">
          <div className="u-full-width">
            <label htmlFor="exampleEmailInput">Your Name</label>
            <input
              className="u-full-width"
              placeholder="Mohamed Akbarally"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              id="name"
            />
            {errors && errors.name && (
              <p style={{ color: "Red" }}>{errors.name}</p>
            )}
          </div>
        </div>
        <div className="row">
          <div className="u-full-width">
            <label htmlFor="exampleEmailInput">Your Password</label>
            <input
              className="u-full-width"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              id="password"
            />
            {errors && errors.password && (
              <p style={{ color: "Red" }}>{errors.password}</p>
            )}
          </div>
        </div>

        <input className="button-primary" type="submit" defaultValue="Submit" />
      </form>
      <div style={{ textAlign: "center" }}>
        <Link to="/register">Register?</Link>
      </div>
    </div>
  );
}
