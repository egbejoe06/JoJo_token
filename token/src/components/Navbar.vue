<template>
    <nav class="bg-gray-900 text-white">
        <div class="container mx-auto px-6 py-4">
            <div class="flex justify-between items-center">
                <!-- Logo and Brand -->
                <div class="flex items-center space-x-4">
                    <!-- <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-500" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg> -->
                    <span class="text-xl font-bold">JoJo Token</span>
                </div>

                <!-- Navigation Links - Desktop -->
                <div class="hidden md:flex items-center space-x-6">
                    <template v-for="item in navItems" :key="item.path">
                        <router-link v-if="item.show" :to="item.path"
                            class="hover:text-blue-400 transition-colors duration-200"
                            :class="{ 'text-blue-400': router.currentRoute.value.path === item.path }">
                            {{ item.name }}
                        </router-link>
                    </template>
                </div>

                <!-- Connect Wallet Button -->
                <div class="flex items-center space-x-4">
                    <button v-if="!isconnected" @click="connect"
                        class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors duration-300">
                        Connect Wallet
                    </button>
                    <div v-else class="bg-gray-800 px-4 py-2 rounded-lg text-gray-300">
                        {{ balance }} JoJo
                    </div>

                    <!-- Mobile Menu Button -->
                    <button @click="toggleMobileMenu" class="md:hidden">
                        <svg v-if="!isMobileMenuOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Mobile Navigation Menu -->
            <transition enter-active-class="transition ease-out duration-200"
                enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-1">
                <div v-show="isMobileMenuOpen" class="md:hidden mt-4 space-y-2">
                    <template v-for="item in navItems" :key="item.path">
                        <router-link v-if="item.show" :to="item.path" @click="isMobileMenuOpen = false"
                            class="block py-2 px-4 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                            :class="{ 'bg-gray-800': router.currentRoute.value.path === item.path }">
                            {{ item.name }}
                        </router-link>
                    </template>
                </div>
            </transition>
        </div>
    </nav>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useWallet } from '../composable/useWallet';
import { ethers } from "ethers";

const router = useRouter();
const isMobileMenuOpen = ref(false);
const {
    connectWallet,
    getContract,
    userAccount,
    connected
} = useWallet()
const contract = ref(null)
const balance = ref(0);
const account = ref("");
const isconnected = computed(() => Boolean(userAccount.value));

const truncatedAddress = computed(() => {
    if (!userAccount.value) return '';
    return `${userAccount.value.slice(0, 6)}...${userAccount.value.slice(-4)}`;
});

const isAdmin = ref(false);

const navItems = computed(() => [
    { name: 'Home', path: '/', show: true },
    { name: 'Marketplace', path: '/marketplace', show: isconnected.value },
    { name: 'Auction', path: '/auction', show: isconnected.value },
    { name: 'Dashboard', path: '/dashboard', show: isconnected.value },
    { name: 'Admin Dashboard', path: '/admin-dashboard', show: isAdmin.value },
    { name: 'Admin NFT Dashboard', path: '/admin-dashboard-nft', show: isAdmin.value },
]);

const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const checkAdminStatus = async () => {
    try {
        if (!contract.value || !userAccount.value) return false;
        isAdmin.value = await contract.value.admins(userAccount.value);
        return isAdmin.value;
    } catch (error) {
        console.error("Admin check error:", error);
        return false;
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

onMounted(async () => {
    try {
        await connectWallet();
        contract.value = getContract();
        account.value = userAccount.value;

        if (contract.value) {
            await fetchBalance();
        }

        await checkAdminStatus();
    } catch (error) {
        console.error("Mounted hook error:", error);
    }
});

const connect = async () => {
    try {
        await connectWallet();
    } catch (error) {
        console.error('Failed to connect wallet:', error);
    }
};
</script>