/**
 * @file
 * Defines the behavior of the media entity browser view.
 */

(function ($, _, Backbone, Drupal) {

  "use strict";

  var Selection = Backbone.View.extend({

    events: {
      'click .views-row': 'onClick',
      'dblclick .views-row': 'onClick'
    },

    // Display selected items counter.
    renderCounter() {
      $('.media-browser-file-counter').each(function () {
        $(this).remove();
      });
      var text = Drupal.formatPlural(this.count, 'Selected 1 item.', 'Selected @count items.');
      var $counter = $('<div class="media-browser-file-counter"></div>').text(text);
      $('.view-content').prepend($counter);
    },

    initialize: function () {
      // This view must be created on an element which has this attribute.
      // Otherwise, things will blow up and rightfully so.
      this.uuid = this.el.getAttribute('data-entity-browser-uuid');

      // If we're in an iFrame, reach into the parent window context to get the
      // settings for this entity browser.
      var settings = (frameElement ? parent : window).drupalSettings.entity_browser[this.uuid];

      // Assume a single-cardinality field with no existing selection.
      this.count = settings.count || 0;
      this.cardinality = settings.cardinality || 1;
      this.renderCounter();
    },

    deselect: function (item) {
      this.$(item)
        .removeClass('checked')
        .find('input[name ^= "entity_browser_select"]')
        .prop('checked', false);
    },

    /**
     * Deselects all items in the entity browser.
     */
    deselectAll: function () {
      // Create a version of deselect() that can be called within each() with
      // this as its context.
      var _deselect = jQuery.proxy(this.deselect, this);

      this.$('.views-row').each(function (undefined, item) {
        _deselect(item);
      });
    },

    select: function (item) {
      this.$(item)
        .addClass('checked')
        .find('input[name ^= "entity_browser_select"]')
        .prop('checked', true);
    },

    /**
     * Marks unselected items in the entity browser as disabled.
     */
    lock: function () {
      var text = Drupal.t('No more items could be selected, you reached the items limit.');
      var $message = $('<div class="media-browser-limit messages warning"></div>').text(text);
      this.$('.view-content').prepend($message);
      this.$('.views-row:not(.checked)').addClass('disabled');
    },

    /**
     * Marks all items in the entity browser as enabled.
     */
    unlock: function () {
      this.$('.media-browser-limit').each(function () {
        $(this).remove();
      });

      this.$('.views-row').removeClass('disabled');
    },

    /**
     * Handles click events for any item in the entity browser.
     *
     * @param {jQuery.Event} event
     */
    onClick: function (event) {

      var chosen_one = this.$(event.currentTarget);

      if (chosen_one.hasClass('disabled')) {
        return false;
      }
      else if (this.cardinality === 1) {
        this.deselectAll();
        this.select(chosen_one);
      }
      else if (chosen_one.hasClass('checked')) {
        this.deselect(chosen_one);
        this.count--;
        this.unlock();
        this.renderCounter();
      }
      else {
        this.select(chosen_one);

        // If cardinality is unlimited, this will never be fulfilled. Good.
        if (++this.count === this.cardinality) {
          this.lock();
        }

        this.renderCounter();
      }
    }

  });

  /**
   * Attaches the behavior of the media entity browser view.
   */
  Drupal.behaviors.mediaEntityBrowserView = {

    getElement: function (context) {
      // If we're in a document context, search for the first available entity
      // browser form. Otherwise, ensure that the context is itself an entity
      // browser form.
      return $(context)[context === document ? 'find' : 'filter']('form[data-entity-browser-uuid]').get(0);
    },

    attach: function (context) {
      var element = this.getElement(context);
      if (element) {
        $(element).data('view', new Selection({ el: element }));
      }
    },

    detach: function (context) {
      var element = this.getElement(context);

      if (element) {
        var view = $(element).data('view');

        if (view instanceof Selection) {
          view.undelegateEvents();
        }
      }
    }

  };

})(jQuery, _, Backbone, Drupal);
