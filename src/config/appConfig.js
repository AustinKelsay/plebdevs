const appConfig = {
    defaultRelayUrls: [
      "wss://nos.lol/",
      "wss://relay.damus.io/",
      "wss://relay.snort.social/",
      "wss://relay.nostr.band/",
      "wss://relay.mutinywallet.com/",
      "wss://relay.primal.net/",
      "wss://nostr21.com/",
      "wss://nostrue.com/",
      "wss://purplerelay.com/",
      "wss://relay.devs.tools/"
    ],
    authorPubkeys: ["f33c8a9617cb15f705fc70cd461cfd6eaf22f9e24c33eabad981648e5ec6f741", "c67cd3e1a83daa56cff16f635db2fdb9ed9619300298d4701a58e68e84098345", "468f729dd409053dac5e7470622c3996aad88db6ed1de9165cb1921b5ab4fd5e"],
    customLightningAddresses: [
      {
        // todo remove need for lowercase
        // name will appear as name@plebdevs.com (lowercase)
        name: "austin",
        // If enabled, zaps are enabled
        allowsNostr: true,
        // make you're own lud06 metadata description
        description: "Austin's Lightning Address",
        // millisats
        maxSendable: 10000000000,
        // millisats
        minSendable: 1000,
        // Your LND invoice macaroon
        invoiceMacaroon: process.env.LND_MACAROON,
        // your LND TLS certificate (may be optional depending on your LND configuration)
        lndCert: "",
        // your LND host (do not include https:// or port)
        lndHost: process.env.LND_HOST,
        // your LND REST API port (default is 8080)
        lndPort: "8080",
      },
      {
        // todo remove need for lowercase
        // name will appear as name@plebdevs.com (lowercase)
        name: "plebdevs",
        // If enabled, zaps are enabled
        allowsNostr: true,
        // make you're own lud06 metadata description
        description: "plebdevs.com",
        // millisats
        maxSendable: 10000000000,
        // millisats
        minSendable: 1000,
        // Your LND invoice macaroon
        invoiceMacaroon: process.env.LND_MACAROON,
        // your LND TLS certificate (may be optional depending on your LND configuration)
        lndCert: "",
        // your LND host (do not include https:// or port)
        lndHost: process.env.LND_HOST,
        // your LND REST API port (default is 8080)
        lndPort: "8080",
      },
    ],
  };
  
export default appConfig;