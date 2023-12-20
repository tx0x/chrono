import Graphql from "@/api/graphql";
import Storage from "@/storage/storage";
import { ENCRYPTED_WALLET, TXS, ACCOUNT_TYPE_WEB3, ACCOUNT_TYPE_KMS } from "@/constants/constants";
import { RawPrivateKey } from "@planetarium/account";
import { BencodexDictionary, decode, encode } from "@planetarium/bencodex";
import { PublicKey } from "@planetarium/account";
import { AwsKmsAccount, KMSClient } from "@planetarium/account-aws-kms";
import * as ethers from "ethers";

const _createAwsKmsAccount = (
  keyId,
  publicKeyHex,
  region,
  accessKeyId,
  secretAccessKey
) => {
  const kmsClient = new KMSClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
  const publicKey = PublicKey.fromHex(
    publicKeyHex,
    publicKeyHex.startsWith("04") ? "uncompressed" : "compressed"
  );

  return new AwsKmsAccount(keyId, publicKey, kmsClient);
}

export default class Wallet {
  constructor(passphrase) {
    this.api = new Graphql();
    this.storage = new Storage(passphrase);
    this.passphrase = passphrase;
    this.canCall = [
      "createSequentialWallet",
      "createPrivateKeyWallet",
      "sendNCG",
      "bridgeWNCG",
      "nextNonce",
      "getPrivateKey",
      "checkKMSAccount",
    ];
  }
  canCallExternal(method) {
    return this.canCall.indexOf(method) >= 0;
  }
  hexToBuffer(hex) {
    return Buffer.from(
      ethers.utils.arrayify(hex, { allowMissingPrefix: true })
    );
  }
  decryptWallet(encryptedWalletJson, passphrase) {
    return ethers.Wallet.fromEncryptedJsonSync(
      encryptedWalletJson,
      passphrase || this.passphrase
    );
  }
  async isValidNonce(nonce) {
    let pendingNonce = await this.storage.get("nonce");
    return pendingNonce == nonce;
  }
  async nextNonce(address) {
    let pendingNonce = await this.api.getNextTxNonce(address);
    this.storage.set("nonce", pendingNonce);
    return pendingNonce;
  }
  async createSequentialWallet(primaryAddress, index) {
    let primaryEncryptedWalletJson = await this.storage.secureGet(
      ENCRYPTED_WALLET + primaryAddress.toLowerCase()
    );
    let wallet = await this.decryptWallet(primaryEncryptedWalletJson);

    let mnemonic = wallet._mnemonic().phrase;

    let newWallet = ethers.Wallet.fromMnemonic(
      mnemonic,
      "m/44'/60'/0'/0/" + index
    );
    let encryptedWallet = await newWallet.encrypt(this.passphrase);
    let address = newWallet.address;

    return { address, encryptedWallet };
  }
  async createPrivateKeyWallet(privateKey) {
    let wallet = new ethers.Wallet(privateKey);
    let encryptedWallet = await wallet.encrypt(this.passphrase);
    let address = wallet.address;

    return { address, encryptedWallet };
  }
  async _transferNCG(sender, receiver, amount, nonce, memo) {
    if (!(await this.isValidNonce(nonce))) {
      throw "Invalid Nonce";
    }

    const account = await this.getAccount(
      sender.toLowerCase(),
      this.passphrase
    );
    const publicKeyHex = (await account.getPublicKey()).toHex("uncompressed");
    const addressHex = (await account.getAddress()).toHex();
    const action = await this.api.getTransferAsset(
      addressHex,
      receiver,
      amount.toString()
    );
    const utxBytes = Buffer.from(
      await this.api.unsignedTx(publicKeyHex, action, nonce),
      "hex"
    );

    const signature = (await account.sign(utxBytes)).toBytes();
    const utx = decode(utxBytes);
    const signedTx = new BencodexDictionary([
      ...utx,
      [new Uint8Array([0x53]), signature],
    ]);
    const encodedHex = Buffer.from(encode(signedTx)).toString("hex");
    const { txId, endpoint } = await this.api.stageTx(encodedHex);

    return { txId, endpoint };
  }

  async sendNCG(sender, receiver, amount, nonce) {
    let { txId, endpoint } = await this._transferNCG(
      sender,
      receiver,
      amount,
      nonce
    );
    let result = {
      id: txId,
      endpoint,
      status: "STAGING",
      type: "transfer_asset5",
      timestamp: +new Date(),
      signer: sender,
      data: {
        sender: sender,
        receiver: receiver,
        amount: amount,
      },
    };

    await this.addPendingTxs(result);
    return result;
  }

  async bridgeWNCG(sender, receiver, amount, nonce) {
    let { txId, endpoint } = await this._transferNCG(
      sender,
      "0x9093dd96c4bb6b44a9e0a522e2de49641f146223",
      amount,
      nonce,
      receiver
    );
    let result = {
      id: txId,
      endpoint,
      status: "STAGING",
      action: "bridgeWNCG",
      type: "transfer_asset5",
      timestamp: +new Date(),
      signer: sender,
      data: {
        sender: sender,
        receiver: receiver,
        amount: amount,
      },
    };

    await this.addPendingTxs(result);
    return result;
  }

  async addPendingTxs(tx) {
    let txs = await this.storage.get(TXS + tx.signer.toLowerCase());
    if (!txs) {
      txs = [];
    }
    txs.unshift(tx);
    await this.storage.set(TXS + tx.signer.toLowerCase(), txs.splice(0, 100));
  }

  async getPrivateKey(address, passphrase) {
    const encryptedWallet = await this.storage.secureGet(
      ENCRYPTED_WALLET + address.toLowerCase()
    );
    let wallet = this.decryptWallet(encryptedWallet, passphrase);
    return wallet.privateKey;
  }

  async checkKMSAccount(
    keyId,
    publicKeyHex,
    region,
    accessKeyId,
    secretAccessKey
  ) {
    const account = _createAwsKmsAccount(
      keyId,
      publicKeyHex,
      region,
      accessKeyId,
      secretAccessKey
    );

    return (await account.getAddress()).toHex();
  }

  async getAccount(address, passphrase) {
    const stored = await this.storage.secureGet(
      ENCRYPTED_WALLET + address.toLowerCase()
    );
    const { accountType, accountData } = Array.isArray(stored)
      ? { accountType: stored[0], accountData: stored[1] }
      : { accountType: ACCOUNT_TYPE_WEB3, accountData: stored};

    console.log(ACCOUNT_TYPE_KMS);
    switch (accountType) {
      case ACCOUNT_TYPE_WEB3:
        const wallet = ethers.Wallet.fromEncryptedJsonSync(
          accountData,
          passphrase
        );

        return RawPrivateKey.fromHex(wallet.privateKey.slice(2));

      case ACCOUNT_TYPE_KMS:
        const [keyId, publicKeyHex, region, accessKeyId, secretAccessKey]
          = accountData;

        return _createAwsKmsAccount(
          keyId,
          publicKeyHex,
          region,
          accessKeyId,
          secretAccessKey
        );

      default:
        break;
    }
  }
}
