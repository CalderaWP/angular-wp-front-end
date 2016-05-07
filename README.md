## Decoupled Angular Front End APP ##
This is a decoupled but powered by WordPress Angular app. It is a simple boilerplate to show a list and single view powered by a WordPress website that is located elsewhere.

## Installation ##
* Clone/Fork
* Run `npm install`
* Create a config file in `assets/js/config.js`
* Run `gulp`
* Open up `./assets/js/angular-front-end-app.js`

## Config File ##
Your `assets/js/config.js` config file should create an object called ngWP with an index called config, with indexes for "api" and "menu" for example:

```
    var ngWP = ngWP || {};
    ngWP.config = {
        api: 'http://v-jpress.dev/wp-json/',
        menu: 'app'
    };
```
