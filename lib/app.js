const express = require('express');
const app = express();
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const request = require('request');
const SpotifyWebApi = require('spotify-web-api-node');

app.use(cors());
app.use(cookieParser());
//bodyparser middleware
app.use(express.json());

//Mailchimp signup route
const Mailchimp = require('mailchimp-api-v3');
const mailchimp = new Mailchimp(process.env.API_KEY);

app.post('/signup', (req, res) => {

  const { email_address } = req.body;

  mailchimp.post(`/lists/${process.env.LIST_ID}/members`, {
    email_address: email_address,
    status: 'subscribed'
  })
    .then(data => {
      console.log(data.statusCode);
      res.status(200).send('Subscribed!');
    })
    .catch(err => {
      console.log(err.statusCode);
      if(err) {
        return res.status(400).send('Already Subscribed');
      }
    });
});


// NodeMailer Logic for Contact me Form
app.post('/email', (req, res) => {
  const mainTransporter = async() => {  
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      auth: {
        user: process.env.USER,
        pass: process.env.PASS
      }
    });
    
    let info = await transporter.sendMail({
      from: req.body.email,
      to: 'Kgali21@gmail.com',
      subject: req.body.subject,
      html: `<body>${req.body.html}</body>`
    });

    console.log('Message Sent: ', info);

    res.sendStatus(200);
  };

  mainTransporter().catch(console.error);
});

//Spotify Web Api
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

spotifyApi.clientCredentialsGrant().then((data) => {
  // console.log('The access token expires in ' + data.body['expires_in']);
  // console.log('The access token is ' + data.body['access_token']);

  spotifyApi.setAccessToken(data.body['access_token']);
}, (err) => {
  console.log('something went wrong when grabbing token', err);
});

app.get('/micki', (req, res) => {
  spotifyApi.getArtistTopTracks('2UqmpmQDScS5rz5WsQaFCA', 'US')
    .then(data => {
      console.log('Album Info', data.body);
      res.send(data.body);
    })
    .catch(error => {
      console.log(error, 'error');
    });
});

app.get('/token', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*'); 
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');

  const options = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      Authorization: 'Basic ' + Buffer.alloc(64, process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET, 'base64')
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  };

  request.post(options, (error, response, body) => {
    if(!error && response.statusCode === 200){
      res.json({ token: body.access_token });
    }
  });

});

const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`Server started on localhost:${PORT}`));

