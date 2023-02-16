// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// #tag The Cockpit
// #tag You can't come broke to an auction you will need gasss.

// Auction Artifacts NFT CONTRACT
contract AuctionNFTs is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter; // Number of tokens created on this contract
    Counters.Counter private _AucIdCount; // Number of auction tokens for auction token indexing
    Counters.Counter public _ActAucCount; // Number of tokens currently active in auctions
    uint256 public MAX_SUPPLY = 1000000;
    uint256 public MINT_PRICE = 0;

    struct AucBidder {
        // Struct to represent an auction bidder
        uint256 bidderIdx;
        address adr;
        uint256 bid;
    }

    struct Auction {
        // Struct to represent an auction.
        uint256 tokenId;
        address aucOwner;
        uint256 topAucBid;
        address topAucBidder;
        uint256 biddersCount;
        uint256 aucIdx;
        bool aucOver;
        bool toPay;
    }

    mapping(uint256 => Auction) public AllAucs; // A mapping matching a token to an auction
    mapping(uint256 => mapping(address => AucBidder)) public AucBidderIdx; // A mapping matching a token to  its bidder's

    constructor() ERC721("AuctionNFTs", "ATN") {
        //ArtifactsNFTs, "AFN"
        // Initialize the tokenIdCounter to start at 1
        _tokenIdCounter.increment();
    }

    modifier onlyTokenOwner(uint256 tokenId) {
        require(
            ownerOf(tokenId) == msg.sender,
            " Callar Must be the token owner to add tokens to Autions"
        );
        _;
    }

    modifier validAuction(uint256 tokenId) {
        require(
            AllAucs[tokenId].tokenId == tokenId,
            "Invalid Token, Not Part Of The Auction"
        );
        _;
    }

    /**
     * @dev to mint a new token, a mint fee is paid(if any)
     * @param uri URL containing the metadata for the token
     */
    function safeMint(string calldata uri) public payable {
        require(totalSupply() < MAX_SUPPLY, "Max token supply reached");
        require(msg.value == MINT_PRICE, "Insuficent funds for minting"); // to be asserted before minting a token.
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        (bool success, ) = payable(owner()).call{value: msg.value}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Transfer contract's balance to the current smart contract's owner
     * @notice allows the current smart contract's owner to withdraw the balance of the smart contract
     */
    function withdrawPayments() public onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}(
            ""
        );
        require(success, "Transfer failed");
    }

    /**
     * @dev reverts if token is already in an auction
     * @notice allow tokens' owners to auction their NFTs
     */
    function AddToAutions(uint256 tokenId) public onlyTokenOwner(tokenId) {
        require(
            AllAucs[tokenId].tokenId != tokenId,
            "Token Has Already Been Added To The Auction Or Has Been Auctioned"
        );

        _ActAucCount.increment(); // Here We Are Updating This State Variables By increamenting Their Counts
        _AucIdCount.increment();
        Auction storage B = AllAucs[tokenId];
        //In the next 7 lines we are creating a new struct and  updating its properties and  variables.
        B.tokenId = tokenId;
        B.aucOwner = msg.sender;
        B.biddersCount = 0;
        B.topAucBid = 0;
        B.aucOver = false;
        B.toPay = false;
        B.aucIdx = _AucIdCount.current();
    }

    /**
     * @dev If caller has already bid in the auction, the bid's value is updated and then compared to the current top bid
     * @notice allow users to make a bid in an auction
     */
    function BidOnAuc(uint256 tokenId, uint256 BId)
        public
        validAuction(tokenId)
    {
        require(
            ownerOf(tokenId) != msg.sender,
            "You Cant bid on your own token"
        );
        require(!AllAucs[tokenId].aucOver, "Auction On This Token Is Over"); // To Be Asserted Before Addiing The Bidder To The Called Token's Auction
        if (AucBidderIdx[tokenId][msg.sender].adr == msg.sender) {
            // Here A condition Is Met if The Bidder Already Exists
            AucBidderIdx[tokenId][msg.sender].bid = BId; // And Updates The Tokens Auction And Bidders Struct Properties And Variables.
            if (AllAucs[tokenId].topAucBid < BId) {
                AllAucs[tokenId].topAucBid = BId;
                AllAucs[tokenId].topAucBidder = msg.sender;
            }
            return;
        }
        if (AllAucs[tokenId].topAucBid < BId) {
            AllAucs[tokenId].biddersCount++;
            AucBidder storage B = AucBidderIdx[tokenId][msg.sender]; // These Next Few Lines  We Will Be Adding A new Bidder If It Dose'nt exists
            B.adr = msg.sender; // And Updates Tokens Auction And Bidders Struct Properties And Variable.
            B.bid = BId;
            B.bidderIdx = AllAucs[tokenId].biddersCount;
            AllAucs[tokenId].topAucBid = BId;
            AllAucs[tokenId].topAucBidder = msg.sender;
        }
    }

    /**
     * @notice allows token owners to update the URI of their NFTs
     */
    function _setURI(uint256 tokenId, string memory uri)
        public
        onlyTokenOwner(tokenId)
    {
        _setTokenURI(tokenId, uri);
    }

    // Making This Call Is Done By The Owner Of A Token That Was On AUction WIthout A Bid And Ended to Restore It Back On Auctions
    function ReactivateDeadAuc(uint256 tokenId)
        public
        onlyTokenOwner(tokenId)
        validAuction(tokenId)
    {
        require(AllAucs[tokenId].aucOver, "This Token Is Still On Auction");
        require(
            AllAucs[tokenId].topAucBid <= 0,
            "There Was A Bid On This Auction"
        );
        AllAucs[tokenId].aucOver = false; // This Line And The Next Will Be Updating Necessary Properties And State Variables.
        AllAucs[tokenId].toPay = false;
        _ActAucCount.increment();
    }

    /**
     * @dev Highest bidder is approved to be able to transfer the token
     * @notice allows auctions' owners to end their auctions
     */
    function EndAucByOwner(uint256 tokenId)
        public
        onlyTokenOwner(tokenId)
        validAuction(tokenId)
    {
        require(
            !AllAucs[tokenId].aucOver,
            "Auction Has To Be Active To Be Ended"
        );
        AllAucs[tokenId].aucOver = true; //This Line And All That Followa Will Be  Updating The Necessary Properties, Variables And Called functions
        _ActAucCount.decrement(); 
        _transfer(msg.sender, address(this), tokenId);
    }

    /**
        * @dev Payment is made to auction's owner and NFT is transferred to the highest bidder
        * @notice allows the highest bidder of an auction to claim and pay for their bought items
     */
    function TransferAucToWinner(uint256 tokenId) public payable {
        require(
            msg.sender == AuctionTopBidder(tokenId),
            "Invalid Address, Caller IS Not The Hightest BIdder"
        ); // This And The Next Line Will Be Adding Some Required Assertions To the Functions
        require(
            msg.value == AllAucs[tokenId].topAucBid,
            "Invalid Payment, Bid Is Does Not Equal Hightest Bid"
        );
        require(
            AllAucs[tokenId].toPay == false,
            "Auctioned NFT has already been transferred"
        );
        AllAucs[tokenId].toPay = true;
        _transfer(address(this), msg.sender, tokenId);
        (bool success, ) = payable(AllAucs[tokenId].aucOwner).call{
            value: msg.value
        }("");
        require(success, "Transfer failed");
    }

    //This Call Is Made Only By Contract Owner To Set The Minting Cost.
    function setCost(uint256 _newCost) public onlyOwner {
        MINT_PRICE = _newCost;
    }

        /**
        * @return Array returns an array of auctionIds for auctions that haven't yet ended
     */
    function ActiveAucs() public view returns (uint256[] memory) {
        uint256[] memory ActBids = new uint256[](_ActAucCount.current());
        uint256 auctionCounts = _AucIdCount.current();
        uint256 index = 0;
        for (uint256 i = 1; i <= auctionCounts; i++) {
            if (AllAucs[i].aucIdx == i && AllAucs[i].aucOver == false) {
                // Here We Will Be Using A loop To lookup The Available Active Auctions
                ActBids[index] = AllAucs[i].tokenId; // To Complete The Process i.e Return The Array.
                index++;
            }
        }

        return ActBids;
    }

    /**
        * @return Array returns an array of auctionIds for auctions that have ended
     */
    function EndedAucs() public view returns (uint256[] memory) {
        uint256[] memory Ended = new uint256[](
           _AucIdCount.current() -_ActAucCount.current()
        );
        uint256 index = 0;
        uint256 auctionCounts = _AucIdCount.current();
        for (uint256 i = 1; i <= auctionCounts; i++) {
            if (AllAucs[i].aucIdx == i && AllAucs[i].aucOver == true) {
                // Here We Will Be Using A loop To lookup The Available Ended Auctions
                Ended[index] = AllAucs[i].tokenId; // To Complete The Process i.e Return The Array.
                index++;
            }
        }
        return Ended;
    }

    /**
        * @return Address returns the address of the highest bidder for an auction
     */
    function AuctionTopBidder(uint256 tokenId)
        public
        view
        validAuction(tokenId)
        returns (address)
    {
        return AllAucs[tokenId].topAucBidder;
    }

    /**
     * @return Array returns a fixed array containing every tokenIds associated with the caller;
     */
    function OwnWallet() public view returns (uint256[] memory) {
        uint256 ownerTokenCount = balanceOf(msg.sender);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        // iterates upto the current balance of caller to retrieve all tokenIds in the _ownedTokens array
        for (uint256 i = 0; i < ownerTokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(msg.sender, i);
        }
        return tokenIds;
    }

    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    // Returns The Token URI Of The Requested Token.
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        return super.tokenURI(tokenId);
    }
}
