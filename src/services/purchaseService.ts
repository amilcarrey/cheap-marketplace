import { ContractReceipt, utils } from 'ethers'
import {
   deleteListing,
   getListingByCollectionAddressAndTokenId,
} from '../repositories/lisntingsRepository'
import { deleteOfferById, getOfferById } from '../repositories/offersRepository'
import { AcceptOfferInput, acceptOfferInputSchema } from '../types'
import {
   getContractInstance,
   getContractInstanceWithSigner,
} from '../utils/contractUtilities'
import { ContractType, contracts } from '../utils/contracts'
import { createValidationResult } from '../utils/validation'
import { ownNft } from '../utils/walletUtilities'

const validateApproval = async (acceptOffer: AcceptOfferInput) => {
   // Validate schema
   const validResult = acceptOfferInputSchema.safeParse(acceptOffer)
   if (!validResult.success) {
      return createValidationResult(400, false, validResult.error.message)
   }

   // Check if the offer exists. If not, return an error.
   const offer = getOfferById(acceptOffer.offerId)
   if (!offer) {
      return createValidationResult(404, false, 'Offer not found')
   }

   // Check if the listing exists. If not, return an error.
   const listing = getListingByCollectionAddressAndTokenId(
      offer.collectionAddress,
      offer.tokenId
   )
   if (!listing) {
      return createValidationResult(404, false, 'Listing not found')
   }

   // Check if the sellet is still the owner of the NFT. If not, return an error.
   const isOwner = await ownNft(acceptOffer.ownerAddress, listing.tokenId)
   if (!isOwner) {
      return createValidationResult(
         400,
         false,
         'You are not the owner of this NFT'
      )
   }

   // Check if the nft is approved to be transfer by the marketplace contract.
   const nftContract = getContractInstance(ContractType.ERC721)
   const approvedAddress = await nftContract.getApproved(offer.tokenId)
   const isApproved =
      contracts[ContractType.MARKETPLACE].address === approvedAddress
   if (!isApproved) {
      return createValidationResult(
         400,
         false,
         'The NFT is not approved to be transfer by the marketplace contract'
      )
   }

   //Check if the erc20 is approved to be transfer by the marketplace contract.
   const erc20Contract = getContractInstance(ContractType.ERC20)
   const allowance = await erc20Contract.allowance(
      offer.buyerAddress,
      contracts[ContractType.MARKETPLACE].address
   )
   const isAllowToSpend = allowance.gte(utils.parseEther(offer.bid.toString()))

   if (!isAllowToSpend) {
      return createValidationResult(
         400,
         false,
         'The ERC20 is not approved to be transfer by the marketplace contract'
      )
   }

   return createValidationResult(200, true, 'OK')
}

const acceptOffer = async (
   acceptOffer: AcceptOfferInput
): Promise<ContractReceipt> => {
   const offer = getOfferById(acceptOffer.offerId)
   if (!offer) {
      throw new Error('Offer not found')
   }

   const listing = getListingByCollectionAddressAndTokenId(
      offer.collectionAddress,
      offer.tokenId
   )
   if (!listing) {
      throw new Error('Listing not found')
   }

   // Extract data from the offer.
   const { collectionAddress, erc20Address, tokenId, bid } = offer

   // Transfer the NFT to the buyer.
   const marketplaceContract = getContractInstanceWithSigner(
      ContractType.MARKETPLACE
   )

   // Convert the bid to wei and create the auction data.
   const bidAmmount = utils.parseEther(bid.toString())
   const autionData = {
      collectionAddress,
      erc20Address,
      tokenId,
      bid: bidAmmount,
   }
   const tx = await marketplaceContract.finishAuction(
      autionData,
      offer.bidderSig,
      acceptOffer.ownerApprovedSig
   )
   const receipt = await tx.wait()

   // Delete listing and offer
   deleteListing(listing)
   deleteOfferById(acceptOffer.offerId)

   return receipt as ContractReceipt
}

export { validateApproval, acceptOffer }
