import {hexZeroPad, joinSignature, serializeTransaction, splitSignature} from "ethers/lib/utils";
const BN = require('bn.js');
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const ethers = require("ethers")
const eccrypto = require("eccrypto")
import crypto from "crypto";
import {BigNumber} from "ethers";
import keccak256 from "keccak256";

//0x130283eE1f337E69236B9E5A844Ad14774450AAC
//022fd56e799cfa3db6230a8a18a1084eafaf44196c1f31dedc218e304f959139
//ho
//0x21f3d880d38b195352c39f3ea13bb6b79380994d5fcab17e49a16bbd920e4dd445c0eeb3ac1568a3346300d5b1e734269bc655a75ce11b17448c0915614505401c

const unsignedTx = 'ZDE6YWxkdTc6dHlwZV9pZHUxNTp0cmFuc2Zlcl9hc3NldDJ1Njp2YWx1ZXNkdTY6YW1vdW50bGR1MTM6ZGVjaW1hbFBsYWNlczE6AnU3Om1pbnRlcnNsMjA6R9CCoRXGPntYsVMtIOYxU46vrd5ldTY6dGlja2VydTM6TkNHZWkxMDBlZXU5OnJlY2lwaWVudDIwOllFSfxR0cBuiqjUralH+pHwvGvQdTY6c2VuZGVyMjA6EwKD7h8zfmkja55ahErRR3RFCqxlZWUxOmczMjpFgiUNDaM7BneahHXSg9XdIQxoO5uZnXTQP6xPWPprzjE6bmkyOWUxOnA2NToExhj966pCmc3EyQMXklv8Ii3E54RH0KcMYg0xHa6LfQ1vWAvV9E7amPFJWzCsVWHLVcE+oZ9AZ7yOS6fJomTMNzE6czIwOhMCg+4fM35pI2ueWoRK0Ud0RQqsMTp0dTI3OjIwMjItMDgtMzFUMTY6MTQ6MDEuNjkwMzczWjE6dWwyMDpZRUn8UdHAboqo1K2pR/qR8Lxr0DIwOhMCg+4fM35pI2ueWoRK0Ud0RQqsZWU='
//unsignedTxId: [[233, 224, 251, 85, 177, 184, 15, 43, 121, 125, 201, 48, 51, 128, 6, 227, 251, 97, 194, 155, 133, 116, 132, 51, 171, 168, 219, 172, 105, 54, 255, 43]
//base64Sign: MEQCIB5GoEvpsq4P3OuJhouEO3+hXxAsIPDkTBJ5AL0n+KppAiA3kZf6+OvmRCMEbFu/MIPzWcxGEDUAD3d/JNPe0EKnlA==

function pkToBuffer(pk) {
  return Buffer.from(ethers.utils.arrayify(pk, {allowMissingPrefix: true}))
}

// console.log('keccak', crypto.createHash('sha256').update('ZDE6YWxkdTc6dHlwZV9pZHUxNTp0cmFuc2Zlcl9hc3NldDJ1Njp2YWx1ZXNkdTY6YW1vdW50bGR1MTM6ZGVjaW1hbFBsYWNlczE6AnU3Om1pbnRlcnNsMjA6R9CCoRXGPntYsVMtIOYxU46vrd5ldTY6dGlja2VydTM6TkNHZWkxMDBlZXU5OnJlY2lwaWVudDIwOllFSfxR0cBuiqjUralH+pHwvGvQdTY6c2VuZGVyMjA6EwKD7h8zfmkja55ahErRR3RFCqxlZWUxOmczMjpFgiUNDaM7BneahHXSg9XdIQxoO5uZnXTQP6xPWPprzjE6bmkyOWUxOnA2NToExhj966pCmc3EyQMXklv8Ii3E54RH0KcMYg0xHa6LfQ1vWAvV9E7amPFJWzCsVWHLVcE+oZ9AZ7yOS6fJomTMNzE6czIwOhMCg+4fM35pI2ueWoRK0Ud0RQqsMTp0dTI3OjIwMjItMDgtMzFUMTY6MTQ6MDEuNjkwMzczWjE6dWwyMDpZRUn8UdHAboqo1K2pR/qR8Lxr0DIwOhMCg+4fM35pI2ueWoRK0Ud0RQqsZWU=', 'base64').digest())
console.log('keccak', ethers.utils.base64.decode('ZDE6YWxkdTc6dHlwZV9pZHUxNTp0cmFuc2Zlcl9hc3NldDJ1Njp2YWx1ZXNkdTY6YW1vdW50bGR1MTM6ZGVjaW1hbFBsYWNlczE6AnU3Om1pbnRlcnNsMjA6R9CCoRXGPntYsVMtIOYxU46vrd5ldTY6dGlja2VydTM6TkNHZWkxMDBlZXU5OnJlY2lwaWVudDIwOllFSfxR0cBuiqjUralH+pHwvGvQdTY6c2VuZGVyMjA6EwKD7h8zfmkja55ahErRR3RFCqxlZWUxOmczMjpFgiUNDaM7BneahHXSg9XdIQxoO5uZnXTQP6xPWPprzjE6bmkyOWUxOnA2NToExhj966pCmc3EyQMXklv8Ii3E54RH0KcMYg0xHa6LfQ1vWAvV9E7amPFJWzCsVWHLVcE+oZ9AZ7yOS6fJomTMNzE6czIwOhMCg+4fM35pI2ueWoRK0Ud0RQqsMTp0dTI3OjIwMjItMDgtMzFUMTY6MTQ6MDEuNjkwMzczWjE6dWwyMDpZRUn8UdHAboqo1K2pR/qR8Lxr0DIwOhMCg+4fM35pI2ueWoRK0Ud0RQqsZWU='))

describe("test", () => {
  test('encrypt & decrypt', async () => {
    const pk = "0x022fd56e799cfa3db6230a8a18a1084eafaf44196c1f31dedc218e304f959139"
    const wallet = new ethers.Wallet(pk)
    const walletSignature = await wallet.signMessage('ho')
    console.log('serialized', serializeTransaction({value:'0x1234'}))
    wallet.signTransaction()

    const message = ethers.utils.hashMessage('ho')
    const signature = ec.sign(ethers.utils.arrayify(message), pkToBuffer(pk), {canonical: true})
    const eccryptoSignature = joinSignature(splitSignature({
      recoveryParam: signature.recoveryParam,
      r: hexZeroPad("0x" + signature.r.toString(16), 32),
      s: hexZeroPad("0x" + signature.s.toString(16), 32),
    }))
    console.log(walletSignature == eccryptoSignature)

    await eccrypto.sign(pkToBuffer(pk), ethers.utils.arrayify(message)).then(sig => {
      const eccryptoSign = ethers.utils.hexlify(sig)
      const recoverSignature = splitSignature(walletSignature)
      const randomSig = ec.sign('', eccrypto.generatePrivate(), {canonical: true})
      randomSig.r = new BN(recoverSignature.r.substring(2), 16)
      randomSig.s = new BN(recoverSignature.s.substring(2), 16)
      randomSig.recoveryParam = recoverSignature.recoveryParam
      const recoverSign = ethers.utils.hexlify(randomSig.toDER())

      console.log(eccryptoSign == recoverSign)
    })
  })
})