# pump-heartbeat-recorder

This is a project to deploy a webhook on Firebase to record heartbeat from a pump. This is a small IOT project to make a electric pump into a IOT pump.

This project could record heartbeat from any IOT object. The object has to call the endpoint using a GET with a number of millis in the body.

The goal is to record runs from the IOT object. If a runs is longer than the specified amount, an alert will be sent.

The configuration is done using Firebase. At the database root, create a node called `config` and put the following values:

- mailgun_api_key : mailgun api key to send email alerts
- mailgun_domain : mailgun domain (or sandbox domain)
- mailgun_sender : mailgun sender address (use postman address for sandbox domains)
- alert_email : the email address where to send the alerts
- min_sec_between_runs : the number of seconds without a heartbeat to consider a new heartbeat like a new run
- sec_before_alerts : the number of seconds a runs can last without triggering an alert
