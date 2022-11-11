import SignClient from "@walletconnect/sign-client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import React, { createContext, useState, useCallback } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// context
export const ClientContext = createContext();

// provider
export function ClientContextProvider({ children }) {
  const [client, setClient] = useState();
  const [pairings, setPairings] = useState();
  const [session, setSession] = useState();
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [balances, setBalances] = useState();
  const [accounts, setAccounts] = useState();
  const [chains, setChains] = useState();
  const [data, setData] = useState();

  async function creatSignClient() {
    try {
      const signClient = await SignClient.init({
        projectId: "",
        metadata: {
          name: "Example Dapp",
          description: "Example Dapp",
          url: "#",
          icons: ["https://walletconnect.com/walletconnect-logo.png"],
        },
      });
      setData(signClient);
    } catch (e) {
      console.log(e);
    }
  }

  creatSignClient();

  const connect = useCallback(async (pairing) => {
    try {
      const requiredNamespaces = {
        eip155: {
          methods: [
            "eth_sendTransaction",
            "eth_signTransaction",
            "eth_sign",
            "personal_sign",
            "eth_signTypedData",
          ],
          chains: ["eip155:1"],
          events: ["chainChanged", "accountsChanged"],
        },
      };

      const { uri, approval } = await data.connect({
        pairingTopic: pairing?.topic,
        requiredNamespaces,
      });

      // Open QRCode modal if a URI was returned (i.e. we're not connecting an existing pairing).
      if (uri) {
        QRCodeModal.open(uri, () => {
          console.log("EVENT", "QR Code Modal closed");
        });
      }

      const session = await approval();
    } catch (e) {
      console.error(e);
      // ignore rejection
    } finally {
      // close modal in case it was open
      QRCodeModal.close();
    }
  });


}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
);
