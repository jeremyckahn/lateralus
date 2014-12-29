# Lateralus

![Lateralus logo](img/logo.png)

Lateralus is a single page web application framework.  It is designed around the idea that UIs should be divided into discreet, reusable, loosely-coupled components.  These components should communicate only indirectly and be easily swappable or removable.  Lateralus provides patterns and utilities to cleanly isolate individual components of your app.

## Dependencies (Core framework)

  * RequireJS
    * RequireJS text plugin
  * Backbone
    * jQuery
    * Underscore/Lo-Dash
  * Mustache

## Getting started

### Installation

````
bower install --save lateralus
````

### Generate the boilerplate

For your convenience, Lateralus comes bundled with a Yeoman generator for quickly scaffolding apps and components from scratch.  You can install the generator from this directory:

````bash
cd generator-lateralus
npm link
````

To scaffold a new Lateralus app:

````bash
mkdir -p path/to/app
cd $_

# Configure the app with the prompts.  For this example, call it "app."
yo lateralus

# Create a new component
yo lateralus:component my-component
````

### Loading the files

Lateralus needs to be loaded as an [AMD package](http://requirejs.org/docs/api.html#packages).  The generator sets this up for you in your new `app/scripts/main.js`:

````javascript
require.config({
  packages: [{
    name: 'lateralus'
    ,location: 'bower_components/lateralus/scripts'
    ,main: 'lateralus'
  }]
});
````

You will also need to lead each component as a package.  For example:

````javascript
require.config({
  packages: [{
    name: 'lateralus'
    ,location: 'bower_components/lateralus/scripts'
    ,main: 'lateralus'
  }, {
    // The component that was created by the generator in the previous step
    name: 'app.component.my-component'
    ,location: 'scripts/components/my-component'
  }]
});
````

Once configured with RequireJS, you can load and instantiate a Lateralus app:

````javascript
require(['lateralus'], function (Lateralus) {
  var App = Lateralus.beget(function () {
    Lateralus.apply(this, arguments);
  });

  var app = new App(document.getElementById('app'));
});
````

### Working with components

Lateralus leverages the AMD module pattern to load dependencies.  Building upon the previous example:

````javascript
require(['lateralus', 'app.component.my-component'],
    function (Lateralus, MyComponent) {

  var App = Lateralus.beget(function () {
    Lateralus.apply(this, arguments);
  });

  var app = new App(document.getElementById('app'));
  app.addComponent(MyComponent);
});
````

Much of the Lateralus workflow involves creating and wiring up components.  The majority of code in a Lateralus app should be handled by components, everything outside of component code should focus on glueing them together and providing utilities.

## Using Lateralus

Lateralus's functionality is divided up into several primary Objects under the `Lateralus` namespace:

  * `Lateralus`
  * `Lateralus.Component`
  * `Lateralus.Component.View`
  * `Lateralus.Component.Model`

### Lateralus

Contains static utility methods, such as `Lateralus.inherit`.

### Lateralus.Component

The primary Object used within the framework to define UI components.  Typically, a component encompasses a `Lateralus.Component.View` and a template (though these are not required).

A component is distinct from a view.  A view is a graphical, interactive representation of a model.  A component represents all of the interrelated parts of significant, individual part of the UI.  This includes one or more Views and templates, a Model, and anything else a UI component needs to function.  A component is a higher-level abstraction than a View.

This is the basic directory structure for a component:

````
my-component/
  styles/
    main.sass
  main.js
  view.js
  model.js
  template.mustache
````

`main.js` is the main entry point for the component and defines the `Lateralus.Component` instance.  `view.js` defines the primary `Lateralus.Component.View` instance, and `template.mustache` is the primary DOM template.  All components should adhere to this directory structure, but they are free to extend it and add new files and require them as necessary.

Boilerplate for a standard `Lateralus.Component` module:

````javascript
define(['lateralus', './view', 'text!./template.mustache'],
    function (Lateralus, View, template) {

  var ExtendedComponent = Lateralus.Component.extend({
    name: 'extended-component' // Should be unique to each component

    // A reference to the View constructor, not the instance.
    ,View: View

    // This is a string of Mustache-templated HTML
    ,template: template
  });

  return ExtendedComponent;
});
````

This is set up for you by the Lateralus Yeoman generator.  `Lateralus.Component` instances have a reference to the central `Lateralus` instance as `this.lateralus`.

### Templates

Lateralus uses [Mustache.js](https://github.com/janl/mustache.js/) for its templating engine.  All components have at least one template associated with them as `this.template`.

### Lateralus.Component.View

This Object extends [`Backbone.View`](http://backbonejs.org/#View) with Lateralus-specific functionality.  Here's a basic `Lateralus.Component.View` subclass module:

````javascript
define(['lateralus'], function (Lateralus) {
  'use strict';

  var Base = Lateralus.Component.View;
  var baseProto = Base.prototype;

  var ExtendedComponentView = Base.extend({
    initialize: function () {
      // An initialize method definition isn't strictly required for a simple
      // example like this, but it's a good habit to get into.  Additionally,
      // generator-lateralus sets up new Views this way.  With the Base/baseProto
      // pattern above, you can easily achieve "super"-like functionality (like
      // Java has).  If you want to add additional initialization code for this
      // View, you should insert it after the baseProto.initialize call.
      baseProto.initialize.apply(this, arguments);
    }
  });

  return ExtendedComponentView;
});
````

A `Lateralus.Component.View` has a reference to the central `Lateralus` instance as `this.lateralus`, and a reference to the `Lateralus.Component` it belongs to with `this.component`.  This is necessary for using the `emit` and `listenFor` mixin methods to communicate with the rest of the app.  Generally, you can use `Lateralus.Component.View` exactly as you would `Backbone.View`, but it gives you a few additional APIs.

As a convenience, `Lateralus.Component.View` implicitly binds DOM nodes in the template as jQuery objects.  If the component's template looks like this:

````html
<div class="$container">
  <h2 class="$header">Hello!</h2>
</div>
````

The view will automatically have properties `this.$container` and `this.$header` that are jQuery objects referencing the `div` and the `h2`, respecively.

`Lateralus.Component.View` transparently renders its template for you.  `this.renderTemplate` is called by `Lateralus.Component.View.prototype.initialize` (which is why you should generally call `baseProto.initialize` as demonstrated above), but you are free to do further rendering with `this.render`.  `this.render` should be used for partial updates, whereas `this.renderTemplate` should be used to completely replace the contents of the View's `$el` with whatever is in `this.template`.

### Lateralus.Component.Model

Similarly to `Lateralus.Component.View`, this object extends its Backbone counterpart &mdash; `Backbone.Model`.  This doesn't add much in the way of new functionality, but it does have a reference to the central `Lateralus` instance and can therefore `emit` and `listenFor` messages.
