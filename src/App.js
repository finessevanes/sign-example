import { useEffect, useState, useCallback } from "react";
import { useWalletConnectClient } from "./context/ClientContext";

function App() {
  const [isSession, setIsSession] = useState(false);

  const {
    pairings,
    isInitializing,
    accounts,
    client,
    session,
    connect,
    disconnect,
  } = useWalletConnectClient();

  const onConnect = () => {
    console.log("on connect");
    connect();
  };

  return (
    <div>
      <h1>Sign V2</h1>
      { session ? <h1>You are connected </h1> :  <button onClick={onConnect}>Connect</button>}
    </div>
  );
}

export default App;
