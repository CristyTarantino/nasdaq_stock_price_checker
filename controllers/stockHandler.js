const axios = require("axios");
const StockSymbol = require("../models/StockSymbol.js");

class StockHandler {
  async getStockData(symbol, ip, like) {
    // const temp = this._getSymbolList(symbol);
    // console.log(temp);
    // const tempArray = this._getStockData(temp);
    // console.log(tempArray);

    if (symbol && typeof symbol === "string" && symbol !== "") {
      try {
        const options = {
          $setOnInsert: {
            name: symbol.toLowerCase()
          }
        };

        if (like) {
          options["$addToSet"] = { ips: ip };
        }

        const symbolDB = await StockSymbol.findOneAndUpdate(
          { name: symbol.toLowerCase() },
          options,
          { upsert: true, new: true, useFindAndModify: false }
        );

        const stockData = await this._getStockPrice(symbol);

        return {
          stockData: {
            stock: symbol,
            price: stockData.latestPrice,
            likes: symbolDB.ips.length
          }
        };
      } catch (e) {
        throw e;
      }
    }

    if (symbol && Array.isArray(symbol)) {
      try {
        const options0 = {
          $setOnInsert: {
            name: symbol[0].toLowerCase()
          }
        };

        if (like) {
          options0["$addToSet"] = { ips: ip };
        }

        const symbolDB0 = await StockSymbol.findOneAndUpdate(
          { name: symbol[0].toLowerCase() },
          options0,
          { upsert: true, new: true, useFindAndModify: false }
        );

        const options1 = {
          $setOnInsert: {
            name: symbol[1].toLowerCase()
          }
        };

        if (like) {
          options1["$addToSet"] = { ips: ip };
        }

        const symbolDB1 = await StockSymbol.findOneAndUpdate(
          { name: symbol[1].toLowerCase() },
          options1,
          { upsert: true, new: true, useFindAndModify: false }
        );

        const stockData = await Promise.all([
          this._getStockPrice(symbol[0]),
          this._getStockPrice(symbol[1])
        ]);

        const hello = [symbolDB0, symbolDB1];

        return {
          stockData: stockData.map((s, i) => ({
            stock: s.symbol,
            price: s.latestPrice,
            rel_likes:
              hello[i].ips.length - (hello[i + 1] || hello[0]).ips.length
          }))
        };
      } catch (e) {
        throw e;
      }
    }
  }

  _getSymbolList(symbol) {
    if (symbol && typeof symbol === "string" && symbol !== "") return [symbol];

    if (symbol && Array.isArray(symbol)) return symbol.slice(0, 2);
  }

  async _getStockPrice(stock) {
    const response = await axios.get(
      "https://repeated-alpaca.glitch.me/v1/stock/" + stock + "/quote"
    );

    return response.data === "Invalid symbol"
      ? (() => {
          throw "Invalid symbol";
        })()
      : response.data;
  }
}

module.exports = StockHandler;
