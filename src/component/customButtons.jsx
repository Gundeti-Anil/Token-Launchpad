import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton, WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
export default function CustomWalletButtons() {
    const { connected, publicKey } = useWallet();

    const truncateAddress = (address) => {
        if (!address) return '';
        const str = address.toString();
        return `${str.slice(0, 4)}...${str.slice(-4)}`;
    };

    return (
        <div className="flex items-center gap-4">
            {!connected ? (
                <div className="wallet-adapter-button-trigger">
                    <WalletMultiButton 
                        style={{
                            background: 'linear-gradient(to right, #8b5cf6, #3b82f6)',
                            border: 'none',
                            borderRadius: '0.75rem',
                            padding: '0.75rem 1.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        Connect Wallet 🔗
                    </WalletMultiButton>
                </div>
            ) : (
                <div className="flex items-center gap-3 bg-black/20 rounded-lg p-3 border border-white/20">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-300 font-mono text-sm">
                            {truncateAddress(publicKey?.toBase58())}
                        </span>
                    </div>
                    <WalletDisconnectButton 
                        style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            borderRadius: '0.5rem',
                            padding: '0.5rem 1rem',
                            fontSize: '0.75rem',
                            color: '#fca5a5',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        Disconnect
                    </WalletDisconnectButton>
                </div>
            )}
        </div>
    );
}