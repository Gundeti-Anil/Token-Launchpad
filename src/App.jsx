// import { generateMnemonic } from "bip39";
import { useState } from 'react';
// import {SolanaWallet}from './component/Solanawallet'
// import {EthWallet}from './component/Ethwallet'
import './App.css'
import Web3Wallet from './component/webWallet'
function App() {
  const [mnemonic, setMnemonic] = useState("");

  return (
    <>
    
      {/* <button onClick={async function() {
        const mn = await generateMnemonic();
        setMnemonic(mn)
       }}>
        Create Seed Phrase
      </button>
      <br />
      <input type="text" value={mnemonic}></input>
      <br />
      <SolanaWallet mnemonic= {mnemonic}></SolanaWallet>
      <EthWallet mnemonic= {mnemonic}></EthWallet> */}
      <Web3Wallet/>


    </>
  )
}

export default App
