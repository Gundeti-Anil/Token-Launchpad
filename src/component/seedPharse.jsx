import { generateMnemonic } from "bip39";
import React, { useState, useEffect } from 'react';
import { Copy, Eye, EyeOff, RefreshCw, Shield, CheckCircle } from 'lucide-react';

const SeedPhrase = ({seedPhrase, setSeedPhrase, copied, setCopied}) => {

    const [showSeedPhrase, setShowSeedPhrase] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateSeedPhrase = async () => {
        setIsGenerating(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const phrase = await generateMnemonic();
        setSeedPhrase(phrase);
        setIsGenerating(false);
      };

      useEffect(() => {
        generateSeedPhrase();
      }, []);

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

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20">

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className="text-yellow-400 w-6 h-6" />
              <h2 className="text-2xl font-bold text-white">Seed Phrase</h2>
            </div>
            <button
              onClick={generateSeedPhrase}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              Generate New
            </button>
          </div>

          {isGenerating ? (
            <div className="bg-black/20 rounded-2xl p-6 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-4 bg-white/20 rounded"></div>
              </div>
              <p className="text-blue-200 mt-4">Generating secure seed phrase...</p>
            </div>
          ) : (
            <div className="bg-black/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-blue-200 text-sm">Keep this phrase safe and secret</p>
                <button
                  onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                  className="text-blue-300 hover:text-white transition-colors"
                >
                  {showSeedPhrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                {(showSeedPhrase ? seedPhrase.split(' ') : Array(12).fill('•••••')).map((word, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-3 text-center">
                    <span className="text-xs text-blue-300 block">{index + 1}</span>
                    <span className="text-white font-mono">{word}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => copyToClipboard(seedPhrase, 'seed')}
                className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 flex items-center justify-center gap-2 transition-all"
              >
                {copied === 'seed' ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Seed Phrase
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
      )
    
    
    
}

export default SeedPhrase;
  
