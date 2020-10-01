const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
var path = require("path");
const multer = require("multer");
var cors = require("cors");
const csv = require("csv-parser");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const axios = require("axios");

const port = process.env.PORT || 4001;
const index = require("./routes/index");

//Server Properties
var csvpath = "auction.csv";
var SPEED = 1;
var START_TIME = 10;
var FINISH_TIME = 5;

var currentLot = 9999;
var results = [];
let interval;
var time = START_TIME;
var bidders = 0;
var bidders_names = {};
var is_participating = {};

// interval helper functions
const biddingInterval = () => {
  clearInterval(interval);
  interval = setInterval(() => auctionInterval(), parseInt(1000 / SPEED));
};

const resetInterval = () => {
  clearInterval(interval);
  interval = setInterval(() => auctionInterval(), parseInt(1000));
};

//function to get google doc csv of lots
const getCSV = () => {
  axios
    .get(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ71ZksMZxUcxEqDk6Ure-DpgjQ5vKfrgouSGCZMrEx1zYpeLq9BDCtfWzZYXcA3eXLNpkf5HqsXifZ/pub?output=csv"
    )
    .then((response) => {
      results = [];
      var arr = response.data.split("\r");
      var headers = arr[0].split(",");
      var headers = arr[0].split(",");
      if (arr.length > 1) {
        for (var i = 1; i < arr.length; i++) {
          var data = arr[i].split(",");
          var obj = {};
          for (var j = 0; j < data.length; j++) {
            obj[headers[j].trim()] = data[j].trim();
          }
          results.push(obj);
        }
        // start auction
        io.emit("lot", results[currentLot]);
        interval = setInterval(() => auctionInterval(), 1000);
      }
    })
    .catch(function (error) {
      results = [];
      console.log("error");
      fs.createReadStream("auction.csv")
        .pipe(csv())
        .on("data", (data) => {
          results.push(data);
        })
        .on("end", () => {
          // start auction
          io.emit("lot", results[currentLot]);
          interval = setInterval(() => auctionInterval(), 1000);
        });
    });
};

const app = express();
app.use(cors());

//socket io middleware
const server = http.createServer(app);
const io = socketIo(server);

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//multer middleware
var storage = multer.diskStorage({
  destination: function (request, file, callback) {
    callback(null, "./uploads/");
  },
  filename: function (request, file, callback) {
    console.log(file);
    callback(null, "auction.csv");
  },
});

var upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    console.log(file.mimetype);
    file.mimetype === "text/csv" || file.mimetype === "application/vnd.ms-excel"
      ? cb(null, true)
      : cb(null, false);
  },
});

// database config
const db = require("./config/keys").mongoURI;

// mongoose middleware
mongoose
  .connect(db)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// passport middleware
app.use(passport.initialize());

// passport config
require("./config/passport")(passport);
app.use("/css", express.static(path.join(__dirname, "routes/public/css")));

// server properties endpoint page
app.use(express.static(path.join(__dirname, "client/build")));

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

app.use(index);

const changeBidders = (clients) => {
  var i;
  Object.keys(is_participating).forEach(function (key, value) {
    return (is_participating[key] = false);
  });

  for (i = 0; i < clients.length; i++) {
    is_participating[bidders_names[clients[i]]] = true;
  }

  console.log("change", JSON.stringify(is_participating));
  io.emit("bidder", is_participating);
};

// POST to change server properties (public not secured)
app.post("/startserver", function (req, res) {
  // clear user log and interval
  clearInterval(interval);
  io.emit("log", null);

  // clear properties
  currentLot = 0;
  results = [];

  // set properties to data
  SPEED = parseFloat(req.body.speed);
  FINISH_TIME = 5;
  START_TIME = parseInt(req.body.time);
  time = START_TIME;

  // read auction csv
  getCSV();
});

io.use(function (socket, next) {
  // socket authentication
  if (socket.handshake.query && socket.handshake.query.token) {
    jwt.verify(socket.handshake.query.token, "secret", function (err, decoded) {
      //throw error if authentication fails
      if (err) {
        next(new Error("Authentication error"));
        return;
      }
      socket.decoded = decoded;

      //throw error if the user is logged in another account
      if (Object.values(bidders_names).indexOf(decoded.name) > -1) {
        next(new Error("Multiple Users"));
        return;
      }

      // record bidders name
      bidders_names[socket.id] = decoded.name;
      console.log(decoded.name + " has joined");
      next();
    });
  } else {
    next(new Error("Authentication error"));
  }
}).on("connection", function (socket) {
  // connection now authenticated to receive further events
  console.log("Autheticated:", bidders_names[socket.id]);
  socket.emit("log", null);
  is_participating[bidders_names[socket.id]] = false;
  io.emit("bidder", is_participating);

  //on connection message
  if (currentLot >= results.length) {
    //if the auction is done
    socket.emit("lot", { Status: "DONE", "Lot Number": 0 });
  } else {
    //if lot is waiting to start
    if (results[currentLot]["Status"] == "WAITING") {
      socket.emit("lot", results[currentLot]);
    }

    //if bidding is in progress the user has to sitout
    if (results[currentLot]["Status"] == "BIDDING") {
      const bidding_obj = Object.assign({}, results[currentLot], {
        Status: "SITOUT",
      });
      socket.emit("lot", bidding_obj);
    }
  }

  //join other's room
  socket.join("others");

  //when user requests the number of participants
  socket.on("bidder", (msg) => {
    io.in("bidders").clients((error, clients) => {
      var i;
      Object.keys(is_participating).forEach(function (key, value) {
        return (is_participating[key] = false);
      });

      for (i = 0; i < clients.length; i++) {
        is_participating[bidders_names[clients[i]]] = true;
      }

      console.log("request", JSON.stringify(is_participating));
      socket.emit("bidder", is_participating);
    });
  });

  //changing bid status (enter or released enter)
  socket.on("bidding", (msg) => {
    if (msg) {
      //user joins the bidding when the auction is waiting
      if (results[currentLot]["Status"] == "WAITING") {
        socket.leave("others");
        socket.join("bidders");
        io.in("bidders").clients((error, clients) => {
          //check who are the bidders
          changeBidders(clients);
        });
      }
    } else {
      //user leaves the bidding
      socket.join("others");
      socket.leave("bidders");

      io.in("bidders").clients((error, clients) => {
        changeBidders(clients);

        //if bidding is in progress
        if (results[currentLot]["Status"] == "BIDDING") {
          //check how many bidders remain
          //check who are the bidders

          bidders = clients.length;

          //inform change in participants
          io.to("bidders").emit("participants", bidders);

          // if one user remains
          if (bidders == 1) {
            // record the price
            results[currentLot]["Price"] = time;

            // notify winning user
            const bidding_obj = Object.assign({}, results[currentLot], {
              Status: "BIDDING_W",
            });
            io.to("bidders").emit("lot", bidding_obj);

            //conclude the lot
            results[currentLot]["Status"] = "FINISHED";
            time = FINISH_TIME;
            resetInterval();
          }

          //send withdrawer losing page
          const bidding_obj = Object.assign({}, results[currentLot], {
            Status: "BIDDING_L",
          });
          socket.emit("lot", bidding_obj);
        }
      });
    }

    socket.emit("rbidding", msg);
  });

  socket.on("disconnect", function () {
    //remove bidder
    bidders--;
    delete is_participating[bidders_names[socket.id]];
    delete bidders_names[socket.id];
    Object.keys(is_participating).forEach(
      (key) =>
        is_participating[key] === undefined && delete is_participating[key]
    );
    Object.keys(bidders_names).forEach(
      (key) => bidders_names[key] === undefined && delete bidders_names[key]
    );

    socket.leave("bidders");
    socket.leave("others");
    console.log("change", JSON.stringify(is_participating));

    io.emit("bidder", is_participating);
  });
});

const auctionInterval = () => {
  //count the number of bidders
  io.in("bidders").clients((error, clients) => {
    bidders = clients.length;

    // waiting for Lot to start
    if (results[currentLot]["Status"] == "WAITING") {
      io.emit("auction", time);
      time = time - 1;

      // waiting is time over
      if (time < 0) {
        //no bidders
        if (bidders == 0) {
          results[currentLot]["Status"] = "NOTSOLD";
          io.to("others").emit("lot", results[currentLot]);
          console.log("lot not sold");
          time = FINISH_TIME;
          return;
        }

        //show sitout age to people not bidding
        const others_obj = Object.assign({}, results[currentLot], {
          Status: "SITOUT",
        });

        io.to("others").emit("lot", others_obj);

        //only one person bidding
        if (bidders == 1) {
          //show winning page
          results[currentLot]["Price"] = results[currentLot]["Starting Price"];

          const bidding_obj = Object.assign({}, results[currentLot], {
            Status: "BIDDING_W",
          });

          io.to("bidders").emit("lot", bidding_obj);

          //conclude the lot
          results[currentLot]["Status"] = "FINISHED";
          time = FINISH_TIME;
        } else {
          //multiple people bidding
          results[currentLot]["Status"] = "BIDDING";

          //set price
          time = parseInt(results[currentLot]["Starting Price"]);

          //show bidding screen to bidders
          const bidding_obj = Object.assign({}, results[currentLot], {
            Status: "BIDDING_B",
          });
          io.to("bidders").emit("lot", bidding_obj);

          //change interval timing to bidding speed
          biddingInterval();
        }
      }
    }

    //Bidding in Progress
    if (results[currentLot]["Status"] == "BIDDING") {
      //increment price
      time = time + 10;
      io.to("bidders").emit("auction", time);
    }

    //Bidding finished
    if (
      results[currentLot]["Status"] == "FINISHED" ||
      results[currentLot]["Status"] == "NOTSOLD"
    ) {
      time = time - 1;

      // 5 second wait
      if (time == 0) {
        var stdtime = new Date().toLocaleTimeString();

        //Lot sold
        if (results[currentLot]["Status"] == "FINISHED") {
          io.in("bidders").clients((error, clients) => {
            // set bidders to false

            if (error) throw error;

            //put winner back into other room
            if (clients.length > 1) {
              console.log("more the one winner");
              if (error) throw error;
            }
            is_participating[bidders_names[clients[0]]] = false;
            console.log("change", JSON.stringify(is_participating));

            io.emit("bidder", is_participating);

            io.sockets.connected[clients[0]].leave("bidders");
            io.sockets.connected[clients[0]].join("others");
            bidders--;

            //increment lot
            currentLot++;
            time = START_TIME;

            //send log update to all users
            io.emit("log", {
              msg:
                bidders_names[clients[0]] +
                " bought Lot #" +
                currentLot +
                " at Rs. " +
                results[currentLot - 1]["Price"],
              time: stdtime,
            });

            //if there are no more lots conclude auction
            if (currentLot >= results.length) {
              clearInterval(interval);
              io.emit("lot", { Status: "DONE", "Lot Number": 0 });
              return;
            }

            // send users new lot
            io.to("others").emit("lot", results[currentLot]);
          });

          // lot not sold
        } else {
          currentLot++;
          time = START_TIME;

          // send log to all users
          io.emit("log", {
            msg: "Lot #" + currentLot + " was not sold",
            time: stdtime,
          });

          //if there are no more lots conclude auction
          if (currentLot >= results.length) {
            clearInterval(interval);
            io.emit("lot", { Status: "DONE", "Lot Number": 0 });
            return;
          }

          io.to("others").emit("lot", results[currentLot]);
        }
      }
    }
  });
};

server.listen(port, () => console.log(`Listening on port ${port}`));
