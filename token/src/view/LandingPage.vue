<template>
    <div class="min-h-screen bg-gray-900 text-white flex flex-col">
        <!-- Navigation -->
        <div>
            <Navbar />
        </div>

        <!-- Hero Section -->
        <main class="container mx-auto px-6 flex-grow flex flex-col justify-center items-center text-center">
            <h1
                class="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                Welcome to the World of JoJo Token
            </h1>

            <p class="text-xl text-gray-400 max-w-2xl mb-8">
                The JoJo Token ecosystem empowers users with daily rewards, airdrops, and NFT opportunities. Experience
                the future of decentralized finance with JoJo.
            </p>
            <button @click="navToDashboard()"
                class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-3 rounded-full text-white font-semibold transition-all duration-300 transform hover:-translate-y-1 hover:scale-110">
                Claim Your First JoJo Token
            </button>
        </main>

        <!-- Features Section -->
        <section class="container mx-auto px-6 py-16">
            <div class="grid md:grid-cols-3 gap-8">
                <div class="bg-gray-800 p-6 rounded-lg text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-blue-500" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <h3 class="text-xl font-semibold mb-2">Airdrops</h3>
                    <p class="text-gray-400">Claim daily tokens and participate in special giveaways.</p>
                </div>

                <div class="bg-gray-800 p-6 rounded-lg text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-green-500" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 class="text-xl font-semibold mb-2">NFT Marketplace</h3>
                    <p class="text-gray-400">Use JoJo Tokens to mint, trade, or auction exclusive NFTs.</p>
                </div>

                <div class="bg-gray-800 p-6 rounded-lg text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-purple-500" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 class="text-xl font-semibold mb-2">Convertibility</h3>
                    <p class="text-gray-400">Easily convert tokens into NFTs or back into JoJo Tokens.</p>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-800 py-6 text-center">
            <p class="text-gray-500">&copy; 2024 JoJo Token. All rights reserved.</p>
        </footer>
    </div>
</template>


<script setup>
import { ref } from 'vue';
import { useWallet } from '../composable/useWallet';
import { useRouter } from "vue-router";
import Navbar from '../components/Navbar.vue';

const { connectWallet, connected, signInWithEthereum, getContract, userAccount } = useWallet();
const isconnected = ref(false)
const truncatedAddress = ref(null)
const router = useRouter();

const navToDashboard = () => {
    router.push("/dashboard")
}

const connect = async () => {
    try {
        if (!connected.value) {
            await connectWallet();
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!connected.value) {
            throw new Error("Failed to connect wallet");
        }
        const getWalletAddress = async () => {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            return accounts[0]; // Return the first account
        };
        isconnected.value = true
        const walletAddress = await getWalletAddress();

        // Truncate the wallet address
        truncatedAddress.value = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
        console.log('Wallet Address:', truncatedAddress);
        const signature = await signInWithEthereum();
        console.log('Signature:', signature);

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
};
</script>
