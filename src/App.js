import { useEffect, useState, useCallback } from "react";
import { useWalletConnectClient } from "./context/ClientContext";

function App() {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

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
    try {
      if (client) {
        connect();
      }
    } catch (e) {
      console.log(e);
    }
  };

  const onDisconnect = () => {
    disconnect();
  };

  return (
    <div className="app">
      <h1>Sign V2</h1>
      {!accounts.length ? (
        <button onClick={onConnect} disabled={!client}>
          Connect
        </button>
      ) : (
        <>
          <h2>{`${accounts[0].slice(9).slice(0, 5)} ... ${accounts[0]
            .slice(9)
            .slice(37)}`}</h2>
          <button>eth_sendTransaction</button>
          <button onClick={onDisconnect}>Disconnect</button>
        </>
      )}
    </div>
  );
}

export default App;
