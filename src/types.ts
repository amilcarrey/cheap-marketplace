import { z } from "zod";

const purchaseSchema = z.object({
   buyerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
   collectionAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
   tokenId: z.string().min(1),
});

type Purchase = z.infer<typeof purchaseSchema>;


const bidSchema = z.union([purchaseSchema, z.object({
   bid: z.number().min(0),
})]);

type Offer = z.infer<typeof bidSchema>;

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

export { Offer, Listing, listingSchema, ListingType };
