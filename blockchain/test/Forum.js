const Forum = artifacts.require("Forum")
const ArgetherToken = artifacts.require("ArgetherToken")

contract('Forum', function(accounts) {
    var tokenInstance;
    var forumInstance, forumAddress;
    const tokenPrice = 1000000000000000;

    it('initializes forum with the proper admin address', function() {
        return ArgetherToken.deployed().then(function(instance) {
            tokenInstance = instance;
            return Forum.deployed()
        }).then(function(instance) {
            forumInstance = instance;
            return forumInstance.admin();
        }).then(function(admin) {
            assert.equal(admin, accounts[0], 'Correctly initiallized with proper admin');
        });
    });

    it('can add a new post', function() {
        return ArgetherToken.deployed().then(function(instance) {
            tokenInstance = instance;
            return Forum.deployed()
        }).then(function(instance) {
            forumInstance = instance;
            return forumInstance.addPost("1", "1", "0", 10, {from: accounts[0], value: 10*tokenPrice});
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf('revert') >= 0, 'error message should be a revert message');
            return forumInstance.address
        }).then(address => {
            forumAddress = address;
            return tokenInstance.approve(forumAddress, 10, {from: accounts[0]});
        }).then(recipt => {
            assert.equal(recipt.logs.length, 1, 'triggers one event');
            assert.equal(recipt.logs[0].event, "Approval", 'should be an approval event');
            return forumInstance.addPost("1", "1", "0", 10, {from: accounts[0], value: 10*tokenPrice});
        }).then(receipt => {
            assert.equal(receipt.logs.length, 1, "triggers one event");
            assert.equal(receipt.logs[0].event, "NewPost", "should be a newPost event");
            return forumInstance.poolOf("1");
        }).then(pool => {
            assert.equal(pool, 10, 'pool value should be the initial bid => 10');
            return forumInstance.minBidOf("1");
        }).then(minBid => {
            assert.equal(minBid, 10, "minimum bid should be 10");
            return forumInstance.postIdsOf("1", 0);
        }).then(idArray => {
            assert.equal(idArray, "1", "discussion should contain 1 postId");
            return forumInstance.getDiscussionPostCount("1");
        }).then(postCount => {
            assert.equal(postCount, 1, "postCount should be 1");
        });
    });

    it('users can upvote a post', function() {
        return ArgetherToken.deployed().then(function(instance) {
            tokenInstance = instance;
            return Forum.deployed()
        }).then(function(instance) {
            forumInstance = instance;
            return forumInstance.poolOf("1");
        }).then(pool => {
            assert.equal(pool, 10, 'checking pool value');
            return tokenInstance.approve(forumAddress, 5, {from:accounts[0]});
        }).then(receipt => {
            assert.equal(receipt.logs.length, 1, "triggers one event");
            assert.equal(receipt.logs[0].event, "Approval", 'should be an approval event');
            assert.equal(receipt.logs[0].args._owner, accounts[0], 'owner is the correct account');
            assert.equal(receipt.logs[0].args._spender, forumAddress, 'spender is the forum');
            assert.equal(receipt.logs[0].args._value, 5, 'approved amount is 5');
            return forumInstance.upvote("2", "1", {from: accounts[0], value: 5*tokenPrice});
        }).then(assert.fail).catch(error => {
            assert(error.message.indexOf('revert') >= 0, 'should revert because of false discussionId');
            return forumInstance.upvote("1", "1", {from: accounts[0], value: 4*tokenPrice});
        }).then(assert.fail).catch(error => {
            assert(error.message.indexOf('revert') >= 0, 'should revert because bid cost is false');
            return forumInstance.upvote("1", "1", {from: accounts[0], value: 1*tokenPrice});
        }).then(receipt => {
            assert.equal(receipt.logs.length, 1, 'should trigger one event');
            assert.equal(receipt.logs[0].event, "Vote", 'should be a vote event');
            assert.equal(receipt.logs[0].args._user, accounts[0], "voter should be accounts[0]");
            assert.equal(receipt.logs[0].args._postId, "1", 'postId should be 1');
            return forumInstance.votersOf("1", 0);
        }).then(voter => {
            assert.equal(voter, accounts[0], 'voter should be 0th account');
            return forumInstance.poolOf("1");
        }).then(pool => {
            assert.equal(pool, 11, 'pool should be 11');
        });
    });

    it('can execute reward distribution', async () => {
        let tokenInstance = await ArgetherToken.deployed();
        let forumInstance = await Forum.deployed();
        /**
         * Reward distribution metrics:
         * distribute tokens to 5 accounts
         * accounts 2 and 3 make posts
         * all 5 accounts make votes
         * 2, 3 and 4 vote for post 1
         * 5, 6 vote for post 2
         */

        // transferring tokens to accounts
        await tokenInstance.transfer(accounts[1], 50);
        await tokenInstance.transfer(accounts[2], 50);
        await tokenInstance.transfer(accounts[3], 50);
        await tokenInstance.transfer(accounts[4], 50);
        await tokenInstance.transfer(accounts[5], 50);
        let balance1 = await tokenInstance.balanceOf(accounts[1]);
        assert.equal(balance1, 50, 'balance1 should be 50');
        // check admin account
        let adminBalanceInitial = await tokenInstance.balanceOf(accounts[0]);
        assert.equal(adminBalanceInitial.toNumber(), 999739, 'admin balance is 999739');
        // accounts approve the contract for a spending of 50
        await tokenInstance.approve(forumInstance.address, 50, {from: accounts[1]});
        await tokenInstance.approve(forumInstance.address, 50, {from: accounts[2]});
        await tokenInstance.approve(forumInstance.address, 50, {from: accounts[3]});
        await tokenInstance.approve(forumInstance.address, 50, {from: accounts[4]});
        await tokenInstance.approve(forumInstance.address, 50, {from: accounts[5]});
        // make two posts
        let addpost1 = await forumInstance.addPost("2", "1", "0", 10, {from:accounts[1], value:10*tokenPrice});
        let addpost2 = await forumInstance.addPost("2", "2", "1", 10, {from:accounts[2], value:10*tokenPrice});
        assert.equal(addpost1.logs[0].event, "NewPost", 'event should be NewPost');
        assert.equal(addpost2.logs[0].event, "NewPost", 'event should be NewPost');
        // upvote the posts
        let vote1 = await forumInstance.upvote("2", "1", {from:accounts[1], value:tokenPrice});
        let vote2 = await forumInstance.upvote("2", "1", {from:accounts[2], value:tokenPrice});
        let vote3 = await forumInstance.upvote("2", "1", {from:accounts[3], value:tokenPrice});
        let vote4 = await forumInstance.upvote("2", "2", {from:accounts[4], value:tokenPrice});
        let vote5 = await forumInstance.upvote("2", "2", {from:accounts[5], value:tokenPrice});
        assert.equal(vote3.logs[0].event, "Vote", 'should be a vote event');
        // check discussion pool
        let pool = await forumInstance.poolOf("2");
        assert.equal(pool, 25, 'discussion pool should be 25');
        // execute the reward distribution
        let receipt = await forumInstance.distributeRewards("2");
        assert.equal(receipt.logs.length, 1, 'should trigger one event');
        assert.equal(receipt.logs[0].event, "Distribute", 'should be a distribute event');
        assert.equal(receipt.logs[0].args._discussionId, "2", 'discussion id should be 2');
        // make reward distribution tests
        let bal1 = await tokenInstance.balanceOf(accounts[1]);
        let bal2 = await tokenInstance.balanceOf(accounts[2]);
        let bal3 = await tokenInstance.balanceOf(accounts[3]);
        let bal4 = await tokenInstance.balanceOf(accounts[4]);
        let bal5 = await tokenInstance.balanceOf(accounts[5]);
        let adminBalancePost = await tokenInstance.balanceOf(accounts[0]);
        assert.equal(bal1.toNumber(), 49, 'balance1 should equal'); // Account 1 has 49
        assert.equal(bal2.toNumber(), 45, 'balance2 should equal'); // Account 2 has 45
        assert.equal(bal3.toNumber(), 51, 'balance3 should equal'); // Account 3 has 51
        assert.equal(bal4.toNumber(), 51, 'balance4 should equal'); // Account 4 has 51
        assert.equal(bal5.toNumber(), 51, 'balance5 should equal'); // Account 5 has 51
        assert.equal(adminBalancePost.toNumber(), 999741, 'admin balance should equal 999741'); // Account 5 has 51
    });

});