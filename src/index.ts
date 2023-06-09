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
import { ContractType } from './utils/contracts'
import { utils } from 'ethers'

const app = express()
app.use(express.json())

const port = 3000

const listings: Listing[] = [
   {
      ownerAddress: '0xC9055374283898F6150c9b24e1c546d3EE6762D8',
      collectionAddress: '0xFCE9b92eC11680898c7FE57C4dDCea83AeabA3ff',
      tokenId: 34,
      listingType: ListingType.FixedPrice,
      erc20Address: '0xbd65c58D6F46d5c682Bf2f36306D461e3561C747',
      bidStartAtOrSellPrice: 0.01,
   },
   {
      ownerAddress: '0xC9055374283898F6150c9b24e1c546d3EE6762D8',
      collectionAddress: '0xFCE9b92eC11680898c7FE57C4dDCea83AeabA3ff',
      tokenId: 35,
      listingType: ListingType.Bid,
      erc20Address: '0xbd65c58D6F46d5c682Bf2f36306D461e3561C747',
      bidStartAtOrSellPrice: 0.01,
   },
]

const offers: Offer[] = [
   {
      id: 'dbb3161a-e6d3-4a55-a898-12784dd4137c',
      buyerAddress: '0x69622f1cCF8bDA7805EDcC6067E8F0Fa3BF9bE61',
      collectionAddress: '0xFCE9b92eC11680898c7FE57C4dDCea83AeabA3ff',
      erc20Address: '0x597C9bC3F00a4Df00F85E9334628f6cDf03A1184',
      tokenId: 35,
      bid: 0.01,
      bidderSig:
         '0xbc8a24a46da66820353950dbd5b38c7e4727da820ffae5166d8aa4ce1f3d52bf6e580fe20d4e80a583fc11329c018974dedcf14bc4c5f0e5e4770f061dfcad471b',
   },
]

app.get(['/listings', '/listings/:address'], (req, res) => {
   try {
      const address = req.params.address
      if (!address) {
         return res.status(200).send(listings)
      }

      const filteredListings = listings.filter(
         (listing) => listing.ownerAddress === address
      )

      return res.status(200).send(filteredListings)
   } catch (error) {
      return res.status(500).send(error)
   }
})

app.get('/offers', (req, res) => {
   try {
      return res.status(200).send(offers)
   } catch (error) {
      return res.status(500).send(error)
   }
})

app.post('/sell', async (req, res) => {
   try {
      const listing = req.body as Listing
      console.log(listing)

      const correctSchema = listingSchema.safeParse(listing)
      if (!correctSchema.success) {
         res.status(400).send('Invalid listing input')
      }
      const isOwner = await ownNft(listing.ownerAddress, listing.tokenId)
      if (!isOwner) {
         res.status(400).send('You do not own this NFT')
      }

      const existingListing = listings.find(
         (l) =>
            l.collectionAddress === listing.collectionAddress &&
            l.tokenId === listing.tokenId
      )

      if (existingListing) {
         return res.status(409).send('Listing already exists!')
      }

      listings.push(listing)

      return res.status(201).send('Listing created successfully!')
   } catch (error: any) {
      return res.status(500).send(error.message as Error)
   }
})

// Maybe this endpoint should have a different name, like 'buy' or 'purchase', because
//even if the listing is a fixed price, the seller still needs to accept the offer signing the offer. So, just to simplify things, I'll keep the name 'place-bid' and I'll be using for both cases 'purchase' and 'bid'.
app.post('/bid', async (req, res) => {
   try {
      const offer = req.body as Omit<Offer, 'id'>

      const isOfferSchemaValid = offerSchema.omit({ id: true }).safeParse(offer)

      if (!isOfferSchemaValid.success) {
         return res.status(400).send('Invalid offer input')
      }

      const listing = listings.find(
         (l) =>
            l.collectionAddress === offer.collectionAddress &&
            l.tokenId === offer.tokenId
      )

      if (!listing) {
         return res.status(404).send('This item is not for sale')
      }

      const _haveEnoughBalance = await haveEnoughBalance(
         offer.buyerAddress,
         offer.bid.toString()
      )

      if (!_haveEnoughBalance) {
         return res.status(400).send("You don't have enough founds!")
      }

      const bidOffer = utils.parseEther(offer.bid.toString())
      const sellPrice = utils.parseEther(
         listing.bidStartAtOrSellPrice.toString()
      )
      const isOfferEnough = bidOffer.gte(sellPrice)

      if (!isOfferEnough) {
         return res.status(400).send('Your offer is not enough')
      }

      const isOfferValid =
         isOfferEnough && offer.erc20Address === listing.erc20Address
      if (!isOfferValid && listing.listingType === ListingType.FixedPrice) {
         return res
            .status(400)
            .send("Your're trying to buy an item with a different currency")
      }

      const newOffer = { id: uuidv4(), ...offer }
      offers.push(newOffer)
      return res.status(201).send({ success: true, offer: newOffer })
   } catch (error: any) {
      res.status(500).send(error.message)
   }
})
//1000000000000000000
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
      const offer = offers.find((o) => o.id === body.offerId)
      if (!offer) {
         return res
            .status(404)
            .send({ success: false, error: 'Offer not found' })
      }

      // Check if the listing exists. If not, return an error.
      const listing = listings.find(
         (l) =>
            l.collectionAddress === offer.collectionAddress &&
            l.tokenId === offer.tokenId
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

      // Check if the offer is still valid. If not, return an error and delete the listing.

      // Check if the seller and the buyer have allowed the contract to transfer the NFT and the ERC20 tokens on their behalf. If not, return an error.

      // Extract data from the offer.
      const { collectionAddress, erc20Address, tokenId, bid } = offer

      // Transfer the NFT to the buyer.
      const marketplaceContract = getContractInstanceWithSigner(
         ContractType.MARKETPLACE
      )
      const tx = await marketplaceContract.finishAuction(
         {
            collectionAddress,
            erc20Address,
            tokenId,
            bid: utils.parseEther(bid.toString()),
         },
         offer.bidderSig,
         body.ownerApprovedSig
      )
      const receipt = await tx.wait()

      res.status(200).send(receipt)
   } catch (error: any) {
      res.status(500).send(error.message)
   }
})

app.listen(port, () => {
   console.log(`Example app listening on port ${port}!`)
})
