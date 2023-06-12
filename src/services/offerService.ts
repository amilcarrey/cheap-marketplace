import { utils } from 'ethers'
import { getListingByCollectionAddressAndTokenId } from '../repositories/lisntingsRepository'
import { ListingType, Offer, offerSchema } from '../types'
import { createValidationResult } from '../utils/validation'
import { haveEnoughBalance } from '../utils/walletUtilities'

const validateOffer = async (offer: Omit<Offer, 'id'>) => {
   // Validate Schema
   const isOfferSchemaValid = offerSchema.omit({ id: true }).safeParse(offer)
   if (!isOfferSchemaValid.success) {
      return createValidationResult(400, false, 'Invalid offer input')
   }

   // Check if listing exists
   const listing = getListingByCollectionAddressAndTokenId(
      offer.collectionAddress,
      offer.tokenId
   )
   if (!listing) {
      return createValidationResult(404, false, 'This item is not for sale')
   }

   // Check if the offer is enough
   const bidOffer = utils.parseEther(offer.bid.toString())
   const sellPrice = utils.parseEther(listing.bidStartAtOrSellPrice.toString())
   const isOfferEnough = bidOffer.gte(sellPrice)
   if (!isOfferEnough) {
      return createValidationResult(400, false, 'Your offer is not enough')
   }

   // Check if the bidder have the enough balance
   const _haveEnoughBalance = await haveEnoughBalance(
      offer.buyerAddress,
      offer.bid.toString()
   )
   if (!_haveEnoughBalance) {
      return createValidationResult(400, false, "You don't have enough founds!")
   }

   // If the listing is a fixed price, check if the offer is valid
   const isOfferValid =
      isOfferEnough && offer.erc20Address === listing.erc20Address
   if (!isOfferValid && listing.listingType === ListingType.FixedPrice) {
      return createValidationResult(400, false, 'Invalid offer')
   }

   return createValidationResult(200, true)
}

export { validateOffer }
