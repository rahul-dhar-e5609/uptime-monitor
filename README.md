##  UPTIME MONITOR

#   OVERVIEW

An "uptime monitor" allows users to enter URLs they want monitored, and receive alerts
when those resources "go down" or "come back up".

The app should be useable, so we will include features such as user sign in and sign up,
edit settings.

We will also include functionality for sending as SMS alert to a user, rather than email.


#   REQUIREMENTS

1.	API listens on a port and accepts incoming HTTP requests for POST, GET, PUT, DELETE and HEAD.
2.	API allows a client to connect, the create a new user, then edit and delete that user.
3.	API allows a user to sign in which gives them a token that they can use for subsequent authenticated requests.
4. 	API allows the user to sign out which invalidates their token.
5.	API allows a sign in user to use their token to create a new "check" (Task to check a given URL, to see if it is up or down. Allow system to understand what up or down is).
6.	API allows a signed in user t edit or delete any of their checks. Limit checks to 5.
7.	In the background, workers perform all the "checks" at the appropriate times, and send alerts to the users when a check changes its state from "up" to "down", or vice versa. Checks should run once a minute.

We will be using twillio for SMS.

#   That's our backend spec

#   HTTP
The way the http server works is we first need to use the http module to define what the server does and then later on we need to tell the server to start listening on a specific port.
Node JS module -> HTTP

#   URL
Parsing Request paths:
    Which resources people are requesting when they send a request to the API? We need to parse the URL they are asking for.
Node JS module -> URL

#   String decoder - payload

#   Adding HTTPS
1   SSL Certificate to use within the application to fascilitate the ssl handshake.
2   In order to create the SSL certificate, using openssl.
3   keygeneration.txt creates two different files, a key.pem and cert.pem
Command is openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
4   We will use these two files to create the https server.
