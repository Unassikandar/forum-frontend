import React, { Component } from 'react';
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';

import DiscussionPage from './pages/discussions';
import PostPage from './pages/posts';
import MainNavigation from './components/Navigation/MainNavigation';

import './App.css';

class App extends Component {

  state = {
    discussionId: null
  };

  render() {
    return (
      <BrowserRouter>
        <React.Fragment>
        <MainNavigation />
        <main className="main-content">
          <Switch>
            {!this.state.discussionId && <Redirect from="/" to="/discussions" exact />}
            {this.state.discussionId && <Redirect from="/discussions" to="/posts"/>}
            <Route path="/discussions" component={DiscussionPage} />
            <Route path="/posts" component={PostPage} />
          </Switch>
        </main>
        </React.Fragment>
      </BrowserRouter>
    );
  }
}

export default App;
