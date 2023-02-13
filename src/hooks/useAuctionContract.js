import { useContract } from "./useContract";
import Auctions from "../contracts/AuctionNFTs.json";
import AuctionAddress from "../contracts/AuctionNFTs-address.json";

// export interface for smart contract
export const useAuctionContract = () =>
  useContract(Auctions.abi, AuctionAddress.AuNFT);
