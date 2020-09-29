import React, { useEffect, useState } from "react";
export default function Participants(props) {
  const { socket } = props;
  const [participants, setParticipants] = useState(null);

  useEffect(() => {
    if (socket) {
      socket.on("participants", function (data) {
        setParticipants(data);
        console.log(data);
      });

      socket.emit("participants", "get");
    }
  }, [socket]);

  return (
    <div>{participants && <div>Bidders Remaining: {participants}</div>}</div>
  );
  //
}
