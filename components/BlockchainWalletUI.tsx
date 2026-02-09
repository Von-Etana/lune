import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, Shield, Key, Link2, ExternalLink, Copy, Check,
    Plus, Share2, Eye, EyeOff, Download, Upload, QrCode,
    Award, ChevronRight, Fingerprint, Lock, Unlock, RefreshCw,
    CheckCircle, AlertTriangle, X, Search, Filter, Trash2
} from 'lucide-react';
import {
    getWallet,
    issueCredential,
    verifyCredential,
    createPresentation,
    getExplorerUrl,
    formatDID,
    exportWallet,
    importWallet,
    CredentialWallet,
    VerifiableCredential,
    VerificationResult
} from '../services/blockchainWalletService';

interface BlockchainWalletUIProps {
    userId: string;
    userName: string;
    onClose?: () => void;
}

export const BlockchainWalletUI: React.FC<BlockchainWalletUIProps> = ({
    userId,
    userName,
    onClose
}) => {
    const [wallet, setWallet] = useState<CredentialWallet | null>(null);
    const [activeTab, setActiveTab] = useState<'credentials' | 'verify' | 'share' | 'settings'>('credentials');
    const [selectedCredential, setSelectedCredential] = useState<VerifiableCredential | null>(null);
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedDID, setCopiedDID] = useState(false);
    const [showMintModal, setShowMintModal] = useState(false);
    const [isMinting, setIsMinting] = useState(false);

    useEffect(() => {
        const w = getWallet(userId);
        setWallet(w);
    }, [userId]);

    const copyDID = () => {
        if (wallet) {
            navigator.clipboard.writeText(wallet.did);
            setCopiedDID(true);
            setTimeout(() => setCopiedDID(false), 2000);
        }
    };

    const handleVerify = async (credentialId: string) => {
        setIsVerifying(true);
        const result = await verifyCredential(credentialId);
        setVerificationResult(result);
        setIsVerifying(false);
    };

    const handleMint = async (skill: string, score: number, level: string) => {
        if (!wallet) return;
        setIsMinting(true);
        try {
            const credential = await issueCredential(wallet, skill, score, level);
            setWallet({ ...wallet, credentials: [...wallet.credentials, credential] });
            setShowMintModal(false);
        } catch (error) {
            console.error('Failed to mint credential:', error);
        }
        setIsMinting(false);
    };

    const filteredCredentials = wallet?.credentials.filter(c =>
        c.credentialSubject.skill?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (!wallet) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="bg-black/30 backdrop-blur-xl border-b border-white/10 px-6 py-4">
                <div className="flex items-center justify-between max-w-5xl mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Credential Wallet</h1>
                            <p className="text-sm text-purple-300">Blockchain-verified credentials</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowMintModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium flex items-center gap-2 hover:opacity-90"
                        >
                            <Plus className="w-4 h-4" />
                            Mint Credential
                        </button>
                        {onClose && (
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                                <X className="w-5 h-5 text-white" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6">
                {/* Wallet Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 mb-6 relative overflow-hidden"
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl" />
                    </div>

                    <div className="relative">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <p className="text-purple-200 text-sm mb-1">Decentralized Identifier (DID)</p>
                                <div className="flex items-center gap-2">
                                    <code className="text-white font-mono text-sm bg-black/20 px-3 py-1 rounded">
                                        {formatDID(wallet.did)}
                                    </code>
                                    <button
                                        onClick={copyDID}
                                        className="p-1.5 hover:bg-white/20 rounded transition"
                                    >
                                        {copiedDID ? (
                                            <Check className="w-4 h-4 text-green-300" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-white" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                                <Shield className="w-4 h-4 text-white" />
                                <span className="text-white text-sm font-medium">Secured</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-purple-200 text-sm">Credentials</p>
                                <p className="text-2xl font-bold text-white">{wallet.credentials.length}</p>
                            </div>
                            <div>
                                <p className="text-purple-200 text-sm">Active</p>
                                <p className="text-2xl font-bold text-white">
                                    {wallet.credentials.filter(c => c.status === 'active').length}
                                </p>
                            </div>
                            <div>
                                <p className="text-purple-200 text-sm">Network</p>
                                <p className="text-lg font-bold text-white">Polygon</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { id: 'credentials', label: 'Credentials', icon: Award },
                        { id: 'verify', label: 'Verify', icon: CheckCircle },
                        { id: 'share', label: 'Share', icon: Share2 },
                        { id: 'settings', label: 'Settings', icon: Key }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition ${activeTab === tab.id
                                    ? 'bg-white text-purple-900'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Credentials Tab */}
                {activeTab === 'credentials' && (
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search credentials..."
                                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        {/* Credential List */}
                        <div className="grid gap-4">
                            {filteredCredentials.map(credential => (
                                <motion.div
                                    key={credential.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/20 hover:bg-white/20 transition cursor-pointer"
                                    onClick={() => setSelectedCredential(credential)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                                <Award className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg">
                                                    {credential.credentialSubject.skill}
                                                </h3>
                                                <p className="text-purple-300 text-sm">
                                                    Score: {credential.credentialSubject.score}% • {credential.credentialSubject.level}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${credential.status === 'active'
                                                    ? 'bg-green-500/20 text-green-300'
                                                    : 'bg-red-500/20 text-red-300'
                                                }`}>
                                                {credential.status}
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4 text-sm text-gray-400">
                                        <span>Issued: {new Date(credential.issuanceDate).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>Network: {credential.blockchain.network}</span>
                                        <a
                                            href={getExplorerUrl(credential)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-auto flex items-center gap-1 text-purple-400 hover:text-purple-300"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            View on chain
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </motion.div>
                            ))}

                            {filteredCredentials.length === 0 && (
                                <div className="text-center py-12">
                                    <Award className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-white mb-2">No credentials yet</h3>
                                    <p className="text-gray-400 mb-4">Complete assessments to earn blockchain-verified credentials</p>
                                    <button
                                        onClick={() => setShowMintModal(true)}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium"
                                    >
                                        Mint Your First Credential
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Verify Tab */}
                {activeTab === 'verify' && (
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
                        <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            Verify a Credential
                        </h3>
                        <p className="text-gray-400 mb-4">
                            Enter a credential ID to verify its authenticity on the blockchain.
                        </p>

                        <div className="flex gap-3 mb-6">
                            <input
                                type="text"
                                placeholder="Enter credential ID or paste URL..."
                                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400"
                            />
                            <button
                                onClick={() => handleVerify('sample-id')}
                                disabled={isVerifying}
                                className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
                            >
                                {isVerifying ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Shield className="w-5 h-5" />
                                )}
                                Verify
                            </button>
                        </div>

                        {/* Verification Result */}
                        {verificationResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-6 rounded-xl ${verificationResult.isValid
                                        ? 'bg-green-500/20 border border-green-500/30'
                                        : 'bg-red-500/20 border border-red-500/30'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    {verificationResult.isValid ? (
                                        <CheckCircle className="w-8 h-8 text-green-400" />
                                    ) : (
                                        <AlertTriangle className="w-8 h-8 text-red-400" />
                                    )}
                                    <div>
                                        <h4 className="font-bold text-white text-lg">
                                            {verificationResult.isValid ? 'Valid Credential' : 'Verification Failed'}
                                        </h4>
                                        <p className="text-gray-400 text-sm">
                                            Verified at {verificationResult.timestamp.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {verificationResult.checks.map((check, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                            {check.status === 'passed' ? (
                                                <Check className="w-4 h-4 text-green-400" />
                                            ) : check.status === 'warning' ? (
                                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                            ) : (
                                                <X className="w-4 h-4 text-red-400" />
                                            )}
                                            <span className="text-white">{check.name}:</span>
                                            <span className="text-gray-400">{check.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Share Tab */}
                {activeTab === 'share' && (
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
                        <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                            <Share2 className="w-5 h-5 text-purple-400" />
                            Share Credentials
                        </h3>
                        <p className="text-gray-400 mb-6">
                            Create a shareable link to your verified credentials.
                        </p>

                        <div className="space-y-4">
                            {wallet.credentials.map(credential => (
                                <div
                                    key={credential.id}
                                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" className="w-4 h-4 accent-purple-500" />
                                        <div>
                                            <p className="text-white font-medium">{credential.credentialSubject.skill}</p>
                                            <p className="text-gray-400 text-sm">Score: {credential.credentialSubject.score}%</p>
                                        </div>
                                    </div>
                                    <span className={credential.status === 'active' ? 'text-green-400' : 'text-red-400'}>
                                        {credential.status}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                                <Link2 className="w-5 h-5" />
                                Generate Share Link
                            </button>
                            <button className="py-3 px-4 bg-white/10 text-white rounded-xl flex items-center justify-center">
                                <QrCode className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-4">
                        <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
                            <h3 className="font-bold text-white text-lg mb-4">Wallet Security</h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Fingerprint className="w-5 h-5 text-purple-400" />
                                        <div>
                                            <p className="text-white font-medium">Biometric Lock</p>
                                            <p className="text-gray-400 text-sm">Require Face ID or fingerprint</p>
                                        </div>
                                    </div>
                                    <button className="w-12 h-6 bg-purple-600 rounded-full relative">
                                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Key className="w-5 h-5 text-purple-400" />
                                        <div>
                                            <p className="text-white font-medium">Export Private Key</p>
                                            <p className="text-gray-400 text-sm">Backup your wallet</p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm">
                                        Export
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Download className="w-5 h-5 text-purple-400" />
                                        <div>
                                            <p className="text-white font-medium">Download Wallet</p>
                                            <p className="text-gray-400 text-sm">Export as JSON file</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const json = exportWallet(wallet);
                                            const blob = new Blob([json], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = 'lune-wallet.json';
                                            a.click();
                                        }}
                                        className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm"
                                    >
                                        Download
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-500/10 backdrop-blur rounded-xl p-6 border border-red-500/20">
                            <h3 className="font-bold text-red-400 text-lg mb-4">Danger Zone</h3>
                            <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium flex items-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                Delete Wallet
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Mint Modal */}
            <AnimatePresence>
                {showMintModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-slate-900 rounded-2xl border border-white/20 max-w-md w-full p-6"
                        >
                            <h2 className="text-xl font-bold text-white mb-4">Mint New Credential</h2>
                            <p className="text-gray-400 mb-6">
                                Mint your skill certification as an NFT on the blockchain.
                            </p>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Skill</label>
                                    <select className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white">
                                        <option>React</option>
                                        <option>TypeScript</option>
                                        <option>Python</option>
                                        <option>Node.js</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Score</label>
                                    <input
                                        type="number"
                                        defaultValue="85"
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Level</label>
                                    <select className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white">
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowMintModal(false)}
                                    className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleMint('React', 85, 'Advanced')}
                                    disabled={isMinting}
                                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    {isMinting ? (
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Award className="w-5 h-5" />
                                            Mint NFT
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Credential Detail Modal */}
            <AnimatePresence>
                {selectedCredential && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedCredential(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 rounded-2xl border border-white/20 max-w-lg w-full p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Credential Details</h2>
                                <button
                                    onClick={() => setSelectedCredential(null)}
                                    className="p-2 hover:bg-white/10 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 text-center mb-6">
                                <Award className="w-16 h-16 text-white mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-white">
                                    {selectedCredential.credentialSubject.skill}
                                </h3>
                                <p className="text-purple-200">
                                    {selectedCredential.credentialSubject.level} • Score: {selectedCredential.credentialSubject.score}%
                                </p>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Credential ID</span>
                                    <code className="text-white font-mono text-xs">
                                        {selectedCredential.id.slice(0, 20)}...
                                    </code>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Issued</span>
                                    <span className="text-white">
                                        {new Date(selectedCredential.issuanceDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Network</span>
                                    <span className="text-white capitalize">
                                        {selectedCredential.blockchain.network}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Token ID</span>
                                    <span className="text-white">
                                        #{selectedCredential.blockchain.tokenId}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <a
                                    href={getExplorerUrl(selectedCredential)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    View on Chain
                                </a>
                                <button className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BlockchainWalletUI;
