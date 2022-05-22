import React, { useState } from "react";
import { render } from "react-dom";

import "./styles.css";

import WalletConnect from "@walletconnect/web3-provider";
import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// modified recommended setup
// rejects promise when WC wallet doesn't approve connection
const connectWC = () => {
  const wcProvider = new WalletConnect({
    infuraId: "8b4d9b4306294d2e92e0775ff1075066"
  });

  // wcProvider.wc.connected may be true if last connection state is in localStorage
  console.log("session", wcProvider.wc.session);

  return new Promise(async (resolve, reject) => {
    // uncomment to *fix*
    // await delay(1000);

    // // wcProvider.wc.connected would be false if the session was stale
    // console.log("session", wcProvider.wc.session);

    // connection refused in wallet
    wcProvider.wc.on("disconnect", () => {
      console.log("Disconnected");
      WalletConnectQRCodeModal.close();
      reject(new Error("Connection refused"));
    });

    // catch WC modal closure
    await wcProvider.enable().catch(reject);

    // if everything worked
    resolve(wcProvider);
  });
};

const WCConnector = ({ lable, connect }) => {
  const [clientV, setClientV] = useState(null);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);
  const setupWC = async () => {
    try {
      const provider = await connect();

      window.provider = provider;
      setProvider(provider);
      setError(null);

      provider.send(
        {
          method: "web3_clientVersion"
        },
        (e, result) => {
          if (e) setError(e);
          else {
            setClientV(result);
          }
        }
      );

      provider.once("stop", () => {
        setProvider(null);
        setClientV(null);
        setError(null);
      });

      // some web3 setup or whatever
    } catch (error) {
      console.log("Error connecting WC", error);
      setError(error);
    }
  };

  const teardownWC = () => {
    // triggers provider.on('stop') and provider.wc.on('disconnect')
    provider && provider.wc.connected && provider.close();
  };

  return (
    <div>
      <h3>{lable}</h3>
      {provider ? (
        <button onClick={teardownWC}>Disconnect WC</button>
      ) : (
        <button onClick={setupWC}>Connect WC</button>
      )}
      {provider && <p>Account: {provider.wc.accounts[0]}</p>}
      {clientV && <pre>{JSON.stringify(clientV)}</pre>}
      {error && <p>{error.message}</p>}
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
      <hr />
      <WCConnector
        lable="new WalletConnectProv w/ disconnect"
        connect={connectWC}
      />
    </div>
  );
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
