import express from 'express';
import { Listing, ListingType, Offer, listingSchema, offerSchema } from './types';
import { haveEnoughBalance, ownNft } from './walletUtilities';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

const port = 3000;

const listings: Listing[] = [
   {
      ownerAddress: "0xC9055374283898F6150c9b24e1c546d3EE6762D8",
      collectionAddress: "0xFCE9b92eC11680898c7FE57C4dDCea83AeabA3ff",
      tokenId: 34,
      listingType: ListingType.FixedPrice,
      erc20Address: "0xbd65c58D6F46d5c682Bf2f36306D461e3561C747",
      bidStartAtOrSellPrice: 1
   },
   {
      ownerAddress: "0xC9055374283898F6150c9b24e1c546d3EE6762D8",
      collectionAddress: "0xFCE9b92eC11680898c7FE57C4dDCea83AeabA3ff",
      tokenId: 35,
      listingType: ListingType.Bid,
      erc20Address: "0xbd65c58D6F46d5c682Bf2f36306D461e3561C747",
      bidStartAtOrSellPrice: 1
   }
];

const offers: Offer[] = [];


app.get(['/listings', '/listings/:address'], (req, res) => {
   try {
      const address = req.params.address;
      if (!address) {
         return res.status(200).send(listings);
      }

      const filteredListings = listings.filter(listing => listing.ownerAddress === address);

      return res.status(200).send(filteredListings);

   } catch (error) {
      return res.status(500).send(error);

   }
}
);

app.post('/sell', async (req, res) => {
   try {
      const listing = req.body as Listing;
      console.log(listing);

      const correctSchema = listingSchema.safeParse(listing);
      if (!correctSchema.success) {
         res.status(400).send('Invalid listing input');
      }
      const isOwner = await ownNft(listing.ownerAddress, listing.tokenId);
      if (!isOwner) {
         res.status(400).send('You do not own this NFT');
      }

      const existingListing = listings.find(l => l.collectionAddress === listing.collectionAddress && l.tokenId === listing.tokenId);

      if (existingListing) {
         return res.status(409).send('Listing already exists!');
      }

      listings.push(listing);

      return res.status(201).send('Listing created successfully!');
   } catch (error: any) {
      return res.status(500).send(error.message as Error);
   }
}
);

// Maybe this endpoint should have a different name, like 'buy' or 'purchase', because 
//but even if the listing is a fixed price, the seller still needs to accept the offer signing the offer. So, just to simplify things, I'll keep the name 'place-bid' and I'll be using for both cases 'purchase' and 'bid'.
app.post('place-bid', async (req, res) => {
   try {
      const offer = req.body as Offer

      const isOfferSchemaValid = offerSchema.safeParse(offer)

      if (!isOfferSchemaValid.success) {
         return res.status(400).send('Invalid offer input')
      }

      const listing = listings.find(l => l.collectionAddress === offer.collectionAddress && l.tokenId === offer.tokenId)

      if (!listing) {
         return res.status(404).send('This item is not for sale')
      }

      const _haveEnoughBalance = await haveEnoughBalance(offer.buyerAddress, offer.bid)

      if (!_haveEnoughBalance) {
         return res.status(400).send('You don\'t have enough founds!')
      }

      if (listing.listingType === ListingType.FixedPrice) {
         const isOfferEnough = offer.bid >= listing.bidStartAtOrSellPrice
         const isOfferValid = isOfferEnough && offer.erc20Address === listing.erc20Address

         if (!isOfferValid) {
            return res.status(400).send('Your offer is not valid, the amount is not enough or the token is not the same as the listing')
         }
      }

      offers.push(offer)
   } catch (error) {
      res.status(500).send(error.message)
   }
}
);

app.post('/accept-offer', async (req, res) => {
   try {
      // Obtain the offer from the request body
      // Check again if the offer is still valid. If not, return an error and delete the listing. 
      // Check if the seller and the buyer have allowed the contract to transfer the NFT and the ERC20 tokens on their behalf. If not, return an error.
      // Transfer the NFT to the buyer.
   } catch (error) {
      res.status(500).send(error.message)
   }
})

app.listen(3000, () => {
   console.log('Example app listening on port 3000!');
}
);