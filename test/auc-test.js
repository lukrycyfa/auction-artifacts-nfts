const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuNFT", function () {
  this.timeout(8880000);

  let auNFT;
  let owner;
  let acc1;
  let acc2;
  let acc3;
  let a1;
  let a2;
  let a3;

  const _start = async () => {
    //     // This is executed before each test
    //     // Deploying the smart contract
    const AuNFT = await ethers.getContractFactory("AuctionNFTs");
    [owner, acc1, acc2, acc3] = await ethers.getSigners();

    auNFT = await AuNFT.deploy();
    a1 = await auNFT.connect(acc1);
    a2 = await auNFT.connect(acc2);
    a3 = await auNFT.connect(acc3);
  };
  _start();

  it("Should be the right owner", async function () {
    expect(await auNFT.owner()).to.equal(owner.address);
  });

  it("Should Mint One NFT For Each Account And Assert Some Changes", async function () {
    expect(await auNFT.balanceOf(acc1.address)).to.equal(0);

    const tokenURI1 = "https://example.com/1";
    const tokenURI2 = "https://example.com/2";
    const tokenURI3 = "https://example.com/3";
    await a1.safeMint(tokenURI1, { value: 1 });
    await a2.safeMint(tokenURI2, { value: 1 });
    await a3.safeMint(tokenURI3, { value: 1 });
    const wa1 = await a1.OwnWallet();
    const wa2 = await a2.OwnWallet();
    const wa3 = await a3.OwnWallet();
    expect(wa1.length).to.equal(1);
    expect(wa2.length).to.equal(1);
    expect(wa3.length).to.equal(1);
    expect(await auNFT.ownerOf(1)).to.equal(acc1.address);
    expect(await auNFT.ownerOf(2)).to.equal(acc2.address);
    expect(await auNFT.ownerOf(3)).to.equal(acc3.address);
    expect(await auNFT.balanceOf(acc1.address)).to.equal(1);
    expect(await auNFT.balanceOf(acc2.address)).to.equal(1);
    expect(await auNFT.balanceOf(acc3.address)).to.equal(1);
  });

  it("Should Perform Some Auction Tasks And Give Out The Right Result", async function () {
    await a1.AddToAutions(1);
    await a2.AddToAutions(2);
    await a3.AddToAutions(3);
    const auc1 = await a1.ActiveAucs();
    const auc2 = await a2.ActiveAucs();
    const auc3 = await a3.ActiveAucs();
    const ends = await auNFT.EndedAucs();
    expect(auc1.length).to.equal(3);
    expect(auc2.length).to.equal(3);
    expect(auc3.length).to.equal(3);
    expect(ends.length).to.equal(0);
    await a1.BidOnAuc(2, 120);
    await a1.BidOnAuc(3, 130);
    await a2.BidOnAuc(1, 135);
    await a2.BidOnAuc(3, 145);
    await a3.BidOnAuc(1, 145);
    await a3.BidOnAuc(2, 95);
    expect(await auNFT.AuctionTopBidder(1)).to.equal(acc3.address);
    expect(await auNFT.AuctionTopBidder(2)).to.equal(acc1.address);
    expect(await auNFT.AuctionTopBidder(3)).to.equal(acc2.address);
    await a1.EndAucByOwner(1);
    await a2.EndAucByOwner(2);
    await a3.EndAucByOwner(3);
    const endded = await auNFT.EndedAucs();
    expect(endded.length).to.equal(3);
  });

  it("Should Make Some Verifications, Transfers And Assert Some Changes", async function () {
    expect(await a1.ToPay(2)).to.equal(true);
    expect(await a2.ToPay(3)).to.equal(true);
    expect(await a3.ToPay(1)).to.equal(true);
    await a1.TransferAucToWinner(acc2.address, 2, { value: 120 });
    await a2.TransferAucToWinner(acc3.address, 3, { value: 145 });
    await a3.TransferAucToWinner(acc1.address, 1, { value: 145 });
    expect(await auNFT.ownerOf(1)).to.equal(acc3.address);
    expect(await auNFT.ownerOf(2)).to.equal(acc1.address);
    expect(await auNFT.ownerOf(3)).to.equal(acc2.address);
    await auNFT.setCost(2);
    const endauc = await auNFT.ActiveAucs();
    expect(await auNFT.MINT_PRICE()).to.equal(2);
    expect(endauc.length).to.equal(0);
  });
});
