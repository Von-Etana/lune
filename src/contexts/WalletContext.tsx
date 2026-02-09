import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Wallet, ExternalLink, AlertCircle } from 'lucide-react';
import { useToast } from '../../lib/toast';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  balance: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  getExplorerUrl: (txHash: string) => string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const toast = useToast();

  const isConnected = !!address;

  // Check if wallet is already connected (from localStorage)
  useEffect(() => {
    const savedAddress = localStorage.getItem('pwr_wallet_address');
    if (savedAddress) {
      setAddress(savedAddress);
      fetchBalance(savedAddress);
    }
  }, []);

  const fetchBalance = async (walletAddress: string) => {
    try {
      // In production, this would call PWRCHAIN RPC
      // For now, we'll use a mock balance
      const mockBalance = Math.random() * 100;
      setBalance(mockBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const connect = async () => {
    try {
      // For PWRCHAIN, users typically connect by providing their wallet address
      // or importing their private key (for server-side operations)
      // For client-side, we'll show a modal to input wallet address
      setShowModal(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect wallet');
    }
  };

  const handleConnectWithAddress = (walletAddress: string) => {
    if (!walletAddress || walletAddress.length < 10) {
      toast.error('Please enter a valid PWRCHAIN wallet address');
      return;
    }

    setAddress(walletAddress);
    localStorage.setItem('pwr_wallet_address', walletAddress);
    fetchBalance(walletAddress);
    setShowModal(false);
    toast.success('Wallet connected successfully!');
  };

  const disconnect = () => {
    setAddress(null);
    setBalance(0);
    localStorage.removeItem('pwr_wallet_address');
    toast.info('Wallet disconnected');
  };

  const getExplorerUrl = (txHash: string): string => {
    return `https://explorer.pwrlabs.io/tx/${txHash}`;
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        balance,
        connect,
        disconnect,
        getExplorerUrl
      }}
    >
      {children}

      {/* Wallet Connection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-teal/10 p-3 rounded-xl">
                <Wallet className="text-teal" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Connect PWRCHAIN Wallet</h2>
                <p className="text-sm text-gray-500">Enter your wallet address to continue</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                Your wallet address is used to verify certificate ownership. Never share your private key.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const address = formData.get('address') as string;
                handleConnectWithAddress(address);
              }}
            >
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Wallet Address
              </label>
              <input
                type="text"
                name="address"
                placeholder="0x..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal mb-4"
                required
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-teal text-white rounded-xl font-medium hover:bg-teal/90 transition"
                >
                  Connect
                </button>
              </div>
            </form>

            <a
              href="https://pwrlabs.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-4"
            >
              Learn about PWRCHAIN <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export default WalletContext;
