(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as anonymous module.
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node / CommonJS
    factory(require('jquery'));
  } else {
    // Browser globals.
    factory(jQuery);
  }
})(function ($) {

  'use strict';

  var NAMESPACE = 'qor.action';
  var EVENT_ENABLE = 'enable.' + NAMESPACE;
  var EVENT_DISABLE = 'disable.' + NAMESPACE;
  var EVENT_CLICK = 'click.' + NAMESPACE;
  var EVENT_CHNAGE = 'change.' + NAMESPACE;
  var EVENT_SUBMIT = 'submit.' + NAMESPACE;
  var ACTION_WRAP = '.qor-action-wrap';

  function QorAction(element, options) {
    this.$element = $(element);
    this.$wrap = $(ACTION_WRAP);
    this.options = $.extend({}, QorAction.DEFAULTS, $.isPlainObject(options) && options);
    this.$clone = null;
    this.init();
  }

  QorAction.prototype = {
    constructor: QorAction,

    init: function () {
      var options = this.options;
      var $this = this.$element;
      this.bind();
    },

    bind: function () {
      this.$element.on(EVENT_CLICK, $.proxy(this.check, this));
      this.$element.on(EVENT_CHNAGE, $.proxy(this.change, this));
      this.$wrap.on(EVENT_SUBMIT, "form", $.proxy(this.submit, this));
    },

    unbind: function () {
      this.$element.off(EVENT_CLICK, this.check);
      this.$element.off(EVENT_CHNAGE, this.change);
      this.$element.off(EVENT_SUBMIT, this.submit);
    },

    change : function(e) {
      var $target = $(e.target);

      if ($target.is('.qor-js-selector')) {
        $(".qor-action-wrap .qor-js-form").hide();
        $(".qor-action-wrap .qor-js-form[data-action='" + $target.val() + "']").show();
        $.proxy(this.appendCheckbox, $target)();
      }
    },

    submit : function(e) {
      var $form = $(e.target);
      $.proxy(this.appendCheckInputs, $form)();
      var $submit = $form.find("button");
      $form.find("qor-js-loading").show();
      $.ajax($form.prop('action'), {
        method: $form.prop('method'),
        data: new FormData($(form).get(0)),
        processData: false,
        contentType: false,
        beforeSend: function () {
          $submit.prop('disabled', true);
        },
        success: function () {
          location.reload();
        },
        error: function (xhr, textStatus, errorThrown) {
          var $error;

          // Custom HTTP status code
          if (xhr.status === 422) {

            // Clear old errors
            $form.find('.qor-field').removeClass('is-error').find('.qor-field__error').remove();

            // Append new errors
            $error = $(xhr.responseText).find('.qor-error');
            $form.before($error);

            $error.find('> li > label').each(function () {
              var $label = $(this);
              var id = $label.attr('for');

              if (id) {
                $form.find('#' + id).
                  closest('.qor-field').
                  addClass('is-error').
                  append($label.clone().addClass('qor-field__error'));
              }
            });
          } else {
            window.alert([textStatus, errorThrown].join(': '));
          }
        },
        complete: function () {
          $submit.prop('disabled', false);
        },
      });
      return false;
    },

    destroy: function () {
      this.unbind();
      this.$element.removeData(NAMESPACE);
    },

    // Helper
    appendCheckbox : function() {
      // Only value change and the table isn't selectable will add checkboxes
      $(".qor-page__body .mdl-data-table__select").each(function(i, e) { $(e).parents("td").remove() });
      $(".qor-page__body .mdl-data-table__select").each(function(i, e) { $(e).parents("th").remove() });

      if($(this).val()) {
        $(".qor-page__body table").addClass("mdl-data-table--selectable");
        new window.MaterialDataTable($(".qor-page__body table").get(0));

        // The fixed head have checkbox but the visiual one doesn't, clone the head with checkbox from the fixed one
        $("thead.is-hidden tr th:not('.mdl-data-table__cell--non-numeric')").clone().prependTo($("thead:not('.is-hidden') tr"));

        // The clone one doesn't bind event, so binding event manual
        var $fixedHeadCheckBox = $("thead:not('.is-fixed') .mdl-checkbox__input").parents("label");
        $fixedHeadCheckBox.find("span").remove();
        new MaterialCheckbox($fixedHeadCheckBox.get(0));
        $fixedHeadCheckBox.click(function(e) {
          $("thead.is-fixed tr th").eq(0).find("label").click();
          $(this).toggleClass("is-checked");
          return false;
        });
      } else {
        $(".qor-page__body table.mdl-data-table--selectable").removeClass("mdl-data-table--selectable");
        $(".qor-page__body tr.is-selected").removeClass("is-selected");
      }
    },

    appendCheckInputs: function() {
      var $form = $(this);
      $form.find("input").remove();
      $(".qor-page__body .mdl-checkbox__input:checked").each(function(i, e) {
        var id = $(e).parents("tr").data("primary-key");
        $form.prepend('<input type="hidden" name="IDs[]" value="' + id + '" />');
      });
    },
  },

  QorAction.DEFAULTS = {
  };

  QorAction.plugin = function (options) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data(NAMESPACE);
      var fn;

      if (!data) {
        $this.data(NAMESPACE, (data = new QorAction(this, options)));
      }

      if (typeof options === 'string' && $.isFunction(fn = data[options])) {
        fn.call(data);
      }
    });
  };

  $(function () {
    var selector = '.qor-js-action';
    var options = {};

    $(document).
      on(EVENT_DISABLE, function (e) {
        QorAction.plugin.call($(selector, e.target), 'destroy');
      }).
      on(EVENT_ENABLE, function (e) {
        QorAction.plugin.call($(selector, e.target), options);
      }).
      triggerHandler(EVENT_ENABLE);
  });

  return QorAction;

});
