import axios from "axios";
require("dotenv").config();
const FormData = require("form-data");

const _api = process.env.REACT_APP_API_KEY;
const _sec = process.env.REACT_APP_SECRET_API_KEY;

// Called To Create A New Artifact
export const createArt = async (
  auctionContract,
  performActions,
  { artname, description, ipfsArtAlias, auctiondate, firstprice, attributes }
) => {
  await performActions(async (kit) => {
    if (!artname || !description || !ipfsArtAlias) return;
    const { defaultAccount } = kit;
    // Convert Artifact Data Into Json Format
    var data = JSON.stringify({
      pinataContent: {
        artname,
        description,
        image: ipfsArtAlias,
        date: auctiondate,
        price: firstprice,
        owner: defaultAccount,
        attributes,
      },
    });

    // Configure Request To Post Data To Pinata IPFS
    var config = {
      method: "post",
      url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: _api,
        pinata_secret_api_key: _sec,
      },
      data: data,
    };

    try {
      // save Artifact Metadata  metadata to Pinata IPFS
      const res = await axios(config);
      // Pinanta IPFS url for uploaded metadata
      const url = `https://ipfs.io/ipfs/${res.data.IpfsHash}`;

      // mint the Artifact and save the IPFS url to the blockchain
      let price = await auctionContract.methods.MINT_PRICE().call();
      let transaction = await auctionContract.methods
        .safeMint(url)
        .send({ from: defaultAccount, value: price });

      return transaction;
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  });
};

// Called To Update An Artifact
export const updateArt = async (
  auctionContract,
  performActions,
  {
    index,
    newartname,
    newipfsArtAlias,
    newauctiondate,
    newdescription,
    newfirstprice,
    ownerAddress,
    newattr,
  }
) => {
  await performActions(async (kit) => {
    const { defaultAccount } = kit;
    if (!newartname || !newdescription || !newipfsArtAlias) return;
    // Convert Artifact Metadata To Json Format
    var data = JSON.stringify({
      pinataContent: {
        artname: newartname,
        description: newdescription,
        image: newipfsArtAlias,
        date: newauctiondate,
        price: newfirstprice,
        owner: ownerAddress,
        attributes: newattr,
      },
    });

    // Configure Request To Post Data To Pinata IPFS
    var config = {
      method: "post",
      url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: _api,
        pinata_secret_api_key: _sec,
      },
      data: data,
    };

    try {

      // save Artifact Metadata  metadata to Pinata IPFS
      const res = await axios(config);

      // Pinanta IPFS url for uploaded metadata
      const url = `https://ipfs.io/ipfs/${res.data.IpfsHash}`;

      // Update Tokens Uri On The Blockchain
      let transaction = await auctionContract.methods
        ._setURI(index.toString(), url)
        .send({ from: defaultAccount });

      return transaction;
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  });
};

// Called To Upload ArtifactFile
export const uploadArtifactFile = async (e) => {
  const file = e.target.files;
  if (!file) return;
  const formData = new FormData();

  formData.append("file", file[0]);

  // Convert ArtifactFile Metadata To Json Format
  const metadata = JSON.stringify({
    name: "ipfsArtAlias",
  });
  formData.append("pinataMetadata", metadata);

  const options = JSON.stringify({
    cidVersion: 0,
  });
  formData.append("pinataOptions", options);

  try {
    // Configure Request To Post Data To Pinata
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: "Infinity",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
          pinata_api_key: _api,
          pinata_secret_api_key: _sec,
        },
      }
    );

    // Return ArtifactFile Pinata IPFS Url
    return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
  } catch (error) {
    console.log(error);
  }
};

// Called To Fetch All Artifacts On Autions
export const getArtifactsOnAuc = async (auctionContract) => {
  try {
    // testing Request To Pinata
    var config = {
      method: "get",
      url: "https://api.pinata.cloud/data/testAuthentication",
      headers: {
        pinata_api_key: _api,
        pinata_secret_api_key: _sec,
      },
    };

    const res = await axios(config);

    // Create An Array, Make A Call To The Contract And Push Returned Artifacts
    const arts = [];
    const ActiveAucs = await auctionContract.methods.ActiveAucs().call();
    const Auc_count = await auctionContract.methods._ActAucCount().call();

    // Use A for Loop, Make A Call To The Contract, Get The Token Url
    // Fetch, Resolve And Push The Artifacts Metadata Into The Array
    for (let i = 0; i < Number(Auc_count); i++) {
      const art = new Promise(async (resolve) => {
        const res = await auctionContract.methods
          .tokenURI(parseInt(ActiveAucs[i]))
          .call();
        const meta = await fetchArtMetadata(res);
        const owner = await fetchArtOwner(
          auctionContract,
          parseInt(ActiveAucs[i])
        );
        resolve({
          index: parseInt(ActiveAucs[i]),
          owner,
          name: meta.data.artname,
          image: meta.data.image,
          date: meta.data.date,
          price: meta.data.price,
          description: meta.data.description,
          attributes: meta.data.attributes,
        });
      });
      arts.push(art);
    }
    return Promise.all(arts);
  } catch (e) {
    console.log({ e });
  }
};

//Called To Fetch All Artifacts That Belong To The Signed In User From The Smart Contract
export const getOwnArtifacts = async (auctionContract) => {
  try {
    // Create An Array, Make A Call To The Contract And Push Returned Artifacts
    const arts = [];
    const ownartifacts = await auctionContract.methods.OwnWallet().call();
    const atr_count = ownartifacts.length;

    // Use A for Loop, Make A Call To The Contract, Get The Token Url
    // Fetch, Resolve And Push The Artifacts Metadata Into The Array
    for (let i = 0; i < Number(atr_count); i++) {
      const art = new Promise(async (resolve) => {
        const res = await auctionContract.methods
          .tokenURI(parseInt(ownartifacts[i]))
          .call();
        const meta = await fetchArtMetadata(res);
        const owner = await fetchArtOwner(
          auctionContract,
          parseInt(ownartifacts[i])
        );
        resolve({
          index: parseInt(ownartifacts[i]),
          owner,
          name: meta.data.artname,
          image: meta.data.image,
          date: meta.data.date,
          price: meta.data.price,
          description: meta.data.description,
          attributes: meta.data.attributes,
        });
      });
      arts.push(art);
    }
    return Promise.all(arts);
  } catch (e) {
    console.log({ e });
  }
};

//Called To Fetch Signed In Users Collectables On The Contract
export const getOwnCollectables = async (auctionContract, address) => {
  try {
    // Create An Array, Make A Call To The Contract And Push Returned Artifacts
    const collect = [];
    const EndedAucs = await auctionContract.methods.EndedAucs().call();
    const Auc_count = EndedAucs.length;

    // Use A for Loop, Make A Call To The Contract, Get The Token Url
    // Fetch, Resolve And Push The Artifacts Metadata Into The Array
    for (let i = 0; i < Auc_count; i++) {
      const _isCollectable = await auctionContract.methods
        .getApproved(parseInt(EndedAucs[i]))
        .call();
      if (_isCollectable === address) {
        const art = new Promise(async (resolve) => {
          const res = await auctionContract.methods
            .tokenURI(parseInt(EndedAucs[i]))
            .call();
          const meta = await fetchArtMetadata(res);
          const owner = await fetchArtOwner(
            auctionContract,
            parseInt(EndedAucs[i])
          );
          resolve({
            index: parseInt(EndedAucs[i]),
            owner,
            name: meta.data.artname,
            image: meta.data.image,
            date: meta.data.date,
            price: meta.data.price,
            description: meta.data.description,
            attributes: meta.data.attributes,
          });
        });
        collect.push(art);
      }
    }
    return Promise.all(collect);
  } catch (e) {
    console.log({ e });
  }
};

//#tag Pls Use My Cors Proxy Appropriately Or We All Get Blocked.
//Called To get The Artifacts from Pinata's IPFS
export const fetchArtMetadata = async (ipfsUrl) => {
  try {
    if (!ipfsUrl) return null;
    //Ipfs Request
    var config = {
      method: "get",
      url:ipfsUrl,
      headers: {
        Authorization: process.env.REACT_APP_JWT,
      },
    };
    const meta = await axios(config);
    return meta;
  } catch (e) {
    console.log({ e });
  }
};

// Called To Get Owner's Address Of The Requested Token
export const fetchArtOwner = async (auctionContract, index) => {
  try {
    //calling the contract
    return await auctionContract.methods.ownerOf(index).call();
  } catch (e) {
    console.log({ e });
  }
};

//Called To Get The Contract OWners Address
export const fetchAuctionContractOwner = async (auctionContract) => {
  try {
    //calling the contract
    let owner = await auctionContract.methods.owner().call();
    return owner;
  } catch (e) {
    console.log({ e });
  }
};

// Called To Add Artifacts To The Auction By The Token Owner
export const AddArtifactToAuc = async (
  auctionContract,
  performActions,
  TokenId
) => {
  try {
    await performActions(async (kit) => {
      const { defaultAccount } = kit;
      //calling the contract
      await auctionContract.methods
        .AddToAutions(TokenId)
        .send({ from: defaultAccount });
    });
  } catch (e) {
    console.log({ e });
  }
};

//Called To Place A Bid On An Artifact By The Bidders
export const BidOnArtifact = async (
  auctionContract,
  performActions,
  TokenId,
  value
) => {
  try {
    await performActions(async (kit) => {
      const { defaultAccount } = kit;
      //calling the contract
      await auctionContract.methods
        .BidOnAuc(TokenId, value)
        .send({ from: defaultAccount });
    });
  } catch (e) {
    console.log({ e });
  }
};

// Called To Reactivate Auctions That Ended With No Bid By The Token Owner
export const ReactivateDeadAuction = async (
  auctionContract,
  performActions,
  TokenId
) => {
  try {
    await performActions(async (kit) => {
      const { defaultAccount } = kit;
      //calling the contract
      await auctionContract.methods
        .ReactivateDeadAuc(TokenId)
        .send({ from: defaultAccount });
    });
  } catch (e) {
    console.log({ e });
  }
};

// Called To End An Auction By Token Owner
export const EndAuction = async (performActions, auctionContract, TokenId) => {
  try {
    await performActions(async (kit) => {
      const { defaultAccount } = kit;
      //calling the contract
      await auctionContract.methods
        .EndAucByOwner(TokenId)
        .send({ from: defaultAccount });
    });
  } catch (e) {
    console.log({ e });
  }
};

// Called To Transfer A Token When AUctions Are Ended By The Highest Bidder
export const transToAucWinner = async (
  auctionContract,
  performActions,
  TokenOwner,
  TokenId,
  Bid
) => {
  try {
    await performActions(async (kit) => {
      const { defaultAccount } = kit;
      //calling the contract
      await auctionContract.methods
        .TransferAucToWinner(TokenOwner, TokenId)
        .send({ from: defaultAccount, value: Bid });
    });
  } catch (e) {
    console.log({ e });
  }
};

// Called By The Contract Owner To Update The Mint Price
export const UpdateMintPrice = async (
  auctionContract,
  performActions,
  _newMintPrice
) => {
  try {
    await performActions(async (kit) => {
      const { defaultAccount } = kit;
      //calling the contract
      await auctionContract.methods
        .setCost(_newMintPrice)
        .send({ from: defaultAccount });
    });
  } catch (e) {
    console.log({ e });
  }
};

// Called To Retrive Auction Info On The Requeted Token
export const AucStatus = async (auctionContract, TokenId) => {
  try {
    //calling the contract
    const value = await auctionContract.methods.AucInfo(TokenId).call();
    return value;
  } catch (e) {
    console.log({ e });
  }
};

// Called To Get The Minting Price.
export const GetMintPrice = async (auctionContract) => {
  try {
    //calling the contract
    const value = await auctionContract.methods.MINT_PRICE().call();
    return value;
  } catch (e) {
    console.log({ e });
  }
};

// Called By Contract Owner To Withdraw The Contracts Balance.
export const WithdrawBal = async (auctionContract) => {
  try {
    //calling the contract
    const transaction = await auctionContract.methods.withdrawPayments().call();
    return transaction;
  } catch (e) {
    console.log({ e });
  }
};

// Called To Retrive An Array Of The Active Auctions
export const ActAucs = async (auctionContract) => {
  try {
    //calling the contract
    const value = await auctionContract.methods.ActiveAucs().call();
    return value;
  } catch (e) {
    console.log({ e });
  }
};

// Called To Retrive An Array Of The Ended Auctions
export const EndedAucsList = async (auctionContract) => {
  try {
    //calling the contract
    const value = await auctionContract.methods.EndedAucs().call();
    return value;
  } catch (e) {
    console.log({ e });
  }
};

// Called To Confirm The Auction Winner i.e The Highest Bidder
export const confirmAucwinner = async (auctionContract, TokenId) => {
  try {
    //calling the contract
    const value = await auctionContract.methods
      .AuctionTopBidder(TokenId)
      .call();
    return value;
  } catch (e) {
    console.log({ e });
  }
};

// Called By the Highest Bidder In An Auction To Verify If Payments And Collection OF
// Artifacts Should Be Made
export const PayForArtifact = async (auctionContract, TokenId) => {
  try {
    //calling the contract
    const value = await auctionContract.methods.ToPay(TokenId).call();
    // .send({ from: defaultAccount });
    return value;
  } catch (e) {
    console.log({ e });
  }
};
