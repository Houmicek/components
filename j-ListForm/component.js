COMPONENT('listform', 'empty:---;default:1', function(self, config, cls) {

	var cls2 = '.' + cls;
	var skip = false;
	var container;
	var form;
	var items;

	self.validate = function(value) {
		return config.disabled || !config.required ? true : !!(value && value.length > 0);
	};

	self.make = function() {

		self.aclass(cls + ' invisible');

		var scr = self.find('script');
		self.template = Tangular.compile(scr.eq(0).html());
		form = $('<div class="{0}-form-container hidden{2}" data-scope="{1}__isolated:1"><div class="{0}-form">{3}</div></div>'.format(cls, self.ID, config.formclass ? (' ' + config.formclass) : '', scr.eq(1).html()))[0];

		var tmp = scr.eq(2).html();
		scr.remove();

		self.append('<div class="{0}-items"><div class="{0}-emptylabel">{1}</div></div>'.format(cls, config.empty)).append(form);
		tmp && self.append('<div class="{0}-footer">{1}</div>'.format(cls, tmp));

		self.compile();
		container = self.find(cls2 + '-items');

		self.event('click', cls2 + '-item', function() {

			if (config.disabled)
				return;

			var t = this;
			if (form.$target === t)
				self.cancel();
			else
				self.edit(t);
		});

		self.event('click', 'button', function(e) {

			if (config.disabled)
				return;

			var is = false;
			var tmp;
			var fn;

			switch (this.name) {

				case 'create':

					if (!$(form).hclass('hidden') && !form.$data) {
						self.cancel();
						return;
					}

					fn = function(obj) {
						if (config.create || !config.default)
							SETR(self.ID, obj);
						else
							DEFAULT(self.ID);
						self.edit();
					};

					if (config.create)
						EXEC(self.makepath(config.create), fn);
					else
						fn({});

					is = true;
					break;

				case 'submit':

					tmp = GETR(self.ID);
					fn = function(tmp) {
						if (tmp) {
							if (form.$target) {
								COPY(tmp, form.$data);
								self.redraw(form.$target, form.$data);
							} else {
								items.push(tmp);
								self.create(tmp);
							}
							skip = true;
							self.set(items, 2);
							self.change(true);
						}
						self.cancel();
					};

					if (config.submit)
						EXEC(self.makepath(config.submit), tmp, fn);
					else
						fn(tmp);

					is = true;
					break;

				case 'cancel':
					self.cancel();
					is = true;
					break;

				case 'remove':

					var el = form.$target;
					var data = form.$data;

					fn = function(is) {
						self.cancel();
						if (is !== false && data) {
							el.parentNode.removeChild(el);
							items.splice(items.indexOf(data), 1);
							skip = true;
							self.set(items, 2);
							self.change(true);
						}
					};

					if (config.remove)
						EXEC(self.makepath(config.remove), data, fn);
					else
						fn();

					is = true;
					break;
			}

			if (is) {
				e.preventDefault();
				e.stopPropagation();
			}
		});
	};

	self.configure = function(key, value) {
		switch (key) {
			case 'disabled':
				self.tclass('ui-' + key, !!value);
				self.find('button[name="create"]').prop('disabled', !!value);
				break;
			case 'required':
				self.tclass(cls + '-' + key, !!value);
				break;
		}
	};

	self.edit = function(el) {

		self.cancel();

		var before;
		var parent;

		if (el) {
			parent = el.parentNode;
			var children = parent.children;
			for (var i = 0; i < children.length; i++) {
				if (children[i] === el) {
					before = children[i + 1];
					break;
				}
			}
			form.$target = el;
			form.$data = el.$data;
			SETR(self.ID, CLONE(el.$data));
			$(el).aclass(cls + '-selected');
		} else {
			parent = container[0];
			form.$target = form.$data = null;
		}

		if (before)
			parent.insertBefore(form, before);
		else
			parent.appendChild(form);

		setTimeout(function() {
			$(form).tclass(cls + '-new', !el).rclass('hidden');
			if (!isMOBILE && config.autofocus) {
				setTimeout(function() {
					self.find(typeof(config.autofocus) === 'string' ? config.autofocus : 'input[type="text"],select,textarea').eq(0).focus();
				}, 100);
			}
		}, 150);
	};

	self.cancel = function() {
		if (form.parentNode !== self.dom)
			self.dom.appendChild(form);
		form.$target && $(form.$target).rclass(cls + '-selected');
		form.$target = form.$data = null;
		$(form).aclass('hidden');
	};

	self.redraw = function(el, data) {
		el.innerHTML = self.template(data);
	};

	self.create = function(item) {
		var dom = document.createElement('DIV');
		dom.setAttribute('class', cls + '-item' + (config.itemclass ? (' '  + config.itemclass) : ''));
		dom.innerHTML = self.template(item);
		dom.$data = item;
		container[0].appendChild(dom);
	};

	self.setter = function(value, path, type) {

		if (!type)
			self.rclass('invisible');

		if (!value)
			value = [];

		items = value;
		self.tclass(cls + '-empty', !value || !value.length);

		if (skip) {
			skip = false;
			return;
		}

		form.$data && self.cancel();
		for (var i = 0; i < value.length; i++)
			self.create(value[i]);
	};

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass(cls + '-invalid', invalid);
	};

});