import ethers from 'ethers'
import { ContractType, contracts } from './contracts'

const provider = new ethers.JsonRpcProvider('https://rpc.sophia.evonet.network')

// The enum ContractType has the values ERC20 and ERC721 that already have set the address and the abi in the contracts dictionary. For more versatility, the address also must be received as a parameter here. In this case I'll be using only the tokens described in the challenge. 
const getContractInstance = (contractType: ContractType) => {
   const contractData = contracts[contractType]
   return new ethers.Contract(contractData.address, contractData.abi, provider)
}

export { getContractInstance }