import fs from "fs";
import crypto from "crypto";
import EventEmitter from "events";
import open from "open";
import express from "express";
import ora from "ora";
import chalk from "chalk";
import os from "os";

import { createLibp2p } from "libp2p";
import { webSockets } from "@libp2p/websockets";
import { noise } from "@chainsafe/libp2p-noise";
import { mplex } from "@libp2p/mplex";
import { multiaddr } from "@multiformats/multiaddr";
import { yamux } from "@chainsafe/libp2p-yamux";
import { circuitRelayTransport } from "libp2p/circuit-relay";
import { identifyService } from "libp2p/identify";
import { pipe } from "it-pipe";
import { bootstrap } from "@libp2p/bootstrap";
import { kadDHT } from "@libp2p/kad-dht";
import { ethers } from "ethers";

import { createKeys, getKeys, deleteKeys } from "../utils/keypair.js";

let filename;

export default class WalletDrop {
  node;
  events = new EventEmitter();
  isReady = false;
  provider = ethers.getDefaultProvider();

  constructor(node) {
    this.node = node;
  }

  static async init() {
    const keys = await getKeys();
    if (!keys) {
      throw new Error("Please login before you can send/receive a file");
    }
    const node = await createLibp2p({
      peerId: keys.peerId,
      addresses: {
        announce: [
          "/ip4/34.171.36.20/tcp/44000/ws/p2p/12D3KooWJ86N5MDMLz4wjaTejfzkMAM5D1ARjR3SKfFS8CHUSm1B/p2p-circuit",
        ],
      },
      transports: [
        webSockets(),
        circuitRelayTransport({
          discoverRelays: 2,
        }),
      ],
      connectionEncryption: [noise()],
      streamMuxers: [yamux(), mplex()],
      services: {
        dht: kadDHT(),
        identify: identifyService(),
        bootstrap: bootstrap({
          list: [
            "/ip4/34.171.36.20/tcp/44000/ws/p2p/12D3KooWJ86N5MDMLz4wjaTejfzkMAM5D1ARjR3SKfFS8CHUSm1B",
            "/ip4/34.171.36.20/tcp/43000/ws/p2p/12D3KooWNpo4ftHMaiozkXfTM3nohJzgiLR52UkUz6PJ3X8D9iUd",
          ],
        }),
      },
    });

    const wd = new WalletDrop(node);
    await wd.node.dial(
      multiaddr(
        "/ip4/34.171.36.20/tcp/44000/ws/p2p/12D3KooWJ86N5MDMLz4wjaTejfzkMAM5D1ARjR3SKfFS8CHUSm1B"
      )
    );
    wd.node.handle("/filename", wd._setFilename);
    wd.node.handle("/file", wd._writeFile);
    wd.node.addEventListener("self:peer:update", (evt) => {
      if (wd.node.getMultiaddrs()[0]) {
        setTimeout(() => {
          wd.events.emit("_ready");
          wd.isReady = true;
        }, 2500);
      }
    });
    return wd;
  }

  static async login() {
    const loginSpinner = ora(
      "Logging in user, please sign the message opened on your browser!"
    ).start();
    const keys = await getKeys();
    if (keys) {
      throw new Error("User already logged in! 🚫");
    }
    const app = express();
    const token = crypto.randomBytes(64).toString("hex");
    open(`https://walletdrop.xyz/verify?token=${token}`);
    app.get("/callback", async (req, res) => {
      const { signature, address } = req.query;
      await createKeys(address);
      res.send("Logged in! You can close this tab.");
      const wd = await WalletDrop.init();
      wd.events.on("_ready", async () => {
        await wd.node.services.dht.put(
          new TextEncoder().encode(address),
          new TextEncoder().encode(wd.node.getMultiaddrs()[0].toString())
        );
        loginSpinner.info(`Wallet drop is ${chalk.green("ready!")} ✅`);
        process.exit(0);
      });
    });
    app.listen(3001);
  }

  async send(filename, address) {
    const sendingSpinner = ora("Preparing to send the file...").start();
    try {
      this.events.on("_ready", async () => {
        if (!this.isReady) {
          sendingSpinner.info(`Ready to send!`);
          if (address.includes("eth")) {
            const ensSpinner = ora(`Resolving ${address}...`).start();
            const walletAddress = await this.provider.resolveName(address);
            address = walletAddress;
            ensSpinner.info(`Resolved to address ${address}`);
          }
          const findingSpinner = ora(`Finding and connecting to ${address}...`);
          setTimeout(async () => {
            let nodeAddr;
            const entry = await this.node.services.dht.get(
              new TextEncoder().encode(address)
            );
            for await (let user of entry) {
              if (user.value) {
                nodeAddr = new TextDecoder().decode(user.value);
                break;
              }
            }
            findingSpinner.info("Connected!");
            const sendSpinner = ora("Sending file...").start();
            const fileStream = fs.createReadStream(filename);
            const namestream = await this.node.dialProtocol(
              multiaddr(nodeAddr),
              "/filename"
            );
            await pipe([new TextEncoder().encode(filename)], namestream);
            const stream = await this.node.dialProtocol(
              multiaddr(nodeAddr),
              "/file"
            );
            fileStream.on("data", async (data) => {
              await pipe([data], stream);
            });
            fileStream.on("end", () => {
              sendSpinner.info(chalk.green("File sent!"));
              setTimeout(() => {
                process.exit(0);
              }, 10000);
            });
          }, 2500);
        }
      });
    } catch (e) {
      throw new Error("Unexpected Error! :(");
    }
  }

  async receive() {
    try {
      const prepSpinner = ora("Preparing to receive...").start();
      const keys = await getKeys();
      if (!keys) {
        console.log(
          chalk.red("You need to login before you can start receiving!")
        );
      }
      this.events.on("_ready", () => {
        if (!this.isReady)
          prepSpinner.info(
            `Waiting to receive! : ${chalk.green(keys.address)} ✅`
          );
      });
    } catch (e) {
      throw new Error(e);
    }
  }

  async logout() {
    try {
      const logoutSpinner = ora("Logging out user...").start();
      await deleteKeys();
      logoutSpinner.info("User logged out!");
      setTimeout(() => {
        process.exit(0);
      }, 3000);
    } catch (e) {
      throw new Error(e);
    }
  }

  _setFilename({ stream }) {
    pipe(stream, async function (source) {
      for await (const msg of source) {
        filename = new TextDecoder().decode(msg.subarray());
      }
    });
  }

  _writeFile({ stream }) {
    const receiveSpinner = ora("Receiving file...");
    pipe(stream, async function (source) {
      const receivedFileStream = fs.createWriteStream(
        `${os.homedir()}/walletdrop/${filename}`
      );
      for await (const msg of source) {
        receivedFileStream.write(msg.subarray());
      }
      receiveSpinner.info("New file received!");
    });
  }
}
