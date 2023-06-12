import { Contract, Wallet, providers } from 'ethers'
import { ContractType, contracts } from './contracts'
import * as dotenv from 'dotenv'
dotenv.config({ path: `${__dirname.split('\\').slice(0, -1).join('\\')}/.env` })

const provider = new providers.JsonRpcProvider(
   'https://rpc.sepolia.org/',
   11155111
)

// The enum ContractType has the values ERC20 and ERC721 that already have set the address and the abi in the contracts dictionary. For more versatility, the address also must be received as a parameter here and only take the abi from the dictionary. In this case I'll be using only the tokens described in the challenge.
const getContractInstance = (contractType: ContractType) => {
   const contractData = contracts[contractType]
   return new Contract(contractData.address, contractData.abi, provider)
}

const getContractInstanceWithSigner = (contractType: ContractType) => {
   const contractData = contracts[contractType]
   const signer = new Wallet(
      process.env.MARKETPLACE_PRIVATE_KEY as string,
      provider
   )
   return new Contract(contractData.address, contractData.abi, signer)
}

export { getContractInstance, getContractInstanceWithSigner }
