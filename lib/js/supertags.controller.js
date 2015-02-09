SuperTags.Controller = new ClassX.extend(SuperTags.Class, function(base) {

	this.parseTags = function(text, options) {
		var newTagsSpacesRegEx = new RegExp(this.token + "[\\[\\({)](.+?)[\\]\\)}]","g");
		var newSimpleTagsRegEx = new RegExp(this.token + "[a-z\\d-]+","g");
		var cleanNewTagsRegEx = new RegExp(this.token + "[\\[\\({\\]\\)}]", "g");
		var cleanCloseRegEx = new RegExp(/[\]\)\}]/g)
		var newSpaceTags = text.match(newTagsSpacesRegEx);

		var modifiedText = text;
		var remainingText = text;
		var ctx = this;
		if(newSpaceTags) {
			newSpaceTags.forEach(function (word) {
				var newHashTag = word.replace(cleanNewTagsRegEx, "");
				newHashTag = newHashTag.replace(cleanCloseRegEx, "");

				var tagDoc = {name: newHashTag};
				ctx.saveNewTag({name: newHashTag})

				modifiedText = modifiedText.replace(word, ctx.token + newHashTag);
				remainingText = modifiedText.replace(ctx.token + newHashTag);

				ctx.storeItemTag(newHashTag)
			});  
		}

		var tagsRemoved = [];
		this.currentItemTags.forEach(function (tag) {
			if(text.indexOf(tag) < 0 && text[text.indexOf(tag)-2] && text[text.indexOf(tag)-2] == ctx.token) {
				tagsRemoved.push(tag);
			} else {
				remainingText = remainingText.replace(ctx.token + tag, "");
			}
		});

		this.currentItemTags = _.difference(this.currentItemTags,tagsRemoved);

		var newSimpleTags = remainingText.match(newSimpleTagsRegEx);

		if(newSimpleTags) {
			newSimpleTags = _.difference(newSimpleTags, this.currentItemTags);

			newSimpleTags.forEach(function (tag) {
				var newHashTag = tag.replace(ctx.token,"");
				ctx.saveNewTag({name: newHashTag})
				ctx.storeItemTag(newHashTag);
			});
		}

		return {modifiedText: modifiedText, tags: this.currentItemTags};
	}

	this.tagItem = function(item, additionalTags) {
		var res = null;

		if(additionalTags != null) {
			this.currentItemTags.push(additionalTags);
		}

		if(this.currentItemTags.length > 0) {
			this.raiseEvent("tag", {tokenType: this.fieldName, tags: this.currentItemTags});
		}

		if(_.isString(item)) {
			res = {};
			res["item"] = item;
			res[this.fieldName] = this.currentItemTags;
		} else if(_.isObject(item)) {
			res = item;
			if(this.parentObj) {
				res[this.parentObj] = res[this.parentObj] || {};
				if(res[this.parentObj][this.fieldName]) {
					var merge = _.union(res[this.parentObj][this.fieldName], this.currentItemTags);
					res[this.parentObj][this.fieldName] = merge;
				} else {
					res[this.parentObj][this.fieldName] = this.currentItemTags;
				}
			} else {
				res[this.fieldName] = this.currentItemTags
			}
		}

		this.currentItemTags = [];
		return res;
	}

	this.saveNewTag = function(mentionObj) {

		if(!this.tagExists(mentionObj.name)) {
			Meteor.call('SuperTags/saveNewTag-'+this.fieldName, mentionObj, function (error, result) {
			});
		}
	}

	this.findSingleTag = function(selector) {
		return this._cl.findOne(selector);
	}

	this.tagExists = function(name) {
		var tagDoc = this.findSingleTag({name: name});
		if(tagDoc)
			return true;

		return false;
	}

	this.storeItemTag = function(tagName) {
		this.currentItemTags.push(tagName);
	}

	this.constructor = function Controller(options) {
		base.constructor.call(this, options);

		this.name = options.initTemplate;
		this.fieldName = options.tokenType;
		this.parseField = options.parseField;
		this.token = options.token;
		this._cl = options.collection;
		this.currentItemTags = [];
		this.parentObj = options.parentObj;

		this.highlight = options.highlight;

		this.__ctx = this;

		this.itemCollection = options.itemCollection;
		if(this.parentObj) {
			this.mongoField = this.parentObj + "." + this.fieldName;
		} else {
			this.mongoField = this.fieldName;
		}
	}
})