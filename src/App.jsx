import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import './App.css'
import TokenLaunchpad from './component/tokenLaunchPad'
import CustomWalletButtons from './component/customButtons'
import { WalletMultiButton, WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";

function App() {

  return (
    <>
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
       
                  
              {/* <CustomWalletButtons /> */}
              <TokenLaunchpad/>

           </WalletModalProvider>
         </WalletProvider>
      </ConnectionProvider>

    </>
  )
}

export default App

