import { createRouter, createWebHistory } from "vue-router";
import welcomepage from "../view/LandingPage.vue";
import Dashboard from "../view/Dashboard.vue";
import Adminsignin from "../view/Adminsignin.vue";
import AdminDashboard from "../view/AdminDashboard.vue";
import AdminNftDashboard from "../view/AdminNftDashboard.vue";
import Marketplace from "../view/Marketplace.vue";
import Auction from "../view/Auction.vue";

const routes = [
  {
    path: "/",
    name: "LandingPage",
    component: welcomepage,
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
  },
  {
    path: "/admin-sign-in",
    name: "Signin",
    component: Adminsignin,
  },
  {
    path: "/admin-dashboard",
    name: "AdminDashboard",
    component: AdminDashboard,
  },
  {
    path: "/admin-dashboard-nft",
    name: "AdminDashboardNft",
    component: AdminNftDashboard,
  },
  {
    path: "/marketplace",
    name: "Marketplace",
    component: Marketplace,
  },
  {
    path: "/auction",
    name: "auction",
    component: Auction,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
