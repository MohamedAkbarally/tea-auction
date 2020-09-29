import React, { useState } from "react";
const axios = require("axios");

export default function Server() {
  const [time, setTime] = useState(10);
  const [speed, setSpeed] = useState(1);

  const onSubmit = (e) => {
    e.preventDefault();

    const userData = {
      time: time,
      speed: speed,
    };

    axios.post(`/startserver`, userData).then((res) => {
      alert("done");
    });
  };
  return (
    <div
      className="container"
      style={{
        marginTop: "100px",
        padding: "30px",
        backgroundColor: "#fff",
        borderStyle: "solid",
        borderColor: "#eee",
      }}
    >
      <h2>Server</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="time">Starting Time:</label>
        <input
          type="number"
          id="fname"
          name="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <br />
        <label htmlFor="speed">Speed:</label>
        <input
          type="number"
          id="lname"
          name="speed"
          value={speed}
          onChange={(e) => setSpeed(e.target.value)}
        />
        <br />
        <label htmlFor="speed">Edit Lots:</label>
        <a
          href="https://docs.google.com/spreadsheets/d/193Zi154TVgeRiP6PWJM22AUhOGsBNEp0WS0pcSpgb4M/edit?usp=sharing"
          target="_blank"
        >
          Open Spread Sheet
        </a>
        <br />
        <br />
        <button type="submit">Start Server</button>
      </form>
    </div>
  );
}
