const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const nodemailer = require('nodemailer');
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
    console.log(req.body, 'request');

    console.log('Message Sent: ', info);
    // console.log('Preview Url: ', nodemailer.getTestMessageUrl(info));
    

    res.sendStatus(200);
  };

  mainTransporter().catch(console.error);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server started on localhost:${PORT}`));

