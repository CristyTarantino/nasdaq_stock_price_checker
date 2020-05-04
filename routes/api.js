/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var StockHandler = require("../controllers/stockHandler.js");

var stockPrices = new StockHandler();

module.exports = function(app) {
  app.route("/api/stock-prices").get(function(req, res) {
    const stock = req.query.stock;
    const like = req.query.like;
    const ip = req.clientIp;

    stockPrices
      .getStockData(stock, ip, like)
      .then(data => res.status(200).json(data))
      .catch(e => res.status(400).send(e.message));
  });
};
