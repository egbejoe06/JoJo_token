<template>
    <div>
        <Navbar />
    </div>
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
        <div class="container mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-center mb-8 text-white">Active NFT Auctions</h1>

            <!-- Auction Listings Grid -->
            <div v-if="activeAuctions.length === 0" class="text-center text-gray-400 mt-12">
                No active auctions at the moment.
            </div>

            <div class="grid md:grid-cols-3 gap-6">
                <div v-for="auction in activeAuctions" :key="auction.tokenId"
                    class="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 transform transition hover:scale-105 relative">
                    <!-- NFT Image -->
                    <div class="bg-gray-700 h-64 flex items-center justify-center">
                        <img :src="auction.image" :alt="auction.name" class="object-fill w-full h-full" />
                    </div>

                    <div class="p-5">
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-lg font-semibold text-indigo-400">{{ auction.name }}</span>
                            <span class="text-green-400 font-medium">
                                Highest Bid: {{ formatPrice(auction.highestBid) }} JoJo
                            </span>
                        </div>

                        <!-- Auction Details -->
                        <div class="space-y-2 mb-4">
                            <div class="text-sm text-gray-400 flex justify-between">
                                <span>Starting Price:</span>
                                <span>{{ formatPrice(auction.startingPrice) }} JoJo</span>
                            </div>
                            <div class="text-sm text-gray-400 flex justify-between">
                                <span>Time Remaining:</span>
                                <span :class="{ 'text-red-400': isAuctionEnding(auction) }">
                                    {{ formatTimeRemaining(auction.endTime) }}
                                </span>
                            </div>
                            <div class="text-sm text-gray-400 flex justify-between">
                                <span>Highest Bidder:</span>
                                <span>
                                    {{ auction.highestBidder === '0x0000000000000000000000000000000000000000'
                                        ? 'No bids yet'
                                        : shortenAddress(auction.highestBidder)
                                    }}
                                </span>
                            </div>
                        </div>

                        <!-- Bid Input and Button -->
                        <div class="space-y-3">
                            <input v-model="bidAmounts[auction.tokenId]" type="number" placeholder="Your Bid Amount"
                                class="w-full p-2 bg-gray-700 text-white rounded-lg" :min="getBidMinimum(auction)" />
                            <div class="flex space-x-2">
                                <button @click="placeBid(auction.tokenId)"
                                    class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                                    :disabled="!userAccount || !isValidBid(auction.tokenId)">
                                    {{ userAccount ? 'Place Bid' : 'Connect Wallet' }}
                                </button>
                                <button v-if="canEndAuction(auction)" @click="endAuction(auction.tokenId)"
                                    class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
                                    End Auction
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Feedback Messages -->
            <div class="mt-6">
                <p v-if="errorMessage" class="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
                    {{ errorMessage }}
                </p>
                <p v-if="successMessage" class="text-center text-green-400 bg-green-900/20 p-4 rounded-lg">
                    {{ successMessage }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { ethers } from 'ethers'
import { useWallet } from '../composable/useWallet'
import axios from 'axios'
import Navbar from '../components/Navbar.vue'

const {
    connectWallet,
    getTokenContract,
    userAccount,
    getContract,
} = useWallet()

// State Variables
const activeAuctions = ref([])
const bidAmounts = reactive({})
const errorMessage = ref('')
const successMessage = ref('')
const contract = ref(null)
const tokenContract = ref(null)

// Fetch Active Auction Listings
async function fetchActiveAuctions() {
    try {
        const auctions = await contract.value.getActiveAuctions();
        console.log('Fetched Active Auctions:', auctions);

        activeAuctions.value = await Promise.all(
            auctions.map(async (auction) => {
                const metadata = await fetchNFTMetadata(ethers.BigNumber.from(auction.tokenId).toString());

                return {
                    tokenId: ethers.BigNumber.from(auction.tokenId).toString(),
                    owner: auction.owner,
                    highestBid: ethers.utils.formatUnits(auction.highestBid, 18),
                    highestBidder: auction.highestBidder,
                    startingPrice: ethers.utils.formatUnits(auction.startingPrice, 18),
                    endTime: ethers.BigNumber.from(auction.endTime).toNumber() * 1000, // Convert to milliseconds for easier handling
                    active: auction.active,
                    ...metadata,
                };
            })
        );
    } catch (error) {
        console.error('Error fetching active auctions:', error);
    }
}




// Fetch NFT Metadata 
const fetchNFTMetadata = async (tokenId) => {
    try {
        const tokenURI = await contract.value.tokenURI(tokenId)
        const ipfsGateway = 'https://pink-glamorous-hawk-591.mypinata.cloud/ipfs/'
        const cleanTokenURI = tokenURI.replace('ipfs://', '')
        const metadataUrl = `${ipfsGateway}${cleanTokenURI}`

        const response = await axios.get(metadataUrl)
        const imageUrl = response.data.image.replace('ipfs://', ipfsGateway)

        return {
            name: response.data.name || `NFT #${tokenId}`,
            description: response.data.description || 'No description available',
            image: imageUrl,
        }
    } catch (error) {
        console.error(`Failed to fetch metadata for NFT #${tokenId}:`, error)
        return {
            name: `NFT #${tokenId}`,
            description: 'Metadata unavailable',
            image: `https://via.placeholder.com/350x350?text=NFT+${tokenId}`
        }
    }
}

// Place Bid on an Auction
const placeBid = async (tokenId) => {
    try {
        // Ensure wallet is connected
        if (!userAccount.value) {
            await connectWallet()
        }

        const bidAmount = bidAmounts[tokenId]
        const bidAmountInWei = ethers.utils.parseUnits(bidAmount.toString(), 18)

        // Check token balance
        const tokenBalance = await tokenContract.value.balanceOf(userAccount.value)
        if (tokenBalance.lt(bidAmountInWei)) {
            errorMessage.value = 'Insufficient token balance'
            return
        }

        // Approve token spending
        await approveTokenSpending(bidAmountInWei)

        // Place bid on the auction
        const tx = await contract.value.placeBid(tokenId, bidAmountInWei)
        await tx.wait()

        successMessage.value = `Successfully placed bid of ${bidAmount} JoJo on NFT #${tokenId}`
        await fetchActiveAuctions()
    } catch (error) {
        errorMessage.value = error.reason || 'Bid placement failed'
        console.error('Bid Error:', error)
    }
}

// End Auction
const endAuction = async (tokenId) => {
    try {
        const tx = await contract.value.endAuction(tokenId)
        await tx.wait()

        successMessage.value = `Successfully ended auction for NFT #${tokenId}`
        await fetchActiveAuctions()
    } catch (error) {
        errorMessage.value = error.reason || 'Auction end failed'
        console.error('Auction End Error:', error)
    }
}

// Token Spending Approval
const approveTokenSpending = async (amount) => {
    try {
        const tx = await tokenContract.value.approve(contract.value.address, amount)
        await tx.wait()
    } catch (error) {
        errorMessage.value = 'Token approval failed'
        console.error('Approval Error:', error)
        throw error
    }
}

// Utility Functions
const shortenAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatPrice = (price) => {
    return Number(price).toFixed(2)
}

const formatTimeRemaining = (endTime) => {
    const timeLeft = endTime - Date.now()
    if (timeLeft <= 0) return 'Auction Ended'

    const hours = Math.floor(timeLeft / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
}

// Helper Methods
const getBidMinimum = (auction) => {
    // If no bids yet, use starting price
    return auction.highestBid > 0
        ? (parseFloat(auction.highestBid) * 1.1).toFixed(2)
        : auction.startingPrice
}

const isValidBid = (tokenId) => {
    const bidAmount = bidAmounts[tokenId]
    const auction = activeAuctions.value.find(a => a.tokenId === tokenId)

    return bidAmount && auction &&
        parseFloat(bidAmount) > parseFloat(getBidMinimum(auction))
}

const isAuctionEnding = (auction) => {
    const timeLeft = auction.endTime - Date.now()
    return timeLeft <= (60 * 60 * 1000) // Less than 1 hour remaining
}

const canEndAuction = (auction) => {
    return Date.now() >= auction.endTime &&
        userAccount.value &&
        auction.owner.toLowerCase() === userAccount.value.toLowerCase()
}

// Lifecycle Hook
onMounted(async () => {
    try {
        // Connect wallet
        await connectWallet()

        // Get contracts
        tokenContract.value = getContract()
        contract.value = getTokenContract()

        // Fetch active auctions
        if (contract.value) {
            await fetchActiveAuctions()
        }
    } catch (error) {
        console.error("Mounted hook error:", error)
    }
})
</script>