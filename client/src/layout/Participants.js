import React, { useContext } from "react";
import { CounterContext } from "./Auction";

const getCount = (arrToConvert) => {
  var newArr = 0;
  for (var i = 0; i < arrToConvert.length; i++) {
    if (arrToConvert[i][1] == true) {
      newArr++;
    }
  }
  return newArr;
};
export default function Participants(props) {
  const [count] = useContext(CounterContext);
  return (
    <div>
      <div>Bidders Remaining: {getCount(count)}</div>
    </div>
  );
  //
}
