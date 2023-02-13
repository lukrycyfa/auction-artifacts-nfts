import { ERC20_DECIMALS } from "./constants";
import BigNumber from "bignumber.js";

// format a wallet address
export const truncateAddress = (address) => {
  if (!address) return;
  return (
    address.slice(0, 5) +
    "..." +
    address.slice(address.length - 4, address.length)
  );
};

// convert from big number
export const formatBigNumber = (num) => {
  if (!num) return;
  let bigNumber = new BigNumber(num);
  return bigNumber.shiftedBy(-ERC20_DECIMALS).toFixed(2);
};

//* convert to big number */
export const CeloDecVal = (num) => {
  if (!num) return;
  let bigNumber = new BigNumber(num);
  return bigNumber.shiftedBy(ERC20_DECIMALS).toNumber();
};