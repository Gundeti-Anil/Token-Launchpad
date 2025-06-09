import React, { useState, useEffect } from 'react';
import { Copy, Eye, EyeOff, RefreshCw, Key, Shield, CheckCircle } from 'lucide-react';
import { mnemonicToSeed } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl"
import { HDNodeWallet, Wallet } from "ethers";

const GenerateAccounts = ({seedPhrase, copied, setCopied}) => {
  

  const [accounts, setAccounts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const generateAccount = async (network) => {

    if (network === "solana") {
      const seed = mnemonicToSeed(seedPhrase);
      const path = `m/44'/501'/${currentIndex}'/0'`;
      const derivedSeed = derivePath(path, seed.toString("hex")).key;
      const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
      const keypair = Keypair.fromSecretKey(secret);
      setCurrentIndex(currentIndex + 1);

      const newAccount = {
        id: Date.now(),
        network,
        publicKey: keypair.publicKey.toBase58(),
        name: `${network.charAt(0).toUpperCase() + network.slice(1)} Account ${accounts.filter(acc => acc.network === network).length + 1}`
      };
      setAccounts(prev => [...prev, newAccount]);
    }
    else if (network === "ethereum") {
        const seed = await mnemonicToSeed(seedPhrase);
        const derivationPath = `m/44'/60'/${currentIndex}'/0'`;
        const hdNode = HDNodeWallet.fromSeed(seed);
        const child = hdNode.derivePath(derivationPath);
        const privateKey = child.privateKey;
        const wallet = new Wallet(privateKey);
        setCurrentIndex(currentIndex + 1);
        const newAccount = {
            id: Date.now(),
            network,
            publicKey: wallet.address,
            name: `${network.charAt(0).toUpperCase() + network.slice(1)} Account ${accounts.filter(acc => acc.network === network).length + 1}`
          };
        setAccounts([...accounts, newAccount]);
    }
    
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };


  return (
    
      
        
        

    <div>
        {/* Account Generation */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-4 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <Key className="text-green-400 w-6 h-6" />
            <h2 className="text-2xl font-bold text-white">Generate Accounts</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => generateAccount('solana')}
              disabled={!seedPhrase}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">SOL</span>
              </div>
              Create Solana Account
            </button>
            
            <button
              onClick={() => generateAccount('ethereum')}
              disabled={!seedPhrase}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">ETH</span>
              </div>
              Create Ethereum Account
            </button>
          </div>
        </div>

        {/* Generated Accounts */}
        {accounts.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Your Accounts</h2>
            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="bg-black/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        account.network === 'solana' 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                      }`}>
                        {account.network === 'solana' ? 'SOL' : 'ETH'}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{account.name}</h3>
                        <p className="text-blue-200 text-sm capitalize">{account.network} Network</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-blue-200 text-sm mb-2">Public Key</p>
                    <div className="flex items-center gap-2">
                      <code className="text-white font-mono text-sm bg-black/30 px-3 py-2 rounded-lg flex-1 overflow-hidden">
                        {account.publicKey}
                      </code>
                      <button
                        onClick={() => copyToClipboard(account.publicKey, account.id)}
                        className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all"
                      >
                        {copied === account.id ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
    
    
  );
};

export default GenerateAccounts;