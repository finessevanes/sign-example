import {
  createContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useContext,
} from "react";
import SignClient from "@walletconnect/sign-client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import { getAppMetadata, getSdkError } from "@walletconnect/utils";

// context
export const ClientContext = createContext();

// provider

export function ClientContextProvider({ children }) {
  const [client, setClient] = useState();
  const [pairings, setPairings] = useState([]);
  const [session, setSession] = useState();

  //   const [isFetchingBalances, setIsFetchingBalances] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  //   const prevRelayerValue = useRef<string>("");
  const [accounts, setAccounts] = useState([]);
  //   const [solanaPublicKeys, setSolanaPublicKeys] =
  //     useState<Record<string, PublicKey>>();
  const [chains, setChains] = useState([]);
  //   const [relayerRegion, setRelayerRegion] = useState<string>(
  //     DEFAULT_RELAY_URL!
  //   );

  const reset = () => {
    setSession(undefined);
    setAccounts([]);
    setChains([]);
  };

  const onSessionConnected = useCallback(async (_session) => {
    const allNamespaceAccounts = Object.values(_session.namespaces)
      .map((namespace) => namespace.accounts)
      .flat();
    setSession(_session);
    setAccounts(allNamespaceAccounts);
  }, []);

  const connect = useCallback(
    async (pairing) => {
      if (typeof client === "undefined") {
        throw new Error("WalletConnect is not initialized");
      }
      console.log("connect, pairing topic is:", pairing?.topic);
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
            chains: ["eip155:5"],
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
        console.log("Established session:", session);
        await onSessionConnected(session);
        // Update known pairings after session is connected.
        setPairings(client.pairing.getAll({ active: true }));
      } catch (e) {
        console.error(e);
      } finally {
        QRCodeModal.close();
      }
    },
    [chains, client, onSessionConnected]
  );

  const disconnect = useCallback(async () => {
    if (typeof client === "undefined") {
      throw new Error("WalletConnect is not initialized");
    }
    if (typeof session === "undefined") {
      throw new Error("Session is not connected");
    }
    await client.disconnect({
      topic: session.topic,
      reason: getSdkError("USER_DISCONNECTED"),
    });
    // Reset app state after disconnect.
    reset();
  }, [client, session]);

  const _subscribeToEvents = useCallback(
    async (_client) => {
      if (typeof _client === "undefined") {
        throw new Error("WalletConnect is not initialized");
      }

      _client.on("session_ping", (args) => {
        console.log("EVENT", "session_ping", args);
      });

      _client.on("session_event", (args) => {
        console.log("EVENT", "session_event", args);
      });

      _client.on("session_update", ({ topic, params }) => {
        console.log("EVENT", "session_update", { topic, params });
        const { namespaces } = params;
        const _session = _client.session.get(topic);
        const updatedSession = { ..._session, namespaces };
        onSessionConnected(updatedSession);
      });

      _client.on("session_delete", () => {
        console.log("EVENT", "session_delete");
        reset();
      });
    },
    [onSessionConnected]
  );

  const createClient = useCallback(async () => {
    try {
      setIsInitializing(true);

      const _client = await SignClient.init({
        projectId: process.env.REACT_APP_PROJECT_ID,
        metadata: {
          name: "Example Dapp",
          description: "Example Dapp",
          url: "wwww.m3mento.xyz",
          icons: ["https://walletconnect.com/walletconnect-logo.png"],
        },
      });
      setClient(_client);
      await _subscribeToEvents(_client);
    } catch (err) {
      throw err;
    } finally {
      setIsInitializing(false);
    }
  }, [_subscribeToEvents]);

  useEffect(() => {
    if (!client) {
      createClient();
    }
  }, [client, createClient]);

  const value = useMemo(
    () => ({
      pairings,
      isInitializing,
      accounts,
      client,
      session,
      connect,
      disconnect
    }),
    [
      pairings,
      isInitializing,
      accounts,
      client,
      session,
      connect,
      disconnect
    ]
  );

  return (
    <ClientContext.Provider value={{ ...value }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useWalletConnectClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error(
      "useWalletConnectClient must be used within a ClientContextProvider"
    );
  }
  return context;
}
