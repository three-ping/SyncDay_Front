// stores/useGithubAuthStore.js
import { defineStore } from "pinia";
import axios from "axios";

export const useGithubAuthStore = defineStore("githubAuth", {
  state: () => ({
    accessToken: localStorage.getItem("github_token"),
    userInfo: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: state => !!state.accessToken,
    username: state => state.userInfo?.login,
    avatarUrl: state => state.userInfo?.avatar_url,
    hasError: state => !!state.error,
    // getter to return accessToken
    getAccessToken: state => {
      if (!state.accessToken) {
        const storedToken = localStorage.getItem("github_token");
        if (storedToken) {
          state.accessToken = storedToken;
        }
      }
      return state.accessToken;
    },
  },

  actions: {
    loginWithGithub() {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI;
      const scope = "read:user read:repo read:org read:project";

      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem("github_auth_redirect", currentPath);

      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    },

    async handleAuthCallback(code) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await axios.get(`user/oauth2/github/access_token?code=${code}`);

        if (response.data.success) {
          const accessToken = response.data.data;
          this.setAccessToken(accessToken);
          await this.fetchUserInfo();
          return true;
        } else {
          throw new Error("Failed to get access token");
        }
      } catch (error) {
        console.error("Auth error:", error);
        this.error = error.message || "Authentication failed";
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    setAccessToken(token) {
      this.accessToken = token;
      if (token) {
        localStorage.setItem("github_token", token);
      }
    },

    async fetchUserInfo() {
      if (!this.accessToken) {
        throw new Error("No access token available");
      }

      this.isLoading = true;

      try {
        const response = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        const userData = await response.json();
        console.log(userData);
        this.userInfo = userData;
        localStorage.setItem("github_user_info", JSON.stringify(userData));
        return userData;
      } catch (error) {
        console.error("Error fetching user info:", error);
        this.error = error.response?.data?.message || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Only remove token during explicit logout
    logout() {
      localStorage.removeItem("github_token"); // Only remove during logout
      this.accessToken = null;
      this.userInfo = null;
      this.error = null;
    },

    clearError() {
      this.error = null;
    },
  },
});
