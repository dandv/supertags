SuperTags.Events = ClassX.extend(SuperTags.Class, function(base){

  this.textFilter = new ReactiveVar("");
  var foundMatch;
  var curTextNode;
  var _fm = new ReactiveVar()

  var initEvents = function(options) {
    var ctx = this;
    if(Meteor.isClient) {

      var events = {};
      var ctx = this;

      var taggleInput = ctx._instCtx.settings.inputSelector;
      var supertagsAcItemClass;
      var supertagsSelectedItemClass;

      if(ctx._instCtx.settings && ctx._instCtx.settings.autocomplete) {
        supertagsAcItemClass = ctx._instCtx.settings.autocomplete.supertagsAcItemClass;
        supertagsSelectedItemClass = ctx._instCtx.settings.autocomplete.supertagsSelectedItemClass;
      }

      events['keydown ' + taggleInput] = function(e,t) {
        var keyCode = e.keyCode;
        var elem = e.currentTarget;
        var selectedItem = $("." + supertagsAcItemClass + "." + supertagsSelectedItemClass);

        if(!ctx.isShowingAutoComplete) {
          return;
        }

        if(keyCode === 38) {
          e.preventDefault();
          if(selectedItem.length > 0) {
            selectedItem.removeClass(supertagsSelectedItemClass);
            selectedItem.prev().addClass(supertagsSelectedItemClass);
          } else {
            $("." + supertagsAcItemClass).last().addClass(supertagsSelectedItemClass)
          }
        } else if(keyCode === 40) {
          e.preventDefault();
          if(selectedItem.length > 0) {
            selectedItem.removeClass(supertagsSelectedItemClass);
            selectedItem.next().addClass(supertagsSelectedItemClass);
          } else {
            $("." + supertagsAcItemClass).first().addClass(supertagsSelectedItemClass)
          }
        } else if (keyCode === 13) {
          if(ctx.isShowingAutoComplete) {
            e.preventDefault();
            var oldText = foundMatch.matchedText;
            var newText = foundMatch.tokenType.token + selectedItem.text();

            var html = curTextNode.nodeValue;
            html = html.replace(oldText,newText)
            curTextNode.nodeValue = html;

            keyUpTag.call(ctx, options, e, t);
          }
        } else if(keyCode === 27) {
          e.preventDefault();
          ctx.hideAutoCompleteBox();
        }
      }

      events['keyup #' + options.inputControl] = function(e,t) {
        var keyCode = e.keyCode;

        //blocking shift and control keys for now
        if(keyCode === 16 || keyCode === 17)
          return;

        var elem = e.currentTarget;

        var rrange = rangy.createRange();
        rrange.selectNodeContents(elem);

        var sel = rangy.getSelection();
        sel.refresh();

        var text = sel.focusNode.nodeValue;
        if(text) {
          var startPos = sel.focusOffset;
          var isMatched = false;

          var charValue = text.substring(startPos-1, startPos);
          var val = text.substring(0,startPos);

          ctx._instCtx.tokenTypes.forEach(function (tokenType) {
            var newSimpleTagsRegEx = new RegExp(tokenType.token + "[a-z\\d-]+","g");
            var matched = val.match(newSimpleTagsRegEx);

            if(charValue === tokenType.token || matched) {
              foundMatch = {tokenType: tokenType, matched: matched, matchedText: charValue};
              if(matched && matched.length > 0) {
                foundMatch.matchedText = matched[0];
              }
              curTextNode = sel.focusNode;
              isMatched = true;
            }
          });

          if(!isMatched) {
            foundMatch = null;
          }

          if(foundMatch) {
            if(!ctx.isShowingAutoComplete) {
              var acBoxTop = elem.offsetTop + elem.offsetHeight;
              var acBoxLeft = elem.offsetLeft;

              console.log('foundMatch', foundMatch)
              ctx._instCtx.autocompleteInfo = foundMatch.tokenType.autocomplete
              ctx.showAutoCompleteBox.call(ctx,elem)
            }
            ctx.textFilter.set(foundMatch.matchedText.substring(1, text.length));
          } else {
            if(ctx.isShowingAutoComplete = true) {
              ctx.hideAutoCompleteBox();
            }
          }
        }
        else {
          ctx.hideAutoCompleteBox();
        }

        if(_.indexOf(options.submitKeys, keyCode) >= 0) {
          ctx.hideAutoCompleteBox();

          keyUpTag.call(ctx, options, e, t);
        }

      // events['keyup #' + options.inputControl] = function(e,t) {
        $("#" + options.inputControl + " span").each(function() {
          var sel = rangy.getSelection();
          var range = sel.getRangeAt(0);

          var sc = range.startContainer;
          var myText = sc.nodeValue;

          if($(this).text().length === 0 || $(this).text() === "x") {
            $(this).remove();
          }
        })

        var iControl = $("#" + options.inputControl);

        if(iControl.text().trim().length === 0) {
          var sel = rangy.getSelection();
          var range = sel.getRangeAt(0);

          var emptyelem = document.createTextNode('\u200B');
          var nbsp = document.createTextNode('\u00A0');
          // iControl.append(nbsp);
          iControl.append(emptyelem);

          range.setStartAfter(emptyelem);
          range.setEndAfter(emptyelem);

          sel.removeAllRanges();
          sel.addRange(range);
        }
      }

      events['mouseover .block, ontouchstart .block'] = function(e,t) {
        var elem = e.currentTarget;

        //hack for chrome's issue in not supporting contenteditable=false
        //more investigation needed
        if($(elem).find(".close").length === 0)
        {
          $(elem).append("<a class='close show'>x</a>");
        }

        $(elem).find(".close").addClass('show');
      }

      events['mouseout .block'] = function(e,t) {
        var elem = e.currentTarget;
        $(elem).find(".close").removeClass('show');
      }

      events['click .close'] = function(e,t) {
        var elem = e.currentTarget;
        var tagBlock = $(elem).closest('.block').remove();

        var sel = window.getSelection();
        var range = sel.getRangeAt(0);
        range.collapse(true);
        range.detach();
      }

      Template[options.inputTemplate].events(events);

      this.autocompleteClickCallback = function(e,t) {
        var elem = e.currentTarget;
        var newText = foundMatch.tokenType.token + $(elem).text();

        var oldText = foundMatch.matchedText;

        var html = curTextNode.nodeValue;
        html = html.replace(oldText,newText);

        curTextNode.nodeValue = html;

        keyUpTag.call(ctx, options, e, t);
        ctx.hideAutoCompleteBox();
      }
    }
  }

  var initRenders = function(options) {
    var ctx = this;
    if(Meteor.isClient) {
      Template[options.inputTemplate].rendered = function() {
        var iControl = $("#"+options.inputControl);
        iControl.attr("contenteditable", true)
        if(iControl.text().length === 0) {
          var nbsp = document.createTextNode('\u00A0');
          iControl.append(nbsp)
        }
      }
    }
  }

  var initTagBoxEvents = function(options) {
    var ctx = this;
    console.log('here')
    if(Meteor.isClient) {
      var events = {}
      var taggleInput = ctx._instCtx.settings.inputSelector;

      if(!ctx._instCtx.settings.autocomplete) {
        return;
      }
      var supertagsAcItemClass = ctx._instCtx.settings.autocomplete.supertagsAcItemClass;
      var supertagsSelectedItemClass = ctx._instCtx.settings.autocomplete.supertagsSelectedItemClass;

      var hideTimeout = null;

      events["keyup " + taggleInput] = function(e,t) {
        console.log('keyup')
        var elem = e.currentTarget;
        var text = $(taggleInput).val();

        ctx.textFilter.set(text);
      }

      events["keydown " + taggleInput] = function(e,t) {
        alert('asf')
        var keyCode = e.keyCode;
        var elem = e.currentTarget;
        var selectedItem = $("." + supertagsAcItemClass + "." + supertagsSelectedItemClass);

        if(keyCode === 38) {
          if(selectedItem.length > 0) {
            selectedItem.removeClass(supertagsSelectedItemClass);
            selectedItem.prev().addClass(supertagsSelectedItemClass);
          } else {
            $("." + supertagsAcItemClass).last().addClass(supertagsSelectedItemClass)
          }
        } else if(keyCode === 40) {
          if(selectedItem.length > 0) {
            selectedItem.removeClass(supertagsSelectedItemClass);
            selectedItem.next().addClass(supertagsSelectedItemClass);
          } else {
            $("." + supertagsAcItemClass).first().addClass(supertagsSelectedItemClass)
          }
        } else if(keyCode === 13 || keyCode === 9) {
          e.preventDefault();
          e.stopPropagation();

          var text = selectedItem.text();
          if(text.length > 0) {
            ctx.taggle.add(text);
            ctx.textFilter.set("");
          } else {
            ctx.taggle.add($(elem).val())
          }

          selectedItem.removeClass(supertagsSelectedItemClass)
        } else if(keyCode === 27) {
          ctx.hideAutoCompleteBox();
        }
      }

      events["focus " + taggleInput] = function(e,t) {
        clearTimeout(hideTimeout)
        var elem = e.currentTarget;
        var data = options.autocomplete;
        if(!ctx.isShowingAutoComplete) {
          ctx.showAutoCompleteBox.call(ctx, elem);
          ctx.textFilter.set("");
        }
      }

      events["blur " + taggleInput] = function(e,t) {
        if(ctx.isShowingAutoComplete) {
          hideTimeout = setTimeout(function() {
            ctx.hideAutoCompleteBox();
            ctx.textFilter.set("");
          },100);
        }
      }

      Template[options.inputTemplate].events(events);

      this.autocompleteClickCallback = function(e,t) {
        var elem = e.currentTarget;
        ctx.taggle.add($(elem).text())
      }
    }
  }

  var initTagBoxRenders = function(options) {
    var ctx = this;
    if(Meteor.isClient) {
      Template[options.inputTemplate].rendered = function() {
        var submitKeys;
        if(ctx.settings.autocomplete) {
          submitKeys = [-1];
        } else {
          submitKeys = ctx.settings.submitKeys;
        }
        ctx.taggle = new Taggle(options.inputControl, {
          additionalTagClasses: ctx.settings.tagCss.additionalTagClasses,
          duplicateTagClass: ctx.settings.tagCss.duplicateTagClass,
          containerFocusClass: ctx.settings.tagCss.containerFocusClass,
          submitKeys: submitKeys
        });
        ctx._instCtx.tags = ctx.taggle.getTags().values;
      }
    }
  }

  var keyUpTag = function(options, e, t) {
console.log('im called')
    var tagBoxId = options.inputControl;

    // if(e.keyCode != 32) return;

    var h = $("#" + tagBoxId).html();

    var appliedTagsText = "";
    this._instCtx.tokenTypes.forEach(function(tt){
      var curTags = tt.parseTags(h);

      var cssClasses = "supertag-item-" + tt.fieldName;
      var itemStyles = "";
      if(tt.css && tt.css.classes) {
        cssClasses += " " + tt.css.classes;
      }

      if(tt.css && tt.css.styles) {
        itemStyles = tt.css.styles;
      }

      curTags.newTags.forEach(function (tag) {
        console.log('tt',tt)
        appliedTagsText = h.replace(tt.token + tag, "<span class='"+cssClasses+"' style='" + itemStyles + "'><s>" + tt.token + "</s>" + tag + "</span>&nbsp;")

        $("#" + tagBoxId).html(appliedTagsText);

        //firefox hack for
        $("#" + tagBoxId + " br").last().remove();

        placeCaretAtEnd(document.getElementById(tagBoxId));
      });
    })

    if(appliedTagsText && appliedTagsText.length > 0) {

    }
  }

  this.initAutoCompleteEvents = false;

  this.showAutoCompleteBox = function(elem) {
    var ctx = this;

    if(!ctx.settings.autocomplete) {
      return;
    }

    if($("#supertags-autocomplete").length > 0) {
      return;
    }

    var acDiv = document.createElement('div');
    acDiv.id = "supertags-autocomplete";
    acDiv.className = "supertags-autocomplete-container";

    var containerElem = document.getElementById(ctx.settings.inputControl);

    acDiv.style.top = (containerElem.offsetTop + containerElem.offsetHeight) + "px";
    // acDiv.style.left = elem.offsetLeft + "px";

    $(elem).after(acDiv);

    var templateName = ctx.settings.autocomplete.containerTemplateName;
    var itemTemplate = ctx.settings.autocomplete.itemTemplateName;

    if(ctx._instCtx.autocompleteInfo && ctx._instCtx.autocompleteInfo.data && _.isArray(ctx._instCtx.autocompleteInfo.data)) {
      Tracker.autorun(function() {
        ctx._instCtx.autocompleteTextFilter.set({text: ctx.textFilter.get(), limit: ctx._instCtx.autocompleteInfo.limit || null});
      })
    }
    //data is a collection, need to filter with text provided in tag box
    else if(ctx._instCtx.autocompleteInfo && ctx._instCtx.autocompleteInfo.data && ctx._instCtx.autocompleteInfo.data._collection) {

      Tracker.autorun(function() {
        var filter = {};
        filter[ctx._instCtx.autocompleteInfo.lookupField] = {$regex: "^" + ctx.textFilter.get()};

        console.log('filter', ctx._instCtx.autocompleteInfo.filter);
        filter = _.extend({}, filter, ctx._instCtx.autocompleteInfo.filter);

        var options = {};
        if(ctx._instCtx.autocompleteInfo.limit) {
          options['limit'] = ctx._instCtx.autocompleteInfo.limit;
        }

        ctx._instCtx.autocompleteTextFilter.set({filter: filter, options:options});
      })
    }

    var events = {};
    var taggleInput = ctx._instCtx.settings.inputSelector;
    var supertagsAcItemClass = ctx._instCtx.settings.autocomplete.supertagsAcItemClass;
    var supertagsSelectedItemClass = ctx._instCtx.settings.autocomplete.supertagsSelectedItemClass;
    if(!initAutoCompleteEvents) {
      events["mouseover ." + supertagsAcItemClass] = function(e,t) {
        var elem = e.currentTarget;
        $(elem).addClass(supertagsSelectedItemClass);
      }

      events["mouseout ." + supertagsAcItemClass] = function(e,t) {
        var elem = e.currentTarget;
        $(elem).removeClass(supertagsSelectedItemClass);
      }

      events["click ." + supertagsSelectedItemClass] = function(e,t) {
        var elem = e.currentTarget;

        ctx.autocompleteClickCallback(e,t);


        $("." + supertagsSelectedItemClass).removeClass(supertagsSelectedItemClass);
        ctx.textFilter.set("");
      }
      initAutoCompleteEvents = true;
    }

    Template[templateName].events(events);

    Blaze.renderWithData(Template[templateName], {itemTemplate: itemTemplate}, acDiv)

    ctx.isShowingAutoComplete = true;
    return acDiv.id;
  }

  this.hideAutoCompleteBox = function() {
    $("#supertags-autocomplete").remove();
    this.isShowingAutoComplete = false;
    this.textFilter.set("")
  }

  this.autocompleteClickCallback = function(e,t) {
    console.log('no callback assigned')
  }

  var placeCaretAtEnd = function (el) {
    el.focus();
    if (typeof window.getSelection != "undefined"
      && typeof document.createRange != "undefined") {
      var range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
      var textRange = document.body.createTextRange();
      textRange.moveToElementText(el);
      textRange.collapse(false);
      textRange.select();
    }
  }

  this.isShowingAutoComplete = false;

  this.constructor = function Events(options, ctx) {
    base.constructor.call(this, options);

    this.settings = ctx.settings;
    this._instCtx = ctx;

    if(!options.inputTemplate)
      return;

    switch(options.tagMode) {
      case "tagBox":
        initTagBoxRenders.call(this,options);
        initTagBoxEvents.call(this, options)
        break;
      case "inline":
        initRenders.call(this, options);
        initEvents.call(this, options);
        break;
    }


  }
})