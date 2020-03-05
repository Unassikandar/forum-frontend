pragma solidity ^0.5.0;

import "./ArgetherToken.sol";

contract Forum {

    uint256 public tokenPrice;
    uint public voteBid;
    address public admin;
    ArgetherToken tokenContract;

    uint256 systemPercentage;
    uint256 voterPercentage;

    //discussionId to postIds in the discussion
    mapping(string => string[]) public postIdsOf;
    // postId maps to the parent of that post. It is assumed that all postIds are unique because of MongoDB
    mapping(string => string) public parentOf;
    // postId maps to the address of owner
    mapping(string => address) public ownerOf;
    // discussionId maps to minBidOf that discussion
    mapping(string => uint256) public minBidOf;
    // discussionId maps to the discussion pool amount
    mapping(string => uint256) public poolOf;
    // discussionId maps to expiry times
    mapping(string => uint256) expiryOf;
    // postId maps to an array containing all the address of voters for that post
    mapping(string => address[]) public votersOf;

    event NewPost(
        address indexed _owner,
        string _discussionId,
        string _postId,
        uint256 _bid
    );

    event Vote(
        address indexed _user,
        string _postId
    );

    event Distribute(
        string _discussionId,
        uint _pool
    );

    // CONSTRUCTOR AND METHODS --->
    constructor(ArgetherToken _tokenContract, uint256 _tokenPrice, uint256 _voteBid) public {
        tokenContract = _tokenContract;
        tokenPrice = _tokenPrice;
        voteBid = _voteBid;
        admin = msg.sender;
        systemPercentage = 10;
        voterPercentage = 25;
    }

    function addPost(string memory _discussionId, string memory _postId, string memory _parentId, uint256 _bid) public payable returns (bool) {
        // if its a new discussion
        if(compareStringsbyBytes(_parentId, "0")){
            minBidOf[_discussionId] = _bid;
            expiryOf[_discussionId] = block.timestamp + 172800;
        }
        require(msg.value == multiply(_bid, tokenPrice), "check token multiplication");
        require(_bid >= minBidOf[_discussionId], 'bid should be greater than the minimum');
        require(block.timestamp <= expiryOf[_discussionId], 'discussion should not have expired');
        require(tokenContract.balanceOf(msg.sender) >= _bid, 'user should have enough balance');
        require(tokenContract.transferFrom(msg.sender, address(this), _bid), 'transfer should be successful');
        // add postId to discussion posts, save parentOf post, add bid to discussion pool
        postIdsOf[_discussionId].push(_postId);
        ownerOf[_postId] = msg.sender;
        parentOf[_postId] = _parentId;
        poolOf[_discussionId] += _bid;
        emit NewPost(msg.sender, _discussionId, _postId, _bid);
        return true;
    }
    /**
     *  Check whether the user has already voted on the post before calling this method.
     * ensure that postId is valid before call
     * the user will pay a constant of 1 token
     * vote bid value can be updated internally
     */
    function upvote(string memory _discussionId, string memory _postId) public payable returns (bool) {
        // check discussion expiry
        require(block.timestamp <= expiryOf[_discussionId], 'discussion should not have expired');
        // make sure that bid == 1
        require(msg.value == 1*tokenPrice, 'user should have bid 1 token');
        // require that voter has enough balance
        require(tokenContract.balanceOf(msg.sender) >= 1, 'voter should have enough balance');
        // require that the transfer of tokens is successful
        require(tokenContract.transferFrom(msg.sender, address(this), 1), 'transfer should be successful: user -> contract');
        // check if the disId is valid
        require(poolOf[_discussionId] > 0, 'discussionId must be valid');
        // create the vote
        votersOf[_postId].push(msg.sender);
        // add bid to the discussion pool
        poolOf[_discussionId] += 1;
        // trigger vote event
        emit Vote(msg.sender, _postId);
        // return bool
        return true;
    }

    function distributeRewards(string memory _discussionId) public returns (bool) {
        // require that discussion has expired
        //require(block.timestamp >= expiryOf[_discussionId], 'discussion has not expired yet');
        // get total posts in the discussion
        uint pool = poolOf[_discussionId];
        uint totalPosts = getDiscussionPostCount(_discussionId);
        string[] memory postArray = postIdsOf[_discussionId];
        // get total votes
        uint totalVotes = 0;
        for(uint i = 0; i < totalPosts; i++){
            totalVotes += getPostVoteCount(postArray[i]);
        }
        // deduct systemPercentage and transfer to admin
        uint value = (systemPercentage/100)*pool;
        poolOf[_discussionId] -= value;
        tokenContract.transfer(admin, value);
        // calculate the weight of one vote ==== figure out whether this should be rational
        uint weight = poolOf[_discussionId] / totalVotes;
        // distribute the pool based on the weight of the votes
        for(uint i = 0; i < totalPosts; i++) {
            uint postReward = getPostVoteCount(postArray[i]) * weight;
            uint voterReward = postReward/2;
            postReward -= voterReward;
            voterReward = voterReward/votersOf[postArray[i]].length;
            // transfers for post voters
            for(uint j = 0; j < votersOf[postArray[i]].length; j++){
                tokenContract.transfer(votersOf[postArray[i]][j], voterReward);
            }
            // transfers for post owners
            tokenContract.transfer(ownerOf[postArray[i]], postReward);
        }
        // reset the discussion pool
        poolOf[_discussionId] = 0;
        // trigger Distribute event
        emit Distribute(_discussionId, pool);
        // return a bool
        return true;
    }

    // HELPER FUNCTIONS --->
    function multiply(uint x, uint y) private pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x, 'multiplication check');
    }
    function compareStringsbyBytes(string memory s1, string memory s2) private pure returns(bool){
        return keccak256(abi.encodePacked(s1)) == keccak256(abi.encodePacked(s2));
    }
    function getDiscussionPostCount(string memory _discussionId) public view returns (uint) {
        return postIdsOf[_discussionId].length;
    }
    function getPostVoteCount(string memory _postId) public view returns (uint) {
        return votersOf[_postId].length;
    }
}