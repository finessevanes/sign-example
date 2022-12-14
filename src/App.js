import { useState } from "react";
import { useWalletConnectClient } from "./context/ClientContext";

function App() {
  const [txnURL, setTxnURL] = useState();
  const { accounts, client, session, connect, disconnect } =
    useWalletConnectClient();

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

  async function onSendTransaction() {
    try {
      if (client) {
        const account = accounts[0];
        if (account === undefined) throw new Error(`Account not found`);

        // Goerli Account 1 from WalletConnect wallet
        // 0xEc57410F1F15df337b54c66BD98F1702B407cB22
        const tx = {
          from: "0xEc57410F1F15df337b54c66BD98F1702B407cB22",
          to: "0xEc57410F1F15df337b54c66BD98F1702B407cB22",
          data: "0x",
          gasPrice: "0x029104e28c",
          gasLimit: "0x5208",
          value: "0x00",
        };

        const result = await client.request({
          topic: session.topic,
          chainId: "eip155:5",
          request: {
            method: "eth_sendTransaction",
            params: [tx],
          },
        });

        setTxnURL(result);

        return {
          method: "eth_sendTransaction",
          address: "0xEc57410F1F15df337b54c66BD98F1702B407cB22",
          valid: true,
          result,
        };
      }
    } catch (e) {
      console.log(e);
    }
  }

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
          <button onClick={onSendTransaction}>eth_sendTransaction</button>
          <button onClick={onDisconnect}>Disconnect</button>
          {txnURL && (
            <h2>
              Check it out{" "}
              <a
                href={`https://goerli.etherscan.io/tx/${txnURL}`}
                target="_blank"
                rel="noreferrer"
              >
                here
              </a>
            </h2>
          )}
          <h2></h2>
        </>
      )}
    </div>
  );
}

export default App;
