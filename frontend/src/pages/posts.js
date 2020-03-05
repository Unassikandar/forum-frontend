import React, { Component } from 'react';
import { MDBCard } from 'mdbreact';
import './posts.css';

import PostList from '../components/PostList/PostList';
import Modal from '../components/Modal/Modal';
import Backdrop from '../components/Backdrop/Backdrop';

class PostPage extends Component {
    state = {
        posts: [],
        creating: false
    }

    constructor(props) {
        super(props);
        this.discussionId = props.location.aboutProps.discussionId;
        this.title = props.location.aboutProps.title;
        this.postContentElRef = React.createRef();
        this.bidElRef = React.createRef();
    }


    startCreateEventHandler = () => {
        this.setState({creating: true});
    }

    modalConfirmHandler = () => {
        this.setState({creating: false});
        const content = this.postContentElRef.current.value;
        const bid = this.bidElRef.current.value;

        if(content.trim().length === 0 || bid <= 0) {
            alert("Invalid Post");
            return;
        }
        const requestBody = {
            query: `
            mutation {createPost (postInput: {disId: "${this.discussionId}", parId: "0", owner: "0x001", content: "${content}"}) {
                _id
                disId {
                    _id
                }
                parId
                owner
                content
                }
            }
            `
        };
        //send request via backend
        fetch('http://localhost:8000/graphql', {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => {
            if(res.status !== 200 && res.status !== 201) {
                throw new Error('Failed!');
            }
            return res.json();
        }).then(resData => {
            console.log(resData);
            this.fetchPosts()
        }).catch(err => {
            console.log(err);
        });

    }

    modalCancelHandler = () => {
        this.setState({creating: false});
    }

    componentDidMount() {
        this.fetchPosts();
    }
    
    fetchPosts() {
        const requestBody = {
            query:`
                query {
                    postsByDiscussion (discussionId: "${this.discussionId}") {
                        _id
                        disId {
                            _id
                        }
                        parId
                        owner
                        content
                    }
                }
            `
        };
        fetch('http://localhost:8000/graphql', {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => {
            if(res.status !== 200 && res.status !== 201) {
                throw new Error('Failed!');
            }
            return res.json();
        }).then(resData => {
            console.log(resData.data.postsByDiscussion);
            const posts = resData.data.postsByDiscussion;
            this.setState({posts: posts});
        }).catch(err => {
            console.log(err);
        });
    }

    render () {
        console.log(this.discussionId);
        return <React.Fragment>
            {this.state.creating && <Backdrop />}
            {this.state.creating && (
                <Modal 
                    title="New Post" 
                    canCancel 
                    canConfirm 
                    onCancel={this.modalCancelHandler} 
                    onConfirm={this.modalConfirmHandler}
                >
                    <form>
                        <div className="form-control">
                            <label htmlFor="post-content">Post Content</label>
                            <textarea id="post-content" rows="4" ref={this.postContentElRef} />
                        </div>
                        <div className="form-control">
                            <label htmlFor="post-bid">Bid</label>
                            <input type="number" id="post-bid" ref={this.bidElRef}></input>
                        </div>
                    </form>
                </Modal>
            )}
            <h1>The Posts Page</h1>;
            <MDBCard className="main__thread">
                <h2>{this.title}</h2>
                <h3>ID: {this.discussionId}</h3>
                <PostList postList={this.state.posts}/>
                <div className="form-actions">
                    <button onClick={this.startCreateEventHandler} type="submit">Add a Post</button>
                </div>
            </MDBCard>
        </React.Fragment>
    }
}

export default PostPage;