const axios = require("axios");
const StockSymbol = require("../models/StockSymbol.js");

class StockHandler {
  async getStockData(symbol, ip, like) {
    const temp = this._getSymbolList(symbol);

    try {
      const stockData = await Promise.all(
        temp.map(s => this._getStockPrice(s))
      );
      const stockLikeList = await Promise.all(
        temp.map(s => this._getSymbolLikes(s, ip, like))
      );

      const returnObj = temp.map(s => ({
        stock: stockData.find(sd => sd.symbol.toLowerCase() === s.toLowerCase())
          .symbol,
        price: stockData.find(sd => sd.symbol.toLowerCase() === s.toLowerCase())
          .latestPrice
      }));

      if (returnObj.length === 1) {
        returnObj[0].likes = stockLikeList[0].ips.length;
        return { stockData: returnObj[0] };
      } else {
        return {
          stockData: returnObj.map((s, i) => ({...s, rel_likes:stockLikeList[i].ips.length -
              (stockLikeList[i + 1] || stockLikeList[0]).ips.length}))
        };
      }
    } catch (e) {
      throw e;
    }
  }

  async _getSymbolLikes(symbol, ip, isLiked) {
    const options = {
      $setOnInsert: {
        name: symbol.toLowerCase()
      }
    };

    if (isLiked) {
      options["$addToSet"] = { ips: ip };
    }

    return await StockSymbol.findOneAndUpdate(
      { name: symbol.toLowerCase() },
      options,
      { upsert: true, new: true, useFindAndModify: false }
    );
  }

  _getSymbolList(symbol) {
    if (symbol && typeof symbol === "string" && symbol !== "") return [symbol];

    if (symbol && Array.isArray(symbol)) return symbol.slice(0, 2);

    throw "symbol not found";
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
