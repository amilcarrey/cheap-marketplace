import { getListingByCollectionAddressAndTokenId } from '../repositories/lisntingsRepository'
import { Listing, ValidationResult, listingSchema } from '../types'
import { ownNft } from '../utils/walletUtilities'
import { createValidationResult } from '../utils/validation'

const validateListing = async (listing: Listing): Promise<ValidationResult> => {
   // Validate schema
   const correctSchema = listingSchema.safeParse(listing)
   if (!correctSchema.success) {
      return createValidationResult(400, false, 'Invalid listing input')
   }

   // Check if listing already exists
   const existingListing = getListingByCollectionAddressAndTokenId(
      listing.collectionAddress,
      listing.tokenId
   )
   if (existingListing) {
      return createValidationResult(409, false, 'Listing already exists!')
   }

   // Validate ownership of NFT
   const isOwner = await ownNft(listing.ownerAddress, listing.tokenId)
   if (!isOwner) {
      return createValidationResult(400, false, 'You do not own this NFT')
   }

   return createValidationResult(200, true)
}

export { validateListing }
