import { ethers } from 'ethers';
import * as dotenv from 'dotenv'
dotenv.config({ path: __dirname + '/.env' })

// const ownerAddress = "0xC9055374283898F6150c9b24e1c546d3EE6762D8"
// const bidderAddress = "0x69622f1cCF8bDA7805EDcC6067E8F0Fa3BF9bE61"


const bid = {
   collectionAddress: '0xFCE9b92eC11680898c7FE57C4dDCea83AeabA3ff',
   erc20Address: '0xbd65c58D6F46d5c682Bf2f36306D461e3561C747',
   tokenId: 35,
   bid: 0.01,
};

async function main() {
   const provider = new ethers.providers.JsonRpcProvider(
      'https://rpc.sepolia.org/'
   );

   const wallet = new ethers.Wallet(
      process.env.BIDDER_PRIVATE_KEY as string,
      provider
   );

   const auctionData = {
      collectionAddress: bid.collectionAddress,
      erc20Address: bid.erc20Address,
      tokenId: bid.tokenId,
      bid: ethers.utils.parseEther(bid.bid.toString())
   };

   const packedBid = ethers.utils.solidityPack(
      ['address', 'address', 'uint256', 'uint256'],
      [
         auctionData.collectionAddress,
         auctionData.erc20Address,
         auctionData.tokenId,
         auctionData.bid
      ]
   );

   const bidHash = ethers.utils.keccak256(packedBid);
   const bidderSignature = await wallet.signMessage(bidHash);

   const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY as string;
   const ownerWallet = new ethers.Wallet(ownerPrivateKey, provider);

   const hashedBidderSig = ethers.utils.keccak256(
      ethers.utils.arrayify(bidderSignature)
   );

   const ownerSignature = await ownerWallet.signMessage(hashedBidderSig);

   console.log('bid on wei:', auctionData.bid.toString());
   console.log('bid:', bid);
   console.log('bidderSig:', bidderSignature);
   console.log('ownerApprovedSig:', ownerSignature);
}

main();
