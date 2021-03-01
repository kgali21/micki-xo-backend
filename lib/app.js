const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());

//bodyparser middleware
app.use(bodyParser.json());

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server started on localhost:${PORT}`));

