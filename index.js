import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";

const app = express();
const port = process.env.PORT || 3000;

// Statische Dateien bereitstellen
app.use(express.static("assets"));

// Middleware für das Parsen von URL-encoded-Daten (z. B. aus Formularen) mit express anstatt bodyparser
app.use(express.urlencoded({ extended: true }));

// Middleware für das Parsen von JSON-Daten
app.use(express.json());

// Middleware, um den aktuellen Pfad in res.locals verfügbar zu machen
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// EJS als Template-Engine verwenden
app.set("view engine", "ejs");

// ---------------------------------------------------------- Route for the Home Page
app.get("/", (req, res) => {
  res.render("index");
});

// ---------------------------------------------------------- Route for the weather page
app.get("/weather", async (req, res) => {
  res.render("weather");
});


// ---------------------------------------------------------- Route for posting on/from the weather page
app.post("/get-weather", async (req, res) => {
  console.log(req.body); // Zeigt die empfangenen Daten an
  const query = req.body.cityName;
  const apiKey = process.env.OPENWEATHERMAP_KEY;
  const unit = "metric";
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}&units=${unit}`;

  try {
    // Anfrage mit axios
    const response = await axios.get(url);

    // Wetterdaten aus der API-Antwort extrahieren
    const weatherData = response.data;
    const temp = weatherData.main.temp;
    const weatherDescription = weatherData.weather[0].description;
    const icon = weatherData.weather[0].icon;
    const imageURL = `http://openweathermap.org/img/wn/${icon}@2x.png`;

    console.log("Weather data fetched successfully:", weatherData);
    console.log(weatherData);
    console.log(temp);
    console.log(weatherDescription);
    console.log(
      "client typed in the received post request: " + req.body.cityName
    );

    // Anfrage an die Nominatim-API, um die Koordinaten der Stadt zu erhalten
    const mapUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;
    const mapResponse = await axios.get(mapUrl);

    if (mapResponse.data.length > 0) {
      const lat = mapResponse.data[0].lat;
      const lon = mapResponse.data[0].lon;

      console.log(
        `Coordinates for ${query}: Latitude ${lat}, Longitude ${lon}`
      );

      // Wetterdaten an die weather.ejs-Datei übergeben
      res.render("weather", {
        city: query,
        temp: temp,
        description: weatherDescription,
        iconURL: imageURL,
        lat: lat,
        lon: lon, // Koordinaten für die Karte
      });
    } else {
      console.error("City not found in Nominatim API.");
      res.status(404).send("City not found.");
    }
  } catch (error) {
    console.error("Failed to fetch weather data:", error.message);
    res.status(500).send("An error occurred while fetching the weather data.");
  }
});

// ---------------------------------------------------------- Route for the recipe page

app.get("/food", async (req, res) => {
  const apiKey = process.env.SPOONACULAR_KEY;
  const url = `https://api.spoonacular.com/recipes/random?apiKey=${apiKey}`;

  try {
    // Anfrage an die Spoonacular API
    const response = await axios.get(url);

    // Rezeptdaten aus der API-Antwort extrahieren
    const recipe = response.data.recipes[0]; // Das erste (und einzige) Rezept

    console.log("Random recipe fetched successfully:", recipe);

    // Rezeptdaten an die food.ejs-Datei übergeben
    res.render("food", {
      title: recipe.title,
      image: recipe.image,
      instructions: recipe.instructions,
      ingredients: recipe.extendedIngredients.map(
        (ingredient) => ingredient.original
      ),
    });
  } catch (error) {
    console.error("Failed to fetch random recipe:", error.message);
    res.status(500).send("An error occurred while fetching the recipe.");
  }
});

// ---------------------------------------------------------- Route for Stock Market Page
app.get("/stock", async (req, res) => {
  res.render("stock", {
    symbol: undefined, // Symbol zurücksetzen
    price: undefined,
    change: undefined,
    changePercent: undefined,
    error: null,
    historicalData: undefined, // Historische Daten zurücksetzen
  });
});

// ---------------------------------------------------------- Route for posting on/from the Stock Market Page
app.post("/get-stock", async (req, res) => {
  const query = req.body.stockName; // Benutzer-Eingabe
  const apiKey = process.env.RAPIDAPI_KEY;
  const searchUrl = `https://apidojo-yahoo-finance-v1.p.rapidapi.com/auto-complete?q=${query}&region=US`;

  try {
    // Suche nach dem Symbol
    const searchResponse = await axios.get(searchUrl, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "apidojo-yahoo-finance-v1.p.rapidapi.com",
      },
    });

    const bestMatch = searchResponse.data.quotes ? searchResponse.data.quotes[0] : null;

    if (!bestMatch) {
      res.locals.currentPath = "/stock";
      return res.render("stock", {
        error: "No matching symbol found. Please try again.",
        symbol: undefined,
        price: undefined,
        change: undefined,
        changePercent: undefined,
        currencySymbol: undefined,
        stockName: query,
        historicalData: null,
      });
    }

    // Extrahiere die Region und das Symbol
    const region = bestMatch.region || "US"; // Fallback auf "US", falls keine Region angegeben ist
    const symbol = bestMatch.symbol; // Extrahiere das Symbol

    // URLs für die zweite Anfrage
    const quoteUrl = `https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/v2/get-quotes?region=${region}&symbols=${symbol}`;
    const chartUrl = `https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/get-charts?symbol=${symbol}&interval=1mo&range=1y&region=${region}`;

    // Hole die Aktieninformationen
    const [quoteResponse, chartResponse] = await Promise.all([
      axios.get(quoteUrl, {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "apidojo-yahoo-finance-v1.p.rapidapi.com",
        },
      }),
      axios.get(chartUrl, {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "apidojo-yahoo-finance-v1.p.rapidapi.com",
        },
      }),
    ]);

    const stockData = quoteResponse.data.quoteResponse.result;
    const chartData = chartResponse.data.chart.result[0]; // Hole die Chart-Daten

    // Extrahiere die historischen Daten aus den Chart-Daten
    const historicalData = chartData.timestamp.map((timestamp, index) => ({
      date: new Date(timestamp * 1000), // Konvertiere Unix-Timestamp in ein Datum
      close: chartData.indicators.quote[0].close[index], // Schlusskurs
    }));

    // Debugging: Logge die historischen Daten
    console.log("Historical Data:", historicalData);

    if (!stockData || stockData.length === 0) {
      res.locals.currentPath = "/stock";
      return res.render("stock", {
        error: "No data available for the given stock symbol.",
        symbol: undefined,
        price: undefined,
        change: undefined,
        changePercent: undefined,
        currencySymbol: undefined,
        stockName: query,
        historicalData: null,
      });
    }

    // Extrahiere die relevanten Daten
    const stock = stockData[0]; // Nimm das erste Ergebnis
    const price = stock.regularMarketPrice;

    // Währungssymbol basierend auf der Währung
    const currency = stock.currency; // Extrahiere die Währung (z. B. USD, EUR)
    let currencySymbol = "";
    if (currency === "USD") {
      currencySymbol = "$";
    } else if (currency === "EUR") {
      currencySymbol = "€";
    } else if (currency === "GBP") {
      currencySymbol = "£";
    } else {
      currencySymbol = currency; // Fallback: Zeige die Währung als Text an
    }

    // Logik für Change (mit Plus oder Minus)
    const change = stock.regularMarketChange;
    const formattedChange = change >= 0 
      ? `+${currencySymbol}${change.toFixed(2)}` 
      : `-${currencySymbol}${Math.abs(change).toFixed(2)}`; // Minuszeichen und Betrag positiv machen

    // Logik für Change Percent (mit Plus oder Minus)
    const changePercent = stock.regularMarketChangePercent;
    const formattedChangePercent = changePercent >= 0 
      ? `+${changePercent.toFixed(2)}%` 
      : `${changePercent.toFixed(2)}%`; // Plus hinzufügen, wenn positiv

    // Debugging: Logge die gerenderten Daten
    console.log("Rendered Data:", {
      symbol,
      price,
      change: formattedChange,
      changePercent: formattedChangePercent,
      historicalData,
    });

    // Daten an die View übergeben
    res.locals.currentPath = "/stock";
    res.render("stock", {
      symbol: symbol,
      price: `${currencySymbol}${price.toFixed(2)}`, // Preis mit Währungssymbol
      change: formattedChange, // Änderung mit Währungssymbol und Plus/Minus
      changePercent: formattedChangePercent, // Prozent mit Plus/Minus
      currencySymbol: currencySymbol,
      error: null,
      stockName: query,
      historicalData: historicalData, // Historische Daten an die View übergeben
    });
  } catch (error) {
    console.error("Failed to fetch stock data:", error.message);
    res.locals.currentPath = "/stock";
    res.render("stock", {
      error: "An error occurred while fetching stock data. Please try again.",
      symbol: undefined,
      price: undefined,
      change: undefined,
      changePercent: undefined,
      currencySymbol: undefined,
      stockName: undefined,
      historicalData: null,
    });
  }
});





// ---------------------------------------------------------- Route for the Wikipedia Page
app.get("/wikipedia", async (req, res) => {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&generator=random&grnnamespace=0&prop=info|extracts&inprop=url&exintro=true&explaintext=true&format=json";

  try {
    // Anfrage an die Wikipedia API
    const response = await axios.get(url);

    // Zufälligen Artikel aus der API-Antwort extrahieren
    const pages = response.data.query.pages;
    const randomPage = Object.values(pages)[0]; // Der zufällige Artikel

    console.log("Random Wikipedia article fetched successfully:", randomPage);

    // Artikel-Daten an die wiki.ejs-Datei übergeben
    res.render("wiki", {
      title: randomPage.title,
      url: randomPage.fullurl,
      description: randomPage.extract, // Kurzbeschreibung des Artikels
    });
  } catch (error) {
    console.error("Failed to fetch random Wikipedia article:", error.message);
    res
      .status(500)
      .send(
        "An error occurred while fetching the Wikipedia article. Check your Internet connection."
      );
  }
});

// Beispiel-Route für POST-Anfragen
app.post("/submit", (req, res) => {
  console.log(req.body); // Zeigt die übermittelten Daten im Terminal an
  res.send("Formular erfolgreich übermittelt!");
});

// Server starten
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
