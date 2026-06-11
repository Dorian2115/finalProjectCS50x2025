const dns = require("dns");

// Force Node to use Google and Cloudflare DNS
dns.setServers(["8.8.8.8", "1.1.1.1"]);

dns.resolveSrv(
  "_mongodb._tcp.spotifyapp.searpwq.mongodb.net",
  (err, addresses) => {
    if (err) {
      console.error("DNS Lookup Failed:", err.message);
    } else {
      console.log("DNS Lookup Successful! MongoDB nodes found:");
      console.log(addresses);
    }
  },
);
