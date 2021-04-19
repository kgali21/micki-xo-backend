const express = require('express');
const app = express();
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();
const queryString = require('querystring');
const cookieParser = require('cookie-parser');
const request = require('request');

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

//Spotify User Token Authentication

//Generates Salt
const generateRandomString = (length) => {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for(let i = 0; i < length; i++){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

app.get('/login', (req, res) => {
  let state = generateRandomString(16);
  res.cookie(process.env.STATE_KEY, state);

  const scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' + queryString.stringify({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scope,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    state: state
  }));
});

app.get('/callback', (req, res) => {
  let code = req.query.code || null;
  let state = req.query.state || null;
  let storedState = req.cookies ? req.cookies[process.env.STATE_KEY] : null;

  if(state === null || state !== storedState) {
    res.redirect('/' + queryString.stringify({
      error: 'state_mismatch'
    }));
  } else {
    res.clearCookie(process.env.STATE_KEY);
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (Buffer.alloc(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, (error, response, body) => {
      if(!error && response.statusCode === 200){
        let access_token = body.access_token;
        let refresh_token = body.refresh_token;
        console.log('access token', access_token);

        const options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        request.get(options, (error, response, body) => {
          console.log(body);
        });

        res.redirect('/' + queryString.stringify({
          access_token,
          refresh_token
        }));
      } else {
        res.redirect('/' + queryString.stringify({
          error: 'invalid_token'
        }));
      }
    });
  }
});

app.get('/refresh_token', (req, res) => {
  let refresh_token = req.query.refresh_token;
  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (Buffer.alloc(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token
    },
    json: true
  };

  request.post(authOptions, (error, response, body) => {
    if(!error && response.statusCode === 200){
      let access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`Server started on localhost:${PORT}`));

