process.env.DEBUG = ["worldql-web", "worldql-core"];

const debug = require("debug")("worldql-web");
const worldql = require("worldql-core");
const express = require("express");
const bodyParser = require("body-parser");
const graphqlHTTP = require("express-graphql");
const dynamicMiddleware = require("dynamic-middleware");

const globalTunnel = require("global-tunnel");
globalTunnel.initialize(); // use ENV http_proxy for all requests

const app = express();
app.set("view engine", "pug");

app.get("/", function(req, res, next) {
  debug("path: /");
  res.render("index", { title: "Hey", message: "Hello there!" });
});

app.use("/setup", bodyParser.urlencoded({ type: "application/x-www-form-urlencoded", extended: true }));
app.post("/setup", function(req, res, next) {
  debug("(body) %o", req.body);

  if (req.body.gqlApis) {
    const gqlApis = JSON.parse(req.body.gqlApis);
    debug("(gqlApis) %o", gqlApis);

    worldql
      .buildGqlSchema(gqlApis)
      .then(gqlSchema => {
        buildGraphqlMW(gqlSchema).then(graphqlMW => {
          debug("install graphqlMW");

          app.use("/graphql", graphqlMW.handler());
          res.redirect("/graphql");
        });
      })
      .catch(err => {
        handle_error(err);
        next();
      });
  } else {
    next("Please provide a gqlApis string");
  }
});

let graphqlMW = null;
function buildGraphqlMW(gqlSchema) {
  return new Promise((resolve, reject) => {
    if (graphqlMW) {
      debug("replace graphqlMW");

      graphqlMW.replace(
        graphqlHTTP(() => {
          return {
            schema: gqlSchema,
            graphiql: true
          };
        })
      );
    } else {
      debug("create graphqlMW");

      graphqlMW = dynamicMiddleware.create(
        graphqlHTTP(() => {
          return {
            schema: gqlSchema,
            graphiql: true
          };
        })
      );
    }

    resolve(graphqlMW);
  });
}

function handle_error(err) {
  debug("(error) %O", err);
}

app.listen(4000);
debug("Running a GraphQL API server at http://localhost:4000/graphql");
