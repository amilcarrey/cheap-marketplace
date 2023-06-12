import express from 'express'
import {
   AcceptOfferInput,
   Listing,
   ListingType,
   Offer,
   acceptOfferInputSchema,
   listingSchema,
   offerSchema,
} from './types'
import { haveEnoughBalance, ownNft } from './utils/walletUtilities'
import { v4 as uuidv4 } from 'uuid'
import {
   getContractInstance,
   getContractInstanceWithSigner,
} from './utils/contractUtilities'
import { ContractType, contracts } from './utils/contracts'
import { utils } from 'ethers'
import {
   addListing,
   deleteListing,
   getListingByCollectionAddressAndTokenId,
   getListings,
} from './repositories/lisntingsRepository'
import {
   addOffer,
   deleteOfferById,
   getOfferById,
   getOffers,
} from './repositories/offersRepository'

const app = express()
app.use(express.json())

const port = 3000

app.get(['/listings', '/listings/:address'], async (req, res) => {
   try {
      const address = req.params.address
      const result = getListings(address)
      return res.status(200).send(result)
   } catch (error) {
      if (error instanceof Error) {
         res.status(500).send(error.message)
      }
      res.status(500).send(error)
   }
})

app.get('/offers', (req, res) => {
   try {
      const result = getOffers()
      return res.status(200).send(result)
   } catch (error) {
      if (error instanceof Error) {
         res.status(500).send(error.message)
      }
      res.status(500).send(error)
   }
})

app.post('/sell', async (req, res) => {
   try {
      const listing = req.body as Listing
      console.log(listing)

      const correctSchema = listingSchema.safeParse(listing)
      if (!correctSchema.success) {
         res.status(400).send({
            success: false,
            error: 'Invalid listing input',
         })
      }
      const isOwner = await ownNft(listing.ownerAddress, listing.tokenId)
      if (!isOwner) {
         res.status(400).send({
            success: false,
            error: 'You do not own this NFT',
         })
      }

      const existingListing = getListingByCollectionAddressAndTokenId(
         listing.collectionAddress,
         listing.tokenId
      )

      if (existingListing) {
         return res.status(409).send({
            success: false,
            error: 'Listing already exists!',
         })
      }

      addListing(listing)

      return res.status(201).send('Listing created successfully!')
   } catch (error: any) {
      if (error instanceof Error) {
         res.status(500).send(error.message)
      }
      res.status(500).send(error)
   }
})

// Maybe this endpoint should have a different name, like 'buy' or 'purchase', because
//even if the listing is a fixed price, the seller still needs to accept the offer signing the offer. So, just to simplify things, I'll keep the name 'place-bid' and I'll be using for both cases 'purchase' and 'bid'.
app.post('/bid', async (req, res) => {
   try {
      const offer = req.body as Omit<Offer, 'id'>

      const isOfferSchemaValid = offerSchema.omit({ id: true }).safeParse(offer)

      if (!isOfferSchemaValid.success) {
         return res.status(400).send({
            success: false,
            error: 'Invalid offer input',
         })
      }

      const listing = getListingByCollectionAddressAndTokenId(
         offer.collectionAddress,
         offer.tokenId
      )

      if (!listing) {
         return res.status(404).send({
            success: false,
            error: 'This item is not for sale',
         })
      }

      const _haveEnoughBalance = await haveEnoughBalance(
         offer.buyerAddress,
         offer.bid.toString()
      )

      if (!_haveEnoughBalance) {
         return res.status(400).send({
            success: false,
            error: "You don't have enough founds!",
         })
      }

      const bidOffer = utils.parseEther(offer.bid.toString())
      const sellPrice = utils.parseEther(
         listing.bidStartAtOrSellPrice.toString()
      )
      const isOfferEnough = bidOffer.gte(sellPrice)

      if (!isOfferEnough) {
         return res.status(400).send({
            success: false,
            error: 'Your offer is not enough',
         })
      }

      const isOfferValid =
         isOfferEnough && offer.erc20Address === listing.erc20Address
      if (!isOfferValid && listing.listingType === ListingType.FixedPrice) {
         return res.status(400).send({
            success: false,
            error: "Your're trying to buy an item with a different currency",
         })
      }

      const newOffer = { id: uuidv4(), ...offer }
      addOffer(newOffer)
      return res.status(201).send({ success: true, offer: newOffer })
   } catch (error) {
      if (error instanceof Error) {
         res.status(500).send(error.message)
      }
      res.status(500).send(error)
   }
})

app.post('/accept-offer', async (req, res) => {
   try {
      // Obtain the offer from the request body
      const body = req.body as AcceptOfferInput
      const validResult = acceptOfferInputSchema.safeParse(body)
      if (!validResult.success) {
         return res
            .status(400)
            .send({ success: false, error: validResult.error })
      }

      // Check if the offer exists. If not, return an error.
      const offer = getOfferById(body.offerId)
      if (!offer) {
         return res
            .status(404)
            .send({ success: false, error: 'Offer not found' })
      }

      // Check if the listing exists. If not, return an error.
      const listing = getListingByCollectionAddressAndTokenId(
         offer.collectionAddress,
         offer.tokenId
      )
      if (!listing) {
         return res
            .status(404)
            .send({ success: false, error: 'Listing not found' })
      }

      // Check if the sellet is still the owner of the NFT. If not, return an error.
      const isOwner = await ownNft(body.ownerAddress, listing.tokenId)
      if (!isOwner) {
         return res.status(400).send({
            success: false,
            error: 'You are not the owner of this NFT',
         })
      }

      // Check if the nft is approved to be transfer by the marketplace contract.
      const nftContract = getContractInstance(ContractType.ERC721)
      const approvedAddress = await nftContract.getApproved(offer.tokenId)
      const isApproved =
         contracts[ContractType.MARKETPLACE].address === approvedAddress

      if (!isApproved) {
         return res.status(400).send({
            success: false,
            error: 'The NFT is not approved to be transfer by the marketplace contract',
         })
      }

      //Check if the erc20 is approved to be transfer by the marketplace contract.
      const erc20Contract = getContractInstance(ContractType.ERC20)
      const allowance = await erc20Contract.allowance(
         offer.buyerAddress,
         contracts[ContractType.MARKETPLACE].address
      )
      const isAllowToSpend = allowance.gte(
         utils.parseEther(offer.bid.toString())
      )

      if (!isAllowToSpend) {
         return res.status(400).send({
            success: false,
            error: 'The ERC20 is not approved to be transfer by the marketplace contract',
         })
      }

      // Extract data from the offer.
      const { collectionAddress, erc20Address, tokenId, bid } = offer

      // Transfer the NFT to the buyer.
      const marketplaceContract = getContractInstanceWithSigner(
         ContractType.MARKETPLACE
      )
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
         body.ownerApprovedSig
      )
      const receipt = await tx.wait()

      // Delete the listing.
      deleteListing(listing)

      // Delete the offer.
      deleteOfferById(body.offerId)

      res.status(200).send({
         success: true,
         transactionHash: receipt.transactionHash,
      })
   } catch (error) {
      error instanceof Error
         ? res.status(500).send(error.message)
         : res.status(500).send(error)
   }
})

app.listen(port, () => {
   console.log(`Cheap marketplace app listening on port ${port}!`)
})
