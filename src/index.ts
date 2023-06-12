import express from 'express'
import { AcceptOfferInput, Listing, Offer } from './types'
import { addListing, getListings } from './repositories/lisntingsRepository'
import { addOffer, getOffers } from './repositories/offersRepository'
import { validateListing } from './services/listingService'
import { validateOffer } from './services/offerService'
import { acceptOffer, validateApproval } from './services/purchaseService'

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

app.get('/offers', (_, res) => {
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

      const isListingValid = await validateListing(listing)
      if (!isListingValid.result.success) {
         return res
            .status(isListingValid.statusCode)
            .send(isListingValid.result)
      }
      addListing(listing)
      return res.status(201).send('Listing created successfully!')
   } catch (error) {
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
      // Validate offer
      const isOfferValid = await validateOffer(offer)
      if (!isOfferValid.result.success) {
         return res.status(isOfferValid.statusCode).send(isOfferValid.result)
      }
      // Save new offer
      const newOffer = addOffer(offer)
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

      const result = await validateApproval(body)
      if (!result.result.success) {
         return res.status(result.statusCode).send(result.result)
      }

      const receipt = await acceptOffer(body)

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
