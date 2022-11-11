import { useEffect } from "react";
import { SignClient } from "@walletconnect/sign-client";

function App({ buttonClick }) {
  const handleConnect = () => {
    console.log("beep boop");
  };

  return (
    <div>
      <h1>Welcome</h1>
      <button onClick={buttonClick}>Connect</button>
    </div>
  );
}

export default App;
