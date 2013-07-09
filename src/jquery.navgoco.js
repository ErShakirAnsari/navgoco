/*
 * jQuery Navgoco Menus Plugin v0.1.2 (2013-07-09)
 * https://github.com/tefra/navgoco
 *
 * Copyright (c) 2013 Chris T (@tefra)
 * BSD - https://github.com/tefra/navgoco/blob/master/LICENSE-BSD
 */
(function($) {

	"use strict";

	/**
	 * Plugin Constructor. Every menu must have a unique id which will either
	 * be the actual id attribute or its index in the page.
	 *
	 * @param {Element} el
	 * @param {Object} options
	 * @param {Integer} idx
	 * @returns {Object} Plugin Instance
	 */
	var Plugin = function(el, options, idx) {
		this.el = el;
		this.$el = $(el);
		this.options = options;
		this.uuid = this.$el.attr('id') ? this.$el.attr('id') : idx;
		this.state = {};
		this.init();
		return this;
	};

	/**
	 * Plugin methods
	 */
	Plugin.prototype = {
		/**
		 * Load cookie, assign a unique data-index attribute to
		 * all sub-menus and show|hide them according to cookie
		 * or based on the parent open class. Find all parent li > a
		 * links add the carent if it's on and attach the event click
		 * to them.
		 */
		init: function() {
			var self = this;
			self._load();
			self.$el.find('ul').each(function(idx) {
				var sub = $(this);
				sub.attr('data-index', idx);
				if (self.options.save && self.state.hasOwnProperty(idx)) {
					sub.parent().addClass(self.options.openClass);
					sub.show();
				} else if (sub.parent().hasClass(self.options.openClass)) {
					sub.show();
					self.state[idx] = 1;
				} else {
					sub.hide();
				}
			});

			var links = self.$el.find("li:has(ul) > a");
			if (self.options.caret) {
				links.append(self.options.caret);
			}
			links.on('click', function(e) {
				e.preventDefault();
				var sub = $(this).next();
				var isOpen = sub.is(":visible");
				self._toggle(sub, !isOpen);
				self._save();
			});
		},
		/**
		 * Accepts a JQuery Element and a boolean flag. If flag is false it removes from the
		 * parent li  the `open` css class and slides up the sub-menu. If flag is open it adds to
		 * the parent li the `open` css class and slides down the menu. If accordion mode is on all
		 * sub-menus except the direct parent tree will close. Internally an object with the menus
		 * states is maintained for later save duty.
		 *
		 * @param {Element} sub
		 * @param {Boolean} open
		 */
		_toggle: function(sub, open) {
			var self = this;
			var idx = sub.attr('data-index');
			var parent = sub.parent();
			if (open) {
				parent.addClass(self.options.openClass);
				sub.slideDown(self.options.slide);
				self.state[idx] = 1;

				if (self.options.accordion) {
					var allowed = self.state = self._parents(sub);
					allowed[idx] = self.state[idx] = 1;

					self.$el.find("ul:visible").each(function() {
						var sub = $(this);
						var idx = sub.attr('data-index');
						if (!allowed.hasOwnProperty(idx)) {
							self._toggle(sub, false);
						}
					});
				}
			} else {
				parent.removeClass(self.options.openClass);
				sub.slideUp(self.options.slide);
				self.state[idx] = 0;
			}


		},
		/**
		 * Returns all parents of a sub-menu. When obj is true It returns an object with indexes for
		 * keys and the elements as values, if obj is false the object is filled with the value `1`.
		 *
		 * @since v0.1.2
		 * @param {Element} sub
		 * @param {Boolean} obj
		 * @returns {Object}
		 */
		_parents: function(sub, obj) {
			var result = {};
			var parent = sub.parent();
			var parents = parent.parents('ul');

			parents.each(function() {
				var par = $(this);
				var idx = $(this).attr('data-index');
				if (!idx) {
					return false;
				}
				result[idx] = obj ? par : 1;
			});
			return result;
		},
		/**
		 * If `save` option is on the internal object that keeps track of the sub-menus states is
		 * saved with a cookie. For size reasons only the open sub-menus indexes are stored.		 *
		 */
		_save: function() {
			if (this.options.save) {
				var save = {};
				for (var key in this.state) {
					if (this.state[key] === 1) {
						save[key] = 1;
					}
				}
				cookie[this.uuid] = this.state = save;
				$.cookie(this.options.cookie.name, JSON.stringify(cookie), this.options.cookie);
			}
		},
		/**
		 * If `save` option is on it reads the cookie data. The cookie contains data for all
		 * navgoco menus so the read happens only once and stored in the global `cookie` var.
		 */
		_load: function() {
			if (this.options.save) {
				if (cookie === null) {
					var data = $.cookie(this.options.cookie.name);
					cookie = (data) ? JSON.parse(data) : {};
				}
				this.state = cookie.hasOwnProperty(this.uuid) ? cookie[this.uuid] : {};
			}
		},
		/**
		 * Public method toggle to manually show|hide sub-menus. If no indexes are provided all
		 * items will be toggled. You can pass sub-menus indexes as regular params. eg:
		 * navgoco('toggle', true, 1, 2, 3, 4, 5);
		 *
		 * Since v0.1.2 it will also open parents when providing sub-menu indexes.
		 *
		 * @param {Boolean} open
		 */
		toggle: function(open) {
			var self = this;
			var length = arguments.length;

			if (length <= 1) {
				self.$el.find('ul').each(function() {
					var sub = $(this);
					self._toggle(sub, open);
				});
			} else {
				var idx;
				var list = {};
				var args = Array.prototype.slice.call(arguments, 1);
				length -= 1;

				for (var i = 0; i < length; i++) {
					idx = args[i];
					var sub = self.$el.find('ul[data-index="' + idx + '"]').first();
					if (sub) {
						list[idx] = sub;
						if (open) {
							var parents = self._parents(sub, true);
							for (var pIdx in parents) {
								if (!list.hasOwnProperty(pIdx)) {
									list[pIdx] = parents[pIdx];
								}
							}
						}
					}
				}

				for (idx in list) {
					self._toggle(list[idx], open);
				}
			}

			self._save();
		},
		/**
		 * Removes instance from JQuery data cache and unbinds events.
		 */
		destroy: function() {
			$.removeData(this.$el);
			this.$el.find("li:has(ul) > a").unbind('click');
		}
	};

	/**
	 * Global var holding all navgoco menus open states
	 *
	 * @type {Object}
	 */
	var cookie = null;

	/**
	 * Default navgoco options
	 *
	 * @type {Object}
	 */
	var defaults = {
		caret: '<span class="caret"></span>',
		accordion: false,
		openClass: 'open',
		save: true,
		cookie: {
			name: 'navgoco',
			expires: false,
			path: '/'
		},
		slide: {
			duration: 400,
			easing: 'swing'
		}
	};

	/**
	 * A JQuery plugin wrapper for navgoco. It prevents from multiple instances and also handles
	 * public methods calls. If we attempt to call a public method on an element that doesn't have
	 * a navgoco instance, one will be created for it with the default options.
	 *
	 * @param {Object|String} options
	 */
	$.fn.navgoco = function(options) {
		if (typeof options === 'string' && options.charAt(0) !== '_' && options !== 'init') {
			var callback = true;
			var args = Array.prototype.slice.call(arguments, 1);
		} else {
			options = $.extend({}, defaults, options || {});
			if (!$.cookie) {
				options.save = false;
			}
		}
		return this.each(function(idx) {
			var $this = $(this);
			var obj = $this.data('navgoco');

			if (!obj) {
				obj = new Plugin(this, callback ? defaults : options, idx);
				$this.data('navgoco', obj);
			}
			if (callback) {
				obj[options].apply(obj, args);
			}
		});
	};
})(jQuery);