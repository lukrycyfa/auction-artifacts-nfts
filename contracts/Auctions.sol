// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol"
import "@openzeppelin/contracts/utils/Counters.sol";

// #tag The Cockpit
// #tag You can't come broke to an auction you will need gasss.

// Auction Artifacts NFT CONTRACT
contract AuctionNFTs is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    using Counters for Counters.Counter;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter; // Number Of Tokens Created On This Contract
    Counters.Counter private _AucIdCount; // Number Of Auction Tokens For Auction Token Indexing 
    Counters.Counter public _ActAucCount; // Number Of Tokens Currently Active In Autions 
    uint256 public MAX_SUPPLY = 1000000; // Maximum Amount Of Tokens To Be Minted On the Contract
    uint public MINT_PRICE = 0; // Price For Minting
    struct AucBidder{ // Struct To Represent An Auction Bidder
        uint bidderIdx;  
        address adr;  
        uint bid;     
    }

    struct Auction{ // Struct To Represnt An Auction.
        uint tokenId;
        address aucOwner; 
        uint topAucBid; 
        address topAucBidder; 
        uint biddersCount; 
        uint aucIdx;      
        bool aucOver;
        bool toPay; 
    }

    
    mapping(uint  => Auction) public AllAucs; // A Mapping Matching A Token To An Auction
    mapping(uint => mapping(address => AucBidder)) public AucBidderIdx; // A Mapping Matching A Token To  It's Bidder's

    
    //Initiated At first Contract Deployment.
    constructor() ERC721("AuctionNFTs", "ATN") { //ArtifactsNFTs, "AFN"
          // Initialize the tokenIdCounter to start 1
         _tokenIdCounter.increment();
    }
  

    // Making This Call SafeMint's To Caller At A Price And Transfers The Payment To Contract Owner
    // And Associates The Newly Returned Token And Other Properties To Caller.
    function safeMint(string memory uri) public payable  {
        require(totalSupply() < MAX_SUPPLY, "Max token supply reached");// These Make's Some Required Validations In the Function
        require(msg.value >= MINT_PRICE, "Insuficent funds for minting"); // To Be Asserted Before Minting A Token.
        uint256 tokenId = _tokenIdCounter.current(); // this line and the next assigns a token Id and updates the _tokenIdCounter State Variable.
        _tokenIdCounter.increment();    
        _safeMint(msg.sender, tokenId); // This Line And The Next Two Make's Call's To These Called Function To Complete The Minting Process.
        _setTokenURI(tokenId, uri); 
        payable(owner()).transfer(msg.value);
    }

    //Making This Call Will Withdraw Payments Made To The Contract, The Call Could Be Made Only By Contract Owner 
    function withdrawPayments() public onlyOwner {
      payable(owner()).transfer(address(this).balance);
    }

    //Making This Call Returns A fixed Array Containing Every Token Associated With The Caller
    

    function ownWallet() public view returns (uint256[] memory) {
    uint256[] memory tokenIds;
    uint256 tokenCount = balanceOf(msg.sender);
    for (uint256 i = 0; i < tokenCount; i++) {
        uint256 tokenId = tokenOfOwnerByIndex(msg.sender, i);
        tokenIds = abi.encodePacked(tokenIds, tokenId);
    }
    return tokenIds;
}



    //Here We Add The Callers Token To The Auctions
    function AddToAutions(uint tokenId)
      public
    {
        require(ownerOf(tokenId) == msg.sender, 
        " Callar Must be the token owner to add tokens to Autions");// These Make's Some Required Validations In the Function
        require(AllAucs[tokenId].tokenId != tokenId,        // To Be Asserted Before Adding The Token To Auctions.
            "Token Has Already Been Added To The Auction Or Has Been Auctioned");
        require(AllAucs[tokenId].aucOver == true, "Token is already in an active auction");

        Auction storage B = AllAucs[tokenId]; //In The Next 7 lines We Are Creating A New Struct And  Updating It's Properties And  Variables.
        B.tokenId = tokenId;
        B.aucOwner = msg.sender; 
        B.biddersCount = 0;
        B.topAucBid = 0;
        B.aucOver = false;
        B.toPay = false;
        B.aucIdx = _AucIdCount.current(); 
        _ActAucCount.increment();  // Here We Are Updating This State Variables By increamenting Their Counts
        _AucIdCount.increment();
        return;
    }


    // Making This Call Will Add The Callers Bid To The Requested Tokens Struct For Bidders.
    function BidOnAuc(uint tokenId, uint BId) 
       public{
        require(ownerOf(tokenId) != msg.sender, "You Cant bid on your own token");
        require(AllAucs[tokenId].tokenId == tokenId, "Invalid Token, Not Part Of The Auction"); // These Make's Some Required Validations In the Function
        require(!AllAucs[tokenId].aucOver, "Auction On This Token Is Over"); // To Be Asserted Before Addiing The Bidder To The Called Token's Auction  
            if(AucBidderIdx[tokenId][msg.sender].adr == msg.sender){ // Here A condition Is Met if The Bidder Already Exists
                AucBidderIdx[tokenId][msg.sender].bid = BId;        // And Updates The Tokens Auction And Bidders Struct Properties And Variables.
                if(AllAucs[tokenId].topAucBid < BId){ 
                    AllAucs[tokenId].topAucBid = BId;
                    AllAucs[tokenId].topAucBidder = msg.sender;
                }
                return;
            }
        
                AucBidder storage bidder = AucBidderIdx[tokenId][msg.sender];
            if (bidder.bidderIdx == 0) {
                bidder.bidderIdx = AllAucs[tokenId].biddersCount + 1;
                AllAucs[tokenId].biddersCount += 1;
            }
            bidder.adr = msg.sender;
            bidder.bid = BId;
            if (BId > AllAucs[tokenId].topAucBid) {
                AllAucs[tokenId].topAucBid = BId;
                AllAucs[tokenId].topAucBidder = msg.sender;
            }
        return;
    }


    // Making This Call Will Explicitly Change And Update's The Uri To A Token By The Caller.
    function _setURI(uint tokenId, string memory uri) public{
        require(ownerOf(tokenId) == msg.sender, "Can Only Update Owners Token Uri");
        _setTokenURI(tokenId, uri);
    }

    // Making This Call Is Done By The Owner Of A Token That Was On AUction WIthout A Bid And Ended to Restore It Back On Auctions
    function ReactivateDeadAuc(uint TokenId) public {
            require(ownerOf(TokenId) == msg.sender, "You Must Be The Token Owner To Reactivate The Auction");//This Line And The Next Three Make's Some Required Validations In the Function
            require(AllAucs[TokenId].tokenId == TokenId, "Token Has not Been Added To The Auction");//Validations In the Function To Be Asserted Before Restoring The Auction
            require(AllAucs[TokenId].aucOver, "This Token Is Still On Auction"); 
            require(AllAucs[TokenId].topAucBid <= 0, "There Was A Bid On This Auction");
            AllAucs[TokenId].aucOver = false;   // This Line And The Next Will Be Updating Necessary Properties And State Variables.
            AllAucs[TokenId].toPay = false;
            _ActAucCount.increment();       
    }


    // Making This Call During and After The Auction IS Over. Get's The HighestBidder And HighestBid On The Token Called.  
    function AucInfo(uint TokenId)public view returns(uint, address){
        require(AllAucs[TokenId].tokenId == TokenId, "Invalid Token, Not Part Of The Auction");// This Make's A Required Validations In the Function
        return (AllAucs[TokenId].topAucBid, AllAucs[TokenId].topAucBidder); // Returned Value
    }

    //Making This Call Will Return's An Array Of Active Tokens On Auction. 
    function ActiveAucs() public view returns (uint256[] memory)
    {
        uint256[] memory ActBids = new uint256[](_ActAucCount.current());
        uint index = 0;
        for(uint i = 0; i < _AucIdCount.current(); i++){
            if(AllAucs[i+1].aucIdx == i){  // Here We Will Be Using A loop To lookup The Available Active Auctions
                if(AllAucs[i+1].aucOver == false){
                    ActBids[index] = AllAucs[i+1].tokenId;// To Complete The Process i.e Return The Array.
                    index++; 
                }
            }
                           
        }

        return ActBids; // Returned Value
    }

     //Making This Call Will Return's An Array Of Ended Tokens On Auction. 
    function EndedAucs() public view returns (uint256[] memory)
        {
            uint256[] memory Ended = new uint256[](_AucIdCount.current() -_ActAucCount.current());
            uint index = 0;
            for(uint i = 0; i < _AucIdCount.current(); i++){
                if(AllAucs[i+1].aucIdx == i){  // Here We Will Be Using A loop To lookup The Available Ended Auctions 
                    if(AllAucs[i+1].aucOver == true && AllAucs[i+1].toPay == true){
                        Ended[index] = AllAucs[i+1].tokenId;// To Complete The Process i.e Return The Array.
                        index++; 
                    }
                }
                            
            }
            return Ended; // Returned Value
        }


    //Making This Call Returns The Requested Tokens Highest Bidder's Address        
    function AuctionTopBidder(uint tokenId)
        public
        view 
        returns( address ){
            require(AllAucs[tokenId].tokenId == tokenId, "Invalid Token, Not Part Of The Auction");// This Make's A Required Validations In the Function
        return AllAucs[tokenId].topAucBidder; // Returned Value
    }


    // This Call Is Made By The Token Owner When Autions On That Token IS Over
    // And Enables The Highest Bidder To Pay for His Token
   function EndAucByOwner(uint tokenId)
        public {
        require(msg.sender == ownerOf(tokenId), "Requires the Owner as the sender"); // This Line And The Next Two Make's A Required Validations In the Function
        require(AllAucs[tokenId].tokenId == tokenId, "Token Is Not Part Of The Auction");// Before The AUction Is Ended And The And ENable Te Transfer Process
        require(!AllAucs[tokenId].aucOver, "Auction Has To Be Active To Be Ended"); 
        AllAucs[tokenId].aucOver = true;//This Line And All That Followa Will Be  Updating The Necessary Properties, Variables And Called functions
        AllAucs[tokenId].toPay = true;  // Needed To Complete this Proccess.
        _ActAucCount.decrement();        
        approve(AllAucs[tokenId].topAucBidder, tokenId);
    }

    // This call Is To Varify The Possiblities Of Payment And Transfer Of Token In The Call
   function ToPay(uint tokenId)
        public  view returns (bool){
        require(msg.sender == AllAucs[tokenId].topAucBidder, 
            "Requires the highest Bidder as the sender"); // This Make's A Required Validations In the Function
        return AllAucs[tokenId].toPay; // Returned Value
    }

    //This Is called WHen The Aution Winner Has the Token In Collectables, To Pay And to Collect The Token.
    function TransferAucToWinner(address payable item_owner, uint tokenId) 
        public payable  {   
        require(msg.sender == AuctionTopBidder(tokenId), "Invalid Address, Caller IS Not The Hightest BIdder");// This And The Next Line Will Be Adding Some Required Assertions To the Functions
        require(msg.value >= AllAucs[tokenId].topAucBid, "Invalid Payment, Bid Is Does Not Equal Hightest Bid"); 
        item_owner.transfer(msg.value); // Here We Will Be Calling Some Functions To Complete The Proccess i.e The Transfer 
        safeTransferFrom(item_owner, msg.sender, tokenId);
    }
   
    //This Call Is Made Only By Contract Owner To Set The Minting Cost.  
    function setCost(uint _newCost) public onlyOwner {
      MINT_PRICE = _newCost;
    }   

    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
           internal
           override(ERC721, ERC721Enumerable)
       {
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

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
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
