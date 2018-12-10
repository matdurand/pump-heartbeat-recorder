// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const MailgunJS = require("mailgun-js");
admin.initializeApp();

const getConfig = async () => {
  const configSnapshot = await admin
    .database()
    .ref("/config")
    .once("value");
  const config = configSnapshot.val();
  return config;
};

const sendAlert = async (duration) => {
  const config = await getConfig();
  const mailgunApiKey = config.mailgun_api_key;
  const mailgunDomain = config.mailgun_domain;
  const mailgunSender = config.mailgun_sender;
  const alertEmail = config.alert_email;
  const mailgun = MailgunJS({
    apiKey: mailgunApiKey,
    domain: mailgunDomain
  });

  const message = "Pump has been running for " + duration / 1000 + " seconds";
  const data = {
    from: mailgunSender,
    to: alertEmail,
    subject: "Pump alert",
    text: message
  };

  console.log("sending alert", message);
  const sendPromise = new Promise((resolve, reject) => {
    mailgun.messages().send(data, (error, body) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
  return sendPromise;
};

exports.addMessage = functions.https.onRequest(async (req, res) => {
  try {
    const config = await getConfig();
    const duration = parseInt(req.body);
    const runsRef = admin.database().ref("/runs");
    const query = runsRef.orderByChild("update").limitToLast(1);
    const querySnapshot = await query.once("value");
    if (querySnapshot.val() === null) {
      await runsRef.push({
        date: new Date().toISOString(),
        update: new Date().toISOString(),
        duration
      });
    } else {
      let operation;
      querySnapshot.forEach((run) => {
        const updateDate = run.child("update").val();
        const secBetween =
          (new Date().getTime() - new Date(updateDate).getTime()) / 1000;
        if (secBetween > config.min_sec_between_runs) {
          operation = runsRef.push({
            date: new Date().toISOString(),
            update: new Date().toISOString(),
            duration
          });
        } else {
          operation = run.ref.update({
            update: new Date().toISOString(),
            duration
          });
        }
      });
      await operation;
    }

    if (duration > config.sec_before_alerts * 1000) {
      await sendAlert(duration);
    }
    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});
