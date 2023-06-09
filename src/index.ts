import express from 'express';
import { Listing, ListingType } from './types';
import { IsValidListingInput } from './validators';

const app = express();
app.use(express.json());

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

      await IsValidListingInput(listing);

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

app.post('place-bid', (req, res) => {
   res.send('Place Bid!');
}
);

app.post('buy', (req, res) => {
   res.send('Buy!');
}
);



app.listen(3000, () => {
   console.log('Example app listening on port 3000!');
}
);