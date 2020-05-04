/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;

const server = require("../server");
const StockSymbol = require("../models/StockSymbol.js");

chai.use(chaiHttp);
const requester = chai.request(server).keepOpen();

suite("Functional Tests", function() {
  suite("GET /api/stock-prices => stockData object", function() {
    
    afterEach(async () => {
      await StockSymbol.findOneAndUpdate(
        { name: "goog" },
        { $pull: { ips: "0.1.2.3" } },
        { upsert: true, new: true, useFindAndModify: false }
      );
      await StockSymbol.findOneAndUpdate(
        { name: "goog" },
        { $pull: { ips: "0.1.2.4" } },
        { upsert: true, new: true, useFindAndModify: false }
      );
      await StockSymbol.findOneAndUpdate(
        { name: "msft" },
        { $pull: { ips: "0.1.2.3" } },
        { upsert: true, new: true, useFindAndModify: false }
      );
      await StockSymbol.findOneAndUpdate(
        { name: "msft" },
        { $pull: { ips: "0.1.2.4" } },
        { upsert: true, new: true, useFindAndModify: false }
      );
    });

    test("1 stock", function(done) {
      chai
        .request(server)
        .get("/api/stock-prices")
        .query({ stock: "goog" })
        .end(function(err, res) {
          if (err) done(err);
          assert.equal(res.status, 200);
          assert.property(res.body, "stockData");
          assert.isObject(res.body.stockData, "stockData is an object");
          done();
        });
    });

    test("1 stock with like", function(done) {
      chai
        .request(server)
        .get("/api/stock-prices")
        .query({ stock: "goog" })
        .end(function(err, res1) {
          let numberOfLikes = res1.body.stockData.likes;
          chai
            .request(server)
            .get("/api/stock-prices")
            .set("X-Forwarded-For", "0.1.2.3")
            .query({ stock: "goog", like: true })
            .end(function(err, res2) {
              assert.equal(res2.status, 200);
              assert.isObject(res2.body, "response should be an object");
              assert.equal(res2.body.stockData.stock, "goog");
              assert.equal(res2.body.stockData.likes, numberOfLikes + 1);
              done();
            });
        });
    });

    test("1 stock with like again (ensure likes arent double counted)", function(done) {
      chai
        .request(server)
        .get("/api/stock-prices")
        .set("X-Forwarded-For", "0.1.2.3")
        .query({ stock: "goog", like: true })
        .end(function(err, res1) {
          let numberOfLikes = res1.body.stockData.likes;
          chai
            .request(server)
            .get("/api/stock-prices")
            .set("X-Forwarded-For", "0.1.2.3")
            .query({ stock: "goog", like: true })
            .end(function(err, res2) {
              assert.equal(res2.status, 200);
              assert.isObject(res2.body, "response should be an object");
              assert.equal(res2.body.stockData.stock, "goog");
              assert.equal(res2.body.stockData.likes, numberOfLikes);
              done();
            });
        });
    });

    test("2 stocks", function(done) {
      chai
        .request(server)
        .get("/api/stock-prices")
        .query({ stock: ["goog", "msft"] })
        .end(function(err, res) {
          if (err) done(err);
          assert.equal(res.status, 200);
          assert.property(res.body, "stockData");
          assert.isArray(res.body.stockData, "stockData is an array");
          assert.equal(res.body.stockData.length, 2);
          assert.equal(res.body.stockData[0].stock, "GOOG");
          assert.equal(res.body.stockData[1].stock, "MSFT");
          assert.property(res.body.stockData[0], "price");
          assert.property(res.body.stockData[1], "price");
          assert.property(res.body.stockData[0], "rel_likes");
          assert.property(res.body.stockData[1], "rel_likes");
          done();
        });
    });

    test("2 stocks with like", done => {
      let numberOfGoogLikes, numberOfMsftLikes;

      chai
        .request(server)
        .get("/api/stock-prices")
        .set("X-Forwarded-For", "0.1.2.3")
        .query({ stock: "goog", like: true })
        .end(function(err, res) {
          numberOfGoogLikes = res.body.stockData.likes;
        });

      chai
        .request(server)
        .get("/api/stock-prices")
        .set("X-Forwarded-For", "0.1.2.3")
        .query({ stock: "msft", like: true })
        .end(function(err, res) {
          numberOfMsftLikes = res.body.stockData.likes;
        });

      chai
        .request(server)
        .get("/api/stock-prices")
        .query({ stock: ["goog", "msft"], like: true })
        .set("X-Forwarded-For", "0.1.2.4")
        .end(function(err, res) {
          const goog = res.body.stockData.find(s => s.stock === "GOOG");
          const msft = res.body.stockData.find(s => s.stock === "MSFT");

          assert.equal(goog.rel_likes, numberOfGoogLikes - numberOfMsftLikes);
          assert.equal(msft.rel_likes, numberOfMsftLikes - numberOfGoogLikes);
          done();
        });
    });
  });
});
