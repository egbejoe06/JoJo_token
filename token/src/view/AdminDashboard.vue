<template>
    <div>
        <Navbar />
    </div>
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
        <div class="container mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-center mb-8 text-white">JoJo Token Admin Dashboard</h1>

            <!-- Admin Connection Check -->
            <div v-if="!isAdmin" class="text-center bg-red-900/20 p-4 rounded-lg mb-6">
                <p class="text-red-400">Only contract admins can access this dashboard</p>
            </div>

            <!-- Admin Functions Section -->
            <div v-if="isAdmin" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Daily Reward Setting -->
                <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <h2 class="text-xl font-semibold mb-4 text-indigo-400">Set Daily Reward</h2>
                    <div class="space-y-4">
                        <input v-model="dailyReward" type="number" placeholder="Daily Reward Amount"
                            class="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500" />
                        <button @click="setDailyReward"
                            class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition">
                            Update Daily Reward
                        </button>
                    </div>
                </div>

                <!-- Gift Code Reward Setting -->
                <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <h2 class="text-xl font-semibold mb-4 text-green-400">Manage Gift Codes</h2>
                    <div class="space-y-4">
                        <input v-model="giftCodeReward" type="number" placeholder="Gift Code Reward Amount"
                            class="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500" />
                        <button @click="setGiftCodeReward"
                            class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition mb-4">
                            Update Gift Code Reward
                        </button>

                        <input v-model="newGiftCode" type="text" placeholder="New Gift Code"
                            class="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500" />
                        <button @click="addGiftCode"
                            class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition">
                            Add Gift Code
                        </button>
                    </div>
                </div>

                <!-- Token to ETH Rate Setting -->
                <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <h2 class="text-xl font-semibold mb-4 text-blue-400">Token Conversion Rates</h2>
                    <div class="space-y-4">
                        <input v-model="tokenToEthRate" type="number" step="0.00001" placeholder="Token to ETH Rate"
                            class="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500" />
                        <input v-model="preSaleRate" type="number" placeholder="Pre-Sale Rate"
                            class="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500" />
                        <button @click="updateRates"
                            class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
                            Update Rates
                        </button>
                    </div>
                </div>

                <!-- Leaderboard -->
                <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg col-span-full">
                    <h2 class="text-xl font-semibold mb-4 text-purple-400">Token Holders Leaderboard</h2>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead>
                                <tr class="bg-gray-700">
                                    <th class="p-3">Rank</th>
                                    <th class="p-3">Address</th>
                                    <th class="p-3">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(holder, index) in leaderboard" :key="holder.address"
                                    class="border-b border-gray-700 hover:bg-gray-700 transition">
                                    <td class="p-3">{{ index + 1 }}</td>
                                    <td class="p-3">{{ holder.address }}</td>
                                    <td class="p-3">{{ holder.balance }} JoJo</td>
                                </tr>
                            </tbody>
                        </table>
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
import { useWallet } from '../composable/useWallet'
import Navbar from '../components/Navbar.vue';

const {
    connectWallet,
    getContract,
    userAccount,
    connected
} = useWallet()

// Reactive state variables
const contract = ref(null)
const dailyReward = ref(20)
const giftCodeReward = ref(1000)
const newGiftCode = ref('')
const tokenToEthRate = ref(0.00001)
const preSaleRate = ref(0.00002)
const leaderboard = ref([])
const successMessage = ref('')
const errorMessage = ref('')
const isAdmin = ref(false)

// Check if the current user is an admin
const checkAdminStatus = async () => {
    try {
        if (!contract.value || !userAccount.value) return false

        isAdmin.value = await contract.value.admins(userAccount.value)
        return isAdmin.value
    } catch (error) {
        console.error("Admin check error:", error)
        return false
    }
}
// Set daily reward amount
const setDailyReward = async () => {
    try {
        if (!contract.value) throw new Error('Contract not initialized')

        const tx = await contract.value.setDailyReward(
            ethers.utils.parseUnits(dailyReward.value.toString(), 18)
        )
        await tx.wait()

        successMessage.value = `Daily reward set to ${dailyReward.value} tokens`
        errorMessage.value = ''
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Failed to set daily reward'
        successMessage.value = ''
    }
}

// Set gift code reward amount
const setGiftCodeReward = async () => {
    try {
        if (!contract.value) throw new Error('Contract not initialized')

        const tx = await contract.value.setGiftCodeReward(
            ethers.utils.parseUnits(giftCodeReward.value.toString(), 18)
        )
        await tx.wait()

        successMessage.value = `Gift code reward set to ${giftCodeReward.value} tokens`
        errorMessage.value = ''
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Failed to set gift code reward'
        successMessage.value = ''
    }
}

// Add a new gift code
const addGiftCode = async () => {
    if (!newGiftCode.value) {
        errorMessage.value = 'Please enter a gift code'
        return
    }

    try {
        if (!contract.value) throw new Error('Contract not initialized')

        const tx = await contract.value.addGiftCode(newGiftCode.value)
        await tx.wait()

        successMessage.value = `Gift code ${newGiftCode.value} added successfully`
        newGiftCode.value = ''
        errorMessage.value = ''
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Failed to add gift code'
        successMessage.value = ''
    }
}

// Update conversion rates
const updateRates = async () => {
    try {
        if (!contract.value) throw new Error('Contract not initialized')

        const tokenToEthTx = await contract.value.setTokenToEthRate(
            ethers.utils.parseUnits(tokenToEthRate.value.toString(), 18)
        )
        await tokenToEthTx.wait()

        const preSaleTx = await contract.value.setPreSaleRate(
            ethers.utils.parseUnits(preSaleRate.value.toString(), 18)
        )
        await preSaleTx.wait()

        successMessage.value = 'Conversion rates updated successfully'
        errorMessage.value = ''
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Failed to update rates'
        successMessage.value = ''
    }
}

// Fetch leaderboard on component mount
const fetchLeaderboard = async () => {
    if (!contract.value) return;

    try {
        const [addresses, scores] = await contract.value.getLeaderboard();
        leaderboard.value = addresses.map((address, i) => ({
            address,
            balance: ethers.utils.formatUnits(scores[i], 18),
        }));
    } catch (error) {
        console.error("Leaderboard fetch error:", error);
    }
};

// Initial setup on component mount
onMounted(async () => {
    try {
        // Attempt to connect wallet
        await connectWallet();

        // Get contract instance
        contract.value = getContract();

        // Check admin status
        const isAdminUser = await checkAdminStatus();

        // Only proceed if contract and admin status are confirmed
        if (contract.value && isAdminUser) {
            // Fetch initial data
            await Promise.all([
                fetchLeaderboard(),
                // Fetch current rates and rewards for display
                fetchCurrentSettings()
            ]);
        }
    } catch (error) {
        console.error("Mounted hook error:", error);
    }
});

// Fetch current contract settings
const fetchCurrentSettings = async () => {
    if (!contract.value) return;

    try {
        // Fetch current daily reward
        const currentDailyReward = await contract.value.baseDailyReward();
        dailyReward.value = Number(ethers.utils.formatUnits(currentDailyReward, 18));

        // Fetch current gift code reward
        const currentGiftCodeReward = await contract.value.giftCodeReward();
        giftCodeReward.value = Number(ethers.utils.formatUnits(currentGiftCodeReward, 18));

        // Fetch current token to ETH rate
        const currentTokenToEthRate = await contract.value.tokenToEthRate();
        tokenToEthRate.value = Number(ethers.utils.formatUnits(currentTokenToEthRate, 18));

        // Fetch current pre-sale rate
        const currentPreSaleRate = await contract.value.preSaleRate();
        preSaleRate.value = Number(ethers.utils.formatUnits(currentPreSaleRate, 18));
    } catch (error) {
        console.error("Failed to fetch current settings:", error);
    }
};
</script>