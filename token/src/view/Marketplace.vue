<!-- NFTMarketplace.vue -->
<template>
    <div>
        <Navbar />
    </div>
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
        <div class="container mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-center mb-8 text-white">NFT Marketplace</h1>

            <!-- Wallet Connection -->
            <!-- <div class="mb-6 flex justify-end">
                <button @click="connectWallet"
                    class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
                    {{ userAccount ? shortenAddress(userAccount) : 'Connect Wallet' }}
                </button>
            </div> -->

            <!-- NFT Listings -->
            <div class="grid md:grid-cols-3 gap-6">
                <div v-for="nft in nftListings" :key="nft.tokenId"
                    class="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 transform transition hover:scale-105 relative">
                    <!-- NFT Image Placeholder -->
                    <!-- <div class="bg-gray-700 h-[12rem] flex items-center justify-center">
                        <div class="w-full h-full relative">
                            <img :src="nft.image" :alt="nft.name" class="w-full aspect-square object-cover" />
                        </div>
                    </div> -->
                    <div> <img :src="nft.image" :alt="nft.name" class="w-full aspect-square object-cover" /></div>

                    <div class="p-5">
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-lg font-semibold text-indigo-400">{{ nft.name }}</span>
                            <span class="text-green-400 font-medium">
                                {{ formatPrice(nft.price) }} JoJo
                            </span>
                        </div>

                        <!-- Seller Information -->
                        <div class="text-sm text-gray-400 mb-2 flex items-center">
                            <span class="mr-2">Seller:</span>
                            <span class="hover:text-white transition">
                                {{ shortenAddress(nft.seller) }}
                            </span>
                        </div>

                        <!-- Description with Tooltip -->
                        <div class="group relative mb-4">
                            <span class="text-gray-500 text-sm truncate block">
                                {{ nft.description }}
                            </span>
                            <div class="absolute z-10 p-2 bg-gray-700 text-white text-sm rounded shadow-lg 
                                opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                                pointer-events-none -top-2 left-0 transform -translate-y-full 
                                max-w-xs overflow-hidden">
                                {{ nft.description }}
                            </div>
                        </div>

                        <div class="space-y-3">
                            <button @click="purchaseNFT(nft.tokenId)"
                                class="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                                :disabled="!userAccount">
                                {{ userAccount ? 'Purchase' : 'Connect Wallet' }}
                            </button>

                            <!-- <button @click="startAuction(nft.tokenId)"
                                class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                                :disabled="!userAccount">
                                Start Auction
                            </button> -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Auction Modal -->
            <!-- <div v-if="showAuctionModal"
                class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div class="bg-gray-800 rounded-xl p-6 w-full max-w-md">
                    <h2 class="text-2xl font-bold mb-4 text-white">Start Auction</h2>

                    <div class="space-y-4">
                        <input v-model="auctionDetails.startingPrice" type="number"
                            placeholder="Starting Price (Tokens)"
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
            </div> -->

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
import { ref, onMounted } from 'vue'
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
const nftListings = ref([])
const showAuctionModal = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const contract = ref(null)
const tokenContract = ref(null)
const auctionlist = ref(null)
const auctionDetails = ref({
    tokenId: null,
    startingPrice: null,
    duration: null
})
// Modify the fetchNFTListings to call fetchNFTMetadata
const fetchNFTListings = async () => {
    try {
        const listings = await contract.value.getAllNFTsForSale()

        // Fetch metadata for each NFT
        const updatedListings = await Promise.all(
            listings.map(async (listing) => {
                const tokenId = listing.tokenId.toNumber()
                const price = ethers.utils.formatUnits(listing.price, 18)
                const seller = listing.seller

                // Fetch the metadata for each NFT using the tokenId
                const metadata = await fetchNFTMetadata(tokenId)

                return {
                    tokenId,
                    price,
                    seller,
                    ...metadata, // Add the metadata fields here
                }
            })
        )

        nftListings.value = updatedListings
    } catch (error) {
        errorMessage.value = 'Failed to fetch NFT listings'
        console.error(error)
    }
}

// Update fetchNFTMetadata to return metadata for each NFT
const fetchNFTMetadata = async (tokenId) => {
    try {
        // Get the token URI from the contract
        const tokenURI = await contract.value.tokenURI(tokenId)

        // Construct the full IPFS URL using the provided Pinata gateway
        const ipfsGateway = 'https://pink-glamorous-hawk-591.mypinata.cloud/ipfs/'
        const cleanTokenURI = tokenURI.replace('ipfs://', '')
        const metadataUrl = `${ipfsGateway}${cleanTokenURI}`

        // Fetch the metadata
        const response = await axios.get(metadataUrl)

        // Process the image URL to use the full IPFS gateway path
        const imageUrl = response.data.image.replace('ipfs://', ipfsGateway)

        return {
            name: response.data.name || `NFT #${tokenId}`,
            description: response.data.description || 'No description available',
            image: imageUrl,
        }
    } catch (error) {
        console.error(`Failed to fetch metadata for NFT #${tokenId}:`, error)

        // Return a default object with placeholder data
        return {
            name: `NFT #${tokenId}`,
            description: 'Metadata unavailable',
            image: `https://via.placeholder.com/350x350?text=NFT+${tokenId}`
        }
    }
}


// Purchase NFT
const purchaseNFT = async (tokenId) => {
    try {
        // Ensure wallet is connected
        if (!userAccount.value) {
            await connectWallet()
        }

        // Verify contracts are properly initialized
        if (!contract.value || !tokenContract.value) {
            errorMessage.value = 'Contracts not initialized'
            return
        }

        // Get the NFT listing
        const nftListing = nftListings.value.find(listing => listing.tokenId === tokenId)
        if (!nftListing) {
            errorMessage.value = 'NFT not found'
            return
        }

        // Convert price to wei
        const priceInWei = ethers.utils.parseUnits(nftListing.price.toString(), 18)

        // Check token balance
        const tokenBalance = await tokenContract.value.balanceOf(userAccount.value)

        if (tokenBalance.lt(priceInWei)) {
            errorMessage.value = 'Insufficient token balance'
            return
        }

        // Approve token spending for the full price (seller amount + listing fee)
        await approveTokenSpending(priceInWei)

        // Purchase the NFT
        const tx = await contract.value.purchaseWithToken(tokenId)
        await tx.wait()

        successMessage.value = `Successfully purchased NFT #${tokenId}`
        await fetchNFTListings()
    } catch (error) {
        // Improved error handling
        if (error.reason) {
            errorMessage.value = error.reason
        } else if (error.message) {
            errorMessage.value = error.message
        } else {
            errorMessage.value = 'NFT purchase failed'
        }
        console.error('Purchase Error:', error)
    }
}

// Updated approval function to match contract requirements
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

// Start Auction
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

// Utility Functions
const shortenAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatPrice = (price) => {
    return Number(price).toFixed(2)
}

// Lifecycle Hook
onMounted(async () => {
    try {
        // Connect wallet
        await connectWallet()
        // contra.value = getContract()
        // Get NFT Store contract
        tokenContract.value = getContract()
        contract.value = getTokenContract()

        // Only proceed if contract and admin status are confirmed
        if (contract.value) {
            // Fetch initial data
            await Promise.all([
                fetchNFTListings()
            ])
        }
    } catch (error) {
        console.error("Mounted hook error:", error)
    }
})
</script>