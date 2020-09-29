import React from "react";
import { Route, Redirect } from "react-router-dom";

const PrivateRoute = ({
  component: Component,
  handleLogout,
  isAuthenticated,
  ...rest
}) => (
  <Route
    {...rest}
    render={(props) =>
      isAuthenticated === true ? (
        <Component {...props} handleLogout={handleLogout} />
      ) : (
        <Redirect to="/login" />
      )
    }
  />
);
export default PrivateRoute;
