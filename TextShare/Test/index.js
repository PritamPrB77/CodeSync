const fetch = require("node-fetch");

const url =
  "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true";

const options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-RapidAPI-Key": "",
    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  },
  body: JSON.stringify({
    language_id: 109, // ✅ Python 3 (use 71 instead of 52 on RapidAPI)
    source_code: Buffer.from("print('Hello, World!')").toString("base64"),
    stdin: Buffer.from("").toString("base64"),
  }),
};

fetch(url, options)
  .then((res) => res.json())
  .then((json) => {
    const output = Buffer.from(json.stdout, "base64").toString("utf8");
    console.log("Decoded Output:", output);
  })
  .catch((err) => console.error("error:" + err));
