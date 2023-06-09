import { z } from "zod";

const acceptOfferInputSchema = z.object({
   offerId: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
   ownerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
   ownerApprovedSig: z.string(),
});

type AcceptOfferInput = z.infer<typeof acceptOfferInputSchema>;

const offerSchema = z.object({
   id: z.string().uuid(),
   buyerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
   collectionAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
   erc20Address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
   tokenId: z.number().min(1),
   bid: z.number().min(1).nonnegative(),
   bidderSig: z.string(),
});

type Offer = z.infer<typeof offerSchema>;

enum ListingType {
   Bid = 'Bid',
   FixedPrice = 'FixedPrice'
}

const listingSchema = z.object({
   ownerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
   collectionAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
   tokenId: z.number().min(1).nonnegative(),
   listingType: z.nativeEnum(ListingType),
   erc20Address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
   bidStartAtOrSellPrice: z.number().min(1).nonnegative(),
});

type Listing = z.infer<typeof listingSchema>;

export { Offer, Listing, listingSchema, offerSchema, ListingType, AcceptOfferInput, acceptOfferInputSchema };
