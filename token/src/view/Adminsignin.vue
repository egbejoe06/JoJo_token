<template>
    <div class="flex justify-center items-center h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div class="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-white mb-2">Admin Portal</h2>
                <p class="text-gray-400">Sign in to your admin account</p>
            </div>
            <form @submit.prevent="handleLogin">
                <!-- Username -->
                <div class="mb-4">
                    <label class="block text-gray-300 font-medium mb-2" for="username">
                        Username
                    </label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20"
                                fill="currentColor">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                    clip-rule="evenodd" />
                            </svg>
                        </span>
                        <input v-model="username" id="username" type="text" placeholder="Enter username"
                            class="w-full pl-10 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            required />
                    </div>
                </div>

                <!-- Password -->
                <div class="mb-6">
                    <label class="block text-gray-300 font-medium mb-2" for="password">
                        Password
                    </label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20"
                                fill="currentColor">
                                <path fill-rule="evenodd"
                                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                    clip-rule="evenodd" />
                            </svg>
                        </span>
                        <input v-model="password" id="password" type="password" placeholder="Enter password"
                            class="w-full pl-10 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            required />
                    </div>
                </div>

                <!-- Login Button -->
                <button type="submit"
                    class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition transform hover:scale-[1.02]">
                    Sign In
                </button>
            </form>

            <!-- Error Message -->
            <p v-if="errorMessage" class="mt-4 text-center text-red-400 bg-red-900/20 p-2 rounded">
                {{ errorMessage }}
            </p>

            <!-- Success Message -->
            <p v-if="successMessage" class="mt-4 text-center text-green-400 bg-green-900/20 p-2 rounded">
                {{ successMessage }}
            </p>
        </div>
    </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import { ethers } from "ethers";
import { useWallet } from '../composable/useWallet';
import { useRouter } from "vue-router";

const router = useRouter()

const {
    connectWallet,
    getContract,
    userAccount,
    connected
} = useWallet();

const username = ref("")
const password = ref("")
const errorMessage = ref("")
const successMessage = ref("")

const contract = ref(null);

const handleLogin = async () => {
    errorMessage.value = "";
    successMessage.value = "";

    if (!contract.value) {
        errorMessage.value = "Contract not initialized. Please reconnect your wallet.";
        return;
    }

    try {
        // Call the login function
        const tx = await contract.value.login(username.value, password.value);
        await tx.wait(); // Wait for the transaction to be mined

        successMessage.value = "Login successful!";
        router.push("/admin-dashboard")
    } catch (error) {
        console.error("Login error:", error);
        const rpcError = error.data?.message || error.message;
        if (rpcError.includes("execution reverted")) {
            errorMessage.value = rpcError.split("execution reverted:")[1]?.trim() || "Login failed.";
        } else {
            errorMessage.value = "An unexpected error occurred. Please try again.";
        }
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
    } catch (error) {
        console.error("Mounted hook error:", error);
    }
});
</script>