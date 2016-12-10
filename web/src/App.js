import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import brace from 'brace';
import AceEditor from 'react-ace';

import 'brace/mode/jsx';
import 'brace/theme/github';
import 'brace/theme/monokai';

import PubNub from 'pubnub';

const pubnub = new PubNub({ subscribeKey: 'demo-36', publishKey: 'demo-36' });


class Editor extends React.Component {

  componentDidMount() {
    this._publish(this._initialCode());
  }

  _onChange = (newCode) => {
    // console.log("Change. new code is: ", newCode);
    this._publish(newCode);
  }

  _publish = (newCode) => {
    let message = {
      code: newCode,
    };

    pubnub.publish({
      channel: 'gistexp1',
      message,
    }, (status, response) => {
      if (status.error) {
        console.log('publish failed', status);
      } else {
        console.log('published!');
      }
    });

  }

  _initialCode() {
    return `
import React from 'react';
import { View, Text } from 'react-native';
export default class MyComponent extends React.Component {
  render() {
    return (
      <View>
        <Text style={{fontWeight: 'bold',}}>This came from a webpage via PubNub</Text>
        <Text>Change this code and watch the output change</Text>
        <Text style={{
            color: 'gray',
            fontSize: 11,
        }}>Use export default on the Component you want to render</Text>
      </View>
    );
  }
};
    `;
  }

  render() {
    return (
      <AceEditor
        mode="jsx"
        theme="github"
        onChange={this._onChange}
        name="code"
        value={this._initialCode()}
        editorProps={{$blockScrolling: true}}
        style={{
          width: 800,
        }}
      />
    );
  }
}

class App extends Component {
  /*
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
  */

  componentDidMount() {

    pubnub.addListener({
      message: function (message) {
        console.log('message came in: ', message)
      }
    });

    pubnub.subscribe({ channels: ['gistexp1'] });
  }

  render() {
    return (
      <div>
        <Editor />
        <ErrorText />
      </div>
    );
  }
}

class ErrorText extends React.Component {
  state = {
    errorText: '',
  }

  componentDidMount() {
    pubnub.addListener({
      message: (message) => {
        if (message.message.hasOwnProperty('errorText')) {
          this.setState({errorText: message.message.errorText});
        }
      },
    });
  }
  render() {
    return (
      <pre style={{color: 'red'}}>{this.state.errorText}</pre>
    );
  }
}

export default App;
