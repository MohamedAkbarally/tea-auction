import React, { useEffect, useState, createContext } from "react";
import socketIOClient from "socket.io-client";
import cx from "classnames";
import Log from "./Log";
import Participants from "./Participants";
import Timer from "./Timer";
import Bidders from "./Bidders";

const ENDPOINT = "https://tea-auction-demo.herokuapp.com";
//const ENDPOINT = "http://localhost:4001";

console.log("h");
const ENTER_KEY = 13;
var socket = null;

export const CounterContext = createContext();

export default function Auction(props) {
  const [bidding, isBidding] = useState(false);
  const [lot, setLot] = useState({ Status: null, "Lot Number": null });
  const [count, setCount] = useState([]);

  const _handleKeyDown = (event) => {
    switch (event.keyCode) {
      case ENTER_KEY:
        isBidding(true);
        break;
      default:
        break;
    }
  };

  const _handleKeyUp = (event) => {
    switch (event.keyCode) {
      case ENTER_KEY:
        isBidding(false);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    socket = socketIOClient(ENDPOINT, {
      query: { token: localStorage.jwtToken },
    });

    socket.on("error", function (msg) {
      console.log(msg);
      console.log("tellllloo");
      window.location.href = "/login";
      props.onLogout();
    });

    socket.on("lot", function (data) {
      setLot(data);
    });

    document.addEventListener("keydown", _handleKeyDown);
    document.addEventListener("keyup", _handleKeyUp);

    return () => {
      socket.disconnect();
      document.removeEventListener("keydown", _handleKeyDown);
      document.removeEventListener("keyup", _handleKeyUp);
    };
  }, [props.user]);

  useEffect(() => {
    if (lot["Status"] === "BIDDING_B") {
      if (bidding === false) socket.emit("bidding", false);
      //emit
    }

    if (lot["Status"] === "WAITING") {
      if (bidding === true) socket.emit("bidding", true);
      if (bidding === false) socket.emit("bidding", false);

      //emit
    }
  }, [bidding]);

  //loading content
  const LoadingPage = (
    <React.Fragment>
      <div className="vertical-center">
        <div className="lds-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </React.Fragment>
  );

  //when user is waiting for the lot to start
  const waitingPage = (
    <React.Fragment>
      <div className="vertical-center">
        <p>
          {lot["Lot Number"] && (
            <span>
              Waiting for Lot #{lot["Lot Number"]} to Start at Rs.{" "}
              {lot["Starting Price"]}
            </span>
          )}
        </p>

        <Timer socket={socket}></Timer>

        <p>Seconds</p>
        {bidding ? (
          <span> You are Bidding in this Lot</span>
        ) : (
          <React.Fragment>
            <div className="inline">
              <span>Press</span>
            </div>
            <div className="key">
              <span>Enter ⏎</span>
            </div>
            <div className="inline">
              <span> to Bid in Lot</span>
            </div>
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );

  //user not bidding
  const sitOutPage = (
    <React.Fragment>
      <div className="vertical-center">
        <h3 style={{ marginBottom: "0px", fontWeight: 700 }}>
          LOT #{lot["Lot Number"] && lot["Lot Number"]} IN PROGRESS
        </h3>
        You are not Participating in this Lot
      </div>
    </React.Fragment>
  );

  //when user has one
  const wonPage = (
    <React.Fragment>
      <div className="vertical-center">
        <h3 style={{ marginBottom: "0px", fontWeight: 700 }}>
          YOU WON LOT #{lot["Lot Number"] && lot["Lot Number"]} AT RS.{" "}
          {lot["Price"]}
        </h3>
        The next lot will start shortly
      </div>
    </React.Fragment>
  );

  //no user bought the lot
  const notSoldPage = (
    <React.Fragment>
      <div className="vertical-center">
        <h3 style={{ marginBottom: "0px", fontWeight: 700 }}>
          LOT #{lot["Lot Number"] && lot["Lot Number"]} NOT SOLD
        </h3>
        The next lot will start shortly
      </div>
    </React.Fragment>
  );

  //the auction is over
  const donePage = (
    <React.Fragment>
      <div className="vertical-center">
        <h3 style={{ marginBottom: "0px", fontWeight: 700 }}>
          AUCTION IS OVER
        </h3>
      </div>
    </React.Fragment>
  );

  // the user lost
  const lostPage = (
    <React.Fragment>
      <div className="vertical-center">
        <h3 style={{ marginBottom: "0px", fontWeight: 700 }}>
          YOU WITHDREW FROM LOT #{lot["Lot Number"] && lot["Lot Number"]}
        </h3>
        The next lot will start shortly
      </div>
    </React.Fragment>
  );

  // the user is bidding
  const biddingPage = (
    <React.Fragment>
      <div className="vertical-center">
        <p>
          {lot["Lot Number"] && <Participants socket={socket}></Participants>}
        </p>
        <Timer socket={socket}></Timer>
        <p>Rupees</p>

        <React.Fragment>
          <div className="inline">
            <span>Release</span>
          </div>
          <div className="key2">
            <span className="pressed">Enter ⏎</span>
          </div>
          <div className="inline">
            <span> to Withdraw from Lot</span>
          </div>
        </React.Fragment>
      </div>
    </React.Fragment>
  );

  var autionStatus;
  switch (lot["Status"]) {
    case "WAITING":
      autionStatus = waitingPage;
      break;
    case "SITOUT":
      autionStatus = sitOutPage;
      break;
    case "BIDDING_W":
      autionStatus = wonPage;
      break;
    case "BIDDING_L":
      autionStatus = lostPage;
      break;
    case "BIDDING_B":
      autionStatus = biddingPage;
      break;
    case "NOTSOLD":
      autionStatus = notSoldPage;
      break;
    case "DONE":
      autionStatus = donePage;
      break;
    default:
      autionStatus = LoadingPage;
  }

  return (
    <CounterContext.Provider value={[count, setCount]}>
      <div>
        <div
          className="container"
          style={{ marginTop: "20px", marginBottom: "-40px" }}
        >
          <div className="row" style={{ marginBottom: "-40px" }}>
            <div className="eight columns">
              {" "}
              <h3>Welcome, {props.user["name"]}</h3>
            </div>
            <div className="four columns">
              {" "}
              <button
                onClick={props.onLogout}
                className="button-primary u-pull-right"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
        <hr style={{ width: "100vw", left: 0 }} />
        <div
          className="container"
          style={{
            marginTop: "30px",
            minHeight: "100%",
          }}
        >
          <div className="row">
            <div className="eight columns">
              <div
                className={cx("main", {
                  active:
                    (bidding && lot["Status"] === "WAITING") ||
                    lot["Status"] === "BIDDING_B" ||
                    lot["Status"] === "BIDDING_W",
                  failed: lot["Status"] === "BIDDING_L",
                })}
              >
                {autionStatus}
              </div>
            </div>
            <div className="four columns">
              <Log socket={socket}></Log>
            </div>
          </div>
          <Bidders socket={socket} name={props.user["name"]}></Bidders>
        </div>
      </div>
    </CounterContext.Provider>
  );
}
