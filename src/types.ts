import { z } from "zod";

const offerSchema = z.object({
   id: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
   buyerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
   collectionAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
   erc20Address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
   tokenId: z.number().min(1),
   bid: z.number().min(0),
   buyerSignature: z.string(),
});

type Offer = z.infer<typeof offerSchema>;

enum ListingType {
   Bid = 'Bid',
   FixedPrice = 'FixedPrice'
}

const listingSchema = z.object({
   ownerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
   collectionAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
   tokenId: z.number().min(1),
   listingType: z.nativeEnum(ListingType),
   erc20Address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
   bidStartAtOrSellPrice: z.number().min(0),
});

type Listing = z.infer<typeof listingSchema>;

export { Offer, Listing, listingSchema, offerSchema, ListingType };
