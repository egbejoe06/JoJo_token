import { ref } from "vue";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../constant/tokenContract";
import {
  Nft_CONTRACT_ADDRESS,
  Nft_CONTRACT_ABI,
} from "../constant/NftContract";

let provider = null;
let signer = null;
let contractInstance = null;
let tokenContractInstance = null;

// Vue reactive state
const connected = ref(false);
const userAccount = ref("");
const isAuthenticated = ref(false);

export const useWallet = () => {
  const connectWallet = async () => {
    // Check if MetaMask is installed
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAccount.value = await signer.getAddress();
        connected.value = true;

        contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );
        tokenContractInstance = new ethers.Contract(
          Nft_CONTRACT_ADDRESS,
          Nft_CONTRACT_ABI,
          signer
        );

        window.ethereum.on("accountsChanged", handleAccountsChanged);
        return contractInstance, tokenContractInstance;
      } catch (error) {
        connected.value = false;
        console.error("Error connecting wallet:", error);
        throw error;
      }
    } else {
      // Handle mobile deep linking with return URL
      const currentUrl = encodeURIComponent(window.location.href);

      // Universal Link format
      let metamaskAppDeepLink;
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // iOS needs a different format
        metamaskAppDeepLink = `metamask://dapp/${window.location.host}?redirect=${currentUrl}`;
      } else {
        // Android format
        metamaskAppDeepLink = `https://metamask.app.link/dapp/${window.location.host}?redirect=${currentUrl}`;
      }

      // For debugging
      console.log("Redirecting to:", metamaskAppDeepLink);

      if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
        window.location.href = metamaskAppDeepLink;
      } else {
        throw new Error("Please install MetaMask!");
      }
    }
  };

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      connected.value = false;
      userAccount.value = "";
    } else {
      userAccount.value = accounts[0];
      connected.value = true;
    }
  };

  if (window.ethereum) {
    window.ethereum
      .request({ method: "eth_accounts" })
      .then(async (accounts) => {
        if (accounts.length > 0) {
          await connectWallet();
        }
      });
  }

  const getContract = () => contractInstance;
  const getTokenContract = () => tokenContractInstance;

  const signInWithEthereum = async () => {
    if (!connected.value) {
      throw new Error("Wallet not connected");
    }

    const domain = window.location.host;
    const nonce = Math.floor(Math.random() * 1000000).toString();
    const currentTime = new Date().toISOString();

    const message = `${domain} wants you to sign in with your Ethereum account:
${userAccount.value}

I accept the Terms of Service: https://${domain}/tos

URI: https://${domain}
Version: 1
Chain ID: 11155111
Nonce: ${nonce}
Issued At: ${currentTime}`;

    try {
      const signature = await signer.signMessage(message);
      isAuthenticated.value = true;
      return signature;
    } catch (error) {
      console.error("Error signing message:", error);
      throw error;
    }
  };

  return {
    connected,
    userAccount,
    connectWallet,
    getContract,
    isAuthenticated,
    signInWithEthereum,
    getTokenContract,
  };
};
