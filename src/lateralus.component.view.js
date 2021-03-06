import $ from 'jquery';
import _ from 'lodash-compat';
import Backbone from 'backbone';
import Mustache from 'mustache';
import mixins from './lateralus.mixins';

const fn = {};

/**
 * The DOM template to be used with this View.
 * @type {string|null}
 * @member Lateralus.Component.View#template
 * @default {null}
 */
fn.template = null;

// jshint maxlen:100
/**
 * The constructor for this class should not be called by application code,
 * it is used by the `{@link Lateralus.Component}`
 * constructor.
 * @private
 * @param {Lateralus} lateralus
 * @param {Lateralus.Component} component
 * @param {Object} [options] Gets passed to
 * [Backbone.View#initialize](http://backbonejs.org/#Collection-constructor).
 * @param {Lateralus.Component.View} [opt_parentView]
 * @mixes Lateralus.mixins
 * @constructs Lateralus.Component.View
 */
fn.constructor = function (lateralus, component, options, opt_parentView) {
  /**
   * A reference to the central {@link Lateralus} instance.
   * @member Lateralus.Component.View#lateralus
   * @type {Lateralus}
   * @final
   */
  this.lateralus = lateralus;

  /**
   * If this is a subview of another `{@link Lateralus.Component.View}`, this
   * property is a reference to the parent `{@link Lateralus.Component.View}`.
   * @property parentView
   * @type {Lateralus.Component.View|null}
   * @default null
   */
  this.parentView = opt_parentView || null;

  /**
   * A reference to the `{@link Lateralus.Component}` to which this `{@link
   * Lateralus.Component.View}` belongs.
   * @member Lateralus.Component.View#component
   * @type {Lateralus.Component}
   * @final
   */
  this.component = component;

  if (options.model) {
    // Attach the model a bit early here so that the modelEvents map is
    // properly bound in the delegateLateralusEvents call below.
    this.model = options.model;
  }

  this.delegateLateralusEvents();
  Backbone.View.call(this, options);
};

/**
 * This is called when a `{@link Lateralus.Component.View}` is initialized, it
 * is not called directly.
 *
 * `{@link Lateralus.Component.View}` subclasses that
 * override `initialize` must call this base method:
 *
 *     const Base = Lateralus.Component.View;
 *     const baseProto = Base.prototype;
 *
 *     const ExtendedComponentView = Base.extend({
 *       initialize: function () {
 *         baseProto.initialize.apply(this, arguments);
 *         // Other logic...
 *       }
 *     });
 * @method Lateralus.Component.View#initialize
 * @param {Object} [opts] Any properties or methods to attach to this
 * `{@link Lateralus.Component.View}` instance.
 */
fn.initialize = function (opts) {
  // this.toString references the central Component constructor, so don't
  // attach the class for it here.
  if (!this.parentView) {
    this.$el.addClass(this.toString());
  }

  /**
   * The CSS class names specified by this property will be attached to `$el`
   * when this `{@link Lateralus.Component.View}` is
   * initialized.
   * @property className
   * @type {string|undefined}
   * @default undefined
   */
  if (this.className) {
    this.$el.addClass(this.className);
  }

  _.extend(this, _.defaults(_.clone(opts), this.attachDefaultOptions));
  this.renderTemplate();

  /**
   * A function to be called in the next JavaScript thread.  This can be
   * necessary for situations where setup logic needs to happen after a View
   * has been rendered.
   *
   * In other words, `{@link Lateralus.Component.View#initialize}` runs before
   * the View has been rendered to the DOM, and `deferredInitialize` runs
   * immediately after it has been rendered.
   * @method Lateralus.Component.View#deferredInitialize
   */
  if (this.deferredInitialize) {
    _.defer(_.bind(this.deferredInitialize, this));
  }
};

/**
 * Meant to be overridden in subclasses.  With `attachDefaultOptions`, you
 * can provide an object of default parameters that should be attached to the
 * View instance when the base `initialize` method is called.  These values
 * can be overridden by the [`options` values that are provided to the View
 * constructor](http://backbonejs.org/#View-constructor).
 * @property attachDefaultOptions
 * @type {Object}
 */
fn.attachDefaultOptions = {};

/**
 * Adds a subview.  Subviews are lighter than subcomponents.  It is
 * preferable to use a subview rather than a subcomponent when there is clear
 * interdependency between two Views.  This pattern is useful when you want
 * to keep display logic well-organized into several Views, but have it
 * compartmentalized within a single component.
 * @method Lateralus.Component.View#addSubview
 * @param {Lateralus.Component.View} Subview A constructor, not an instance.
 * @param {Object} [subviewOptions] Backbone.View [constructor
 * options](http://backbonejs.org/#View-constructor) to pass along to the
 * subview when it is instantiated.
 * @return {Lateralus.Component.View} The instantiated subview.
 */
fn.addSubview = function (Subview, subviewOptions) {
  if (!this.subviews) {
    /**
     * The subviews of this object.  Do not modify this property directly, it
     * is managed by Lateralus.
     * @property subviews
     * @type {Array(Lateralus.Component.View)}
     */
    this.subviews = [];
  }

  const subview = new Subview(
    this.lateralus,
    this.component,
    subviewOptions,
    this
  );

  this.subviews.push(subview);

  return subview;
};

/**
 * This method returns the object whose properties are used as render
 * variables in `{@link Lateralus.Component.View#renderTemplate}`.  The method
 * can be overridden.
 * @method Lateralus.Component.View#getTemplateRenderData
 * @return {Object} The [raw `Backbone.Model`
 * data](http://backbonejs.org/#Model-toJSON), if this View has a Model.
 * Otherwise, an empty object is returned.
 */
fn.getTemplateRenderData = function () {
  const renderData = {};

  if (this.model) {
    _.extend(renderData, this.model.toJSON());
  }

  _.extend(renderData, this.lateralus.globalRenderData);

  return renderData;
};

fn.getTemplatePartials = function () {
  /**
   * An optional map of template partials to be passed to the
   * `Mustache.render` call for this View.
   *
   *     Lateralus.Component.View.extend({
   *       templatePartials: {
   *         myNamePartial: 'Hello my name is {{name}}.'
   *       }
   *     });
   *
   * @property templatePartials
   * @type {Object<String>|undefined}
   * @default undefined
   */
  return _.extend(this.templatePartials || {}, this.lateralus.globalPartials);
};

/**
 * Meant to be called by `{@link Lateralus.Component.View#initialize}` and
 * infrequently thereafter, this method empties out
 * [`$el`](http://backbonejs.org/#View-$el) and does a full re-render.
 * [`render`](http://backbonejs.org/#View-render) should only be used for
 * partial renders.
 * @method Lateralus.Component.View#renderTemplate
 */
fn.renderTemplate = function () {
  if (!this.template) {
    return;
  }

  this.$el.children().remove();
  this.$el.html(
    Mustache.render(
      this.template,
      this.getTemplateRenderData(),
      this.getTemplatePartials()
    )
  );

  this.bindToDOM();
};

/**
 * Look for any DOM elements within [`$el`](http://backbonejs.org/#View-$el)
 * that have a class that looks like _`$this`_ and create a property on this
 * instance with the same name.  The attached property is a jQuery object
 * that references the corresponding DOM element.
 * @method Lateralus.Component.View#bindToDOM
 * @private
 */
fn.bindToDOM = function () {
  this.$el.find('[class^="$"]').each((i, el) => {
    const $el = $(el);
    this[$el.attr('class').split(/\s+/)[0]] = $el;
  });
};

/**
 * Remove this `{@link Lateralus.Component.View}` from
 * the DOM and cleanly dispose of any references.
 * @method Lateralus.Component.View#dispose
 * @chainable
 */
fn.dispose = function () {
  this.remove();

  const parentView = this.parentView;
  if (parentView) {
    parentView.subviews = _.without(parentView.subviews, this);
  }

  return this;
};

_.extend(fn, mixins);

/**
 * This class builds on the ideas and APIs of
 * [`Backbone.View`](http://backbonejs.org/#View).
 * @class Lateralus.Component.View
 * @extends {Backbone.View}
 */
const ComponentView = Backbone.View.extend(fn);

/**
 * @method Lateralus.Component.View#toString
 * @return {string} The name of this View.  This is used internally by
 * Lateralus.
 */
ComponentView.prototype.toString = function () {
  return this.component.toString() + '-view';
};

export default ComponentView;
