import React, { useState } from "react";
import Login from "./layout/Login";
import Auction from "./layout/Auction";
import Register from "./layout/Register";
import Footer from "./layout/Footer";
import Server from "./layout/Server";

import "./App.css";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import PrivateRoute from "./common/PrivateRoute";
import jwt_decode from "jwt-decode";
import axios from "axios";

//on dev
axios.defaults.baseURL = "http://localhost:4001";

const invalid_token = () => {
  authenticated_initial = false;
  user_intial = null;
  localStorage.removeItem("jwtToken");
  window.location.href = "/login";
};

if (localStorage.jwtToken) {
  try {
    const decoded = jwt_decode(localStorage.jwtToken);
    var authenticated_initial = true;
    var user_intial = decoded;
    const currentTime = Date.now() / 1000;

    if (decoded.exp < currentTime) {
      invalid_token();
    }
  } catch (error) {
    invalid_token();
  }
}

function App() {
  const [user, setUser] = useState(user_intial);
  const [authenticated, setIsAuthenticated] = useState(authenticated_initial);

  const onLogout = () => {
    setUser(null);
    setIsAuthenticated(null);
    localStorage.removeItem("jwtToken");
    window.location.href = "/login";
  };
  return (
    <Router>
      <div className="App">
        <Switch>
          <PrivateRoute
            exact
            path="/auction"
            isAuthenticated={authenticated}
            component={() => <Auction user={user} onLogout={onLogout} />}
          />
          <Route exact path="/login" component={Login} />
          <Route exact path="/" component={Login} />
          <Route exact path="/register" component={Register} />
          <Route exact path="/server" component={Server} />
        </Switch>
        <Footer></Footer>
      </div>
    </Router>
  );
}

export default App;
