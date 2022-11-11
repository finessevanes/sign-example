import SignClient from "@walletconnect/sign-client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import { useEffect, useState, useCallback } from "react";

function App() {
  const [client, setClient] = useState();
  const [pairing, setPairing] = useState();

  const creatSignClient = useCallback(async () => {
    try {
      const signClient = await SignClient.init({
        projectId: "9338b83ff89083cd0ee7da8cea475c23",
        metadata: {
          name: "Example Dapp",
          description: "Example Dapp",
          url: "#",
          icons: ["https://walletconnect.com/walletconnect-logo.png"],
        },
      });
      console.log('signClient', signClient)
      setClient(signClient)
    } catch (e) {
      console.error(e);
    }
  })

  useEffect(() => {
    console.log('does client exist: ', client)
    if(!client){
      creatSignClient()
    }
  }, [client])



  const handleConnect = useCallback(async () => {
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

      const { uri, approval } = await client.connect({
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
      console.log('error:')
      console.error(e);
      // ignore rejection
    } finally {
      // close modal in case it was open
      QRCodeModal.close();
    }
  }, [client]);

  return (
    <div>
      <h1>Welcome</h1>
      <button onClick={handleConnect}>Connect</button>
    </div>
  );
}

export default App;