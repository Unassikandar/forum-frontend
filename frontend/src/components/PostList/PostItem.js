import React from 'react';

import './PostItem.css';

const postItem = props => (
    <li key={props.postId} className="post__list-item">
        <label>Content: {props.postContent}</label>
        <button className="btn">Upvote</button>
    </li>
);

export default postItem;