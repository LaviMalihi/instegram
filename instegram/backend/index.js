/*/dependencies/*/
const express = require('express')
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
let path = require('path')
let os = require('os')
let fs = require('fs')
let webpush = require('web-push')
let { v4: uuidv4, v4 } = require('uuid');

let inspect = require('util').inspect

let cors = require('cors')
const corsOptions ={
  origin:'http://localhost:3000',
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200
}



/* config-express */
const app = express()
app.use(cors(corsOptions));

/* config-firebase */
const serviceAccount = require('./serviceAccountKey.json');
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'machtagram.appspot.com'
});
const db = getFirestore();
let bucket = getStorage().bucket();

/*
config - webpush
*/

  webpush.setVapidDetails(
    'mailto:machtayair@gmail.com',
    'BEIvLWGOWIhwcyP9BHgXX6zBfrzJDewMkXZT1AeZg8_2akWLFU8J0NctNqLEl90-3deFBJembc4fipaFXSBJN2E', // public key
    'v4EVOEF18f5_QPXDsT5CL6toyTMMAymQtVnLNBDytiY' // private key
  );

/* end-point */
app.get('/posts', (request, response) => {
  response.set('Access-Control-Allow-Origin', '*')
    //   response.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET", true);
    // response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  let posts = []
  db.collection('posts').orderBy('date', 'desc').get().then(snapshot=>{
  snapshot.forEach((doc) => {
    posts.push(doc.data())
   });
   response.send(posts)
})
})


// /* end-point-createPost */

app.post('/createPost', (request, response) => {
  response.set('Access-Control-Allow-Origin', '*')
  let busboy = require('busboy');
  let uuid = v4()

  let bb = busboy({ headers: request.headers });

  let fields = {}
  let fileData = {}

  bb.on('file', function(fieldname, file, info) {
    const { filename, encoding, mimeType } = info;
    // console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
    console.log(
      `File [${fieldname}]: filename: %j, encoding: %j, mimeType: %j`,
      filename,
      encoding,
      mimeType
    );
    // /tmp/4564564-234234.png
    let filepath = path.join(os.tmpdir(), filename)
    file.pipe(fs.createWriteStream(filepath))
    fileData = { filepath, mimeType }
  });

  bb.on('field', function(fieldname, val, info) {
    fields[fieldname] = val
  });

  bb.on('finish', function() {
    bucket.upload(
      fileData.filepath,
      {
        uploadType: 'media',
        metadata: {
          metadata: {
            contentType: fileData.mimetype,
            firebaseStorageDownloadTokens: uuid
          }
        }
      },
      (err, uploadedFile) => {
        if (!err) {
          createDocument(uploadedFile)
        }
      }
    )

    function createDocument(uploadedFile) {
      db.collection('posts').doc(fields.id).set({
        id: fields.id,
        caption: fields.caption,
        location: fields.location,
        postedBy: fields.postedBy,
        userPhoto: fields.userPhoto,
        date: parseInt(fields.date),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${ bucket.name }/o/${ uploadedFile.name }?alt=media&token=${ uuid }`
      }).then(() => {
        sendPushNotification()
        response.send('Post added: ' + fields.id)
      })
    }

    function sendPushNotification() {
      let subscriptions = []
      db.collection('subscriptions').get().then(snapshot => {
        snapshot.forEach((doc) => {
          subscriptions.push(doc.data())
        });
        return subscriptions
      }).then(subscriptions => {
        subscriptions.forEach(subscription => {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              auth: subscription.keys.auth,
              p256dh: subscription.keys.p256dh
            }
          };
          let pushContent = {
            title: 'New Machtagram Post!',
            body: 'New Post Added! Check it out!',
            openUrl: '/'
          }
          let pushContentStringified = JSON.stringify(pushContent)
          webpush.sendNotification(pushSubscription, pushContentStringified)
        })
      })
    }

  });
  request.pipe(bb)
})


/*
  endpoint - createSubscription
*/

app.post('/createSubscription', (request, response) => {
  response.set('Access-Control-Allow-Origin', '*')
  db.collection('subscriptions').add(request.query).then(docRef => {
    response.send({
      message: 'Subscription added!',
      postData: request.query
    })
  })
})

/* listen */
app.listen(process.env.PORT ||3000)

