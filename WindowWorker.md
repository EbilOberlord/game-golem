# Introduction #

Window performs two actions.

  * It prevents more than one copy of Golem running per application at any one time - preventing race conditions and data problems.
  * It provides (non-permanent) storage of per-window data.

# Details #

Internally Window will keep an id for any opened tbs, and only let one maintain control at any one time. If there is only one active window then nothing is visible to the user, however when a second window is open the first one gets a large "Enabled" button, and the new one gets a "Disabled" button. If none are "Enabled" then any can have the "Disabled" button pressed to become "Enabled".

Window also maintains window specific data. This data is not persistent - in that it can be lost if the browser is restarted, or the user browses to another site that uses the same method for data storage. It is only valid within the exact same window (or tab) as it is saved in - so is useful if you are planning on causing the page to browse to a different location. It is **NOT** per application, so data can be shared between any (and all) Golem workers.

NOTE: Golem currently only runs on Castle Age, when other games are added that is the "per application" spoken about.

# Usage #

```
Worker.set('path.to.key', value);
value = Worker.get('path.to.key', [default]);
```

Do not use "data", "runtime" or "option" in the path, it is all under the same storage section. Path may also be supplied as an array in the form ['path', 'to', 'key'] - which may be easier in certain circumstances.