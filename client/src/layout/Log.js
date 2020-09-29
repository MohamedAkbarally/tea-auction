import React, { useEffect, useState } from "react";
var arr = [];
export default function Log(props) {
  const { socket } = props;
  const [log, setLog] = useState(0);

  useEffect(() => {
    if (socket) {
      arr = [];
      socket.on("log", function (data) {
        if (data) {
          arr = arr.concat(data);
          setLog(arr.length);
        } else {
          arr = [];
        }
      });
    }
  }, [socket]);

  return (
    <div>
      <h4>Auction Log</h4>
      <div className="log">
        {arr.map((entry, index) => (
          <p key={index} style={{ marginBottom: 0, paddingRight: 10 }}>
            <strong>{entry.time} </strong>
            {entry.msg}
          </p>
        ))}
      </div>
    </div>
  );
}
