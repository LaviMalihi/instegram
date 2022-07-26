<template>
  <q-page>
    <q-card class="my-card">
      <q-tabs
        v-model="tab"
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        dense
        narrow-indicator
      >
        <q-tab name="login" label="Login" />
        <q-tab name="register" label="Register" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="login" class="hige">
          <inner-form :tab="tab" />
        </q-tab-panel>

        <q-tab-panel name="register" class="hige">
          <inner-form :tab="tab" />
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-page>
</template>

<script>
import firebase from "firebase/compat/app";

export default {
  name: "Login",

  data() {
    return {
      tab: "login",
      email: "",
      password: "",
    };
  },

  components: {
    innerForm: require("src/components/innerForm.vue").default,
  },
};
</script>

<style lang="sass">
.my-card
    margin: 0 auto
    min-height:625px
    max-width:1050px
.hige
    min-height: 500px
</style>
