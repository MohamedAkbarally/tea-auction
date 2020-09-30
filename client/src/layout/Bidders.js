import React, { useEffect, useState, useContext } from "react";
import { CounterContext } from "./Auction";

export default function Participants(props) {
  const { socket } = props;
  const [count, setCount] = useContext(CounterContext);

  useEffect(() => {
    if (socket) {
      socket.on("bidder", function (data) {
        setCount(Object.entries(data));
      });
      socket.emit("bidder");
    }
  }, [socket]);

  return (
    <div>
      <div className="row" style={{ marginTop: 20 }}>
        <h6>{count.length > 1 && <span>Bidding:</span>}</h6>
      </div>
      <div className="row" style={{ marginTop: -5 }}>
        {count.map(function (item, i) {
          if (item[0] == props.name) {
            return;
          }
          var h;
          var s;

          if (item[1]) {
            h = "#33C3F0";
          } else {
            s = "#ededed";
          }
          return (
            <div
              className="circle tooltip"
              style={{
                backgroundColor: h,
              }}
              key={i}
            >
              <span className="initials">
                {item[0].substring(0, 2).toUpperCase()}
              </span>
              <span className="tooltiptext">{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
  //
}
