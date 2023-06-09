import { Wallet, providers, utils } from 'ethers'
import * as dotenv from 'dotenv'
dotenv.config({ path: __dirname + '/.env' })

// const ownerAddress = "0xC9055374283898F6150c9b24e1c546d3EE6762D8"
// const bidderAddress = "0x69622f1cCF8bDA7805EDcC6067E8F0Fa3BF9bE61"

const bid = {
   collectionAddress: '0xFCE9b92eC11680898c7FE57C4dDCea83AeabA3ff',
   erc20Address: '0x597C9bC3F00a4Df00F85E9334628f6cDf03A1184',
   tokenId: 35,
   bid: 0.01,
}
async function main() {
   const packedBid = utils.solidityPack(
      ['address', 'address', 'uint256', 'uint256'],
      [
         bid.collectionAddress,
         bid.erc20Address,
         bid.tokenId,
         utils.parseEther(bid.bid.toString()),
      ]
   )

   const bidHash = utils.keccak256(packedBid)

   const provider = new providers.JsonRpcProvider(
      'https://rpc.sepolia.org/',
      11155111
   )

   const bidderSigner = new Wallet(
      process.env.BIDDER_PRIVATE_KEY as string,
      provider
   )

   const bidderSignatureOfBid = await bidderSigner.signMessage(bidHash)

   const ownerSigner = new Wallet(
      process.env.MARKETPLACE_PRIVATE_KEY as string,
      provider
   )

   const hashedBidderSig = utils.keccak256(bidderSignatureOfBid)

   const ownerSignatureApproval = await ownerSigner.signMessage(
      utils.arrayify(hashedBidderSig)
   )

   console.log('bid:', bid)
   console.log('bidderSig:', bidderSignatureOfBid)
   console.log('ownerApprovedSig:', ownerSignatureApproval)
}

main()
