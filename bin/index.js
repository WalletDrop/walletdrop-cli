import { Command } from "commander";
import WalletDrop from "../lib/walletdrop.js";

const program = new Command();

program
  .name("walletdrop")
  .version("0.0.1")
  .description("WalletDrop CLI - Share files instantly to Ethereum addresses!");

// Login command
program
  .command("login")
  .description("Log in to the WalletDrop service")
  .action(async () => {
    await WalletDrop.login();
  });

program
  .command("send <filename> <address>")
  .description("Send a file")
  .action(async (filename, address) => {
    try {
      const walletDrop = await WalletDrop.init();
      await walletDrop.send(filename, address);
    } catch (error) {
      console.error("An error occurred:", error);
    }
  });

program
  .command("receive")
  .description("Receive a file")
  .action(async () => {
    try {
      const walletDrop = await WalletDrop.init();
      await walletDrop.receive();
    } catch (error) {
      console.error("An error occurred:", error);
    }
  });

program
  .command("logout")
  .description("Logout from account")
  .action(async () => {
    try {
      const walletdrop = await WalletDrop.init();
      await walletdrop.logout();
    } catch (e) {
      console.error("Unable to logout", e);
    }
  });

program.parse(process.argv);
