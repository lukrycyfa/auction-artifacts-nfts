# Auction Artifacts Nft's
This project pitches of the idea of an Auction market. This use case  will be an online auction market setting
That resides on the Block chain where payments will be made in crypto currencies for our artifacts i.e. 'ERC20 Fungible Tokens' for 'ERC721 Non-Fungible Tokens'. A user
With a wallet compatible to interact with the Dapp Connects, uses available funds to mint an artifact 
With its necessary identifier's and a date being part of it. Once this artifact's is available to the owner, it could be added to the Auctions before the auction date and time. Its identifier's could be updated before then too based on user's preference. An additional 49-50 mins is added to the auction time for the auction, and starts counting down at auction time, allowing other users to Bid on the Artifact. When this time is up the Biding window closes and the Owner of that Auction will have to end it and grant's permission's for payment to the
Artifacts by the Highest Bidder pending on when logged in (Artifact Owner's need to Be Aware of Their Auction Timing's). On granting permissions for payments the highest bidder gets to See this artifacts in the collectable (Highest Bidders would have to check if their Bided Artifacts are available to be collected), And initiate the transaction to pay for and collect the artifact. Artifacts that where On Auctions and had no Bid could be updated i.e. (to be more specific thier dates's), and be restored back on Auctions. [live project here](https://auctions-artifacts.vercel.app/).   

## 1. Tech Stack
This Project uses the following tech stack:
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces.
- [use-Contractkit](contractkit
) - A frontend library for interacting with the Celo blockchain.
- [Hardhat](https://hardhat.org/) - A tool for writing and deploying smart contracts.
- [Bootstrap](https://getbootstrap.com/) - A CSS framework that provides responsive, mobile-first layouts.

## 2. Quick Start

To get this project up running locally, follow these simple steps:

### 2.1 Clone the repository:

```bash
git clone https://github.com/lukrycyfa/auction-artifacts-nfts.git
```
### 2.2 Get your own ipfs storage:
- You will be needing an ipfs storage for this project. I used the Pinata Ipfs, [Pinata Ipfs](https://app.pinata.cloud/). Sign up with pinata, get a secret key, an api key and a JWT key instructions on that are found in the doc's [Authentication](https://docs.pinata.cloud/pinata-api/authentication).
- Update this three variables in the .env file with your new keys REACT_APP_API_KEY for your api key, REACT_APP_SECRET_API_KEY for your secret key and REACT_APP_JWT for your JWT key.

```js
REACT_APP_API_KEY = your api key;
REACT_APP_SECRET_API_KEY = your api secret key;
REACT_APP_JWT = your JWT key;
```

### 2.3 Navigate to the directory:

```bash
cd auction-artifacts-nfts
```

### 2.4 Install the dependencies:

```bash
npm install
```
### 2.5 Run the dapp:

```bash
npm start
```

To properly test the dapp you will need to have a Celo wallet with testnet tokens.
This learning module [NFT Contract Development with Hardhat](https://hackmd.io/exuZTH2hTqKytn2vxgDmcg) will walk you through the process of creating a Metamask wallet and claiming Alfajores testnet tokens.

## 3. Smart-Contract Deployment
Note: Altering anything on the contract that affects the frontend would also require you updating the frontend. 

You can use your own smart contract that the dapp will interact with by following the steps below:


### 3.1 Add a new smart contract
Update the contracts/Auctions.sol file with your solidity code. 

Notice that if you change the contract and file name you will also need to update the deploy script that we will use later.

### 3.2 Compile the smart contract

```bash
npx hardhat compile
```

### 3.3 Run tests on smart contract

```bash
npx hardhat test
```

### 3.4 Update env file

- Update the file in the root directory called ".env"
- Update the key called MNEMONIC and paste in your mnemonic key. e.g

```js
MNEMONIC = "...";
```

In this case, we are using a mnemonic from an account created on Metamask. You can copy it from your Metamask account settings. An account created on the Celo extension wallet will not work.

You can find more details about the whole process in the Dacade [NFT Contract Development with Hardhat](https://hackmd.io/exuZTH2hTqKytn2vxgDmcg) learning module. It will also show you how to get testnet tokens for your account so you can deploy your smart contract in the next step.

### 3.5 Deploy the smart contract to the Celo testnet Aljafores

```bash
npx hardhat run --network alfajores scripts/deploy.js
```

This command will update the src/contract files with the deployed smart contract ABI and contract address.
