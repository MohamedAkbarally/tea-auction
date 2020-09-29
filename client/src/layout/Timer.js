import React, { useEffect, useState } from "react";
export default function Timer(props) {
  const { socket } = props;
  const [time, setTime] = useState(null);

  useEffect(() => {
    if (socket) {
      socket.on("auction", function (data) {
        setTime(data);
      });
    }
  }, [socket]);

  return (
    time && (
      <h1 style={{ marginBottom: "-5px" }} className="timer">
        {time}
      </h1>
    )
  );

  //
}
