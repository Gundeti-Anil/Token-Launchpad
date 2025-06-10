
import React, { useState } from 'react';
import { Keypair, SystemProgram, Transaction, PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton, WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import { 
    TOKEN_2022_PROGRAM_ID, 
    createMintToInstruction, 
    createAssociatedTokenAccountInstruction, 
    getMintLen, 
    createInitializeMetadataPointerInstruction, 
    createInitializeMintInstruction, 
    TYPE_SIZE, 
    LENGTH_SIZE, 
    ExtensionType, 
    getAssociatedTokenAddressSync 
} from "@solana/spl-token";
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';

export default function TokenLaunchpad() {
    const { connection } = useConnection();
    const wallet = useWallet();
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        symbol: '',
        uri: '',
        initialSupply: '',
        decimals: '9'
    });
    
    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);
    const [txSignatures, setTxSignatures] = useState([]);

    // Input validation
    const validateForm = () => {
        const { name, symbol, uri, initialSupply, decimals } = formData;
        
        if (!name.trim()) 
            return "Token name is required";
        if (!symbol.trim()) 
            return "Token symbol is required";
        if (symbol.length > 10) 
            return "Symbol must be 10 characters or less";
        if (!uri.trim()) 
            return "Image URL is required";
        if (!initialSupply || isNaN(Number(initialSupply))) 
            return "Valid initial supply is required";
        if (Number(initialSupply) <= 0) 
            return "Initial supply must be greater than 0";
        if (!decimals || isNaN(Number(decimals))) 
            return "Valid decimals is required";
        if (Number(decimals) < 0 || Number(decimals) > 9) 
            return "Decimals must be between 0 and 9";
        
        // Basic URL validation
        try {
            new URL(uri);
        } catch {
            return "Please enter a valid URL for the image";
        }
        
        return null;
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(''); // Clear error when user types
    };

    const createToken = async () => {
        if (!wallet.connected || !wallet.publicKey) {
            setError("Please connect your wallet first");
            return;
        }

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess(null);
        setTxSignatures([]);

        try {
            const { name, symbol, uri, initialSupply, decimals } = formData;
            const mintKeypair = Keypair.generate();
            const decimalPlaces = parseInt(decimals);
            const supplyInBaseUnits = Math.floor(parseFloat(initialSupply) * Math.pow(10, decimalPlaces));

            // Step 1: Create mint account with metadata
            setCurrentStep("Creating mint account and metadata...");
            
            const metadata = {
                mint: mintKeypair.publicKey,
                name: name.trim(),
                symbol: symbol.trim().toUpperCase(),
                uri: uri.trim(),
                additionalMetadata: [],
            };

            const mintLen = getMintLen([ExtensionType.MetadataPointer]);
            const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
            const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

            const createMintTx = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: wallet.publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: mintLen,
                    lamports,
                    programId: TOKEN_2022_PROGRAM_ID,
                }),
                createInitializeMetadataPointerInstruction(
                    mintKeypair.publicKey, 
                    wallet.publicKey, 
                    mintKeypair.publicKey, 
                    TOKEN_2022_PROGRAM_ID
                ),
                createInitializeMintInstruction(
                    mintKeypair.publicKey, 
                    decimalPlaces, 
                    wallet.publicKey, 
                    null, 
                    TOKEN_2022_PROGRAM_ID
                ),
                createInitializeInstruction({
                    programId: TOKEN_2022_PROGRAM_ID,
                    mint: mintKeypair.publicKey,
                    metadata: mintKeypair.publicKey,
                    name: metadata.name,
                    symbol: metadata.symbol,
                    uri: metadata.uri,
                    mintAuthority: wallet.publicKey,
                    updateAuthority: wallet.publicKey,
                }),
            );

            createMintTx.feePayer = wallet.publicKey;
            createMintTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            createMintTx.partialSign(mintKeypair);

            const mintTxSignature = await wallet.sendTransaction(createMintTx, connection);
            await connection.confirmTransaction(mintTxSignature, 'confirmed');
            setTxSignatures(prev => [...prev, { step: "Mint Created", signature: mintTxSignature }]);

            // Step 2: Create Associated Token Account
            setCurrentStep("Creating token account...");
            
            const associatedTokenAddress = getAssociatedTokenAddressSync(
                mintKeypair.publicKey,
                wallet.publicKey,
                false,
                TOKEN_2022_PROGRAM_ID,
            );

            const createATATx = new Transaction().add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    associatedTokenAddress,
                    wallet.publicKey,
                    mintKeypair.publicKey,
                    TOKEN_2022_PROGRAM_ID,
                ),
            );

            const ataTxSignature = await wallet.sendTransaction(createATATx, connection);
            // await connection.confirmTransaction(ataTxSignature, 'confirmed');
            setTxSignatures(prev => [...prev, { step: "Token Account Created", signature: ataTxSignature }]);

            // Step 3: Mint initial supply
            setCurrentStep("Minting initial supply...");
            
            const mintToTx = new Transaction().add(
                createMintToInstruction(
                    mintKeypair.publicKey, 
                    associatedTokenAddress, 
                    wallet.publicKey, 
                    supplyInBaseUnits, 
                    [], 
                    TOKEN_2022_PROGRAM_ID
                )
            );

            const mintToTxSignature = await wallet.sendTransaction(mintToTx, connection);
            // await connection.confirmTransaction(mintToTxSignature, 'confirmed');
            setTxSignatures(prev => [...prev, { step: "Tokens Minted", signature: mintToTxSignature }]);

            // Success!
            setSuccess({
                mintAddress: mintKeypair.publicKey.toBase58(),
                tokenAccountAddress: associatedTokenAddress.toBase58(),
                supply: initialSupply,
                decimals: decimalPlaces
            });

            // Reset form
            setFormData({
                name: '',
                symbol: '',
                uri: '',
                initialSupply: '',
                decimals: '9'
            });

        } catch (err) {
            console.error("Token creation error:", err);
            setError(err.message || "Failed to create token. Please try again.");
        } finally {
            setIsLoading(false);
            setCurrentStep('');
        }
    };

    const truncateAddress = (address) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">🚀 Solana Token Launchpad</h1>
                    <p className="text-gray-300">Create your own SPL Token with Token-2022 program</p>
                </div>

                {/* Main Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-white/20">
                    {/* Wallet Status */}
                    <div className="mb-6 p-4 bg-black/20 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300">Wallet Status:</span>
                            {wallet.connected ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-green-400 font-mono text-sm">
                                        {truncateAddress(wallet.publicKey?.toBase58() || "")}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-red-400">Not Connected</span>
                            )}
                        </div>
                    </div>

                    {/* Form */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Token Name</label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    type="text"
                                    placeholder="My Awesome Token"
                                    maxLength="32"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
                                <input
                                    value={formData.symbol}
                                    onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    type="text"
                                    placeholder="MAT"
                                    maxLength="10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
                            <input
                                value={formData.uri}
                                onChange={(e) => handleInputChange('uri', e.target.value)}
                                className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                type="url"
                                placeholder="https://example.com/token-image.png"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Initial Supply</label>
                                <input
                                    value={formData.initialSupply}
                                    onChange={(e) => handleInputChange('initialSupply', e.target.value)}
                                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    type="number"
                                    placeholder="1000000"
                                    min="0"
                                    step="any"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Decimals</label>
                                <select
                                    value={formData.decimals}
                                    onChange={(e) => handleInputChange('decimals', e.target.value)}
                                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    {[...Array(10)].map((_, i) => (
                                        <option key={i} value={i} className="bg-gray-800">{i}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                                <p className="text-red-300">❌ {error}</p>
                            </div>
                        )}

                        {/* Loading State */}
                        {isLoading && (
                            <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent"></div>
                                    <p className="text-blue-300">{currentStep}</p>
                                </div>
                            </div>
                        )}

                        {/* Create Button */}
                        <button
                            onClick={createToken}
                            disabled={isLoading || !wallet.connected}
                            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    Creating Token...
                                </div>
                            ) : (
                                '🚀 Create Token'
                            )}
                        </button>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="mt-6 p-6 bg-green-500/20 border border-green-500/50 rounded-lg">
                            <h3 className="text-green-300 font-semibold mb-3">✅ Token Created Successfully!</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-300">Mint Address:</span>
                                    <code className="text-green-300 font-mono">{truncateAddress(success.mintAddress)}</code>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-300">Token Account:</span>
                                    <code className="text-green-300 font-mono">{truncateAddress(success.tokenAccountAddress)}</code>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-300">Total Supply:</span>
                                    <span className="text-green-300">{success.supply} tokens</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Transaction History */}
                    {txSignatures.length > 0 && (
                        <div className="mt-6 p-4 bg-black/20 rounded-lg">
                            <h4 className="text-white font-medium mb-3">Transaction History:</h4>
                            <div className="space-y-2">
                                {txSignatures.map((tx, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-300">{tx.step}:</span>
                                        <code className="text-blue-300 font-mono">{truncateAddress(tx.signature)}</code>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-gray-400 text-sm">
                    <p>Powered by Solana Token-2022 Program</p>
                </div>
            </div>
        </div>
    );
}