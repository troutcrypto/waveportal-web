import React, { useEffect, useState } from "react";
import './App.css';
import { ethers } from "ethers";
import abi from './utils/WavePortal.json';

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const contractABI = abi.abi;
  const contractAddress = "0x2d3957BF09ED642e67D9EDe4ED8B421b94612DBb";
  const getAllWaves = async () => {
    try {
      console.log("Calling get all waves")
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();
        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          };

        });

        setAllWaves(wavesCleaned);
      }  else {
        console.log("Eth Wallet doesnt exist!");
      }
    } catch (error) {
      console.log("Error in get all waves:", error);
    }
  };

  useEffect(() => {
    let wavePortalContract;
    const onNewWave = (from, timestamp, message) => {
      console.log('NewWave being handled on js end: onNewWave', from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message
        },
      ]); 
    };

    // if metamask wallet: add listener for NewWave function
    // on new wave -> update the all aves dict
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      } 
    };
  }, []);

  const wave = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        // create the contract: need signer, provider, abi
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total waves:", count.toNumber());

        // do the wave
        const waveTxn = await wavePortalContract.wave("hello2", {gasLimit: 300000});
        console.log("Mining ... ", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves(); 
        console.log("New total waves:", count.toNumber());
      } else {
        console.log("No Eth wallet");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("No Eth wallet detected!");
      } else {
        console.log("Found eth wallet!");

        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:", account);

          let waves = await getAllWaves();
          setCurrentAccount(account);
        } else {
          console.log("No authorized accounts found");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // we've created a function to connect wallet on click
  const connectWalletAction = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get metamask if you want to wave!");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" }); 
      console.log("Connected: ", accounts[0]); 
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    } 
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        ☕ Hey there!
        </div>

        <div className="bio">
        Connect your Ethereum wallet and wave at me!
        </div>

        <button className="waveButton" onClick={wave}>
          Send a wave
        </button>


        {!currentAccount && (
          <button className="waveButton" onClick={connectWalletAction}>
          Connect wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}
