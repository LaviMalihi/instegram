<template>
  <q-form @submit="submitForm" class="center">
    <q-input
      v-if="tab == 'register'"
      style="max-width: 500px"
      v-model="formData.name"
      class="q-mb-md"
      outlined
      label="Name"
      :rules="[(val) => !!val || 'Field is required']"
    />
    <q-input
      style="max-width: 500px"
      v-model="formData.email"
      class="q-mb-md"
      outlined
      label="Email"
      type="email"
      :rules="[(val) => !!val || 'Field is required']"
    />
    <q-input
      style="max-width: 500px"
      v-model="formData.password"
      class="q-mb-md"
      outlined
      type="password"
      label="Password"
      :rules="[(val) => !!val || 'Field is required']"
    />
    <div class="tt large-screen-only">
      <q-space />
      <q-btn
        v-if="tab == 'login'"
        class="bt1"
        @click="googleLogin()"
        color="primary"
      >
        google התחבר באמצעות חשבון
      </q-btn>
      <q-btn class="bt2" color="primary" type="submit" :label="tab" />
    </div>
    <div class="tt2 small-screen-only">
      <q-space />
      <q-btn
        v-if="tab == 'login'"
        class="bt1"
        @click="googleLogin()"
        color="primary"
      >
        google התחבר באמצעות חשבון
      </q-btn>
      <q-btn class="bt2" color="primary" type="submit" :label="tab" />
    </div>
  </q-form>
</template>

<script>
import firebaseAuth from "../boot/firebase";
import { LocalStorage, SessionStorage } from "quasar";
import {
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import Localbase from "localbase";
let lb = new Localbase("db");

export default {
  name: "InnerForm",

  props: ["tab"],

  data() {
    return {
      formData: {
        name: "",
        email: "",
        password: "",
      },
    };
  },

  methods: {
    async submitForm() {
      if (this.tab == "login") {
        this.loginUser(this.formData);
      } else {
        this.registerUser(this.formData);
      }
    },

    async registerUser(formData) {
      const auth = getAuth();
      createUserWithEmailAndPassword(auth, formData.email, formData.password)
        .then((userCredential) => {
          // Signed in
          window.user = userCredential.user;
          userCredential.user.displayName = formData.name;
          this.user = userCredential.user;
          console.log(userCredential.user);
          this.addToLocalbase(userCredential.user);
          // ...
          this.$router.push(`/`);
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          // ..
        });
    },

    async loginUser(formData) {
      const auth = getAuth();
      signInWithEmailAndPassword(auth, formData.email, formData.password)
        .then((userCredential) => {
          // Signed in
          window.user = userCredential.user;
          this.user = userCredential.user;
          this.addToLocalbase(userCredential.user);

          // ...
          this.$router.push(`/`);
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
        });
    },

    async googleLogin() {
      const provider = new GoogleAuthProvider();
      const auth = getAuth();
      signInWithPopup(auth, provider)
        .then((result) => {
          // This gives you a Google Access Token. You can use it to access the Google API.
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const token = credential.accessToken;
          // The signed-in user info.
          const user = result.user;
          window.user = result.user;
          this.addToLocalbase(result.user);
          // ...
          this.$router.push(`/`);
        })
        .catch((error) => {
          // Handle Errors here.
          const errorCode = error.code;
          const errorMessage = error.message;
          // The email of the user's account used.
          const email = error.email;
          // The AuthCredential type that was used.
          const credential = GoogleAuthProvider.credentialFromError(error);
          // ...
        });
    },
    addToLocalbase(user) {
      lb.collection("activeUser").add(
        {
          photoURL: user.photoURL,
          displayName: user.displayName,
          email: user.email,
        },
        "user"
      );
    },
  },
};
</script>

<style lang="sass">
.center
  max-width: 975px
  margin: 0 auto
.q-mb-md
    margin: 0 auto
    margin-top: 15px
    margin-bottom: 15px
.tt
    position: fixed
    left: 50%
    transform: translate(-50%, -50%)
    margin-top: 15px
.tt2
    margin-left: 4%
    margin-right: 4%
.bt1
   margin-right: 5px
.bt2
    // width: 100px
</style>
