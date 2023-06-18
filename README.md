# WalletDrop Documentation

[WalletDrop Network Architecture](https://walletdrop.notion.site/WalletDrop-Network-Architecture-227c854718bf43da8a26c37adfc15c62?pvs=4)

WalletDrop is a versatile and powerful CLI tool that revolutionizes file sharing. Our application provides a seamless, secure, and instant method to share files directly to wallet addresses and ENS. Built on the robust Libp2p platform, WalletDrop stands out with its decentralized approach to file transfer. The tool's user-friendly interface ensures a smooth experience for both installation and usage.

## Installation:

1. Ensure that you have Node.js installed on your machine. WalletDrop is a Node.js application, and thus requires Node.js to be installed first. You can download Node.js from the official website: **[https://nodejs.org/](https://nodejs.org/)**
2. Install WalletDrop globally on your machine by running the following command in your terminal: (The **`-g`** flag is used to install the package globally, which allows you to run WalletDrop from anywhere in your terminal)

```bash
npm install -g walletdrop
```

1. Check WalletDrop installation on your machine by running the following command in your terminal: 

```bash
walletdrop --version
```

1. To use WalletDrop, simply run the command **`walletdrop`** followed by any options or arguments as needed. If you need help with the commands, you can always type **`walletdrop --help`** to get a list of commands and how to use them.

## Usage

### 1. Logging In:

First, you need to log in using your wallet account. Run the following command:

```bash
walletdrop login
```

Once this command is executed, it will open a new browser tab. In this tab, you'll need to select your wallet and sign a message to confirm your identity. You are now logged in to WalletDrop via the CLI.

### 2. Receiving Files:

To start listening for incoming files, use the following command:

```bash
walletdrop receive
```

This will make your wallet listen for incoming files. When a file is received, you'll get a notification along with the file details. 

<aside>
💡 By default, WalletDrop saves the received files in “walletdrop” directory which you can find on your Home directory

</aside>

### 3. Sending Files:

Sending files requires you to be present in the directory where the file is located. Use the **`send`** command, followed by the file name (with its proper extension) and the recipient's wallet address or ENS. Here's how you can do this:

```bash
walletdrop send <filename.extension> <Recipient_Wallet_Address>
```

Replace **`<filename.extension>`** with the name of the file you want to send (don't forget to include the file extension), and **`<Recipient_Wallet_Address>`** with the wallet address or ENS of the person you want to send the file to.

<aside>
💡 **Important Note**: Before you can send a file successfully, the recipient must be prepared with **`walletdrop receive`** command in their terminal. Make sure they've run this command before you attempt to send the file.

</aside>

For example, if you want to send a file named **`sample.txt`** to a wallet address **`0x1234abcd`**, you would run:

```bash
walletdrop send sample.txt 0x1234abcd

//OR

walletdrop send sample.txt freddy.eth
```

If the file is sent successfully, you'll see a confirmation message.