# About
A auction demo to test the efficacy of variation of a dutch style auction. The auction is such that prices rise at a fixed interval and the last bidder to leave wins the respective lot.

# Program
the client side is built using react. the users authetication and information is stored on mongodb. The auction schedule (the information about each lot) is stored on a google sheet (however this could also be migrated to the mongodb database in the future. The bidding is done over sockets using socket-io on an express server.

# Usage
to run the server
```
node app.js
```

build the client and run the server
```
node run dev
```
