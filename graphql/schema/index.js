const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type Post {
        _id: ID!
        disId: Discussion!
        parId: String!
        owner: String!
        content: String!
    }

    type Discussion {
        _id: ID!
        title: String!
        startTime: String!
        endTime: String!
        containedPosts: [Post!]
    }

    type Vote {
        _id: ID!
        owner: String!
        postId: Post!
    }

    input PostInput {
        disId: String!
        parId: String!
        owner: String!
        content: String!
    }

    input VoteInput {
        owner: String!
        postId: String!
    }

    type RootQuery {
        discussions: [Discussion!]!
        posts: [Post!]!
        postsByDiscussion(discussionId: String!): [Post!]!
        votes: [Vote!]!
    }

    type RootMutation {
        createPost(postInput: PostInput!): Post
        createDiscussion(title: String!, startTime: String!, endTime: String!): Discussion
        createVote(voteInput: VoteInput!) : Vote
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
    `);