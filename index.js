import express from "express";
import proxy from "express-http-proxy";

// App 1: Target server
const app1 = express();

app1.post("/post", async (req, res) => {
  // If request indicates upload is more than 100kB, respond immediately with 413
  const length = parseInt(req.headers["content-length"]);
  if (isNaN(length) || length > 100000) {
    res.status(413).sendFile("failure.html", { root: "html" });
  } else {
    res.status(200).sendFile("success.html", { root: "html" });
  }
});

app1.use("/", async (req, res) => {
  res.status(200).sendFile("home.html", { root: "html" });
});

app1.use((err, req, res, next) => {
  console.error("target error\n", err);
  res.status(500).sendFile("error.html", { root: "html" });
});

const port1 = 3001;
app1.listen(port1, () => {
  console.info(`Server running at http://localhost:${port1}`);
});

// App 2: Proxy
const app2 = express();

app2.all("*", (req, res, next) => {
  proxy(`http://localhost:${port1}`, {
    parseReqBody: false,
    limit: "1gb",
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers ||= {};
      // Workaround for issue #545
      if (srcReq.headers["content-length"]) {
        proxyReqOpts.headers["content-length"] =
          srcReq.headers["content-length"];
      }
      return proxyReqOpts;
    },
  })(req, res, next);
});

app2.use((err, req, res, next) => {
  console.error("proxy error\n", err);
  res.status(500).sendFile("error.html", { root: "html" });
});

const port2 = 3002;
app2.listen(port2, () => {
  console.info(`Proxy running at http://localhost:${port2}`);
});
