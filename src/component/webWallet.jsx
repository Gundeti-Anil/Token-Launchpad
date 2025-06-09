import React, { useState, useEffect } from 'react';
import { Copy, Eye, EyeOff, Wallet, RefreshCw, Key, Shield, CheckCircle } from 'lucide-react';
import SeedPhrase from './seedPharse';
import GenerateAccounts from './accounts';
const Web3Wallet = () => {
  
  const [seedPhrase, setSeedPhrase] = useState('');
  const [copied, setCopied] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {/* <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-2xl">
              <Wallet className="w-8 h-8 text-white" />
            </div> */}
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Web3 Wallet</h1>
          <p className="text-blue-200">Secure multi-chain wallet generator</p>
        </div>
        {/* Seed Phrase Section */}      
        <SeedPhrase seedPhrase={seedPhrase} setSeedPhrase={setSeedPhrase} copied={copied} setCopied={setCopied}/>
        {/* Account Generation */}
        <GenerateAccounts seedPhrase={seedPhrase} copied={copied} setCopied={setCopied}/>
      </div>
    </div>
  );
};

export default Web3Wallet;