import {
  createContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useContext,
} from "react";
import SignClient from "@walletconnect/sign-client";
import { getSdkError } from "@walletconnect/utils";
import { ConfigCtrl as ModalConfigCtrl, ModalCtrl } from "@web3modal/core";
import "@web3modal/ui";

// context
export const ClientContext = createContext();

ModalConfigCtrl.setConfig({
  projectId: process.env.REACT_APP_PROJECT_ID,
  theme: "light",
});

// provider
export function ClientContextProvider({ children }) {
  const [client, setClient] = useState();
  const [pairings, setPairings] = useState([]);
  const [session, setSession] = useState();
  const [accounts, setAccounts] = useState([]);

  const reset = () => {
    setSession(undefined);
    setAccounts([]);
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

        if (uri) {
          ModalCtrl.open({uri, standaloneChains: ["eip155:5"]})
        }

        const session = await approval();
        await onSessionConnected(session);
        setPairings(client.pairing.getAll({ active: true }));
      } catch (e) {
        console.error(e);
      } finally {
        ModalCtrl.close();
      }
    },
    [client, onSessionConnected]
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
      const _client = await SignClient.init({
        projectId: process.env.REACT_APP_PROJECT_ID,
        metadata: {
          name: "Example Dapp",
          description: "Example Dapp",
          url: "wwww.finessevanes.xyz",
          icons: ["https://walletconnect.com/walletconnect-logo.png"],
        },
      });
      setClient(_client);
      await _subscribeToEvents(_client);
    } catch (err) {
      throw err;
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
      accounts,
      client,
      session,
      connect,
      disconnect,
    }),
    [pairings, accounts, client, session, connect, disconnect]
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
