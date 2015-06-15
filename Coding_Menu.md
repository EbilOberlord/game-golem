# Requirements #

Any Worker is capable of adding entries to the popup menu with a single function.

# How To #

Create a member function that takes two arguments -

```
myWorker.menu = function(worker, key)
```

Action depends on the arguments received.

If not worker then it is dealing with the global popup menu at the top of the Golem display, otherwise it is dealing with the menu relating to a specific worker.

If not key then it requires an Array to be returned consisting of "key:label" strings. There are a small number of special characters that can be used as the first character of the label.

  * `"+"` gives a tick next to the item
  * `"-"` gives a cross next to the item
  * `"="` gives a dot next to the item (radio selection)

No processing takes place at all within the menu handler. When an option is clicked by the user the menu() function will be called again with the worker (if not global) and the key. The display is closed immediately so no return value is required unless the key is not set.

# Example #

```
Queue.menu = function(worker, key) {
	if (worker) {
		if (!key) {
			if (worker.work && !worker.settings.no_disable) {
				return ['enable:' + (worker.get(['option','_disabled'], false) ? '-Disabled' : '+Enabled')];
			}
		} else if (key === 'enable') {
			worker.set(['option','_disabled'], worker.option._disabled ? undefined : true);
		}
	}
};

```