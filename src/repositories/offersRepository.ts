import { Offer } from '../types'
import { v4 as uuidv4 } from 'uuid'

const offers: Offer[] = [
   {
      id: 'dbb3161a-e6d3-4a55-a898-12784dd4137c',
      buyerAddress: '0x69622f1cCF8bDA7805EDcC6067E8F0Fa3BF9bE61',
      collectionAddress: '0xFCE9b92eC11680898c7FE57C4dDCea83AeabA3ff',
      erc20Address: '0xbd65c58D6F46d5c682Bf2f36306D461e3561C747',
      tokenId: 38,
      bid: 0.01,
      bidderSig:
         '0xbc604f8851c848dc87113d92f95235be89701106e00c2b8544932293ecbaa4022529a5a2af92d9cac405a0cf3f06120fcc7250050a1488f83d14b7d82ffa77591c',
   },
]

const getOffers = (): Offer[] => {
   return offers
}

const getOfferByCollectionAddressAndTokenId = (
   collectionAddress: string,
   tokenId: number
): Offer | undefined => {
   return offers.find(
      (o) => o.collectionAddress === collectionAddress && o.tokenId === tokenId
   )
}

const getOfferById = (id: string): Offer | undefined => {
   return offers.find((o) => o.id === id)
}

const addOffer = (offer: Omit<Offer, 'id'>) => {
   const newId = uuidv4()
   const newOffer = { id: newId, ...offer }
   offers.push(newOffer)
   return newOffer
}

const deleteOfferById = (id: string) => {
   const index = offers.findIndex((o) => o.id === id)
   offers.splice(index, 1)
}

export {
   getOffers,
   getOfferByCollectionAddressAndTokenId,
   addOffer,
   getOfferById,
   deleteOfferById,
}
