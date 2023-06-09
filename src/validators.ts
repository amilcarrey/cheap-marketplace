import { Listing, listingSchema } from "./types";
import { ownNft } from "./walletUtilities";

async function IsValidListingInput(listing: Listing) {
   const correctSchema = listingSchema.safeParse(listing);
   if (!correctSchema.success) {
      throw new Error('Invalid listing input');
   }
   const isOwner = await ownNft(listing.ownerAddress, listing.tokenId);
   if (!isOwner) {
      throw new Error('You do not own this NFT');
   }
   // TODO: check if erc20Address is an erc20 contract
   // TODO: check if collectionAddress is an erc721 contract

   return true;
}

export { IsValidListingInput } 