<template>
    <div>
        <Navbar />
    </div>
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
        <div class="container mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-center mb-8 text-white">NFT Store Admin Dashboard</h1>

            <!-- Admin Connection Check -->
            <div v-if="!isAdmin" class="text-center bg-red-900/20 p-4 rounded-lg mb-6">
                <p class="text-red-400">Only contract admins can access this dashboard</p>
            </div>

            <!-- Admin Functions Section -->
            <div v-if="isAdmin" class="space-y-6">
                <!-- Create NFT Section -->
                <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <h2 class="text-xl font-semibold mb-4 text-indigo-400">Create New NFT</h2>
                    <div class="space-y-4">
                        <div class="grid md:grid-cols-2 gap-4">
                            <input v-model="nftName" type="text" placeholder="NFT Name"
                                class="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500" />

                            <input v-model="nftPrice" type="number" placeholder="Price (Tokens)"
                                class="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500" />
                        </div>

                        <div class="flex items-center justify-center w-full">
                            <label
                                class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                                <div class="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg class="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12">
                                        </path>
                                    </svg>
                                    <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                        <span class="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">
                                        {{ nftFile ? nftFile.name : 'PNG, JPG, or GIF (Max 10MB)' }}
                                    </p>
                                </div>
                                <input type="file" class="hidden" @change="handleFileUpload"
                                    accept=".jpg,.jpeg,.png,.gif" />
                            </label>
                        </div>

                        <textarea v-model="nftDescription" placeholder="NFT Description"
                            class="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500 h-32"></textarea>

                        <button @click="createNFT" :disabled="isUploading"
                            class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                            {{ isUploading ? 'Uploading...' : 'Create NFT' }}
                        </button>
                    </div>
                </div>

                <!-- Listing Fee Management -->
                <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <h2 class="text-xl font-semibold mb-4 text-green-400">Listing Fee Management</h2>
                    <div class="space-y-4">
                        <div class="flex items-center">
                            <input v-model="listingFeePercent" type="number" min="0" max="100"
                                placeholder="Listing Fee Percentage"
                                class="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500 mr-4" />
                            <button @click="updateListingFee"
                                class="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition">
                                Update Fee
                            </button>
                        </div>
                        <p class="text-gray-400">Current Listing Fee: {{ currentListingFee }}%</p>
                    </div>
                </div>

                <!-- Withdraw Fees -->
                <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <h2 class="text-xl font-semibold mb-4 text-blue-400">Collected Fees</h2>
                    <div class="space-y-4">
                        <p class="text-gray-400">Total Collected Fees: {{ collectedFees }} Tokens</p>
                        <button @click="withdrawFees"
                            class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
                            Withdraw Fees
                        </button>
                    </div>
                </div>
            </div>

            <!-- Action Feedback -->
            <div class="mt-8">
                <p v-if="successMessage" class="text-center text-green-400 bg-green-900/20 p-4 rounded-lg">
                    {{ successMessage }}
                </p>
                <p v-if="errorMessage" class="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
                    {{ errorMessage }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ethers } from 'ethers'
import axios from 'axios'
import { useWallet } from '../composable/useWallet'
import Navbar from '../components/Navbar.vue'

const {
    connectWallet,
    getTokenContract,
    userAccount,
    getContract,
} = useWallet()

// Pinata Configuration
const PINATA_JWT = import.meta.VITE.PINATA_JWT

// State variables
const contract = ref(null)
const isAdmin = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// NFT Creation Variables
const nftName = ref('')
const nftDescription = ref('')
const nftPrice = ref(null)
const nftFile = ref(null)
const isUploading = ref(false)

// Fee Management Variables
const listingFeePercent = ref(0)
const currentListingFee = ref(0)
const collectedFees = ref(0)

// File upload handler
const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            errorMessage.value = 'File size exceeds 10MB limit'
            return
        }
        nftFile.value = file
    }
}

// Upload to IPFS via Pinata
const uploadToIPFS = async () => {
    if (!nftFile.value) {
        throw new Error('No file selected')
    }

    isUploading.value = true
    const formData = new FormData()
    formData.append('file', nftFile.value)

    const pinataMetadata = JSON.stringify({
        name: nftName.value,
    })
    formData.append('pinataMetadata', pinataMetadata)

    try {
        // Upload file to Pinata
        const fileResponse = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${PINATA_JWT}`
                }
            }
        )

        // Create metadata JSON
        const metadata = {
            name: nftName.value,
            description: nftDescription.value,
            image: `ipfs://${fileResponse.data.IpfsHash}`
        }

        // Upload metadata to Pinata
        const metadataResponse = await axios.post(
            'https://api.pinata.cloud/pinning/pinJSONToIPFS',
            metadata,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${PINATA_JWT}`
                }
            }
        )

        isUploading.value = false
        return `ipfs://${metadataResponse.data.IpfsHash}`
    } catch (error) {
        isUploading.value = false
        throw error
    }
}

// Create NFT
const createNFT = async () => {
    // Validate inputs
    if (!nftName.value || !nftPrice.value || !nftFile.value) {
        errorMessage.value = 'Please fill in all fields'
        return
    }

    try {
        // Upload to IPFS
        const tokenURI = await uploadToIPFS()

        // Create NFT via contract
        const tx = await contract.value.createToken(
            tokenURI,
            ethers.utils.parseUnits(nftPrice.value.toString(), 18)
        )
        await tx.wait()

        // Reset form
        nftName.value = ''
        nftDescription.value = ''
        nftPrice.value = null
        nftFile.value = null

        successMessage.value = 'NFT Created Successfully!'
        errorMessage.value = ''
    } catch (error) {
        console.error(error)
        errorMessage.value = error.message || 'Failed to create NFT'
        successMessage.value = ''
    }
}

// Update Listing Fee
const updateListingFee = async () => {
    try {
        const tx = await contract.value.updateListingFeePercent(listingFeePercent.value)
        await tx.wait()

        successMessage.value = 'Listing Fee Updated Successfully!'
        errorMessage.value = ''

        // Refresh current listing fee
        await fetchListingFee()
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Failed to update listing fee'
        successMessage.value = ''
    }
}

// Withdraw Collected Fees
const withdrawFees = async () => {
    try {
        const tx = await contract.value.withdrawFees()
        await tx.wait()

        successMessage.value = 'Fees Withdrawn Successfully!'
        errorMessage.value = ''

        // Refresh collected fees
        await fetchCollectedFees()
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Failed to withdraw fees'
        successMessage.value = ''
    }
}

// Fetch current listing fee
const fetchListingFee = async () => {
    if (!contract.value) return

    try {
        const fee = await contract.value.listingFeePercent()
        currentListingFee.value = fee.toNumber()
    } catch (error) {
        console.error('Failed to fetch listing fee', error)
    }
}

// Fetch collected fees
const fetchCollectedFees = async () => {
    if (!contract.value) return

    try {
        // Get the payment token contract instance
        const tokenContract = getTokenContract() // Assuming this method exists in your useWallet composable

        // Get the NFT store contract address to check its balance
        const nftStoreAddress = contract.value.address

        const balance = await tokenContract.balanceOf(nftStoreAddress)
        collectedFees.value = ethers.utils.formatUnits(balance, 18)
    } catch (error) {
        console.error('Failed to fetch collected fees', error)
    }
}

// Admin check
const checkAdminStatus = async () => {
    try {
        if (!contra.value || !userAccount.value) return false

        isAdmin.value = await contra.value.admins(userAccount.value)
        return isAdmin.value
    } catch (error) {
        console.error("Admin check error:", error)
        return false
    }
}

const contra = ref(null)

// Initial setup on component mount
onMounted(async () => {
    try {
        // Connect wallet
        await connectWallet()
        contra.value = getContract()
        // Get NFT Store contract
        contract.value = getTokenContract()

        // Check admin status
        const isAdminUser = await checkAdminStatus()

        // Only proceed if contract and admin status are confirmed
        if (contract.value && isAdminUser) {
            // Fetch initial data
            await Promise.all([
                fetchListingFee(),
                fetchCollectedFees()
            ])
        }
    } catch (error) {
        console.error("Mounted hook error:", error)
    }
})
</script>