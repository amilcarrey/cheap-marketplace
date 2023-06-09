import { BigNumber, providers, utils } from 'ethers'
import { getContractInstance } from './contractUtilities'
import { ContractType } from './contracts'

//Sepholia provider
const provider = new providers.JsonRpcProvider(
   'https://rpc.sepolia.org/',
   11155111
)

const getBalance = async (address: string) => {
   const balance = await provider.getBalance(address)
   return balance
}

const haveEnoughBalance = async (address: string, amount: string) => {
   const balance = await getBalance(address)
   const amountInWei = utils.parseEther(amount)
   return balance.gte(amountInWei)
}

const ownNft = async (address: string, tokenId: number) => {
   const erc721Contract = getContractInstance(ContractType.ERC721)
   const owner = await erc721Contract.ownerOf(tokenId)
   return owner === address
}

export { haveEnoughBalance, ownNft }
