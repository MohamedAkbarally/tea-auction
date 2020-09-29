import React from "react";
import Logo from "../img/logo-grey.png";
export default function Footer() {
  return (
    <div className="footer">
      <img alt="logo" src={Logo} height="30" className="logo"></img>
      <h5 className="footertext">TEA AUCTION DEMO V1</h5>
    </div>
  );
}
