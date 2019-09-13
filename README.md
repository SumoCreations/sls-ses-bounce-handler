SLS SES Bounce / Complaint Handler
==================================

1. Fork this repository.
2. Customize the serverles.yml as needed.
3. `sls deploy --stage {dev,staging,prod,etc...}`
4. Subscribe bounce and complaint notifications for a given domain to the SNS topics created by this service.
5. Enjoy! You're all done. You can decide how to access the dynamo blacklist table in your other services.