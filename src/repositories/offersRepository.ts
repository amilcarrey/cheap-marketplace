import { Offer } from '../types'

const offers: Offer[] = [
   {
      id: 'dbb3161a-e6d3-4a55-a898-12784dd4137c',
      buyerAddress: '0x69622f1cCF8bDA7805EDcC6067E8F0Fa3BF9bE61',
      collectionAddress: '0xFCE9b92eC11680898c7FE57C4dDCea83AeabA3ff',
      erc20Address: '0xbd65c58D6F46d5c682Bf2f36306D461e3561C747',
      tokenId: 35,
      bid: 0.01,
      bidderSig:
         '0x23192d0faaada95ee4d5aedb6da33fb70fac1b9f05fb39874613658fd9b4b2b342889a1c2947463d3ed028bd4e4d7bec50cae26b7868a63d8a766964bde576a81b',
   },
]

export const getOffers = (): Offer[] => {
   return offers
}
