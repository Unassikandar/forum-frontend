import React from 'react';
import PostListItem from './PostItem'
import './PostList.css';

const postList = props => {
    const postList = props.postList.map(post => {
        return <PostListItem key={post._id} postId={post._id} postContent={post.content}/>
    });

    return (<ul className="post__list">{postList}</ul>)
};

export default postList;