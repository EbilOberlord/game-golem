# Introduction #

This is a subclass of Worker.

The Page class is how you navigate around the game.

You have various methods to go to other pages, and to click on links. You can check if the page is in a "loading" state (via ajax), and it will automatically retry or refresh if things are taking too long.

This worker is also responsible for trying to detect if the page is "broken" (by not being loaded properly) and will try to refresh if that happens.

# Details #

No Workers are called while the page is in a loading state.

# Variables #

## Page.page ##

This is the _title_ of the page in an internal format. Basically the rule is "title\_subtitle", with all spaces and non alphanumeric names removed.

## Page.pageNames ##

**read-only**

This is an object containing `name:{url:'...', image:'...'}` items.

The image value is an image to look for to tell if the page name is the current page - this must never occur if it is not the active page. The url is the base url for navigation. `name` is the value passed to/from the Page class.

# Methods #

## to() ##

`Page.to('name',args)`

This asks to go to the specified page. If args are blank then it can reply with `false` meaning that it's not already there. Otherwise it will go there if not already and return true if it is.

Args is a url argument list starting with the ?

This will try to load the page using Ajax exclusively.

## click() ##

`Page.click(selector)`

This will try to click the jQuery selector (string or object etc) after a (very) short period of time. It will return failure if it could not find the element.

## loading() ##

`Page.loading()`

Checks if the page is currently loading and returns false if not. If it is then it will also check how long it has been loading and retry the previous Page event if needed - or even reload the page entirely if it seems completely frozen.

**NOTE:** You must account for this behaviour in any workers that navigate a site.

## reload() ##

`Page.reload()`

Simply forces a page reload. Use this if you think the page is broken - but not if it's just frozen on a click() or to().