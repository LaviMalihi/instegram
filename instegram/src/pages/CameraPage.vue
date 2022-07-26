<template>
  <q-page class="constrain-2 q-pa-md">
    <div class="camera-frame q-pa-md">
      <video v-show="!imageCaptured" ref="video" class="full-width" autoplay />
      <canvas
        v-show="imageCaptured"
        ref="canvas"
        class="full-width"
        height="240"
        autoplay
      />
    </div>
    <div class="text-center q-pa-md">
      <q-btn
        v-if="hasCameraSupport"
        @click="captureImage()"
        :disable="imageCaptured"
        round
        color="grey-10"
        icon="eva-camera"
        size="lg"
      />
      <q-file
        v-else
        v-model="imageUpload"
        @input="captureImageFallback"
        label="Choose an image"
        accept="image/*"
        outlined
      >
        <template v-slot:prepend>
          <q-icon name="eva-attach-outline" />
        </template>
      </q-file>

      <div class="row-justify-center q-ma-md">
        <q-input
          v-model="post.caption"
          label="caption *"
          class="col col-sm-6"
          dense
        />
      </div>

      <div class="row-justify-center q-ma-md">
        <q-input
          :loading="locationLoading"
          v-model="post.location"
          label="location"
          class="col col-sm-6"
          dense
        >
          <template v-slot:append>
            <q-btn
              v-if="!locationLoading && locationSupported"
              @click="getLocation"
              round
              dense
              flat
              icon="eva-navigation-2-outline"
            />
          </template>
        </q-input>
      </div>
      <div class="row-justify-center q-mt-md">
        <q-btn
          @click="addPost"
          :disable="!post.caption || !post.photo"
          unelevated
          color="primary"
          label="post caption"
          rounded
        />
      </div>
    </div>
  </q-page>
</template>

<script>
import { uid } from "quasar";
require("md-gum-polyfill");
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import Localbase from "localbase";
let lb = new Localbase("db");
export default {
  name: "CameraPage",

  data() {
    return {
      post: {
        id: uid(),
        caption: "",
        location: "",
        photo: null,
        date: Date.now(),
      },
      imageCaptured: false,
      imageUpload: [],
      hasCameraSupport: true,
      locationLoading: false,
      user: {},
    };
  },

  computed: {
    locationSupported() {
      if ("geolocation" in navigator) return true;
      return false;
    },
    backgroundSyncSupported() {
      if ("serviceWorker" in navigator && "SyncManager" in window) return true;
      return false;
    },
  },

  methods: {
    initCamera() {
      navigator.mediaDevices
        .getUserMedia({
          video: true,
        })
        .then((stream) => {
          this.$refs.video.srcObject = stream;
        })
        .catch((error) => {
          this.hasCameraSupport = false;
        });
    },
    captureImage() {
      let video = this.$refs.video;
      let canvas = this.$refs.canvas;
      canvas.width = video.getBoundingClientRect().width;
      canvas.height = video.getBoundingClientRect().height;
      let context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.imageCaptured = true;
      this.post.photo = this.dataURItoBlob(canvas.toDataURL());
      this.disableCamera();
    },

    captureImageFallback(file) {
      this.post.photo = file;

      let canvas = this.$refs.canvas;
      let context = canvas.getContext("2d");

      var reader = new FileReader();
      reader.onload = (event) => {
        var img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          this.imageCaptured = true;
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file.target.files[0]);
    },
    disableCamera() {
      this.$refs.video.srcObject.getVideoTracks().forEach((track) => {
        track.stop();
      });
    },
    dataURItoBlob(dataURI) {
      // convert base64 to raw binary data held in a string
      // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
      var byteString = atob(dataURI.split(",")[1]);

      // separate out the mime component
      var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

      // write the bytes of the string to an ArrayBuffer
      var ab = new ArrayBuffer(byteString.length);

      // create a view into the buffer
      var ia = new Uint8Array(ab);

      // set the bytes of the buffer to the correct values
      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      // write the ArrayBuffer to a blob, and you're done
      var blob = new Blob([ab], { type: mimeString });
      return blob;
    },
    getLocation() {
      this.locationLoading = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.getCityAndCountry(position);
        },
        (err) => {
          this.locationError();
        },
        { timeout: 7000 }
      );
    },
    getCityAndCountry(position) {
      let apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`;
      this.$axios
        .get(apiUrl)
        .then((result) => {
          this.locationSuccess(result);
          console.log(result);
        })
        .catch((err) => {
          this.locationError();
        });
    },
    locationSuccess(result) {
      if (result.data.address.city)
        this.post.location = result.data.address.city;
      if (result.data.address.town)
        this.post.location = result.data.address.town;
      if (result.data.address.country) {
        this.post.location += `, ${result.data.address.country}`;
      }
      this.locationLoading = false;
    },
    locationError() {
      this.$q.dialog({
        title: "Error",
        message: "Could not find your location.",
      });
      this.locationLoading = false;
    },
    addPost() {
      this.$q.loading.show();
      let formData = new FormData();
      formData.append("id", this.post.id);
      formData.append("caption", this.post.caption);
      formData.append("location", this.post.location);
      formData.append("date", this.post.date);
      formData.append("postedBy", this.user.displayName);
      formData.append("userPhoto", this.user.photoURL);
      formData.append("file", this.post.photo, this.post.id + `.png`);
      this.$axios
        .post(`${process.env.API}/createPost`, formData)
        .then((response) => {
          console.log("response: ", response);
          this.$router.push("/");
          this.$q.notify({
            message: "Post created!",
            actions: [{ label: "Dismiss", color: "white" }],
          });
          this.$q.loading.hide();
        })
        .catch((err) => {
          console.log("err: ", err);
          if (!navigator.onLine && this.backgroundSyncSupported) {
            this.$q.notify("Post created, Will send when you are online");
            this.$router.push("/");
          } else {
            this.$q.dialog({
              title: "Error",
              message: "Sorry, could not create post!",
            });
          }
          this.$q.loading.hide();
        });
    },
  },
  mounted() {
    lb.collection("activeUser")
      .doc("user")
      .get()
      .then((document) => {
        this.user = document;
      });
    if (Object.keys(this.user).length === 0) {
      this.$router.push(`/login`);
      if (this.hasCameraSupport) {
        this.disableCamera();
      }
    } else {
      this.initCamera();
    }
  },

  created() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        const uid = user.uid;
        // ...
      }
    });
  },

  beforeDestroy() {
    if (this.hasCameraSupport) {
      this.disableCamera();
    }
  },
};
</script>

<style lang="sass">
.camera-frame
  border: 2px solid $grey-10
  border-radius: 10px

.invisible
  visibility: hidden
  display: none
</style>
