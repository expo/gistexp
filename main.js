import Exponent from 'exponent';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Dimensions from 'Dimensions';
import PubNub from 'pubnub';

const babelStandalone = require('./babel-standalone');
const {height, width} = Dimensions.get('window');

const pubnub = new PubNub({ subscribeKey: 'demo-36', publishKey: 'demo-36', ssl: true,});

pubnub.addListener({
  message: function (message) {
    console.log('message came in: ', message)
  }
});


pubnub.subscribe({
    channels: ['gistexp1'],
});


global['$$$___1C_Modules___$$$'] = {
  'react': require('react'),
  'react-native': require('react-native'),
};

function wrapScript(code) {
  return `
    global['$$$___1C_Result___$$$'] = (function (require, module, exports) {
      exports = {};
      module = {exports: exports};
      ${code}
      ;
      return module;
    })(function (moduleName) { // require implementation
      return global['$$$___1C_Modules___$$$'][moduleName];
    });
  `;
}

class App extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      code:  `
import React from 'react';
import { View, Text } from 'react-native';
export default class MyComponent extends React.Component {
  render() {
    return (
      <View>
        <Text>Change this code and watch the output change</Text>
        <Text style={{
            color: 'gray',
            fontSize: 11,
        }}>Use export default on the Component you want to render</Text>
      </View>
    );
  }
};
      `,
      url: 'http://ccheever.com/Exponent/OneComponent.jsx',
    };
  }

  componentDidMount() {
    // this._updateCode();

    pubnub.addListener({
      message: (message) => {
        if (message.message.code) {
          console.log("Updating code because received a message about it");
          this.setState({code: message.message.code});
        } else {
          console.log("Received a message but it didn't include code");
        }
      },
    });

  }

  _updateCode() {
    this._updateCodeAsync().then((code) => {
      console.log("Code loaded I think.");
      this.setState({code});
    }, (err) => {
      console.error("Error loading code: ", err);
    });
  }

  async _updateCodeAsync() {
    let response = await fetch(this.state.url);
    let code = await response.text();
    return code;
    // console.log("code=" + JSON.stringify(code));
  }

  render() {
    // let x = eval("var y = 1; y + y;");
    let source = `
      import React from 'react';
      import { Text, View } from 'react-native';

      export const someValue = 6;

      function someDec(x) { return x; }

      @someDec
      export default class MyComponent extends React.Component {
        render() {
          return (
            <View>
              <Text>My very own component</Text>
              <Text>Hello James</Text>
              <Text>transformed on the phone</Text>
              <Text>Hello Nikki</Text>
            </View>
          );
        }
      }
    `;

    let errorText = undefined;
    // let MyComponent = undefined;
    let code = '';
    let m = undefined;
    let wrappedCode;
    try {
      code = babelStandalone.transform(this.state.code, {
        presets: ['es2015', 'react', 'exponent'],
      }).code;
      wrappedCode = wrapScript(code);
    } catch (e) {
      errorText = '' + e;
    }
    try {
      if (wrappedCode) {
        m = eval(wrappedCode);
      }
    } catch (e) {
      errorText = '' + e;
    }
    let MyComponent = m;
    if (m && m.exports && m.exports.__esModule) {
      MyComponent = m.exports.default;
    } else if (m && m.exports) {
      MyComponent = m.exports;
    } else {
      MyComponent = undefined;
    }

    errorText = errorText || '';
    let message = {
      errorText,
    };
    pubnub.publish({ channel: 'gistexp1', message: message }, function (status, response) {
      if (status.error) {
        console.log('publish failed', status);
      } else {
        console.log('published!');
      }
    });

    return (MyComponent && <MyComponent /> || <View />);

    return (
      <View style={styles.container}>
        <View style={{
            height: 30,
            width: 1,
        }} />
        {(MyComponent && (<MyComponent />))}
        {/*
        <TouchableOpacity onPress={() => {
            this._updateCode();
          }}>
          <View style={{
              backgroundColor: 'orange',
              margin: 20,
              // padding: 20,
          }}><Text>Refresh</Text></View>
        </TouchableOpacity>
        */}
        {/*
        <TextInput
          style={{
            height: 40,
            borderColor: 'gray',
            borderWidth: 1,
            fontSize: 10,
            alignItems: 'center',
          }}
          onChangeText={(text) => this.setState({url: text})}
          value={this.state.url}
        />
        <View style={{
            backgroundColor: 'orange',
            // padding: 20,
            margin: 20,
        }}><Text>Live Code by Editing Below</Text></View>
        */}

        {/*
        <View
          style={{
            flex: 1,
            borderColor: 'gray',
            borderWidth: 1,
            alignItems: 'center',
            // padding: 3,
            width: width,
            margin: 3,
            justifyContent: 'center',
          }}
          >
          <TextInput
            style={{
              flex: 1,
              fontFamily: 'Menlo',
              fontSize: 10,
              alignItems: 'center',
              width: width - 10,
              justifyContent: 'flex-start',
            }}
            multiline
            onChangeText={(text) => this.setState({code: text})}
            value={this.state.code}
          />
        </View>
        */}
        {/*
        {(errorText && (<Text style={{
          backgroundColor: 'red',
          fontWeight: 'bold',
          color: 'white',
          fontFamily: 'Menlo',
        }}>{errorText}</Text>))}
        */}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

Exponent.registerRootComponent(App);
