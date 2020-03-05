import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './discussions.css';

class DiscussionPage extends Component {
    state = {
        discussions: []
    }

    constructor(props) {
        super(props);
        this.titleEl = React.createRef();
        this.postEl = React.createRef();
        this.bidEl = React.createRef();
    }

    componentDidMount() {
        this.fetchDiscussions();
    }

    postHandler = (disId, parId, owner, content) => {
        const requestBody = {
            query: `
                mutation {
                    createPost( postInput: {disId: "${disId}", parId: "${parId}", owner: "${owner}", content: "${content}"}) {
                        _id
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
            if(res.status !== 200 && res.status !== 201){
                throw new Error('Failed to Post!');
            }
            return res.json();
        }).then(resData => {
            this.fetchDiscussions();
        }).catch(err => {
            console.log(err)
        })
    }

    newDiscussion = (event) => {
        event.preventDefault();
        const title = this.titleEl.current.value;
        const post = this.postEl.current.value;
        const bid = this.bidEl.current.value;
        let currentDate = new Date();
        let expDate = new Date();
        expDate = expDate.setDate(expDate.getDate() + 2);

        if(post.trim().length === 0 || bid.trim().length === 0) {
            return;
        }
        
        const requestBody = {
            query: `
            mutation {createDiscussion (title: "${title}", startTime: "${currentDate}", endTime: "${expDate}") {
                _id
                title
                startTime
                endTime
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
            // console.log(resData);
            console.log(resData.data.createDiscussion._id.toString());
            this.postHandler(resData.data.createDiscussion._id, "0", "0x01", "this.postEl");
        }).catch(err => {
            console.log(err);
        });
    };

    fetchDiscussions() {
        const requestBody = {
            query:`
                query {
                    discussions {
                        _id
                        title
                        startTime
                        endTime
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
            const discussions = resData.data.discussions;
            this.setState({discussions: discussions});
        }).catch(err => {
            console.log(err);
        });
    }
    
    render () {
        const discussionList = this.state.discussions.map(discussion => {
            return (
                <li key={discussion._id} className="discussions__list-item">
                    <Link to={{
                        pathname: "/posts",
                        aboutProps: {
                            discussionId: discussion._id,
                            title: discussion.title
                        }
                    }}> 
                    <h3>Title: {discussion.title}</h3>
                    <label>Start Time: {discussion.startTime}</label>
                    <label>End Time{discussion.endTime}</label>
                    </Link>
                </li>
            );
        });
        return <div>
            <h1>Dicussions</h1>
            <form className="discussion-form" onSubmit={this.newDiscussion}>
            <div className="form-control">
                    <label htmlFor="title">Discussion Title</label>
                    <input type="text" id="title" required ref={this.titleEl}/>
                </div>
                <div className="form-control">
                    <label htmlFor="post">New Discussion Post</label>
                    <input type="text" id="post" required ref={this.postEl}/>
                </div>
                <div className="form-control">
                    <label htmlFor="bid">Bid</label>
                    <input type="number" id="bid" required ref={this.bidEl}/>
                </div>
                <div className="form-actions">
                    <button type="submit">Start New Discussion</button>
                </div>
            </form>
            <ul className="discussions__list">{discussionList}</ul>
        </div>
    }
}

export default DiscussionPage;