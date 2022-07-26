<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-white text-grey-10" bordered>
      <q-toolbar class="constrain">
        <q-btn
          class="large-screen-only q-mr-sm"
          flat
          to="/camera"
          round
          size="18px"
          dense
          icon="eva-camera-outline"
        />
        <q-separator vertical spaced class="large-screen-only" />
        <q-toolbar-title class="text-grand-hotel text-bold">
          Machtagram
        </q-toolbar-title>
        <q-separator vertical spaced class="large-screen-only" />
        <q-btn
          class="large-screen-only"
          to="/#/"
          flat
          round
          size="18px"
          dense
          icon="eva-home-outline"
        />
        <q-separator vertical spaced class="large-screen-only" />
        <q-btn
          class="large-screen-only"
          @click="signOut()"
          flat
          round
          size="18px"
          dense
          icon="eva-log-out-outline"
        />
      </q-toolbar>
    </q-header>

    <q-footer class="bg-white constrain" bordered>
      <transition
        appear
        enter-active-class="animated fadeIn"
        leave-active-class="animated fadeOut"
      >
        <div v-if="showAppInstallBanner" class="banner-container bg-primary">
          <div class="constrain">
            <q-banner
              class="bg-primary text-white q-mb-md"
              inline-actions
              dense
            >
              <template v-slot:avatar>
                <q-icon name="img:/icons/ms-icon-144x144.png" outline="white" />
              </template>

              <b>Install app</b>

              <template v-slot:action>
                <q-btn
                  @click="installApp"
                  label="Yes"
                  class="q-px-sm"
                  dense
                  flat
                />
                <q-btn
                  @click="showAppInstallBanner = false"
                  label="Later"
                  class="q-px-sm"
                  dense
                  flat
                />
                <q-btn
                  @click="neverShowAppInstallBanner"
                  label="Never"
                  class="q-px-sm"
                  dense
                  flat
                />
              </template>
            </q-banner>
          </div>
        </div>
      </transition>

      <q-tabs
        class="text-grey-10 small-screen-only"
        active-color="primary"
        indicator-color="transparnt"
      >
        <q-route-tab to="/" icon="eva-home-outline" label="Home" />
        <q-route-tab to="/camera" icon="eva-camera-outline" label="Camera" />
      </q-tabs>
    </q-footer>

    <q-page-container class="bg-grey-1">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" :key="$route.fullPath"></component>
        </keep-alive>
      </router-view>
    </q-page-container>
  </q-layout>
</template>
<script>
let deferredPrompt;

import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import Localbase from "localbase";
let lb = new Localbase("db");

export default {
  name: "MainLayout",

  data() {
    return {
      showAppInstallBanner: false,
      user: true,
    };
  },
  methods: {
    installApp() {
      // Hide the app provided install promotion
      this.showAppInstallBanner = false;
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
          this.neverShowAppInstallBanner();
        } else {
          console.log("User dismissed the install prompt");
        }
      });
    },
    neverShowAppInstallBanner() {
      this.showAppInstallBanner = false;
      this.$q.localStorage.set("neverShowAppInstallBanner", true);
    },

    signOut() {
      lb.collection("activeUser")
        .delete()
        .then(() => {
          const auth = getAuth();
          signOut(auth)
            .then(() => {
              this.$router.push(`/login`);
              // Sign-out successful.
            })
            .catch((error) => {
              // An error happened.
            });
        });
      // const auth = getAuth();
      // signOut(auth)
      //   .then(() => {
      //     this.$router.push(`/login`);
      //     // Sign-out successful.
      //   })
      //   .catch((error) => {
      //     // An error happened.
      //   });
    },
  },

  mounted() {
    let neverShowAppInstallBanner = this.$q.localStorage.getItem(
      "neverShowAppInstallBanner"
    );

    if (!neverShowAppInstallBanner) {
      window.addEventListener("beforeinstallprompt", (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI notify the user they can install the PWA
        setTimeout(() => {
          this.showAppInstallBanner = true;
        }, 3000);
      });
    }
  },
  created() {
    if (!window.user) {
      this.user = false;
    }
    if (window.user) {
      this.user = true;
    }
  },
};
</script>

<style lang="sass">
.q-toolbar
  @media (min-width: $breakpoint-sm-min)
   height: 75px
.q-toolbar__title
  font-size: 30px
  @media (max-width: $breakpoint-xs-max)
   text-align: center
.q-footer
  .q-tab__icon
    text-size: 30px
</style>
