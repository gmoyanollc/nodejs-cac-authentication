#!/bin/env node
/*
  [Authentication using HTTPS client certificates](https://medium.com/@sevcsik/authentication-using-https-client-certificates-3c9d270e8326)
  Andras Sevcsik-Zajácz
  Jul 22, 2017
*/
const express = require("express");
const fs = require("fs");
const https = require("https");

const DEFAULT_IP = "127.0.0.1";
const DEFAULT_PORT = "5555";
const httpsRequestOptions = {
  host: "gmoyano.com",
  port: 443,
  path: "",
  //key: fs.readFileSync("server_key.pem"),
  key: "",
  //cert: fs.readFileSync("server_cert.pem"),
  cert: "",
  requestCert: true,
  rejectUnauthorized: false,
  //ca: [fs.readFileSync("server_cert.pem")]
  ca: ""
};

const App = function() {
  var self = this;
  self.setupVariables = function() {
    if (typeof process.env.IP === "undefined") {
      self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
      self.port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
    } else {
      // c9 environment
      self.ipaddress = process.env.IP;
      self.port = process.env.PORT;
    }

    if (typeof self.ipaddress === "undefined") {
      console.warn(
        "using default IP and PORT: " + DEFAULT_IP + ":" + DEFAULT_PORT
      );
      self.ipaddress = DEFAULT_IP;
      self.port = DEFAULT_PORT;
    } else {
      console.info("using IP: " + self.ipaddress + " and PORT: " + self.port);
    }
  };

  self.populateCache = function() {
    if (typeof self.zcache === "undefined") {
      self.zcache = { "index.html": "" };
    }
    self.zcache["index.html"] = fs.readFileSync("./index.html");
  };

  self.cache_get = function(key) {
    return self.zcache[key];
  };

  self.terminator = function(sig) {
    if (typeof sig === "string") {
      console.log(
        "%s: Received %s - terminating sample app ...",
        Date(Date.now()),
        sig
      );
      process.exit(1);
    }
    console.log("%s: Node server stopped.", Date(Date.now()));
  };

  self.setupTerminationHandlers = function() {
    process.on("exit", function() {
      self.terminator();
    });

    [
      "SIGHUP",
      "SIGINT",
      "SIGQUIT",
      "SIGILL",
      "SIGTRAP",
      "SIGABRT",
      "SIGBUS",
      "SIGFPE",
      "SIGUSR1",
      "SIGSEGV",
      "SIGUSR2",
      "SIGTERM"
    ].forEach(function(element, index, array) {
      process.on(element, function() {
        self.terminator(element);
      });
    });
  };

  self.createRoutes = function() {
    self.routes = {};

    self.routes["/asciimo"] = function(req, res) {
      var link = "http://i.imgur.com/kmbjB.png";
      res.send("<html><body><img src='" + link + "'></body></html>");
    };

    self.routes["/"] = function(req, res) {
      res.setHeader("Content-Type", "text/html");
      res.send(self.cache_get("index.html"));
    };

    self.routes["/authenticate"] = function(req, res) {
      try {
        httpsRequestOptions.host = req.query.urlHostnameInput
        httpsRequestOptions.path = req.query.urlPathInput
        //res.send("contacting " + req.query.urlHostnameInput)

        const httpsRequest = https.request(httpsRequestOptions, httpsResponse => {
          let body = "";
          httpsResponse.on("data", data => {
            body += data;
          });
          httpsResponse.on("end", () => {
            const authorized = "authorized: " + httpsResponse.socket.authorized
            const headers = JSON.stringify(httpsResponse.headers, null, 2)
            const responseText = authorized + "<br><br>" + headers + "<br><br>" + body
            res.send(responseText);
          });
        });

        httpsRequest.on("error", (error) => {
          throw (error)
        })

        httpsRequest.end()
        /* self.app.get("/authenticate", (req, res) => {
          const cert = req.connection.getPeerCertificate();
          if (req.client.authorized) {
            res.send(
              `Hello ${cert.subject.CN}, your certificate was issued by ${cert.issuer.CN}!`
            );
          } else if (cert.subject) {
            res
              .status(403)
              .send(
                `Sorry ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`
              );
          } else {
            res
              .status(401)
              .send(
                `Sorry, but you need to provide a client certificate to continue.`
              );
          }
        }); */
      } catch (error) {
        throw (error)
      }
    };
  };

  self.initializeServer = function() {
    self.createRoutes();
    self.app = express();

    for (var r in self.routes) {
      self.app.get(r, self.routes[r]);
    }
  };

  self.initialize = function() {
    self.setupVariables();
    self.populateCache();
    self.setupTerminationHandlers();
    self.initializeServer();
  };

  self.start = function() {
    self.app.listen(self.port, self.ipaddress, function() {
      console.log(
        "%s: Node server started on %s:%d ...",
        Date(Date.now()),
        self.ipaddress,
        self.port
      );
    });
  };
};

var zapp = new App();
zapp.initialize();
zapp.start();