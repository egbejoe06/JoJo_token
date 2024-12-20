<template>
    <div>
        <Navbar />
    </div>
    <div class="min-h-screen bg-gray-900 text-gray-100 font-sans">
        <main class="max-w-7xl mx-auto p-6">
            <!-- Main Content Layout -->
            <div class="flex flex-col lg:flex-row gap-6">
                <!-- Left Section (Main Content - 70%) -->
                <div class="lg:w-[70%] space-y-6">
                    <!-- Action Cards Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Daily Login Reward -->
                        <div class="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
                            <div class="flex items-center mb-4">
                                <ClockIcon class="w-5 h-5 mr-2 text-green-400" />
                                <h2 class="text-xl font-bold text-white">Daily Reward</h2>
                            </div>
                            <button @click="claimDailyReward"
                                class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                :disabled="!connected">
                                <GiftIcon class="w-5 h-5 mr-2" />
                                Claim Daily Reward
                            </button>
                            <div v-if="claimMessage" :class="[
                                'mt-3 p-2 rounded text-center',
                                claimMessage.includes('success')
                                    ? 'bg-green-900/50 text-green-300'
                                    : 'bg-red-900/50 text-red-300'
                            ]">
                                {{ claimMessage }}
                            </div>
                        </div>

                        <!-- Buy Pre-sale -->
                        <div class="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
                            <div class="flex items-center mb-4">
                                <WalletIcon class="w-5 h-5 mr-2 text-indigo-400" />
                                <h2 class="text-xl font-bold text-white">Buy Pre-sale</h2>
                            </div>
                            <input v-model="purchaseAmount" type="number" step="0.01" min="0"
                                placeholder="Amount in ETH"
                                class="w-full mb-4 p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500 transition" />
                            <button @click="buyPresale"
                                class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                :disabled="!connected || !purchaseAmount">
                                Buy Tokens
                            </button>
                            <div v-if="purchaseMessage" :class="[
                                'mt-3 p-2 rounded text-center',
                                purchaseMessage.includes('success')
                                    ? 'bg-green-900/50 text-green-300'
                                    : 'bg-red-900/50 text-red-300'
                            ]">
                                {{ purchaseMessage }}
                            </div>
                        </div>

                        <!-- Gift Code -->
                        <div class="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
                            <div class="flex items-center mb-4">
                                <AwardIcon class="w-5 h-5 mr-2 text-blue-400" />
                                <h2 class="text-xl font-bold text-white">Redeem Gift Code</h2>
                            </div>
                            <input v-model="giftCode" type="text" placeholder="Enter gift code"
                                class="w-full mb-4 p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 transition" />
                            <button @click="redeemGiftCode"
                                class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                :disabled="!connected || !giftCode">
                                Redeem
                            </button>
                            <div v-if="giftMessage" :class="[
                                'mt-3 p-2 rounded text-center',
                                giftMessage.includes('success')
                                    ? 'bg-green-900/50 text-green-300'
                                    : 'bg-red-900/50 text-red-300'
                            ]">
                                {{ giftMessage }}
                            </div>
                        </div>
                    </div>

                    <!-- NFTs Section -->
                    <div class="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
                        <div class="flex items-center justify-between mb-6">
                            <div class="flex items-center">
                                <ImageIcon class="w-5 h-5 mr-2 text-purple-400" />
                                <h2 class="text-xl font-bold text-white">My NFTs</h2>
                            </div>
                            <button @click="fetchUserNFTs" class="text-purple-400 hover:text-purple-300 transition">
                                <RefreshCwIcon class="w-5 h-5" />
                            </button>
                        </div>

                        <!-- Loading State -->
                        <div v-if="loading" class="text-center py-12">
                            <div
                                class="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4">
                            </div>
                            <p class="text-gray-400">Loading your NFTs...</p>
                        </div>

                        <!-- Empty State -->
                        <div v-else-if="userNFTs.length === 0" class="text-center py-12 text-gray-400">
                            <ImageOffIcon class="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p class="text-lg mb-2">No NFTs Found</p>
                            <p class="text-sm">Connect your wallet or purchase an NFT to get started</p>
                        </div>

                        <!-- NFT Grid -->
                        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            <div v-for="nft in userNFTs" :key="nft.tokenId"
                                class="bg-gray-700 rounded-lg overflow-hidden hover:bg-gray-600 transition">
                                <img :src="nft.image" :alt="nft.name" class="w-full aspect-square object-cover"
                                    @error="handleImageError" />
                                <div class="p-3">
                                    <h3 class="font-medium text-base mb-1 truncate">{{ nft.name }}</h3>
                                    <div class="group relative mb-2">
                                        <span class="text-gray-500 text-xs truncate block">
                                            {{ nft.description }}
                                        </span>
                                        <div class="absolute z-10 p-2 bg-gray-700 text-white text-sm rounded shadow-lg 
                                            opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                                            pointer-events-none -top-2 left-0 transform -translate-y-full 
                                            max-w-xs overflow-hidden">
                                            {{ nft.description }}
                                        </div>
                                    </div>
                                    <div class="flex justify-between items-center text-sm">
                                        <span class="text-purple-400">ID: {{ nft.tokenId }}</span>
                                    </div>
                                    <button @click="startAuction(nft.tokenId)"
                                        class="w-full bg-blue-600 text-white py-1.5 px-2 rounded-lg hover:bg-blue-700 transition mt-2 text-sm"
                                        :disabled="!userAccount">
                                        Start Auction
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Section (Leaderboard - 30%) -->
                <div class="lg:w-[30%]">
                    <div class="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 sticky top-6">
                        <div class="flex items-center mb-4">
                            <UsersIcon class="w-5 h-5 mr-2 text-indigo-400" />
                            <h2 class="text-xl font-bold text-white">Top 10 Leaderboard</h2>
                        </div>
                        <div class="overflow-hidden">
                            <div v-if="leaderboard.length === 0" class="text-center py-8 text-gray-400">
                                No leaderboard data available
                            </div>
                            <ul v-else class="space-y-3">
                                <li v-for="(user, index) in leaderboard.slice(0, 10)" :key="index"
                                    class="bg-gray-700 p-3 rounded-lg flex justify-between items-center hover:bg-gray-600 transition">
                                    <span class="font-medium text-gray-300">
                                        {{ index + 1 }}. {{ truncateAddress(user.address) }}
                                    </span>
                                    <span class="text-indigo-400 font-bold">
                                        {{ user.score }} JoJo
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Auction Modal -->
        <div v-if="showAuctionModal"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-gray-800 rounded-xl p-6 w-full max-w-md">
                <h2 class="text-2xl font-bold mb-4 text-white">Start Auction</h2>
                <div class="space-y-4">
                    <input v-model="auctionDetails.startingPrice" type="number" placeholder="Starting Price (Tokens)"
                        class="w-full p-3 bg-gray-700 text-white rounded-lg" />
                    <input v-model="auctionDetails.duration" type="number" placeholder="Auction Duration (seconds)"
                        class="w-full p-3 bg-gray-700 text-white rounded-lg" />
                    <div class="flex space-x-4">
                        <button @click="confirmAuction"
                            class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                            Confirm
                        </button>
                        <button @click="showAuctionModal = false"
                            class="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Wallet Not Connected Warning -->
        <div v-if="!connected" class="fixed bottom-0 left-0 right-0 bg-yellow-600 text-white p-4">
            <div class="max-w-6xl mx-auto flex justify-between items-center">
                <p class="font-medium">Please connect your wallet to access all features</p>
                <button @click="connectWallet" class="bg-yellow-700 px-4 py-2 rounded hover:bg-yellow-800 transition">
                    Connect Wallet
                </button>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import { ethers } from "ethers";
import { useWallet } from '../composable/useWallet';
import Navbar from "../components/Navbar.vue";
import {
    Users as UsersIcon,
    Gift as GiftIcon,
    Wallet as WalletIcon,
    Award as AwardIcon,
    Clock as ClockIcon,
    Image as ImageIcon,
    RefreshCw as RefreshCwIcon,
    ImageOff as ImageOffIcon
} from 'lucide-vue-next';

const {
    connectWallet,
    getContract,
    userAccount,
    getTokenContract,
    connected
} = useWallet();

const contract = ref(null);
const tokenContract = ref(null);
const account = ref("");

// State variables
const userNFTs = ref([]);
const errorMessage = ref('')
const successMessage = ref('')
const leaderboard = ref([]);
const balance = ref(0);
const purchaseAmount = ref("");
const claimMessage = ref("");
const purchaseMessage = ref("");
const giftCode = ref("");
const giftMessage = ref("");
const showAuctionModal = ref(false)
const auctionDetails = ref({
    tokenId: null,
    startingPrice: null,
    duration: null
})

function truncateAddress(walletAddress) {
    if (!walletAddress || walletAddress.length < 10) {
        return walletAddress; // Return as is if it's too short
    }
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}
// Methods
const fetchLeaderboard = async () => {
    if (!contract.value) return;

    try {
        const [addresses, scores] = await contract.value.getLeaderboard();
        leaderboard.value = addresses.map((address, i) => ({
            address,
            score: ethers.utils.formatUnits(scores[i], 18),

        }));
    } catch (error) {
        console.error("Leaderboard fetch error:", error);
    }
};

const fetchBalance = async () => {
    if (!contract.value || !account.value) return;

    try {
        const userBalance = await contract.value.getBalance(account.value);
        balance.value = ethers.utils.formatUnits(userBalance, 18);
    } catch (error) {
        console.error("Balance fetch error:", error);
    }
};

const claimDailyReward = async () => {
    try {
        console.log('Attempting to claim daily reward');
        console.log('Current contract:', contract.value);

        if (!contract.value) {
            claimMessage.value = "Contract not initialized";
            return;
        }

        // Directly call the contract method
        const tx = await contract.value.claimDailyLoginReward();
        console.log('Transaction sent:', tx);

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log('Transaction receipt:', receipt);

        claimMessage.value = "Daily reward claimed successfully!";

        // Refresh balance after claiming
        await fetchBalance();
    } catch (error) {
        console.error('Claim daily reward error:', error);

        // Provide more detailed error messaging
        if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
            claimMessage.value = "Transaction failed. Possible reasons: Already claimed, not eligible, or contract restrictions.";
        } else if (error.reason) {
            claimMessage.value = `Error: ${error.reason}`;
        } else {
            claimMessage.value = "Failed to claim reward. Please try again.";
        }
    }
};

const buyPresale = async () => {
    try {
        if (!purchaseAmount.value || isNaN(purchaseAmount.value)) {
            purchaseMessage.value = "Please enter a valid amount.";
            return;
        }
        const amountInEther = ethers.utils.parseEther(purchaseAmount.value.toString());
        const tx = await contract.value.buyTokens({ value: amountInEther });
        await tx.wait();
        purchaseMessage.value = "Tokens purchased successfully!";
        fetchBalance();
    } catch (error) {
        console.log(error);
        purchaseMessage.value = "Failed to buy tokens. Please try again.";
    }
};

const redeemGiftCode = async () => {
    try {
        const tx = await contract.value.redeemGiftCode(giftCode.value); // Assuming `redeemGiftCode` is in your contract
        await tx.wait();
        giftMessage.value = "Gift code redeemed successfully!";
        fetchBalance();
    } catch (error) {
        giftMessage.value = "Invalid gift code or redemption failed.";
    }
};
const fetchUserNFTs = async () => {
    if (!tokenContract.value || !account.value) {
        console.log("Token contract or account not initialized");
        return;
    }

    try {
        // First check if the function exists
        if (typeof tokenContract.value.getNFTsByOwner !== 'function') {
            console.error("getNFTsByOwner function not found in contract");
            return;
        }

        const nfts = await tokenContract.value.getNFTsByOwner(account.value);

        // Defensive check for nfts array
        if (!Array.isArray(nfts)) {
            console.error("Unexpected response format from getNFTsByOwner");
            return;
        }

        const updatedListings = await Promise.all(
            nfts.map(async (nft) => {
                // Defensive programming for NFT object structure
                if (!nft) return null;

                try {
                    // Handle different possible NFT data structures
                    const tokenId = typeof nft === 'object'
                        ? (nft.tokenId?.toNumber?.() ?? nft.tokenId ?? nft)
                        : nft;

                    const price = nft.price
                        ? ethers.utils.formatUnits(nft.price, 18)
                        : '0';

                    const seller = nft.seller ?? account.value;

                    // Fetch metadata
                    const metadata = await fetchNFTMetadata(tokenId);

                    return {
                        tokenId,
                        price,
                        seller,
                        ...metadata,
                    };
                } catch (error) {
                    console.error(`Error processing NFT:`, error);
                    return null;
                }
            })
        );

        // Filter out null values and update the ref
        userNFTs.value = updatedListings.filter(nft => nft !== null);
        console.log(userNFTs.value);
    } catch (error) {
        console.error("Error fetching NFTs:", error);
        userNFTs.value = []; // Reset to empty array on error
    }
};

const fetchNFTMetadata = async (tokenId) => {
    try {
        if (!tokenContract.value || !tokenId) {
            throw new Error("Contract or tokenId not available");
        }

        const tokenURI = await tokenContract.value.tokenURI(tokenId);
        const ipfsGateway = 'https://pink-glamorous-hawk-591.mypinata.cloud/ipfs/';
        const cleanTokenURI = tokenURI.replace('ipfs://', '');
        const metadataUrl = `${ipfsGateway}${cleanTokenURI}`;

        const response = await fetch(metadataUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        return {
            name: data.name || `NFT #${tokenId}`,
            description: data.description || 'No description available',
            image: data.image.replace('ipfs://', ipfsGateway),
        };
    } catch (error) {
        console.error(`Failed to fetch metadata for NFT #${tokenId}:`, error);
        return {
            name: `NFT #${tokenId}`,
            description: 'Metadata unavailable',
            image: `/api/placeholder/350/350?text=NFT+${tokenId}`
        };
    }
};
const startAuction = (tokenId) => {
    auctionDetails.value.tokenId = tokenId
    showAuctionModal.value = true
}

const confirmAuction = async () => {
    try {
        const { tokenId, startingPrice, duration } = auctionDetails.value

        const tx = await contract.value.startAuction(
            tokenId,
            ethers.utils.parseUnits(startingPrice.toString(), 18),
            duration
        )
        await tx.wait()

        successMessage.value = `Auction started for NFT #${tokenId}`
        showAuctionModal.value = false
        await fetchNFTListings()
    } catch (error) {
        errorMessage.value = 'Failed to start auction'
        console.error(error)
    }
}
onMounted(async () => {
    try {
        // Attempt to connect wallet first
        await connectWallet().catch(error => {
            console.warn("Wallet connection failed:", error);
        });

        // Get contract instance
        contract.value = getContract();
        tokenContract.value = getTokenContract()

        // Set account
        account.value = userAccount.value;

        // Only proceed if contract and account are available
        if (contract.value && account.value) {
            await Promise.all([
                fetchUserNFTs(),
                fetchLeaderboard(),
                fetchBalance()
            ]);
        }
    } catch (error) {
        console.error("Mounted hook error:", error);
    }
});

</script>
