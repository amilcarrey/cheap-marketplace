import { Listing, ListingType } from '../types'

const listings: Listing[] = [
   {
      ownerAddress: '0xC9055374283898F6150c9b24e1c546d3EE6762D8',
      collectionAddress: '0xFCE9b92eC11680898c7FE57C4dDCea83AeabA3ff',
      tokenId: 38,
      listingType: ListingType.FixedPrice,
      erc20Address: '0xbd65c58D6F46d5c682Bf2f36306D461e3561C747',
      bidStartAtOrSellPrice: 0.01,
   },
   {
      ownerAddress: '0xC9055374283898F6150c9b24e1c546d3EE6762D8',
      collectionAddress: '0xFCE9b92eC11680898c7FE57C4dDCea83AeabA3ff',
      tokenId: 39,
      listingType: ListingType.Bid,
      erc20Address: '0xbd65c58D6F46d5c682Bf2f36306D461e3561C747',
      bidStartAtOrSellPrice: 0.01,
   },
]

const addListing = (listing: Listing) => {
   listings.push(listing)
}

const getListings = (address?: string): Listing | Listing[] => {
   if (!address) {
      return listings
   }

   return listings.filter((listing) => listing.ownerAddress === address)
}

const getListingByCollectionAddressAndTokenId = (
   collectionAddress: string,
   tokenId: number
): Listing | undefined => {
   return listings.find(
      (o) => o.collectionAddress === collectionAddress && o.tokenId === tokenId
   )
}

const deleteListing = (listing: Listing) => {
   const index = listings.findIndex(
      (l) =>
         l.collectionAddress === listing.collectionAddress &&
         l.tokenId === listing.tokenId
   )
   listings.splice(index, 1)
}

export {
   addListing,
   getListings,
   getListingByCollectionAddressAndTokenId,
   deleteListing,
}
